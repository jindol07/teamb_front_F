/** 파일 안내
 * 용도: 역할별 WebSocket 연결과 장애 시 HTTP 대체 조회를 관리하는 공유 훅.
 * 직접 사용처: AdminDashboard, ParkingStatusAdmin, ParkingStatus, 사용자 Reservation.tsx.
 * parkingSpaceApi로 접속·조회하고 useParkingStore에 반영한다. 토큰 변경·만료·언마운트 시 자원을 정리한다.
 * 인증 성공 시 기본 폴링을 중단한다. 관리자 예약 보조 조회는 이 훅 밖의 별도 경로다.
 */
/**
 * 관리자 현황은 A, 사용자 현황은 U에서 받는다.
 * HTTP는 기존 axios JWT 인증을 사용하고, 소켓은 첫 AUTH 메시지로 인증한다.
 * 연결 장애 중에는 5초 HTTP 조회를 유지한다. 토큰 만료 시 갱신을 시도하고 권한 거절·갱신 실패 시 중단한다.
 */
import { useEffect } from 'react';
import { fetchPublicParkingSpaces, getParkingWebSocketUrl } from './parkingSpaceApi';
import type { ParkingServer } from './parkingSpaceApi';
import { refreshAccessToken, refreshAdminAccessToken } from '../../api/axios';
import { normalizeParkingSpaces } from './parkingSpaceResponse';
import { useParkingStore } from './useParkingStore';

// A/U별 연결 관리자를 만든다. 동일 서버의 여러 구독자는 연결과 폴링을 공유한다.
function createParkingSpaceSync(server: ParkingServer) {
  const POLL_MS = 5000;
  const HEARTBEAT_MS = 15000;
  const HEARTBEAT_TIMEOUT_MS = 45000;
  let subscribers = 0;
  let socket: WebSocket | null = null;
  let reconnectTimer: number | undefined;
  let pollTimer: number | undefined;
  let heartbeatTimer: number | undefined;
  let socketTimeout: number | undefined;
  let expirationTimer: number | undefined;
  let reconnectDelay = 3000;
  let requestController: AbortController | null = null;
  let pendingRequest: Promise<void> | null = null;
  let snapshotVersion = 0;
  let generation = 0;
  let token: string | null = null;
  let authBlocked = false;
  let renewing = false;

  // 화면의 사전 만료·역할 검사다. JWT 서명과 실제 권한 검증은 서버가 수행한다.
  function tokenExpiration(value: string): number {
    const parts = value.split('.');
    if (parts.length !== 3) throw new Error('로그인 정보를 확인할 수 없습니다. 다시 로그인해 주세요.');
    try {
      const encoded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const claims = JSON.parse(window.atob(encoded));
      if (claims.role !== (server === 'admin' ? 'ADMIN' : 'OFFICE')) {
        throw new Error('role');
      }
      if (typeof claims.exp !== 'number' || !Number.isFinite(claims.exp) || claims.exp <= 0) {
        throw new Error('expiration');
      }
      const expiresAt = claims.exp * 1000;
      if (!Number.isFinite(expiresAt)) throw new Error('expiration');
      return expiresAt;
    } catch {
      throw new Error('현재 화면에 맞는 로그인 정보가 없습니다. 다시 로그인해 주세요.');
    }
  }

  // 토큰·구독·세대가 바뀐 뒤 도착한 응답을 폐기하기 위한 조건이다.
  function isCurrent(epoch: number, currentToken: string | null): boolean {
    return subscribers > 0 && generation === epoch && token === currentToken
      && localStorage.getItem('token') === currentToken;
  }

  function stopPolling() {
    window.clearInterval(pollTimer);
    pollTimer = undefined;
  }

  // 세대와 버전을 먼저 바꿔 이전 비동기 응답을 무효화한 뒤 소켓·타이머·요청을 정리한다.
  function stopResources() {
    generation += 1;
    snapshotVersion += 1;
    stopPolling();
    window.clearTimeout(reconnectTimer);
    window.clearInterval(heartbeatTimer);
    window.clearTimeout(socketTimeout);
    window.clearTimeout(expirationTimer);
    reconnectTimer = heartbeatTimer = socketTimeout = expirationTimer = undefined;
    const connection = socket;
    socket = null;
    connection?.close();
    requestController?.abort();
    requestController = null;
    pendingRequest = null;
    reconnectDelay = 3000;
  }

  // 인증 실패 상태에서는 자동 재시도를 멈추고 기존 구획 데이터를 비워 잘못된 계정 노출을 막는다.
  function failAuthentication(message: string) {
    stopResources();
    authBlocked = true;
    useParkingStore.getState().resetParking();
    useParkingStore.getState().failSync(message);
  }

  /** access 토큰 만료 시 refresh를 1회 시도하고, 실패하면 동기화를 중단한다. */
  async function renewSession(message: string): Promise<void> {
    if (renewing) return;

    renewing = true;
    const sessionToken = token;
    const refreshSession = server === 'user'
      ? refreshAccessToken
      : refreshAdminAccessToken;

    try {
      const newAccessToken = await refreshSession();

      if (subscribers === 0) return;

      // refresh 중 로그아웃/재로그인으로 세션이 바뀌었으면
      // 새 세션의 동기화가 처리하도록 이 요청은 버린다.
      if (localStorage.getItem('token') !== sessionToken) {
        return;
      }

      if (newAccessToken) {
        // refreshAccessToken이 parking-auth-changed를 발생시킨다.
        // 이벤트가 아직 처리되지 않은 경우를 대비해 직접 재시작한다.
        if (localStorage.getItem('token') !== token) {
          handleAuthChange();
        }
        return;
      }

      failAuthentication(message);
    } finally {
      renewing = false;
    }
  }

  function scheduleExpiration(expiresAt: number) {
    window.clearTimeout(expirationTimer);
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      void renewSession('로그인이 만료되었습니다. 다시 로그인해 주세요.');
      return;
    }
    expirationTimer = window.setTimeout(() => {
      if (localStorage.getItem('token') !== token) handleAuthChange();
      else void renewSession('로그인이 만료되었습니다. 다시 로그인해 주세요.');
    }, Math.min(remaining, 2147483647));
  }

  /** HTTP는 10초로 제한한다. 계정 변경 또는 최신 소켓 수신 뒤 도착한 이전 HTTP 결과는 폐기한다. */
  async function refreshParkingSpaces(): Promise<void> {
    if (subscribers === 0 || authBlocked || !token) return;
    if (localStorage.getItem('token') !== token) {
      handleAuthChange();
      return;
    }
    requestController?.abort();
    const controller = new AbortController();
    requestController = controller;
    const epoch = generation;
    const currentToken = token;
    const version = snapshotVersion;
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 10000);
    const store = useParkingStore.getState();
    store.startSync();
    try {
      const rows = await fetchPublicParkingSpaces(controller.signal, server);
      if (!isCurrent(epoch, currentToken) || controller.signal.aborted || snapshotVersion !== version) return;
      store.replaceFromServer(rows);
    } catch (error) {
      if (!isCurrent(epoch, currentToken) || (controller.signal.aborted && !timedOut)
          || snapshotVersion !== version) return;
      const failure = timedOut ? new Error('주차구획 조회 시간이 초과되었습니다.') : error;
      store.failSync(failure instanceof Error ? failure.message : String(failure));
      throw failure;
    } finally {
      window.clearTimeout(timeout);
      if (requestController === controller) requestController = null;
    }
  }

  // 동시 폴링 요청을 하나로 제한한다. 실패 표시는 스토어가 담당한다.
  function load() {
    if (pendingRequest || authBlocked) return;
    const request = refreshParkingSpaces();
    pendingRequest = request;
    void request.catch(() => {
      // HTTP 오류는 스토어를 통해 표시한다.
    }).finally(() => {
      if (pendingRequest === request) pendingRequest = null;
    });
  }

  // 연결 장애 중 즉시 한 번 조회하고 이후 5초 주기로 현황을 보완한다.
  function startPolling() {
    if (pollTimer !== undefined || subscribers === 0 || authBlocked || !token) return;
    load();
    pollTimer = window.setInterval(load, POLL_MS);
  }

  // 재연결 대기는 3초부터 최대 30초까지 증가한다. 인증 거절 시에는 재시도하지 않는다.
  function scheduleReconnect() {
    if (subscribers === 0 || authBlocked || !token || reconnectTimer !== undefined) return;
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = undefined;
      connect();
    }, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, 30000);
  }

  // 토큰을 URL에 넣지 않고 첫 AUTH 메시지로 전송한다.
  function connect() {
    if (subscribers === 0 || authBlocked || !token || socket) return;
    if (localStorage.getItem('token') !== token) {
      handleAuthChange();
      return;
    }
    const epoch = generation;
    const currentToken = token;
    let authenticated = false;
    let connection: WebSocket;
    try {
      connection = new WebSocket(getParkingWebSocketUrl(server));
    } catch {
      startPolling();
      scheduleReconnect();
      return;
    }
    socket = connection;
    let lastReceivedAt = Date.now();
    socketTimeout = window.setTimeout(() => {
      if (socket === connection) connection.close();
    }, 10000);

    connection.onopen = () => {
      if (socket !== connection || !isCurrent(epoch, currentToken)) return;
      window.clearTimeout(socketTimeout);
      socketTimeout = window.setTimeout(() => {
        if (socket === connection && !authenticated) connection.close();
      }, 10000);
      // JWT는 URL이나 로그에 넣지 않는다. 재연결마다 새로 인증한다.
      connection.send(JSON.stringify({ type: 'AUTH', token: currentToken }));
    };

    connection.onmessage = (event: MessageEvent<string>) => {
      if (socket !== connection) return;
      if (!isCurrent(epoch, currentToken)) {
        handleAuthChange();
        return;
      }
      lastReceivedAt = Date.now();
      if (event.data === 'PONG' && authenticated) return;
      try {
        const message = JSON.parse(event.data);
        // 인증이 확인되면 폴링을 중지하고 HTTP 보완 조회·주기 PING을 시작한다.
        if (message?.type === 'AUTH_OK' && !authenticated) {
          authenticated = true;
          window.clearTimeout(socketTimeout);
          socketTimeout = undefined;
          reconnectDelay = 3000;
          stopPolling();
          // 인증 성공 및 연결 사이에 발생한 변경도 최신 HTTP 조회로 보완한다.
          void refreshParkingSpaces().catch(() => {
            if (socket === connection) connection.close();
          });
          heartbeatTimer = window.setInterval(() => {
            if (!isCurrent(epoch, currentToken)) {
              handleAuthChange();
            } else if (Date.now() - lastReceivedAt > HEARTBEAT_TIMEOUT_MS) {
              connection.close();
            } else if (connection.readyState === WebSocket.OPEN) {
              connection.send('PING');
            }
          }, HEARTBEAT_MS);
          return;
        }
        if (!authenticated || message?.type !== 'PARKING_SPACES_SNAPSHOT' || !Array.isArray(message.spaces)) {
          throw new Error('지원하지 않는 주차현황 웹소켓 응답입니다.');
        }
        // 소켓 응답도 HTTP와 같은 형식 검증을 거쳐 반영하고 스냅샷 버전을 올린다.
        useParkingStore.getState().replaceFromServer(normalizeParkingSpaces(message.spaces));
        snapshotVersion += 1;
      } catch {
        console.warn('주차현황 웹소켓 응답 오류. HTTP로 다시 조회합니다.');
        connection.close();
      }
    };

    connection.onerror = () => {
      if (socket === connection) connection.close();
    };
    // 인증 종료 코드는 재로그인을 안내하고 일반 연결 장애는 HTTP 조회와 재연결로 전환한다.
    connection.onclose = (event: CloseEvent) => {
      if (socket !== connection) return;
      window.clearTimeout(socketTimeout);
      window.clearInterval(heartbeatTimer);
      socketTimeout = heartbeatTimer = undefined;
      socket = null;
      if (!isCurrent(epoch, currentToken)) {
        handleAuthChange();
      } else if (event.code === 4001) {
        void renewSession('로그인이 만료되었습니다. 다시 로그인해 주세요.');
      } else if (event.code === 4003 || event.code === 1008) {
        failAuthentication('주차현황 연결 인증에 실패했습니다. 다시 로그인해 주세요.');
      } else {
        startPolling();
        scheduleReconnect();
      }
    };
  }

  // 현재 저장된 토큰으로 만료 예약·초기 HTTP·소켓 연결을 시작한다.
  function startForCurrentToken() {
    token = localStorage.getItem('token');
    authBlocked = false;
    if (!token) {
      failAuthentication('로그인이 필요합니다.');
      return;
    }
    try {
      const expiresAt = tokenExpiration(token);

      // 이미 만료된 access 토큰이면 refresh부터 시도한다.
      if (expiresAt <= Date.now()) {
        void renewSession('로그인이 만료되었습니다. 다시 로그인해 주세요.');
        return;
      }

      scheduleExpiration(expiresAt);
      startPolling();
      connect();
    } catch (error) {
      failAuthentication(error instanceof Error ? error.message : '다시 로그인해 주세요.');
    }
  }

  // 계정 변경 시 이전 계정의 데이터와 연결을 폐기한 뒤 새 토큰으로 시작한다.
  function handleAuthChange() {
    if (subscribers === 0 || localStorage.getItem('token') === token) return;
    stopResources();
    useParkingStore.getState().resetParking();
    startForCurrentToken();
  }

  // 다른 탭에서 발생한 토큰 변경 또는 저장소 초기화를 감지한다.
  function handleStorage(event: StorageEvent) {
    if (event.key === 'token' || event.key === null) handleAuthChange();
  }

  // 첫 구독에서 시작하고 마지막 구독 해제에서 종료한다. 리스너도 동일한 함수 참조로 해제한다.
  function subscribe() {
    subscribers += 1;
    if (subscribers === 1) {
      useParkingStore.getState().resetParking();
      window.addEventListener('parking-auth-changed', handleAuthChange);
      window.addEventListener('storage', handleStorage);
      window.addEventListener('focus', handleAuthChange);
      startForCurrentToken();
    }
    return () => {
      subscribers -= 1;
      if (subscribers !== 0) return;
      window.removeEventListener('parking-auth-changed', handleAuthChange);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleAuthChange);
      stopResources();
      token = null;
      authBlocked = false;
      useParkingStore.getState().resetParking();
    };
  }

  return { subscribe, refresh: refreshParkingSpaces };
}

const connections = {
  admin: createParkingSpaceSync('admin'),
  user: createParkingSpaceSync('user'),
};

// 화면은 서버 역할을 선택하고 필요 시 refresh를 호출한다. 연결 생명주기는 effect가 관리한다.
export function useParkingSpaceSync(server: ParkingServer = 'admin') {
  const connection = connections[server];
  useEffect(connection.subscribe, [connection]);
  return { refresh: connection.refresh };
}

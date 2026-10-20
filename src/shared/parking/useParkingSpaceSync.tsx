/**
 * 관리자 현황은 A, 사용자 현황은 U에서 받는다.
 * HTTP는 기존 axios JWT 인증을 사용하고, 소켓은 첫 AUTH 메시지로 인증한다.
 * 연결 장애 중에는 5초 HTTP 조회를 유지하되 인증 실패 시 재시도를 중지한다.
 */
import { useEffect } from 'react';
import { fetchPublicParkingSpaces, getParkingWebSocketUrl } from './parkingSpaceApi';
import type { ParkingServer } from './parkingSpaceApi';
import { normalizeParkingSpaces } from './parkingSpaceResponse';
import { useParkingStore } from './useParkingStore';

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

  // 화면에서의 사전 확인이다. 실제 서명/권한 검증은 항상 서버가 수행한다.
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

  function isCurrent(epoch: number, currentToken: string | null): boolean {
    return subscribers > 0 && generation === epoch && token === currentToken
      && localStorage.getItem('token') === currentToken;
  }

  function stopPolling() {
    window.clearInterval(pollTimer);
    pollTimer = undefined;
  }

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

  function failAuthentication(message: string) {
    stopResources();
    authBlocked = true;
    useParkingStore.getState().resetParking();
    useParkingStore.getState().failSync(message);
  }

  function scheduleExpiration(expiresAt: number) {
    window.clearTimeout(expirationTimer);
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      failAuthentication('로그인이 만료되었습니다. 다시 로그인해 주세요.');
      return;
    }
    expirationTimer = window.setTimeout(() => {
      if (localStorage.getItem('token') !== token) handleAuthChange();
      else scheduleExpiration(expiresAt);
    }, Math.min(remaining, 2147483647));
  }

  /** 늦은 HTTP 결과가 계정 변경이나 최신 소켓 상태를 덮어쓰지 못하게 한다. */
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

  function startPolling() {
    if (pollTimer !== undefined || subscribers === 0 || authBlocked || !token) return;
    load();
    pollTimer = window.setInterval(load, POLL_MS);
  }

  function scheduleReconnect() {
    if (subscribers === 0 || authBlocked || !token || reconnectTimer !== undefined) return;
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = undefined;
      connect();
    }, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, 30000);
  }

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
    connection.onclose = (event: CloseEvent) => {
      if (socket !== connection) return;
      window.clearTimeout(socketTimeout);
      window.clearInterval(heartbeatTimer);
      socketTimeout = heartbeatTimer = undefined;
      socket = null;
      if (!isCurrent(epoch, currentToken)) {
        handleAuthChange();
      } else if (event.code === 4001 || event.code === 4003 || event.code === 1008) {
        failAuthentication(event.code === 4001
          ? '로그인이 만료되었습니다. 다시 로그인해 주세요.'
          : '주차현황 연결 인증에 실패했습니다. 다시 로그인해 주세요.');
      } else {
        startPolling();
        scheduleReconnect();
      }
    };
  }

  function startForCurrentToken() {
    token = localStorage.getItem('token');
    authBlocked = false;
    if (!token) {
      failAuthentication('로그인이 필요합니다.');
      return;
    }
    try {
      const expiresAt = tokenExpiration(token);
      if (expiresAt <= Date.now()) throw new Error('로그인이 만료되었습니다. 다시 로그인해 주세요.');
      scheduleExpiration(expiresAt);
      startPolling();
      connect();
    } catch (error) {
      failAuthentication(error instanceof Error ? error.message : '다시 로그인해 주세요.');
    }
  }

  function handleAuthChange() {
    if (subscribers === 0 || localStorage.getItem('token') === token) return;
    stopResources();
    useParkingStore.getState().resetParking();
    startForCurrentToken();
  }

  function handleStorage(event: StorageEvent) {
    if (event.key === 'token' || event.key === null) handleAuthChange();
  }

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

export function useParkingSpaceSync(server: ParkingServer = 'admin') {
  const connection = connections[server];
  useEffect(connection.subscribe, [connection]);
  return { refresh: connection.refresh };
}

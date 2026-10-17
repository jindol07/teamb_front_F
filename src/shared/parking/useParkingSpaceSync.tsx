/**
 * 공개 주차현황을 탭당 한 연결로 공유합니다.
 * 초기/재연결 시 GET, 연결 중 웹소켓 수신, 끊긴 동안 5초 조회를 사용합니다.
 */
import { useEffect } from 'react';
import { fetchPublicParkingSpaces, getParkingWebSocketUrl } from './parkingSpaceApi';
import { useParkingStore } from './useParkingStore';

const POLL_MS = 5000;
const HEARTBEAT_MS = 15000;
const HEARTBEAT_TIMEOUT_MS = 45000;
let subscribers = 0;
let socket: WebSocket | null = null;
let reconnectTimer: number | undefined;
let pollTimer: number | undefined;
let heartbeatTimer: number | undefined;
let reconnectDelay = 3000;
let requestController: AbortController | null = null;
let pendingRequest: Promise<void> | null = null;
let snapshotVersion = 0;

/** 늦게 완료된 GET이 최신 소켓 상태를 덮어쓰지 않게 합니다. */
async function refreshParkingSpaces(): Promise<void> {
  requestController?.abort();
  const controller = new AbortController();
  requestController = controller;
  const version = snapshotVersion;
  let timedOut = false;
  const timeout = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 10000);
  const store = useParkingStore.getState();
  store.startSync();
  try {
    const rows = await fetchPublicParkingSpaces(controller.signal);
    if (controller.signal.aborted || snapshotVersion !== version) return;
    if (!Array.isArray(rows)) throw new Error('API 응답이 배열이 아닙니다.');
    store.replaceFromServer(rows);
  } catch (error) {
    if ((controller.signal.aborted && !timedOut) || snapshotVersion !== version) return;
    const failure = timedOut ? new Error('주차구획 조회 시간이 초과되었습니다.') : error;
    store.failSync(failure instanceof Error ? failure.message : String(failure));
    throw failure;
  } finally {
    window.clearTimeout(timeout);
    if (requestController === controller) requestController = null;
  }
}

function load() {
  if (pendingRequest) return;
  const request = refreshParkingSpaces();
  pendingRequest = request;
  void request.catch(() => {
    // 오류 정보는 공통 스토어에 저장되어 기존 화면에 표시됩니다.
  }).finally(() => {
    if (pendingRequest === request) pendingRequest = null;
  });
}

function stopPolling() {
  window.clearInterval(pollTimer);
  pollTimer = undefined;
}

function startPolling() {
  if (pollTimer !== undefined || subscribers === 0) return;
  load();
  pollTimer = window.setInterval(load, POLL_MS);
}

function scheduleReconnect() {
  if (subscribers === 0 || reconnectTimer !== undefined) return;
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = undefined;
    connect();
  }, reconnectDelay);
  reconnectDelay = Math.min(reconnectDelay * 2, 30000);
}

function connect() {
  if (subscribers === 0 || socket) return;
  let connection: WebSocket;
  try {
    connection = new WebSocket(getParkingWebSocketUrl());
  } catch (error) {
    console.warn('주차현황 웹소켓 연결 실패. HTTP 조회를 유지합니다.', error);
    startPolling();
    scheduleReconnect();
    return;
  }
  socket = connection;
  let lastReceivedAt = Date.now();
  // 연결 자체가 완료되지 않는 경우에도 HTTP 조회와 재시도를 유지합니다.
  const connectTimeout = window.setTimeout(() => {
    if (socket === connection && connection.readyState === WebSocket.CONNECTING) connection.close();
  }, 10000);

  connection.onopen = () => {
    if (socket !== connection) return;
    window.clearTimeout(connectTimeout);
    reconnectDelay = 3000;
    lastReceivedAt = Date.now();
    stopPolling();
    // 최초 GET과 연결 사이에 발생한 변경도 다시 확인합니다.
    void refreshParkingSpaces().catch(() => {
      if (socket === connection) connection.close();
    });
    heartbeatTimer = window.setInterval(() => {
      if (Date.now() - lastReceivedAt > HEARTBEAT_TIMEOUT_MS) {
        connection.close();
      } else if (connection.readyState === WebSocket.OPEN) {
        connection.send('PING');
      }
    }, HEARTBEAT_MS);
  };

  connection.onmessage = (event: MessageEvent<string>) => {
    if (socket !== connection) return;
    lastReceivedAt = Date.now();
    if (event.data === 'PONG') return;
    try {
      const message = JSON.parse(event.data);
      if (message?.type !== 'PARKING_SPACES_SNAPSHOT' || !Array.isArray(message.spaces)) {
        throw new Error('지원하지 않는 주차현황 웹소켓 응답입니다.');
      }
      // 기존 좌표/중복 검증 및 AVAILABLE → EMPTY 변환을 그대로 사용합니다.
      useParkingStore.getState().replaceFromServer(message.spaces);
      snapshotVersion += 1;
    } catch (error) {
      console.warn('주차현황 웹소켓 응답 오류. HTTP로 다시 조회합니다.', error);
      connection.close();
    }
  };

  connection.onerror = () => {
    if (socket === connection) connection.close();
  };
  connection.onclose = () => {
    window.clearTimeout(connectTimeout);
    if (socket !== connection) return;
    socket = null;
    window.clearInterval(heartbeatTimer);
    heartbeatTimer = undefined;
    startPolling();
    scheduleReconnect();
  };
}

function subscribe() {
  subscribers += 1;
  if (subscribers === 1) {
    startPolling();
    connect();
  }
  return () => {
    subscribers -= 1;
    if (subscribers !== 0) return;
    stopPolling();
    window.clearTimeout(reconnectTimer);
    reconnectTimer = undefined;
    window.clearInterval(heartbeatTimer);
    heartbeatTimer = undefined;
    const connection = socket;
    socket = null;
    connection?.close();
    requestController?.abort();
    requestController = null;
    pendingRequest = null;
    reconnectDelay = 3000;
  };
}

export function useParkingSpaceSync() {
  useEffect(subscribe, []);
  // 관리자 저장 후 수동 재조회에 사용하는 기존 인터페이스를 유지합니다.
  return { refresh: refreshParkingSpaces };
}

/** [1023_1010] 파일 안내
 * 용도: A/U 주차구획 API 호출과 화면에서 공유하는 요청·응답 타입 정의.
 * 직접 사용처: ParkingStatusAdmin, SlotDetailPanel, ParkingReservationList,
 * useParkingSpaceSync, parkingSpaceResponse, parkingSpaceAdapter, useParkingStore.
 * 연결: api/axios.ts의 adminApi·userApi → A/U ParkingSpaceController.
 * 관리자 상세에는 메모·차량번호가 포함될 수 있으므로 공개 현황과 구분한다.
 * API 계약의 타입 선언은 런타임 검증이 아니며, 구획 응답 검증은 정규화 함수가 맡는다.
 */
/**
 * Spring Boot A·U 서버의 주차구획 API 통신 모듈.
 *
 * 원칙:
 * - 임의의 Mock 데이터는 반환하지 않음. 오류면 예외를 던짐.
 * - 관리자/사용자 조회 API를 분리하여 관리자 메모를 사용자에게 노출하지 않음.
 * - 관리자 조회·수정은 A, 사용자 현황 조회는 U 서버로 요청.
 * - 공개용 DTO는 민감 정보를 제외한다는 의미이며, 로그인 정책은 서버가 적용.
 */
import type { AxiosRequestConfig } from 'axios';
import {
  adminApi,
  refreshAccessToken,
  refreshAdminAccessToken,
  userApi,
} from '../../api/axios';
import { normalizeParkingSpace, normalizeParkingSpaces } from './parkingSpaceResponse';

// 개인별 서버 주소는 Vite 환경변수(.env, .env.local)에서 읽습니다.
const API_ORIGIN = (import.meta.env.VITE_BOOT_API_BASE_URL ?? '').replace(/\/+$/, '');
// _A·_U에는 context-path가 포함되어 있으므로 /alpharking을 다시 붙이지 않는다.
const ADMIN_CONTEXT = (
  import.meta.env.VITE_BOOT_API_BASE_URL_A ?? `${API_ORIGIN}/alpharking/admin`
).replace(/\/+$/, '');
const USER_CONTEXT = (import.meta.env.VITE_BOOT_API_BASE_URL_U ?? '/alpharking').replace(
  /\/+$/,
  '',
);

export type ParkingServer = 'admin' | 'user';

/** [1023_1010] 관리자 예약 집계·달력·이력 목록에서 사용하는 예약 조회 응답. */
export interface ParkingReservationRecord {
  parkingReservationId: number;
  parkingSpaceId: number;
  vehicleNumber: string;
  reservationStartAt: string;
  reservationEndAt: string;
  statusCode: string;
}

/** [1023_1010] 관리자 오늘 예약 집계용 날짜. 브라우저 시간대와 무관하게 한국 날짜를 사용한다. */
export function parkingToday() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** [1023_1010] 지정일 예약 조회. spaceId가 없으면 전체 구획, 있으면 해당 구획만 요청한다. */
export function fetchParkingReservations(
  date: string,
  signal?: AbortSignal,
  spaceId?: number,
  upcoming = false,
) {
  return request<ParkingReservationRecord[]>(
    spaceId == null ? '/reservations' : `/${spaceId}/reservations`,
    {
      params: { date, upcoming },
      signal,
    },
  );
}

/** 달력 표시는 진행 중·향후 확정 예약이 있는 구획에만 표시한다. */
export function fetchUpcomingParkingReservations(signal?: AbortSignal) {
  return request<ParkingReservationRecord[]>('/reservations/upcoming', { signal });
}

/** 관리자 패널: 해당 구획의 전체 날짜 예약 기록(취소 포함). */
export function fetchParkingReservationHistory(spaceId: number, signal?: AbortSignal) {
  return request<ParkingReservationRecord[]>(`/${spaceId}/reservation-history`, {
    signal,
  });
}

/** 화면 역할에 맞는 서버의 현황 소켓에 연결합니다. */
export function getParkingWebSocketUrl(server: ParkingServer = 'admin'): string {
  // [1023_1010] 현재 페이지 기준으로 상대 주소를 해석하고 HTTP 보안 여부를 소켓 프로토콜에 반영한다.
  const context = server === 'user' ? USER_CONTEXT : ADMIN_CONTEXT;
  const url = new URL(`${context}/ws/parking/spaces`, window.location.origin);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}

/** 서버 응답을 화면용 camelCase로 정규화한 주차구획 데이터. */
export interface ParkingSpaceDto {
  parkingSpaceId: number;
  floorNo: number;
  zoneCode: string;
  spaceNumber: string;
  /** 백엔드에서 조합한 AI팀 공통 구획 코드 */
  spaceCode: string;
  spaceTypeCode: string;
  spaceStatusCode: string;
  xPosition: number | null;
  yPosition: number | null;
  width: number | null;
  height: number | null;
  /** 관리자에게만 반환하며 사용자 공개 API에는 존재하지 않음. */
  memo?: string | null;
  /** 관리자 응답 전용. 공개 API에는 포함되지 않습니다. */
  vehicleNumber?: string | null;
  updatedAt?: string | null;
}

/** [1023_1010] 보정 패널에서 선택·연결할 기존 이용 기록. 구획 미배정·미출차 값은 null일 수 있다. */
export interface ParkingUsageRecord {
  parkingUsageId: number;
  vehicleId: number | null;
  vehicleNumber: string;
  parkingSpaceId: number | null;
  spaceCode: string | null;
  entryAt: string;
  exitAt: string | null;
  parkingTypeCode: string;
}

/** [1023_1010] 관리자 변경 이력 표시용 스냅샷. changeReason은 저장된 변경 사유다. */
export interface ParkingSpaceHistory {
  parkingSpaceHistoryId: number;
  spaceStatusCode: string;
  spaceTypeCode: string;
  memo: string | null;
  changeReason: string | null;
  changedByAdminId: number | null;
  changeSourceCode: string;
  validFrom: string;
  validTo: string | null;
}

/** [1023_1010] 보정 화면의 기준값 묶음: DB 구획 원본·연결된 미출차 기록·최근 이력. */
export interface ParkingCorrectionDetail {
  space: ParkingSpaceDto;
  activeUsages: ParkingUsageRecord[];
  history: ParkingSpaceHistory[];
}

/** [1023_1010] 이용 기록 유지 / 기존 기록 연결 / 구획 연결만 해제 / 누락 출차 처리. */
export type ParkingUsageAction = 'KEEP' | 'ASSIGN' | 'DETACH' | 'EXIT';

/** [1023_1010] expected 계열은 조회 당시 기준값이다. 서버가 현재 값과 대조해 덮어쓰기를 방지한다. */
export interface ParkingCorrectionInput {
  spaceStatusCode: string;
  spaceTypeCode: string;
  memo: string;
  changeReason: string;
  usageAction: ParkingUsageAction;
  parkingUsageId: number | null;
  vehicleNumber: string | null;
  exitAt: string | null;
  expectedStatus: string;
  expectedType: string;
  expectedMemo: string | null;
  expectedUpdatedAt: string | null;
  expectedHistoryId: number | null;
  expectedActiveUsageIds: number[];
}

/** 기존 axios 인터셉터로 로그인 JWT를 첨부하고 HTTP 오류를 전달한다. */
async function request<T>(
  path: string,
  init: AxiosRequestConfig = {},
  server: ParkingServer = 'admin',
): Promise<T> {
  // [1023_1010] 서버 역할별 axios 인증 인터셉터를 사용하고, 오류 상태는 아래에서 직접 해석한다.
  const client = server === 'user' ? userApi : adminApi;
  const requestConfig: AxiosRequestConfig = {
    ...init,
    baseURL: server === 'user' ? USER_CONTEXT : ADMIN_CONTEXT,
    url: `/api/parking/spaces${path}`,
    withCredentials: true,
    validateStatus: () => true,
    headers: { ...init.headers, 'Cache-Control': 'no-cache' },
  };

  let response = await client.request<T>(requestConfig);

  // validateStatus: () => true 때문에 401이 reject되지 않는다.
  // 서버별 refresh를 수행한 뒤 원 요청을 1회 재시도한다.
  if (response.status === 401) {
    const newAccessToken = server === 'user'
      ? await refreshAccessToken()
      : await refreshAdminAccessToken();

    if (newAccessToken) {
      response = await client.request<T>(requestConfig);
    }
  }

  if (response.status < 200 || response.status >= 300) {
    if (response.status === 401)
      throw new Error('로그인이 필요하거나 인증이 만료되었습니다. 다시 로그인해 주세요.');
    if (response.status === 403)
      throw new Error('주차구획 조회·변경 권한이 없거나 인증을 확인할 수 없습니다.');
    // [1023_1010] 서버가 보정 실패 사유를 제공하면 일반 HTTP 문구보다 그 사유를 우선 표시한다.
    const errorBody: unknown = response.data;
    if (
      errorBody &&
      typeof errorBody === 'object' &&
      'message' in errorBody &&
      typeof errorBody.message === 'string' &&
      errorBody.message
    ) {
      throw new Error(errorBody.message);
    }
    throw new Error(`주차구획 API 오류: HTTP ${response.status}`);
  }
  // [1023_1010] 프록시·로그인 HTML을 정상 구획 JSON으로 오인하지 않도록 응답 형식을 확인한다.
  const contentType = String(response.headers['content-type'] ?? '');
  if (!contentType.includes('application/json')) {
    throw new Error(
      `주차구획 API가 JSON이 아닌 응답을 반환했습니다: ${contentType || 'Content-Type 없음'}`,
    );
  }
  return response.data;
}

/** 관리자는 JWT 인증 후 메모를 포함한 구획 목록 조회. */
export function fetchAdminParkingSpaces(signal?: AbortSignal) {
  return request<unknown>('', { signal }).then(normalizeParkingSpaces);
}

/** 공통 스토어에는 화면 역할에 관계없이 메모/민감 정보를 제외한 현황만 저장한다. */
export function fetchPublicParkingSpaces(
  signal?: AbortSignal,
  server: ParkingServer = 'admin',
) {
  return request<unknown>(server === 'user' ? '' : '/public', { signal }, server).then(
    normalizeParkingSpaces,
  );
}

/** 관리자 구획 강제 변경: JWT 인증 및 ADMIN 권한이 필요하다. */
export function saveParkingSpace(parkingSpaceId: number, input: ParkingCorrectionInput) {
  return request<unknown>(`/${parkingSpaceId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data: input,
  }).then(normalizeParkingSpace);
}

/** 메모·차량 기록·이력은 관리자 패널 안에서만 보관한다. */
export async function fetchParkingCorrection(
  parkingSpaceId: number,
  signal?: AbortSignal,
): Promise<ParkingCorrectionDetail> {
  const detail = await request<ParkingCorrectionDetail>(`/${parkingSpaceId}/correction`, {
    signal,
  });
  return { ...detail, space: normalizeParkingSpace(detail.space) };
}

/** [1023_1010] 보정 패널의 차량 검색. 새 입차를 만들지 않고 기존 미출차 기록 후보만 조회한다. */
export function searchParkingUsageRecords(vehicleNumber: string, signal?: AbortSignal) {
  return request<ParkingUsageRecord[]>('/usage-candidates', {
    params: { vehicleNumber },
    signal,
  });
}

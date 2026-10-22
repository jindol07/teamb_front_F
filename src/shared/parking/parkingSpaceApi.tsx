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
import { adminApi, userApi } from '../../api/axios';
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

export interface ParkingReservationRecord {
  parkingReservationId: number;
  parkingSpaceId: number;
  vehicleNumber: string;
  reservationStartAt: string;
  reservationEndAt: string;
  statusCode: string;
}

export function parkingToday() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

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

export interface ParkingCorrectionDetail {
  space: ParkingSpaceDto;
  activeUsages: ParkingUsageRecord[];
  history: ParkingSpaceHistory[];
}

export type ParkingUsageAction = 'KEEP' | 'ASSIGN' | 'DETACH' | 'EXIT';

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
  const client = server === 'user' ? userApi : adminApi;
  const response = await client.request<T>({
    ...init,
    baseURL: server === 'user' ? USER_CONTEXT : ADMIN_CONTEXT,
    url: `/api/parking/spaces${path}`,
    withCredentials: true,
    validateStatus: () => true,
    headers: { ...init.headers, 'Cache-Control': 'no-cache' },
  });
  if (response.status < 200 || response.status >= 300) {
    if (response.status === 401)
      throw new Error('로그인이 필요하거나 인증이 만료되었습니다. 다시 로그인해 주세요.');
    if (response.status === 403)
      throw new Error('주차구획 조회·변경 권한이 없거나 인증을 확인할 수 없습니다.');
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

/**
 * 관리자 메모 변경. 변경 성공 후 서버가 DB의 최신 구획 1개를 다시 반환함.
 * 변경 ID는 프론트 임시 id가 아닌 실제 PARKING_SPACE_ID여야 함.
 * 서버에서는 adminId를 요청 본문에서 신뢰하지 않고 JWT 인증 정보에서 가져옴.
 */
export function saveParkingMemo(parkingSpaceId: number, memo: string) {
  return request<unknown>(`/${parkingSpaceId}/memo`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data: { memo },
  }).then(normalizeParkingSpace);
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

export function searchParkingUsageRecords(vehicleNumber: string, signal?: AbortSignal) {
  return request<ParkingUsageRecord[]>('/usage-candidates', {
    params: { vehicleNumber },
    signal,
  });
}

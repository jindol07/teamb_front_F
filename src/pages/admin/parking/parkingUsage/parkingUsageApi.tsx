/** [1023_1010] 파일 안내
 * 용도: 관리자 입출차 조회·수동 입차/출차·구획 연결 API 계약.
 * 직접 사용처: ParkingUsageAdmin(조회), 현재 라우트 미연결 ParkingManage(수동 입출차).
 * assignParkingSpace는 구획 연결용 export이며 현재 프론트 호출자는 확인되지 않는다.
 * A ParkingUsageController로 JWT 요청한다. 서버 API와 DTO가 존재하므로 export 미호출만으로 서버 기능을 삭제하지 않는다.
 */
import type { AxiosRequestConfig } from 'axios';
import { adminApi } from '../../../../api/axios';

const origin = (import.meta.env.VITE_BOOT_API_BASE_URL ?? '').replace(/\/+$/, '');
const adminContext = (import.meta.env.VITE_BOOT_API_BASE_URL_A
  ?? `${origin}/alpharking/admin`).replace(/\/+$/, '');

// [1023_1010] 입차 기록의 DB ID와 구획 ID를 구분한다. 미등록 차량·미배정 구획·미출차 값은 null일 수 있다.
export interface ParkingUsage {
  parkingUsageId: number;
  vehicleId: number | null;
  vehicleNumber: string;
  parkingSpaceId: number | null;
  spaceCode: string | null;
  entryAt: string;
  exitAt: string | null;
  parkingTypeCode: string;
}

// [1023_1010] A 관리자 axios를 사용한다. HTTP 상태별 안내를 만들고 입출차 데이터만 반환한다.
async function request<T>(path: string, init: AxiosRequestConfig = {}): Promise<T> {
  const response = await adminApi.request<T>({
    ...init,
    baseURL: adminContext,
    url: `/api/parking/usages${path}`,
    withCredentials: true,
    validateStatus: () => true,
    headers: { ...init.headers, 'Cache-Control': 'no-cache' },
  });
  if (response.status < 200 || response.status >= 300) {
    if (response.status === 401) throw new Error('관리자 로그인이 필요하거나 인증이 만료되었습니다. 다시 로그인해 주세요.');
    if (response.status === 403) throw new Error('관리자 권한이 없거나 인증을 확인할 수 없습니다.');
    if (response.status === 409) throw new Error('중복 입차·출차 또는 구획 배정 상태가 충돌합니다. 목록을 새로고침하세요.');
    if (response.status === 422) throw new Error('등록 승인된 차량번호가 아닙니다.');
    throw new Error(`입출차 API 오류: HTTP ${response.status}`);
  }
  return response.data;
}

// [1023_1010] 최근 기록 조회. 전체 미출차 집계는 별도 active API를 사용한다.
export const fetchParkingUsages = (signal?: AbortSignal) => request<ParkingUsage[]>('', { signal });
// [1023_1010] 최근 기록 제한과 무관하게 현재 미출차 목록을 조회한다.
export const fetchActiveParkingUsages = (signal?: AbortSignal) => request<ParkingUsage[]>('/active', { signal });
// [1023_1010] 수동 입차 요청: 승인된 등록 차량 또는 번호판 기반 방문 차량 처리는 서버가 판정한다.
export const createParkingEntry = (vehicleNumber: string) =>
  request<ParkingUsage>('/entry', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    data: { vehicleNumber },
  });
// [1023_1010] 기존 이용 기록을 출차 처리한다. 새 이용 기록을 생성하지 않는다.
export const finishParkingUsage = (id: number) =>
  request<ParkingUsage>(`/${id}/exit`, { method: 'PATCH' });
// [1023_1010] 기존 이용 기록과 점유 확인된 구획을 연결하는 서버 API 계약이다.
export const assignParkingSpace = (id: number, spaceId: number) =>
  request<ParkingUsage>(`/${id}/space`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    data: { parkingSpaceId: spaceId },
  });


// 1. 판정 시점의 이력입니다. 현재 주차 위치나 위반 확정을 뜻하지 않습니다.
export type ParkingDecisionCode = 'MATCHED' | 'WRONG_SPACE' | 'NO_VALID_RESERVATION' | 'UNDETERMINED';
export interface AiParkingDecision {
  aiDetectionEventId: number;
  eventId: string;
  detectedAt: string;
  cameraId: string;
  plateNumber: string;
  spaceCode: string;
  parkingUsageId: number | null;
  expectedParkingUsageId: number | null;
  parkingDecision: ParkingDecisionCode;
  outcome: 'PROCESSED' | 'UNCHANGED' | 'PENDING';
}

export async function fetchAiParkingDecisions(signal?: AbortSignal): Promise<AiParkingDecision[]> {
  const data = await request<unknown>('/ai-decisions', { signal });
  const isId = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
  if (!Array.isArray(data) || !data.every(row => {
    if (typeof row !== 'object' || row === null) return false;
    return isId(row.aiDetectionEventId) && typeof row.eventId === 'string'
      && typeof row.detectedAt === 'string' && Number.isFinite(Date.parse(row.detectedAt))
      && typeof row.cameraId === 'string' && typeof row.plateNumber === 'string'
      && typeof row.spaceCode === 'string'
      && (row.parkingUsageId === null || isId(row.parkingUsageId))
      && (row.expectedParkingUsageId === null || isId(row.expectedParkingUsageId))
      && ['MATCHED', 'WRONG_SPACE', 'NO_VALID_RESERVATION', 'UNDETERMINED'].includes(row.parkingDecision)
      && ['PROCESSED', 'UNCHANGED', 'PENDING'].includes(row.outcome)
      && ((row.parkingDecision === 'MATCHED') !== (row.outcome === 'PENDING'));
  })) throw new Error('주차 판정 응답 형식을 확인할 수 없습니다.');
  return data as AiParkingDecision[];
}

/** 파일 안내
 * 용도: 전체 이력 화면에서 사용하는 관리자 입출차 기록 조회 계약.
 * 직접 사용처: History.tsx의 ‘입·출차 이력’ 분류.
 * 입출차 관리 화면 삭제 후에도 공통 이력이 사용하므로 이 조회 API는 유지한다.
 * AI 입출차·구획 보정 백엔드와 DB의 이용 기록은 변경하지 않는다.
 */
import type { AxiosRequestConfig } from 'axios';
import { adminApi } from '../../../../api/axios';

const origin = (import.meta.env.VITE_BOOT_API_BASE_URL ?? '').replace(/\/+$/, '');
const adminContext = (import.meta.env.VITE_BOOT_API_BASE_URL_A
  ?? `${origin}/alpharking/admin`).replace(/\/+$/, '');

// 입차 기록의 DB ID와 구획 ID를 구분한다. 미등록 차량·미배정 구획·미출차 값은 null일 수 있다.
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

// A 관리자 axios를 사용한다. HTTP 상태별 안내를 만들고 입출차 데이터만 반환한다.
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

// 전체 이력 화면의 입·출차 분류에서 서버의 최근 기록을 조회한다.
export const fetchParkingUsages = (signal?: AbortSignal) => request<ParkingUsage[]>('', { signal });

import type { AxiosRequestConfig } from 'axios';
import { adminApi } from '../../../../api/axios';

const origin = (import.meta.env.VITE_BOOT_API_BASE_URL ?? '').replace(/\/+$/, '');
const adminContext = (import.meta.env.VITE_BOOT_API_BASE_URL_A
  ?? `${origin}/alpharking/admin`).replace(/\/+$/, '');

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

export const fetchParkingUsages = (signal?: AbortSignal) => request<ParkingUsage[]>('', { signal });
export const fetchActiveParkingUsages = (signal?: AbortSignal) => request<ParkingUsage[]>('/active', { signal });
export const createParkingEntry = (vehicleNumber: string) =>
  request<ParkingUsage>('/entry', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    data: { vehicleNumber },
  });
export const finishParkingUsage = (id: number) =>
  request<ParkingUsage>(`/${id}/exit`, { method: 'PATCH' });
export const assignParkingSpace = (id: number, spaceId: number) =>
  request<ParkingUsage>(`/${id}/space`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    data: { parkingSpaceId: spaceId },
  });

const origin = (import.meta.env.VITE_BOOT_API_BASE_URL ?? '').replace(/\/$/, '');
const endpoint = `${origin}/alpharking/admin/api/parking/usages`;

export interface ParkingUsage {
  parkingUsageId: number;
  vehicleId: number;
  vehicleNumber: string;
  parkingSpaceId: number | null;
  spaceCode: string | null;
  entryAt: string;
  exitAt: string | null;
  parkingTypeCode: string;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${endpoint}${path}`, {
    credentials: 'include',
    cache: 'no-store',
    ...init,
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('관리자 로그인 세션이 없습니다. 로그인 기능 연동 후 이용할 수 있습니다.');
    if (response.status === 409) throw new Error('중복 입차·출차 또는 구획 배정 상태가 충돌합니다. 목록을 새로고침하세요.');
    if (response.status === 422) throw new Error('등록 승인된 차량번호가 아닙니다.');
    throw new Error(`입출차 API 오류: HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const fetchParkingUsages = () => request<ParkingUsage[]>('');
export const fetchActiveParkingUsages = () => request<ParkingUsage[]>('/active');
export const createParkingEntry = (vehicleNumber: string) =>
  request<ParkingUsage>('/entry', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vehicleNumber }),
  });
export const finishParkingUsage = (id: number) =>
  request<ParkingUsage>(`/${id}/exit`, { method: 'PATCH' });
export const assignParkingSpace = (id: number, spaceId: number) =>
  request<ParkingUsage>(`/${id}/space`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parkingSpaceId: spaceId }),
  });

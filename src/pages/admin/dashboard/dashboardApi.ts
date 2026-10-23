/** 대시보드 조회 API. 기존 관리자 axios의 JWT 인증과 차량 신청 API 계약을 사용한다. */
import axios from 'axios';
import { adminApi } from '../../../api/axios';
import type { VehicleChangeRequestDTO } from '../../../api/vehicleApi';

export interface DailyParkingSummaryRow {
  summaryDate: string;
  usageCount: number;
  reservationCount: number;
  visitorCount: number;
}

export type DashboardPeriod = 'week' | 'month';

export interface DashboardParkingEventRow {
  parkingUsageId: number;
  vehicleNumber: string;
  eventType: 'ENTRY' | 'EXIT';
  occurredAt: string;
  spaceCode: string | null;
}

export async function fetchDailyParkingSummary(
  period: DashboardPeriod,
  signal?: AbortSignal,
): Promise<DailyParkingSummaryRow[]> {
  const response = await adminApi.get<DailyParkingSummaryRow[]>(
    '/api/dashboard/daily-parking-summary',
    {
      params: { period },
      signal,
      timeout: 10000,
    },
  );
  if (!Array.isArray(response.data))
    throw new Error('일별 통계 응답 형식을 확인해 주세요.');
  return response.data;
}

/** 전체 이용 기록의 입차·출차 시각으로 정렬된 최신 5건. 변경 API는 호출하지 않는다. */
export async function fetchRecentParkingEvents(
  signal?: AbortSignal,
): Promise<DashboardParkingEventRow[]> {
  const response = await adminApi.get<DashboardParkingEventRow[]>(
    '/api/dashboard/recent-parking-events',
    {
      signal,
      timeout: 10000,
    },
  );
  if (!Array.isArray(response.data))
    throw new Error('입출차 내역 응답 형식을 확인해 주세요.');
  return response.data;
}

/** 기존 차량 목록 조회 경로에 취소·시간 제한만 붙이며 승인·반려 코드는 호출하지 않는다. */
export async function fetchDashboardVehicleRequests(
  signal?: AbortSignal,
): Promise<VehicleChangeRequestDTO[]> {
  const response = await adminApi.get<VehicleChangeRequestDTO[]>('/api/vehiclech', {
    signal,
    timeout: 10000,
  });
  if (!Array.isArray(response.data))
    throw new Error('차량 신청 응답 형식을 확인해 주세요.');
  return response.data;
}

export function dashboardError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401)
      return '로그인이 만료되었습니다. 다시 로그인해 주세요.';
    if (error.response?.status === 403) return '관리자 권한을 확인해 주세요.';
    if (error.code === 'ECONNABORTED')
      return '조회 시간이 초과되었습니다. 다시 시도해 주세요.';
    return '데이터를 불러오지 못했습니다. 서버 연결을 확인해 주세요.';
  }
  return error instanceof Error ? error.message : '조회 중 오류가 발생했습니다.';
}

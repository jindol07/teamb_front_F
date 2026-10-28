/** 파일 안내
 * 용도: 대시보드 통계·입출차·차량 신청·위험알림 조회와 응답 타입, 오류 안내를 제공한다.
 * 직접 사용처: AdminDashboard. 차트와 목록 컴포넌트도 이 파일의 타입을 사용한다.
 * 기존 adminApi의 인증을 사용하며 조회에는 10초 제한과 요청 취소 신호를 전달한다.
 * 차량 신청 조회는 기존 /api/vehiclech를 사용한다. 대기 상태 필터는 AdminDashboard가 적용한다.
 */
import axios from 'axios';
import { adminApi } from '../../../api/axios';
import type { VehicleChangeRequestDTO } from '../../../api/vehicleApi';

/** 저장된 날짜별 집계 한 행. 방문 차량 이용은 전체 이용과 더해서 총계를 만들지 않는다. */
export interface DailyParkingSummaryRow {
  summaryDate: string;
  usageCount: number;
  reservationCount: number;
  visitorCount: number;
}

/** 달력상의 한 주·한 달이 아니라 오늘 포함 최근 7일·30일 조회 옵션이다. */
export type DashboardPeriod = 'week' | 'month';

/** 하나의 이용 기록에서 ENTRY와 EXIT가 각각 별도 행으로 반환될 수 있다. */
export interface DashboardParkingEventRow {
  parkingUsageId: number;
  vehicleNumber: string;
  eventType: 'ENTRY' | 'EXIT';
  occurredAt: string;
  spaceCode: string | null;
}

/** 통계 생성 없이 DAILY_PARKING_SUMMARY에 저장된 기간별 행을 읽는다. */
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

// 위험알림은 관리자 공통 Provider에서 조회한다. 기존 타입·상세 API의 import 경로는 유지한다.
export type {
  DashboardSafetyAlert,
  DashboardSafetyIncident,
} from '../../../shared/safety/safetyAlertApi';
export {
  fetchDashboardSafetyIncident,
  markDashboardSafetyAlertRead,
} from '../../../shared/safety/safetyAlertApi';

/** 인증·권한·지연·연결 오류를 화면 안내로 변환한다. 원래 예외나 토큰은 화면에 노출하지 않는다. */
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

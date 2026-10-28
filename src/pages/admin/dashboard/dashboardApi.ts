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

/** 안전사고의 업무 상태이며 AI 탐지 해제나 알림 읽음 상태와는 별개다. */
export interface DashboardSafetyIncident {
  incidentId: number;
  type: string;
  risk: string;
  status: string;
  detectionCount: number;
  firstDetectedAt: string | null;
  lastDetectedAt: string | null;
  isTest: boolean;
  parkingSpaceId: number | null;
  resolutionNote: string | null;
}

export interface DashboardSafetyAlert {
  notificationId: number;
  incidentId: number;
  title: string;
  content: string;
  read: boolean;
  createdAt: string | null;
  incident: DashboardSafetyIncident | null;
}

/** JDBC Map 응답의 대문자 키를 화면 모델로 변환한다. 잘못된 응답을 정상 0건으로 숨기지 않는다. */
function safetyRecord(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('위험알림 응답 형식을 확인해 주세요.');
  }
  return value as Record<string, unknown>;
}

function safetyId(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error('위험알림 식별자가 올바르지 않습니다.');
  }
  return value;
}

function safetyText(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('위험알림의 필수 항목을 확인해 주세요.');
  }
  return value;
}

function safetyFlag(value: unknown): boolean {
  if (value !== 'Y' && value !== 'N') {
    throw new Error('위험알림의 시험·읽음 상태를 확인해 주세요.');
  }
  return value === 'Y';
}

/** JDBC 날짜는 서버 설정에 따라 ISO 문자열 또는 epoch 밀리초다. 시간대 없는 문자열은 재해석하지 않는다. */
function safetyTime(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number' && Number.isFinite(value)) {
    const date = new Date(value);
    if (Number.isFinite(date.getTime())) return date.toISOString();
  }
  throw new Error('위험알림 시각 형식을 확인해 주세요.');
}

function safetyIncident(value: unknown): DashboardSafetyIncident {
  const row = safetyRecord(value);
  if (typeof row.DETECTION_COUNT !== 'number'
      || !Number.isSafeInteger(row.DETECTION_COUNT) || row.DETECTION_COUNT < 0) {
    throw new Error('위험 감지 횟수가 올바르지 않습니다.');
  }
  return {
    incidentId: safetyId(row.SAFETY_INCIDENT_ID),
    type: safetyText(row.INCIDENT_TYPE_CODE),
    risk: safetyText(row.RISK_LEVEL_CODE),
    status: safetyText(row.INCIDENT_STATUS_CODE),
    detectionCount: row.DETECTION_COUNT,
    firstDetectedAt: safetyTime(row.FIRST_DETECTED_AT),
    lastDetectedAt: safetyTime(row.LAST_DETECTED_AT),
    isTest: safetyFlag(row.IS_TEST),
    parkingSpaceId: row.PARKING_SPACE_ID == null ? null : safetyId(row.PARKING_SPACE_ID),
    resolutionNote: row.RESOLUTION_NOTE == null ? null : safetyText(row.RESOLUTION_NOTE),
  };
}

/** 관리자 본인 알림과 사건 목록을 병렬 조회한다. 시험 알림도 유지하고 사건 ID로 연결한다. */
export async function fetchDashboardSafetyAlerts(signal?: AbortSignal): Promise<{
  alerts: DashboardSafetyAlert[];
  incidentError: string | null;
}> {
  const config = { params: { limit: 30 }, signal, timeout: 10000 };
  const [notifications, incidents] = await Promise.allSettled([
    adminApi.get<unknown>('/api/admin/safety-notifications', config),
    adminApi.get<unknown>('/api/admin/safety-incidents', config),
  ]);
  if (notifications.status === 'rejected') throw notifications.reason;
  if (!Array.isArray(notifications.value.data)) {
    throw new Error('위험알림 목록 응답이 배열이 아닙니다.');
  }
  const byIncident = new Map<number, DashboardSafetyIncident>();
  let incidentError: string | null = null;
  try {
    if (incidents.status === 'rejected') throw incidents.reason;
    if (!Array.isArray(incidents.value.data)) throw new Error('안전사고 목록 응답이 배열이 아닙니다.');
    for (const value of incidents.value.data) {
      const incident = safetyIncident(value);
      byIncident.set(incident.incidentId, incident);
    }
  } catch (error) {
    byIncident.clear();
    incidentError = dashboardError(error);
  }
  // 서버의 최신순을 유지한다. 사건 목록의 최근 30건 밖에 있는 알림도 숨기지 않는다.
  const alerts = notifications.value.data.slice(0, 5).map((value): DashboardSafetyAlert => {
    const row = safetyRecord(value);
    const incidentId = safetyId(row.SAFETY_INCIDENT_ID);
    return {
      notificationId: safetyId(row.NOTIFICATION_ID),
      incidentId,
      title: safetyText(row.TITLE),
      content: row.CONTENT == null ? '' : safetyText(row.CONTENT),
      read: safetyFlag(row.READ_YN),
      createdAt: safetyTime(row.CREATED_AT),
      incident: byIncident.get(incidentId) ?? null,
    };
  });
  return { alerts, incidentError };
}

/** 항목을 펼칠 때만 사건 상세를 조회한다. 읽음 PATCH나 사건 상태 변경 요청은 수행하지 않는다. */
export async function fetchDashboardSafetyIncident(
  incidentId: number,
  signal?: AbortSignal,
): Promise<DashboardSafetyIncident> {
  safetyId(incidentId);
  const response = await adminApi.get<unknown>(`/api/admin/safety-incidents/${incidentId}`, {
    signal, timeout: 10000,
  });
  const incident = safetyIncident(response.data);
  if (incident.incidentId !== incidentId) throw new Error('요청한 안전사고와 응답이 일치하지 않습니다.');
  return incident;
}

/** 상세 조회 성공 뒤 관리자 본인 알림만 읽음 처리한다. 사건의 접수·해결 상태는 변경하지 않는다. */
export async function markDashboardSafetyAlertRead(
  notificationId: number,
  signal?: AbortSignal,
): Promise<void> {
  safetyId(notificationId);
  const response = await adminApi.patch<unknown>(
    `/api/admin/safety-notifications/${notificationId}/read`,
    undefined,
    { signal, timeout: 10000 },
  );
  const row = safetyRecord(response.data);
  if (safetyId(row.NOTIFICATION_ID) !== notificationId || !safetyFlag(row.READ_YN)) {
    throw new Error('알림 읽음 처리 결과를 확인할 수 없습니다.');
  }
}

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

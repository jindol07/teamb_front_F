/** 파일 안내
 * 용도: 관리자 전역 위험알림·사건 상세·읽음·업무 상태 변경 API와 응답 검증.
 * 직접 사용처: SafetyAlertProvider. 기존 adminApi의 JWT 인증·토큰 갱신을 공유한다.
 * 기존 서버의 최근 100건 조회 한도를 사용한다. 읽음과 사건 처리 완료, AI 감지 상태는 별개다.
 */
import axios from 'axios';
import { adminApi } from '../../api/axios';

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
  if (
    typeof row.DETECTION_COUNT !== 'number' ||
    !Number.isSafeInteger(row.DETECTION_COUNT) ||
    row.DETECTION_COUNT < 0
  ) {
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
export async function fetchSafetyAlerts(signal?: AbortSignal): Promise<{
  alerts: DashboardSafetyAlert[];
  incidentError: string | null;
}> {
  const config = { params: { limit: 100 }, signal, timeout: 10000 };
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
    if (!Array.isArray(incidents.value.data))
      throw new Error('안전사고 목록 응답이 배열이 아닙니다.');
    for (const value of incidents.value.data) {
      const incident = safetyIncident(value);
      byIncident.set(incident.incidentId, incident);
    }
  } catch (error) {
    byIncident.clear();
    incidentError = safetyError(error);
  }
  // 서버의 최신순을 유지한다. 사건 목록의 최근 100건 밖에 있는 알림도 숨기지 않는다.
  const alerts = notifications.value.data.map((value): DashboardSafetyAlert => {
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
  const response = await adminApi.get<unknown>(
    `/api/admin/safety-incidents/${incidentId}`,
    {
      signal,
      timeout: 10000,
    },
  );
  const incident = safetyIncident(response.data);
  if (incident.incidentId !== incidentId)
    throw new Error('요청한 안전사고와 응답이 일치하지 않습니다.');
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

export type SafetyTargetStatus = 'PROCESSING' | 'RESOLVED';

/** 완료 메모 없이 status만 전송한다. 서버의 성공 응답을 검증한 뒤에만 화면에 완료를 반영한다. */
export async function changeSafetyIncidentStatus(
  incidentId: number,
  status: SafetyTargetStatus,
  signal?: AbortSignal,
): Promise<{ incidentId: number; status: string; resolutionNote: string | null }> {
  safetyId(incidentId);
  const response = await adminApi.patch<unknown>(
    `/api/admin/safety-incidents/${incidentId}/status`,
    {
      status,
    },
    { signal, timeout: 10000 },
  );
  const row = safetyRecord(response.data);
  if (
    safetyId(row.SAFETY_INCIDENT_ID) !== incidentId ||
    row.INCIDENT_STATUS_CODE !== status
  ) {
    throw new Error(
      '사건 처리 결과를 확인할 수 없습니다. 최신 상태를 다시 조회해 주세요.',
    );
  }
  return {
    incidentId,
    status,
    resolutionNote: row.RESOLUTION_NOTE == null ? null : safetyText(row.RESOLUTION_NOTE),
  };
}

export function safetyAuthorizationError(error: unknown): boolean {
  return (
    axios.isAxiosError(error) &&
    (error.response?.status === 401 || error.response?.status === 403)
  );
}
/** 인증·권한·지연·연결 오류를 화면 안내로 변환한다. 원래 예외나 토큰은 화면에 노출하지 않는다. */
export function safetyError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401)
      return '로그인이 만료되었습니다. 다시 로그인해 주세요.';
    if (error.response?.status === 403) return '관리자 권한을 확인해 주세요.';
    if (error.response?.status === 409)
      return '다른 관리자가 처리 상태를 변경했거나 허용되지 않은 상태 전환입니다. 최신 상태를 확인해 주세요.';
    if (error.response?.status === 400) return '처리 상태 요청을 확인해 주세요.';
    if (error.code === 'ECONNABORTED')
      return '조회 시간이 초과되었습니다. 다시 시도해 주세요.';
    return '데이터를 불러오지 못했습니다. 서버 연결을 확인해 주세요.';
  }
  return error instanceof Error ? error.message : '조회 중 오류가 발생했습니다.';
}

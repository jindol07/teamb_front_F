/** 파일 안내
 * 용도: 관리자 본인의 최근 위험알림 5건과 선택한 사건의 상세 정보를 표시한다.
 * 직접 사용처: AdminDashboard. 목록·사건 요약은 부모가 30초마다 조회하고 상세는 선택할 때만 조회한다.
 * 시험 표시는 사건의 IS_TEST로만 판정한다. 사건 정보가 없으면 미확인으로 표시하며 알림을 숨기지 않는다.
 * 상세 조회 성공 뒤 미읽음 알림만 읽음 처리한다. 실패하면 미읽음을 유지하고 오류를 표시한다.
 * 알림 읽음과 사건 업무 상태는 별개이며 접수·확인·해결 상태는 변경하지 않는다.
 */
import { useEffect, useState } from 'react';
import { useParkingStore } from '../../../shared/parking/useParkingStore';
import { dashboardError, fetchDashboardSafetyIncident, markDashboardSafetyAlertRead } from './dashboardApi';
import type { DashboardSafetyAlert, DashboardSafetyIncident } from './dashboardApi';
import styles from './AdminDashboard.module.css';

interface RiskAlertPanelProps {
  alerts: DashboardSafetyAlert[] | null;
  loading: boolean;
  error: string | null;
  incidentError: string | null;
  refreshVersion: number;
  onRead: (notificationId: number) => void;
}

const riskLabels: Record<string, string> = { HIGH: '높음', MEDIUM: '보통', LOW: '낮음' };
const statusLabels: Record<string, string> = {
  RECEIVED: '접수', PROCESSING: '처리중', HOLD: '보류', RESOLVED: '해결',
};
const typeLabels: Record<string, string> = { FIRE: '화재', SMOKE: '연기' };

/** 오프셋이 있으면 한국 시각으로 표시하고, 시간대 없는 DB 문자열에는 브라우저 시간대를 덧씌우지 않는다. */
function displayTime(value: string | null): string {
  if (!value) return '시각 미확인';
  if (/(Z|[+-]\d{2}:?\d{2})$/i.test(value)) {
    const date = new Date(value);
    if (Number.isFinite(date.getTime())) {
      return new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
      }).format(date);
    }
  }
  return value.replace('T', ' ').slice(0, 19);
}

export default function RiskAlertPanel({
  alerts, loading, error, incidentError, refreshVersion, onRead,
}: RiskAlertPanelProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<{
    notificationId: number;
    incident: DashboardSafetyIncident;
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [readSaving, setReadSaving] = useState(false);
  const slots = useParkingStore((state) => state.slots);
  const selectedAlert = alerts?.find((alert) => alert.notificationId === selectedId);
  const selectedNotificationId = selectedAlert?.notificationId;
  const selectedIncidentId = selectedAlert?.incidentId;
  const selectedRead = selectedAlert?.read;

  // 선택·서버 목록 갱신 때 상세를 조회한다. 로컬 읽음 상태 변경으로 GET과 PATCH가 반복되지 않게 한다.
  useEffect(() => {
    setDetail(null);
    setDetailError(null);
    setReadError(null);
    if (selectedNotificationId == null || selectedIncidentId == null) {
      setDetailLoading(false);
      return;
    }
    const controller = new AbortController();
    setDetailLoading(true);
    void fetchDashboardSafetyIncident(selectedIncidentId, controller.signal)
      .then((incident) => {
        if (!controller.signal.aborted) setDetail({ notificationId: selectedNotificationId, incident });
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setDetailError(dashboardError(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setDetailLoading(false);
      });
    return () => controller.abort();
  }, [selectedNotificationId, selectedIncidentId, refreshVersion]);

  // 구획이 지정된 사건만 기존 도면 캐시에서 코드를 찾는다. 위치를 임의 추정하지 않는다.
  const currentDetail = detail?.notificationId === selectedNotificationId ? detail?.incident ?? null : null;

  // 현재 선택한 알림의 상세 GET이 성공한 경우에만 PATCH한다. 이미 읽은 알림은 다시 요청하지 않는다.
  useEffect(() => {
    if (!currentDetail || selectedNotificationId == null || selectedRead !== false) {
      setReadSaving(false);
      return;
    }
    const controller = new AbortController();
    setReadSaving(true);
    setReadError(null);
    void markDashboardSafetyAlertRead(selectedNotificationId, controller.signal)
      .then(() => {
        if (!controller.signal.aborted) onRead(selectedNotificationId);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setReadError(dashboardError(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setReadSaving(false);
      });
    return () => controller.abort();
  }, [currentDetail, selectedNotificationId, selectedRead, onRead]);

  const detailSpace = currentDetail?.parkingSpaceId == null ? null
    : slots.find((slot) => slot.parkingSpaceId === currentDetail.parkingSpaceId)?.spaceCode
      ?? `구획 #${currentDetail.parkingSpaceId}`;

  return (
    <section className={styles.panel} aria-labelledby="dashboard-alerts-title">
      <div className={styles.panelHeading}>
        <div>
          <h2 id="dashboard-alerts-title">위험알림 리스트</h2>
          <p>내 관리자 알림 · 최근 5건</p>
        </div>
        <span className={styles.badge}>시험 포함</span>
      </div>
      {error && (
        <p className={styles.errorText} role="alert">
          {alerts === null ? '위험알림 조회 실패' : '갱신 실패 · 이전 조회 결과입니다'}: {error}
        </p>
      )}
      {incidentError && alerts !== null && alerts.length > 0 && (
        <p className={styles.errorText} role="alert">사건 요약 조회 실패: {incidentError}</p>
      )}
      {alerts === null ? (
        <div className={styles.emptyState} role={loading ? 'status' : undefined}>
          {loading ? '위험알림을 불러오고 있습니다.' : '위험알림을 불러오지 못했습니다.'}
        </div>
      ) : alerts.length === 0 ? (
        <div className={styles.emptyState}>
          {error ? '마지막 조회 결과는 0건입니다.' : '현재 관리자에게 수신된 위험알림이 없습니다.'}
        </div>
      ) : (
        <ul className={styles.safetyList}>
          {alerts.map((alert) => {
            const incident = currentDetail?.incidentId === alert.incidentId ? currentDetail : alert.incident;
            const expanded = selectedId === alert.notificationId;
            return (
              <li key={alert.notificationId}>
                <button
                  type="button"
                  className={styles.safetyItem}
                  aria-expanded={expanded}
                  aria-controls={`dashboard-safety-detail-${alert.notificationId}`}
                  onClick={() => setSelectedId(expanded ? null : alert.notificationId)}
                >
                  <span className={styles.safetyTitle}>
                    <strong>{incident?.isTest ? alert.title.replace(/^\[TEST\]\s*/, '') : alert.title}</strong>
                    <span className={styles.safetyBadges}>
                      {incident?.isTest && <span className={styles.safetyTest}>시험</span>}
                      {!alert.read && <span className={styles.safetyUnread}>미읽음</span>}
                    </span>
                  </span>
                  <span className={styles.safetyBadges}>
                    {incident ? (
                      <>
                        <span className={`${styles.safetyRisk} ${incident.risk === 'HIGH' ? styles.safetyHigh : ''}`}>
                          위험도 {riskLabels[incident.risk] ?? incident.risk}
                        </span>
                        <span>{typeLabels[incident.type] ?? incident.type} · {statusLabels[incident.status] ?? incident.status}</span>
                      </>
                    ) : <span>사건 정보 미확인 · 상세 보기로 확인</span>}
                  </span>
                  <span className={styles.safetyContent}>{alert.content}</span>
                  <span className={styles.safetyTime}>알림 {displayTime(alert.createdAt)} · {expanded ? '상세 닫기' : '상세 보기'}</span>
                </button>
                <div id={`dashboard-safety-detail-${alert.notificationId}`} hidden={!expanded}>
                  {expanded && (
                    <div className={styles.safetyDetail}>
                      {detailLoading ? <p role="status">사건 상세를 조회하고 있습니다.</p>
                        : detailError ? <p className={styles.errorText} role="alert">상세 조회 실패: {detailError}</p>
                          : currentDetail ? (
                            <>
                              <strong>사건 #{currentDetail.incidentId}{currentDetail.isTest ? ' · 시험 데이터' : ''}</strong>
                              <dl>
                                <dt>처리 상태</dt><dd>{statusLabels[currentDetail.status] ?? currentDetail.status}</dd>
                                <dt>구획</dt><dd>{detailSpace ?? '구획 미지정'}</dd>
                                <dt>최초 감지</dt><dd>{displayTime(currentDetail.firstDetectedAt)}</dd>
                                <dt>최근 감지</dt><dd>{displayTime(currentDetail.lastDetectedAt)}</dd>
                                <dt>감지 횟수</dt><dd>{currentDetail.detectionCount}회</dd>
                                <dt>알림 상태</dt><dd>{readSaving ? '읽음 처리 중…' : alert.read ? '읽음' : '미읽음'}</dd>
                                {currentDetail.resolutionNote && <><dt>해결 메모</dt><dd>{currentDetail.resolutionNote}</dd></>}
                              </dl>
                              {readError && <p className={styles.errorText} role="alert">
                                상세는 조회했지만 읽음 처리에 실패했습니다: {readError} 상세를 다시 열거나 새로고침해 주세요.
                              </p>}
                            </>
                          ) : null}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className={styles.caption}>
        30초마다 갱신 · 상세 조회 성공 시 읽음 처리됩니다. 사건의 확인·해결 상태는 별도로 관리됩니다.
      </p>
    </section>
  );
}

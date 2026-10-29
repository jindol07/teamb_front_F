/** 파일 안내
 * 용도: 공통 Provider의 관리자 위험알림 중 최근 5건을 대시보드에 표시한다.
 * 직접 사용처: AdminDashboard. 자체 폴링 없이 사건 선택 시 전역 상세·업무 처리 모달을 연다.
 * 읽음과 처리 상태는 전역 모달 및 다른 관리자 변경 결과와 함께 갱신된다.
 */
import { useSafetyAlerts } from '../../../shared/safety/SafetyAlertProvider';
import {
  safetyDisplayTime,
  safetyStatusLabels,
} from '../../../shared/safety/GlobalSafetyAlert';
import styles from './AdminDashboard.module.css';

const riskLabels: Record<string, string> = { HIGH: '높음', MEDIUM: '보통', LOW: '낮음' };
const typeLabels: Record<string, string> = { FIRE: '화재', SMOKE: '연기' };

export default function RiskAlertPanel() {
  const safety = useSafetyAlerts();
  const alerts = safety.alerts?.slice(0, 5) ?? null;
  return (
    <section className={styles.panel} aria-labelledby="dashboard-alerts-title">
      <div className={styles.panelHeading}>
        <div>
          <h2 id="dashboard-alerts-title">위험알림 리스트</h2>
          <p>내 관리자 알림 · 최근 5건</p>
        </div>
        <span className={styles.badge}>시험 포함</span>
      </div>
      {safety.error && (
        <p className={styles.errorText} role="alert">
          {safety.error}
        </p>
      )}
      {safety.incidentError && (
        <p className={styles.errorText} role="alert">
          사건 요약 조회 실패: {safety.incidentError}
        </p>
      )}
      {alerts === null ? (
        <div className={styles.emptyState} role="status">
          {safety.loading
            ? '위험알림을 불러오고 있습니다.'
            : '위험알림을 불러오지 못했습니다.'}
        </div>
      ) : alerts.length === 0 ? (
        <div className={styles.emptyState}>
          현재 관리자에게 수신된 위험알림이 없습니다.
        </div>
      ) : (
        <ul className={styles.safetyList}>
          {alerts.map((alert) => (
            <li key={alert.notificationId}>
              <button
                type="button"
                className={styles.safetyItem}
                aria-haspopup="dialog"
                onClick={() => safety.open(alert.incidentId)}
              >
                <span className={styles.safetyTitle}>
                  <strong>
                    {alert.incident?.isTest
                      ? alert.title.replace(/^\[TEST\]\s*/, '')
                      : alert.title}
                  </strong>
                  <span className={styles.safetyBadges}>
                    {alert.incident?.isTest && (
                      <span className={styles.safetyTest}>시험</span>
                    )}
                    {!alert.read && <span className={styles.safetyUnread}>미읽음</span>}
                  </span>
                </span>
                <span className={styles.safetyBadges}>
                  {alert.incident ? (
                    <>
                      <span
                        className={`${styles.safetyRisk} ${alert.incident.risk === 'HIGH' ? styles.safetyHigh : ''}`}
                      >
                        위험도 {riskLabels[alert.incident.risk] ?? alert.incident.risk}
                      </span>
                      <span>
                        {typeLabels[alert.incident.type] ?? alert.incident.type} ·{' '}
                        {safetyStatusLabels[alert.incident.status] ??
                          alert.incident.status}
                      </span>
                    </>
                  ) : (
                    <span>사건 정보 미확인 · 상세 보기로 확인</span>
                  )}
                </span>
                <span className={styles.safetyContent}>{alert.content}</span>
                <span className={styles.safetyTime}>
                  알림 {safetyDisplayTime(alert.createdAt)} · 상세·처리 보기
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className={styles.caption}>
        5초마다 공통 갱신 · 상세 조회 성공 시 읽음 · 현장 조치 후 별도 처리 완료
      </p>
    </section>
  );
}

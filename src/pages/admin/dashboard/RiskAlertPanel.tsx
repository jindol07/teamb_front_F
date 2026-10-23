/** 위험알림 연결 전의 자리 표시 영역. 미연동 상태를 알림 0건으로 표현하지 않는다. */
import styles from './AdminDashboard.module.css';

export default function RiskAlertPanel() {
  return (
    <section className={styles.panel} aria-labelledby="dashboard-alerts-title">
      <div className={styles.panelHeading}>
        <div>
          <h2 id="dashboard-alerts-title">위험알림 리스트</h2>
          <p>주차장 내 위험 상황과 확인이 필요한 알림</p>
        </div>
        <span className={styles.pendingBadge}>연동 예정</span>
      </div>
      <div className={styles.alertPlaceholder}>
        <span className={styles.alertIcon} aria-hidden="true">
          !
        </span>
        <div>
          <strong>위험알림 연동 준비 중</strong>
          <p>알림 기능 연결 후 발생 시각·구획·알림 내용을 이곳에 표시합니다.</p>
        </div>
      </div>
    </section>
  );
}

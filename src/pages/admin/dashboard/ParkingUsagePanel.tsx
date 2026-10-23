/** 최근 입차·출차 이벤트 각각을 1건으로 표시하는 대시보드 목록. */
import { Link } from 'react-router-dom';
import type { DashboardParkingEventRow } from './dashboardApi';
import styles from './AdminDashboard.module.css';

interface ParkingUsagePanelProps {
  events: DashboardParkingEventRow[];
  loading: boolean;
  error: string | null;
}

export default function ParkingUsagePanel({
  events,
  loading,
  error,
}: ParkingUsagePanelProps) {
  return (
    <section className={styles.panel} aria-labelledby="dashboard-usage-title">
      <div className={styles.panelHeading}>
        <div>
          <h2 id="dashboard-usage-title">최근 입출차 내역</h2>
          <p>발생 시각 기준 최근 5건</p>
        </div>
        <Link to="/admin/parking-usage">전체 보기 →</Link>
      </div>
      {loading ? (
        <div className={styles.emptyState} role="status">
          입출차 내역을 불러오고 있습니다.
        </div>
      ) : error ? (
        <div className={styles.emptyState} role="alert">
          입출차 조회 실패
          <br />
          {error}
        </div>
      ) : events.length === 0 ? (
        <div className={styles.emptyState}>조회할 입출차 내역이 없습니다.</div>
      ) : (
        <ul className={styles.requestList}>
          {events.slice(0, 5).map((event) => (
            <li key={`${event.parkingUsageId}-${event.eventType}`}>
              <div>
                <strong>{event.vehicleNumber}</strong>
                <span
                  className={
                    event.eventType === 'ENTRY' ? styles.entryBadge : styles.exitBadge
                  }
                >
                  {event.eventType === 'ENTRY' ? '입차' : '출차'}
                </span>
              </div>
              <p>{event.spaceCode || '구획 미배정'}</p>
              <time dateTime={event.occurredAt}>
                {event.occurredAt.replace('T', ' ')}
              </time>
            </li>
          ))}
        </ul>
      )}
      <p className={styles.caption}>
        입차와 출차를 각각 표시합니다. 구획은 이용 기록에 현재 연결된 정보입니다.
      </p>
    </section>
  );
}

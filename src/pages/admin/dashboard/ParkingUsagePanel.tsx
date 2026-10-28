/** 파일 안내
 * 용도: 최근 입차·출차 이벤트를 최대 5건 보여 주는 대시보드 목록.
 * 직접 사용처: AdminDashboard. 데이터 조회와 갱신은 부모가 수행하고 이 파일은 표시만 담당한다.
 * 같은 이용 기록의 입차·출차는 별도 이벤트다. 표시 구획은 현재 이용 기록에 연결된 값이며 당시 위치 보관값은 아니다.
 * 로딩·오류·빈 목록을 구분하고 전체 보기는 공통 이력 화면으로 이동한다.
 */
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
        <Link to="/admin/history">전체 보기 →</Link>
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

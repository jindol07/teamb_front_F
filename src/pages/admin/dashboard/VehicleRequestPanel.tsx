/** 미검토 추가 차량 신청 목록. 승인·반려는 기존 차량관리 화면에서 처리한다. */
import { Link } from 'react-router-dom';
import type { VehicleChangeRequestDTO } from '../../../api/vehicleApi';
import styles from './AdminDashboard.module.css';

interface VehicleRequestPanelProps {
  requests: VehicleChangeRequestDTO[];
  loading: boolean;
  error: string | null;
}

export default function VehicleRequestPanel({
  requests,
  loading,
  error,
}: VehicleRequestPanelProps) {
  // 기존 API의 한국 시간 문자열을 시간대 재해석 없이 정렬한다.
  const recent = [...requests]
    .sort(
      (a, b) =>
        (b.requestedat ?? '').localeCompare(a.requestedat ?? '') ||
        (b.vehiclechangerequestid ?? 0) - (a.vehiclechangerequestid ?? 0),
    )
    .slice(0, 5);
  return (
    <section className={styles.panel} aria-labelledby="dashboard-requests-title">
      <div className={styles.panelHeading}>
        <div>
          <h2 id="dashboard-requests-title">차량 추가 등록 신청</h2>
          <p>회원의 추가 차량 등록 요청</p>
        </div>
        <Link to="/admin/vehicle">전체 보기 →</Link>
      </div>
      <div className={styles.requestCount}>
        <span>처리 대기</span>
        <strong>
          {loading || error ? '—' : requests.length.toLocaleString('ko-KR')}
          <small>건</small>
        </strong>
      </div>
      {loading ? (
        <div className={styles.emptyState} role="status">
          신청 내역을 불러오고 있습니다.
        </div>
      ) : error ? (
        <div className={styles.emptyState} role="alert">
          신청 조회 실패
          <br />
          {error}
        </div>
      ) : recent.length === 0 ? (
        <div className={styles.emptyState}>처리할 추가 등록 신청이 없습니다.</div>
      ) : (
        <ul className={styles.requestList}>
          {recent.map((request) => (
            <li key={request.vehiclechangerequestid}>
              <div>
                <strong>{request.requestedvehiclenumber || '차량번호 미확인'}</strong>
                <span className={styles.requestBadge}>접수</span>
              </div>
              <p>
                {request.requestedownername || '신청자 미확인'}
                <span> · </span>
                {request.officenumber ? `${request.officenumber}호` : '호실 미확인'}
              </p>
              <time>
                {request.requestedat?.replace('T', ' ').slice(0, 16) ||
                  '신청 일시 미확인'}
              </time>
            </li>
          ))}
        </ul>
      )}
      <p className={styles.caption}>
        최근 접수 5건 표시 · 승인과 반려는 차량관리의 신청 관리에서 처리합니다.
      </p>
    </section>
  );
}

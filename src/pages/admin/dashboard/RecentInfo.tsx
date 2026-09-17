import { recentEntriesMock, recentExitsMock, dashboardStatsMock } from '../../../mock/dashboardMock';
import { noticeListMock } from '../../../mock/noticeMock';

/**
 * RecentInfo
 * 대시보드 하단 추가 정보 영역입니다.
 * 문서 23번 요구사항에 따라 꼭 필요한 정보만 선별하여 구성했습니다.
 *   - 최근 입차 / 출차 차량
 *   - 주차장 이용률, 금일 예약 건수, 미처리 알림
 *   - 최근 공지사항
 */
export default function RecentInfo() {
  const { usageRate, todayReservationCount, unresolvedAlerts } = dashboardStatsMock;

  return (
    <div className="row g-3">
      <div className="col-12 col-lg-4">
        <div className="card p-3 h-100">
          <h6 className="fw-bold mb-3">최근 입차 차량</h6>
          <ul className="list-unstyled mb-0">
            {recentEntriesMock.map((item) => (
              <li key={item.id} className="d-flex justify-content-between small py-1">
                <span>{item.vehicleNumber}</span>
                <span className="text-secondary">{item.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="col-12 col-lg-4">
        <div className="card p-3 h-100">
          <h6 className="fw-bold mb-3">최근 출차 차량</h6>
          <ul className="list-unstyled mb-0">
            {recentExitsMock.map((item) => (
              <li key={item.id} className="d-flex justify-content-between small py-1">
                <span>{item.vehicleNumber}</span>
                <span className="text-secondary">{item.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="col-12 col-lg-4">
        <div className="card p-3 h-100">
          <h6 className="fw-bold mb-3">운영 요약</h6>
          <ul className="list-unstyled mb-2">
            <li className="d-flex justify-content-between small py-1">
              <span>주차장 이용률</span>
              <span className="fw-bold">{usageRate}%</span>
            </li>
            <li className="d-flex justify-content-between small py-1">
              <span>금일 예약 건수</span>
              <span className="fw-bold">{todayReservationCount}건</span>
            </li>
            <li className="d-flex justify-content-between small py-1">
              <span>미처리 알림</span>
              <span className="fw-bold text-danger">{unresolvedAlerts}건</span>
            </li>
          </ul>
          <hr />
          <h6 className="fw-bold mb-2 small">최근 공지사항</h6>
          <p className="small text-secondary mb-0">{noticeListMock[0].title}</p>
        </div>
      </div>
    </div>
  );
}

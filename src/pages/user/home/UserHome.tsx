import { Link } from 'react-router-dom';
import { noticeListMock } from '../../../mock/noticeMock';

/**
 * 사용자 메인 페이지 (/user)
 * 주차현황 / 공지사항 / 주차예약 3개의 기능 메뉴로 이동할 수 있습니다.
 */
export default function UserHome() {
  const latestNotice = noticeListMock[0];

  return (
    <div className="container py-4">
      <h2 className="page-title">환영합니다 👋</h2>
      <p className="page-description">이용하실 서비스를 선택해주세요.</p>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <Link to="/user/parking-status" className="user-menu-card d-block p-4 h-100">
            <h5 className="fw-bold mb-2">🅿️ 주차현황</h5>
            <p className="mb-0 text-secondary small">
              현재 주차장 이용 현황을 확인할 수 있습니다.
            </p>
          </Link>
        </div>
        <div className="col-12 col-md-4">
          <Link to="/user/notice" className="user-menu-card d-block p-4 h-100">
            <h5 className="fw-bold mb-2">📢 공지사항</h5>
            <p className="mb-0 text-secondary small">
              최근 공지사항: {latestNotice.title}
            </p>
          </Link>
        </div>
        <div className="col-12 col-md-4">
          <Link to="/user/reservation" className="user-menu-card d-block p-4 h-100">
            <h5 className="fw-bold mb-2">📅 주차예약</h5>
            <p className="mb-0 text-secondary small">
              원하는 날짜와 시간에 주차를 예약할 수 있습니다.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

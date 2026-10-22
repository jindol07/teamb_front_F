import { useLocation, useNavigate } from 'react-router-dom';

/** 관리자 사이드바: 주차관제는 하위 메뉴 없이 현황 화면으로 바로 이동합니다. */
const menuItemClass = (isActive: boolean) => `nav-link ${isActive ? 'active' : ''}`;

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isParkingPath =
    location.pathname === '/admin/parking' ||
    location.pathname.startsWith('/admin/parking/');

  return (
    <nav className="admin-sidebar py-3">
      <ul className="nav flex-column">
        <li className="nav-item">
          <span
            className={menuItemClass(location.pathname === '/admin/dashboard')}
            onClick={() => navigate('/admin/dashboard')}
          >
            대시보드
          </span>
        </li>

        <li className="nav-item">
          <span
            className={menuItemClass(location.pathname === '/admin/notice')}
            onClick={() => navigate('/admin/notice')}
          >
            공지사항
          </span>
        </li>

        <li className="nav-item">
          <span
            className={menuItemClass(isParkingPath)}
            onClick={() => navigate('/admin/parking')}
          >
            주차관제
          </span>
        </li>

        <li className="nav-item">
          <span
            className={menuItemClass(location.pathname === '/admin/parking-usage')}
            onClick={() => navigate('/admin/parking-usage')}
          >
            입출차 관리
          </span>
        </li>

        <li className="nav-item">
          <span
            className={menuItemClass(location.pathname === '/admin/vehicle')}
            onClick={() => navigate('/admin/vehicle')}
          >
            차량관리
          </span>
        </li>
        <li className="nav-item">
           <span
            className={menuItemClass(location.pathname === '/admin/mileage')}
            onClick={() => navigate('/admin/mileage')}
          >
            마일리지
          </span>
        </li>
        <li className="nav-item">
          <span
            className={menuItemClass(location.pathname === '/admin/history')}
            onClick={() => navigate('/admin/history')}
          >
            이력
          </span>
        </li>
      </ul>
    </nav>
  );
}

import { useNavigate } from 'react-router-dom';

/**
 * AdminHeader
 * 관리자 Dashboard 상단 헤더. 서비스명과 로그아웃 버튼을 표시합니다.
 */
export default function AdminHeader() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/admin/login');
  };

  return (
    <header className="admin-header d-flex align-items-center justify-content-between px-3">
      <span className="fw-bold">주차관제 관리자 시스템</span>
      <div className="d-flex align-items-center gap-3">
        <span className="small">관리자님</span>
        <button
          type="button"
          className="btn btn-sm btn-outline-light"
          onClick={handleLogout}
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}

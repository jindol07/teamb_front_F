import { Link, useNavigate } from 'react-router-dom';
import { adminLogoutAction, getAdmin } from '../auth/actions/authActions';
import { useAppDispatch } from '../auth/reducers/store';
import { useEffect, useState } from 'react';

/**
 * AdminHeader
 * 관리자 Dashboard 상단 헤더. 서비스명과 로그아웃 버튼을 표시합니다.
 */
export default function AdminHeader() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [currentAdmin, setCurrentAdmin] = useState("");

  const handleLogout = () => {
    adminLogoutAction()(dispatch);
    navigate('/admin/login');
  };

    useEffect(() => {
      const fetchOffice = async () => {
        const result = await getAdmin();
  
        if (result) {
          setCurrentAdmin(result.data.username);
        }
      };
  
      fetchOffice();
    }, []);

  return (
    <header className="admin-header d-flex align-items-center justify-content-between px-3">
      <Link to="/admin/dashboard" className="admin-header-brand fw-bold text-decoration-none">
        AI Alpha Parking Service
      </Link>
      <div className="d-flex align-items-center gap-3">
        <span className="small">{currentAdmin} 님</span>
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

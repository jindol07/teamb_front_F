import { Link, useNavigate } from 'react-router-dom';
import { currentUserMock } from '../mock/userMock';
import { getOffice, logoutAction } from '../auth/actions/authActions';
import { useAppDispatch } from '../auth/reducers/store';
import { useEffect, useState } from 'react';

/**
 * UserHeader
 * 사용자 서비스 상단 헤더. 로고, 로그인 회원 정보, 마이페이지/로그아웃 버튼을 표시합니다.
 * 현재는 로그인 서버가 없으므로 사용자 정보는 Mock Data(currentUserMock)를 사용합니다.
 */
export default function UserHeader() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [currentUser, setCurrentUser] = useState("");

  const handleLogout = () => {
    logoutAction()(dispatch);
    navigate('/user/login');
  };
  useEffect(() => {
    const fetchOffice = async () => {
      const result = await getOffice();
      if (result) {
        setCurrentUser(result.data.username);
      }
    };

    fetchOffice();
  }, []);

  return (
    <header className="user-header d-flex align-items-center border-bottom">
      <div className="container d-flex justify-content-between align-items-center h-100">
        <Link to="/user" className="user-header-brand fw-bold fs-5 text-decoration-none">
          <span className="user-header-brand-text">AI Alpha Parking Service</span>
        </Link>

        <div className="d-flex align-items-center gap-3">
          <span className="text-secondary d-none d-sm-inline">
            {currentUser} 님
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => navigate('/user/mypage')}
          >
            마이페이지
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={handleLogout}
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}

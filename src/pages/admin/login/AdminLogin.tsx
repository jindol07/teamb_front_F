import { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

/**
 * 관리자 로그인 페이지 (/admin/login)
 * 사용자 로그인과 완전히 분리된 화면입니다.
 */
export default function AdminLogin() {
  const navigate = useNavigate();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: 추후 이 부분에서 Axios로 관리자 로그인 API를 호출하게 됩니다.
    navigate('/admin/dashboard');
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: '100vh', backgroundColor: 'var(--admin-primary)' }}
    >
      <div className="bg-white p-4 rounded w-100" style={{ maxWidth: 400 }}>
        <div className="text-center mb-4">
          <h2 className="fw-bold" style={{ color: 'var(--admin-primary)' }}>
            주차관제 관리자 시스템
          </h2>
          <p className="text-secondary small">관리자 계정으로 로그인해주세요.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="adminId" className="form-label">
              아이디
            </label>
            <input type="text" id="adminId" className="form-control" placeholder="아이디" />
          </div>
          <div className="mb-3">
            <label htmlFor="adminPw" className="form-label">
              비밀번호
            </label>
            <input
              type="password"
              id="adminPw"
              className="form-control"
              placeholder="비밀번호"
            />
          </div>  

          <button type="submit" className="btn btn-primary w-100 mb-3">
            로그인
          </button>

          <div className="d-flex justify-content-between small">
            <Link to="/admin/signup" className="text-decoration-none">관리자 가입</Link>
            <Link to="/user/login" className="text-decoration-none">
              &larr; 사용자 로그인으로 이동
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

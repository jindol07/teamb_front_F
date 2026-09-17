import { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

/**
 * 사용자 로그인 페이지 (/user/login)
 * 현재는 실제 인증을 구현하지 않으며, 로그인 버튼을 누르면 바로 /user로 이동합니다.
 */
export default function UserLogin() {
  const navigate = useNavigate();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: 추후 이 부분에서 Axios로 로그인 API를 호출하게 됩니다.
    navigate('/user');
  };

  return (
    <div className="container d-flex justify-content-center align-items-center py-5">
      <div className="w-100" style={{ maxWidth: 400 }}>
        <div className="text-center mb-4">
          <h2 className="fw-bold text-primary">주차관제 서비스</h2>
          <p className="text-secondary">회원 서비스를 이용하려면 로그인해주세요.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="userId" className="form-label">
              아이디
            </label>
            <input type="text" id="userId" className="form-control" placeholder="아이디" />
          </div>
          <div className="mb-3">
            <label htmlFor="userPw" className="form-label">
              비밀번호
            </label>
            <input
              type="password"
              id="userPw"
              className="form-control"
              placeholder="비밀번호"
            />
          </div>

          <button type="submit" className="btn btn-primary w-100 mb-3">
            로그인
          </button>

          <div className="d-flex justify-content-between small">
            <Link to="/user/signup" className="text-decoration-none">
              회원가입
            </Link>
            <Link to="/admin/login" className="text-decoration-none">
              관리자 로그인 &rarr;
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

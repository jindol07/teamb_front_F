import { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

/**
 * 관리자 회원가입 페이지 (/admin/signup)
 * 현재는 실제 회원가입/인증 기능을 구현하지 않습니다.
 */
export default function AdminSignup() {
  const navigate = useNavigate();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // TODO: 추후 Axios로 관리자 회원가입 API를 호출합니다.
    navigate('/admin/login');
  };

  return (
    <div className="container d-flex justify-content-center py-5">
      <div className="w-100" style={{ maxWidth: 500 }}>

        {/* 제목 */}
        <div className="text-center mb-4">
          <h2 className="fw-bold text-primary">주차관제 서비스</h2>
          <p className="text-secondary">관리자 회원가입</p>
        </div>

        <form onSubmit={handleSubmit}>

          {/* 아이디 */}
          <div className="mb-3">
            <label htmlFor="adminId" className="form-label">
              아이디
            </label>

            <input
              type="text"
              id="adminId"
              className="form-control"
              placeholder="아이디를 입력해주세요"
            />
          </div>


          {/* 비밀번호 */}
          <div className="mb-3">
            <label htmlFor="adminPw" className="form-label">
              비밀번호
            </label>

            <input
              type="password"
              id="adminPw"
              className="form-control"
              placeholder="비밀번호를 입력해주세요"
            />
          </div>


          {/* 비밀번호 확인 */}
          <div className="mb-3">
            <label htmlFor="adminPwConfirm" className="form-label">
              비밀번호 확인
            </label>

            <input
              type="password"
              id="adminPwConfirm"
              className="form-control"
              placeholder="비밀번호를 다시 입력해주세요"
            />
          </div>


          {/* 이름 */}
          <div className="mb-3">
            <label htmlFor="adminName" className="form-label">
              이름
            </label>

            <input
              type="text"
              id="adminName"
              className="form-control"
              placeholder="이름을 입력해주세요"
            />
          </div>


          {/* 이메일 */}
          <div className="mb-3">
            <label htmlFor="adminEmail" className="form-label">
              이메일
            </label>

            <div className="input-group">
              <input
                type="email"
                id="adminEmail"
                className="form-control"
                placeholder="이메일을 입력해주세요"
              />

              <button
                type="button"
                className="btn btn-outline-primary"
              >
                인증번호 발송
              </button>
            </div>
          </div>


          {/* 이메일 인증번호 */}
          <div className="mb-3">
            <label htmlFor="emailCode" className="form-label">
              인증번호
            </label>

            <input
              type="text"
              id="emailCode"
              className="form-control"
              placeholder="이메일로 받은 인증번호를 입력해주세요"
            />
          </div>


          {/* 휴대폰 번호 */}
          <div className="mb-3">
            <label htmlFor="phone" className="form-label">
              휴대폰 번호
            </label>

            <input
              type="tel"
              id="phone"
              className="form-control"
              placeholder="휴대폰 번호를 입력해주세요"
            />
          </div>


          {/* 관리사무소 코드 */}
          <div className="mb-3">
            <label htmlFor="officeCode" className="form-label">
              관리사무소 코드
            </label>

            <input
              type="text"
              id="officeCode"
              className="form-control"
              placeholder="관리사무소 코드를 입력해주세요"
            />

            <div className="form-text">
              소속된 관리사무소에서 발급받은 코드를 입력해주세요.
            </div>
          </div>


          {/* 관리자 인증번호 */}
          {/* <div className="mb-3">
            <label htmlFor="adminCode" className="form-label">
              관리자 인증번호
            </label>

            <input
              type="text"
              id="adminCode"
              className="form-control"
              placeholder="관리자 인증번호를 입력해주세요"
            />

            <div className="form-text">
              관리사무소에서 발급받은 관리자 인증번호를 입력해주세요.
            </div>
          </div> */}


          {/* 직책 */}
          {/* <div className="mb-3">
            <label htmlFor="position" className="form-label">
              직책
            </label>

            <select
              id="position"
              className="form-select"
              defaultValue=""
            >
              <option value="" disabled>
                직책을 선택해주세요
              </option>
              <option value="MANAGER">관리소장</option>
              <option value="PARKING_MANAGER">주차관리자</option>
              <option value="STAFF">관리사무소 직원</option>
            </select>
          </div> */}


          {/* 약관 동의 */}
          <div className="border rounded p-3 mb-4">

            <div className="form-check mb-2">
              <input
                type="checkbox"
                id="agreeAll"
                className="form-check-input"
              />

              <label
                htmlFor="agreeAll"
                className="form-check-label fw-bold"
              >
                전체 약관에 동의합니다.
              </label>
            </div>

            <hr />

            <div className="form-check mb-2">
              <input
                type="checkbox"
                id="terms"
                className="form-check-input"
              />

              <label
                htmlFor="terms"
                className="form-check-label"
              >
                서비스 이용약관 동의{' '}
                <span className="text-danger">(필수)</span>
              </label>
            </div>

            <div className="form-check">
              <input
                type="checkbox"
                id="privacy"
                className="form-check-input"
              />

              <label
                htmlFor="privacy"
                className="form-check-label"
              >
                개인정보 수집 및 이용 동의{' '}
                <span className="text-danger">(필수)</span>
              </label>
            </div>

          </div>


          {/* 회원가입 버튼 */}
          <button
            type="submit"
            className="btn btn-primary w-100 mb-3"
          >
            관리자 회원가입
          </button>


          {/* 로그인 이동 */}
          <div className="text-center small">
            이미 관리자 계정이 있으신가요?{' '}
            <Link
              to="/admin/login"
              className="text-decoration-none"
            >
              관리자 로그인
            </Link>
          </div>

        </form>
      </div>
    </div>
  );
}
import { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VehicleList from '../../../components/common/VehicleList';

/**
 * 입주민 회원가입 페이지 (/user/signup)
 * 현재는 실제 회원가입/인증 기능을 구현하지 않습니다.
 */
export default function UserSignUp() {
  const navigate = useNavigate();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // TODO: 추후 Axios로 회원가입 API를 호출합니다.
    navigate('/user/login');
  };

  return (
    <div className="container d-flex justify-content-center py-5">
      <div className="w-100" style={{ maxWidth: 500 }}>

        {/* 제목 */}
        <div className="text-center mb-4">
          <h2 className="fw-bold text-primary">주차관제 서비스</h2>
          <p className="text-secondary">입주민 회원가입</p>
        </div>

        <form onSubmit={handleSubmit}>

          {/* 아이디 */}
          <div className="mb-3">
            <label htmlFor="userId" className="form-label">
              아이디
            </label>

            <input
              type="text"
              id="userId"
              className="form-control"
              placeholder="아이디를 입력해주세요"
            />
          </div>


          {/* 비밀번호 */}
          <div className="mb-3">
            <label htmlFor="userPw" className="form-label">
              비밀번호
            </label>

            <input
              type="password"
              id="userPw"
              className="form-control"
              placeholder="비밀번호를 입력해주세요"
            />
          </div>


          {/* 비밀번호 확인 */}
          <div className="mb-3">
            <label htmlFor="userPwConfirm" className="form-label">
              비밀번호 확인
            </label>

            <input
              type="password"
              id="userPwConfirm"
              className="form-control"
              placeholder="비밀번호를 다시 입력해주세요"
            />
          </div>


          {/* 이메일 */}
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              이메일
            </label>

            <div className="input-group">
              <input
                type="email"
                id="email"
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


          {/* 동 / 호수 */}
          <div className="mb-3">
            <label className="form-label">
              거주지
            </label>

            <div className="d-flex gap-2">
              <input
                type="text"
                id="dong"
                className="form-control"
                placeholder="동"
              />

              <input
                type="text"
                id="ho"
                className="form-control"
                placeholder="호수"
              />
            </div>
          </div>


          {/* 입주민 인증번호 */}
          <div className="mb-3">
            <label htmlFor="residentCode" className="form-label">
              입주민 인증번호
            </label>

            <input
              type="text"
              id="residentCode"
              className="form-control"
              placeholder="입주민 인증번호를 입력해주세요"
            />

            <div className="form-text">
              관리사무소에서 발급받은 입주민 인증번호를 입력해주세요.
            </div>
          </div>


          {/* 차량 등록 */}
          <div className="mb-3">
            <label htmlFor="carNumber" className="form-label">
              차량 등록 <span className="text-secondary"></span>
            </label>

            <input
              type="text"
              id="carNumber"
              className="form-control"
              placeholder="예: 12가 3456"
              required
            />

            <div className="form-text">
              이용할 차량을 최소 1대 등록해주세요.
            </div>
          </div>

          {/* <VehicleList /> */}


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
                이용약관 동의 <span className="text-danger">(필수)</span>
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
                개인정보 수집 및 이용 동의 <span className="text-danger">(필수)</span>
              </label>
            </div>

          </div>


          {/* 회원가입 버튼 */}
          <button
            type="submit"
            className="btn btn-primary w-100 mb-3"
          >
            회원가입
          </button>


          {/* 로그인 이동 */}
          <div className="text-center small">
            이미 회원이신가요?{' '}
            <Link
              to="/user/login"
              className="text-decoration-none"
            >
              로그인
            </Link>
          </div>

        </form>
      </div>
    </div>
  );
}

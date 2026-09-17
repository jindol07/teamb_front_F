/**
 * UserFooter
 * 사용자 서비스 하단 푸터. 관리자 연락처, 고객센터, 운영시간 정보를 표시합니다.
 */
export default function UserFooter() {
  return (
    <footer className="user-footer py-4 mt-5">
      <div className="container">
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <h6 className="fw-bold">관리자 연락처</h6>
            <p className="mb-0 small">02-1234-5678</p>
          </div>
          <div className="col-12 col-md-4">
            <h6 className="fw-bold">고객센터</h6>
            <p className="mb-0 small">1588-0000 (평일 09:00 ~ 18:00)</p>
          </div>
          <div className="col-12 col-md-4">
            <h6 className="fw-bold">운영시간</h6>
            <p className="mb-0 small">연중무휴 24시간 운영</p>
          </div>
        </div>
        <hr className="border-secondary" />
        <p className="mb-0 small text-center">
          &copy; 2026 주차관제 웹 서비스. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

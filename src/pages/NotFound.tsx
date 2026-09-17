import { Link } from 'react-router-dom';

/**
 * 404 페이지
 * 정의되지 않은 모든 경로는 이 페이지로 연결됩니다. (router/AppRouter.tsx 참고)
 */
export default function NotFound() {
  return (
    <div
      className="d-flex flex-column justify-content-center align-items-center text-center"
      style={{ minHeight: '100vh' }}
    >
      <h1 className="display-3 fw-bold text-primary">404</h1>
      <p className="text-secondary mb-4">요청하신 페이지를 찾을 수 없습니다.</p>
      <Link to="/user/login" className="btn btn-primary">
        홈으로 이동
      </Link>
    </div>
  );
}

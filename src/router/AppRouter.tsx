import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import UserRoutes from './UserRouter';
import AdminRoutes from './AdminRouter';
import NotFound from '../pages/NotFound';

/**
 * AppRouter
 * ------------------------------------------------------------------
 * 프로젝트 전체 Routing의 시작점입니다.
 * 사용자 Route(UserRoutes)와 관리자 Route(AdminRoutes)를 하나로 합치고,
 * 정의되지 않은 모든 경로는 404 페이지로 연결합니다.
 *
 * 이 파일은 공통 파일이므로 수정 시 팀원과 상의해주세요.
 * (새 페이지 추가는 이 파일이 아니라 UserRouter.tsx / AdminRouter.tsx에서 합니다)
 */
export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 첫 화면 접속 시 사용자 로그인 화면으로 이동 */}
        <Route path="/" element={<Navigate to="/user/login" replace />} />

        {UserRoutes()}
        {AdminRoutes()}

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

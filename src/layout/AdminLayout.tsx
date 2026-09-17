import { Outlet } from 'react-router-dom';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

/**
 * AdminLayout
 * ------------------------------------------------------------------
 * 관리자(Admin) 관련 모든 페이지가 공통으로 사용하는 레이아웃입니다.
 * 상단 Header + 좌측 Sidebar + 우측 Main Content 구조의 Dashboard 형태입니다.
 *
 *  ┌─────────────────────────────┐
 *  │           Header            │
 *  ├───────────┬─────────────────┤
 *  │  Sidebar  │  Main Content   │  ← <Outlet />이 렌더링되는 자리
 *  └───────────┴─────────────────┘
 */
export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <AdminHeader />
      <div className="d-flex">
        <AdminSidebar />
        <main className="admin-content flex-grow-1 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

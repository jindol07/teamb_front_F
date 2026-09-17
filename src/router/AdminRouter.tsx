import { Route } from 'react-router-dom';
import AdminLayout from '../layout/AdminLayout';
import AdminLogin from '../pages/admin/login/AdminLogin';
import AdminDashboard from '../pages/admin/dashboard/AdminDashboard';
import AdminNotice from '../pages/admin/notice/AdminNotice';
import ParkingManage from '../pages/admin/parking/manage/ParkingManage';
import ParkingStatusAdmin from '../pages/admin/parking/status/ParkingStatusAdmin';
import VehicleManage from '../pages/admin/vehicle/VehicleManage';
import History from '../pages/admin/history/History';
import AdminSignup from '../pages/admin/login/AdminSignUp';

/**
 * AdminRoutes
 * ------------------------------------------------------------------
 * 관리자(Admin) 관련 모든 Route를 모아둔 곳입니다.
 * UserRouter.tsx와 동일한 이유로, AppRouter.tsx에서는 반드시
 * {AdminRoutes()} 형태(함수 호출)로 사용합니다.
 *
 * 새로운 관리자 메뉴/페이지를 추가하려면:
 *  1) 이 파일에 <Route> 한 줄 추가
 *  2) layout/AdminSidebar.tsx 에 메뉴 항목 추가
 * (자세한 방법은 README의 "새로운 관리자 메뉴 추가 방법" 참고)
 */
export default function AdminRoutes() {
  return (
    <>
      {/* 관리자 로그인 화면은 Sidebar가 없는 별도 화면입니다 */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/signup" element={<AdminSignup />} />

      {/* 아래 화면들은 모두 AdminLayout(Header + Sidebar)을 함께 사용합니다 */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="notice" element={<AdminNotice />} />
        <Route path="parking/manage" element={<ParkingManage />} />
        <Route path="parking/status" element={<ParkingStatusAdmin />} />
        <Route path="vehicle" element={<VehicleManage />} />
        <Route path="history" element={<History />} />
      </Route>
    </>
  );
}

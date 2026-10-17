import { Navigate, Route } from 'react-router-dom';
import AdminLayout from '../layout/AdminLayout';
import AdminLogin from '../pages/admin/login/AdminLogin';
import AdminDashboard from '../pages/admin/dashboard/AdminDashboard';
import AdminNotice from '../pages/admin/notice/AdminNotice';
import ParkingStatusAdmin from '../pages/admin/parking/status/ParkingStatusAdmin';
import ParkingUsageAdmin from '../pages/admin/parking/parkingUsage/ParkingUsageAdmin';
import VehicleManage from '../pages/admin/vehicle/VehicleManage';
import History from '../pages/admin/history/History';
import AdminSignup from '../pages/admin/login/AdminSignUp';
import AdminNoticeDetail from '../pages/admin/notice/AdminNoticeDetail';

/** 관리자 메뉴의 주차관제는 기존 현황 화면을 단일 페이지로 사용합니다. */
export default function AdminRoutes() {
  return (
    <>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/signup" element={<AdminSignup />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="notice" element={<AdminNotice />} />
        <Route path="parking" element={<ParkingStatusAdmin />} />
        {/* 기존 즐겨찾기 및 외부 링크는 새 주차관제 페이지로 이동 */}
        <Route path="parking/status" element={<Navigate to="/admin/parking" replace />} />
        <Route path="parking/manage" element={<Navigate to="/admin/parking" replace />} />
        <Route path="parking-usage" element={<ParkingUsageAdmin />} />
        <Route path="vehicle" element={<VehicleManage />} />
        <Route path="history" element={<History />} />
        <Route path="notice/:id" element={<AdminNoticeDetail />} />
      </Route>
    </>
  );
}

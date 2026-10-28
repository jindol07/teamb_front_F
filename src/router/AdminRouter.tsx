import { Navigate, Route } from 'react-router-dom';
import AdminLayout from '../layout/AdminLayout';
import AdminLogin from '../pages/admin/login/AdminLogin';
import AdminDashboard from '../pages/admin/dashboard/AdminDashboard';
import AdminNotice from '../pages/admin/notice/AdminNotice';
import ParkingStatusAdmin from '../pages/admin/parking/status/ParkingStatusAdmin';
import VehicleManage from '../pages/admin/vehicle/VehicleManage';
import History from '../pages/admin/history/History';
import AdminSignup from '../pages/admin/login/AdminSignUp';
import AdminNoticeDetail from '../pages/admin/notice/AdminNoticeDetail';
import AdminMileage from '../pages/admin/mileage/AdminMileage';

/** 관리자 메뉴의 주차관제는 기존 현황 화면을 단일 페이지로 사용합니다. */
export default function AdminRoutes() {
    return (
        <>
            {/* 관리자 로그인 화면은 Sidebar가 없는 별도 화면입니다 */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/signup" element={<AdminSignup />} />

            {/* 아래 화면들은 모두 AdminLayout(Header + Sidebar)을 함께 사용합니다 */}
            <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="notice" element={<AdminNotice />} />
                <Route path="parking" element={<ParkingStatusAdmin />} />
                {/* 기존 즐겨찾기 및 외부 링크는 새 주차관제 페이지로 이동 */}
                <Route path="parking/status" element={<Navigate to="/admin/parking" replace />} />
                <Route path="parking/manage" element={<Navigate to="/admin/parking" replace />} />
                {/* 삭제한 입출차 관리 화면의 기존 링크는 전체 이력으로 이동합니다. */}
                <Route path="parking-usage" element={<Navigate to="/admin/history" replace />} />
                <Route path="vehicle" element={<VehicleManage />} />
                <Route path="mileage" element={<AdminMileage />} />
                <Route path="history" element={<History />} />
                <Route path="notice/:id" element={<AdminNoticeDetail />} />
            </Route>
        </>
    );
}

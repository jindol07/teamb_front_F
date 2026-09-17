import SummaryCards from './SummaryCards';
import ParkingPieChart from './ParkingPieChart';
import VehicleBarChart from './VehicleBarChart';
import RecentInfo from './RecentInfo';

/**
 * 관리자 Dashboard 페이지 (/admin/dashboard)
 * 초기 템플릿에서 가장 완성도 높게 구현하는 화면입니다. (문서 19번)
 */
export default function AdminDashboard() {
  return (
    <div>
      <h2 className="page-title">대시보드</h2>
      <p className="page-description">주차관제 서비스 현황을 한눈에 확인하세요.</p>

      <SummaryCards />

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-5">
          <ParkingPieChart />
        </div>
        <div className="col-12 col-lg-7">
          <VehicleBarChart />
        </div>
      </div>

      <RecentInfo />
    </div>
  );
}

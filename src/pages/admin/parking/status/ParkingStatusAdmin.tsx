// src/pages/admin/parking/status/ParkingStatusAdmin.tsx
import { parkingSummaryMock } from '../../../../mock/parkingMock';
import ParkingMapCanvas from './ParkingMapCanvas'; // 1. 새로 만든 2D 캔버스 컴포넌트 불러오기

/**
 * 관리자 주차관제 현황 페이지 (/admin/parking/status)
 * 전체 / 사용중 / 예약 / 사용가능 현황을 Card 형태로 보여줍니다.
 */
export default function ParkingStatusAdmin() {
  const { totalSpots, currentParked, reservedSpots, availableSpots } = parkingSummaryMock;

  const cards = [
    { label: '전체', value: totalSpots, unit: '면', color: 'text-dark' },
    { label: '사용중', value: currentParked, unit: '면', color: 'text-primary' },
    { label: '예약', value: reservedSpots, unit: '면', color: 'text-warning' },
    { label: '사용가능', value: availableSpots, unit: '면', color: 'text-success' },
  ];

  return (
    <div>
      <h2 className="page-title">주차관제 현황</h2>
      <p className="page-description">현재 주차장 상태를 실시간으로 보여줍니다. (Mock Data)</p>

      {/* 상단 현황 요약 카드 */}
      <div className="row g-3">
        {cards.map((card) => (
          <div key={card.label} className="col-6 col-lg-3">
            <div className="card summary-card text-center p-4 h-100">
              <div className="text-secondary small mb-1">{card.label}</div>
              <div className={`summary-value ${card.color}`}>
                {card.value}
                <span className="fs-6 ms-1">{card.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 2. 요약 카드 밑에 2D 도면 컴포넌트 추가 */}
      <ParkingMapCanvas />
    </div>
  );
}
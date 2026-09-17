import { parkingSummaryMock } from '../../../mock/parkingMock';

/**
 * SummaryCards
 * 대시보드 상단의 주요 통계 카드 4개 (전체 주차면 / 현재 주차 / 잔여 주차면 / 금일 입차)
 */
export default function SummaryCards() {
  const { totalSpots, currentParked, availableSpots, todayEntries } = parkingSummaryMock;

  const cards = [
    { label: '전체 주차면', value: `${totalSpots}면` },
    { label: '현재 주차 차량', value: `${currentParked}대` },
    { label: '잔여 주차면', value: `${availableSpots}면` },
    { label: '금일 입차', value: `${todayEntries}대` },
  ];

  return (
    <div className="row g-3 mb-4">
      {cards.map((card) => (
        <div key={card.label} className="col-6 col-lg-3">
          <div className="card summary-card p-3 h-100">
            <div className="text-secondary small mb-1">{card.label}</div>
            <div className="summary-value">{card.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

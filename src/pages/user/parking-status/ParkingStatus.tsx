import React, { useState } from 'react';
import { parkingSummaryMock, allParkingSlotsMock, ParkingSlot } from '../../../mock/parkingMock';
import useAgent from '../../../hooks/useAgent';
import ParkingMapCanvasCore from './ParkingMapCanvasCore'; // 경로에 맞게 수정해주세요 (예: ./ParkingMapCanvasCore)

/**
 * 사용자 주차현황 페이지 (/user/parking-status)
 * 전체 주차면 / 현재 주차 / 잔여 주차면 및 실시간 주차장 맵을 표시합니다.
 */
export default function ParkingStatus() {
  const { isMobile } = useAgent();
  const { totalSpots, currentParked, availableSpots } = parkingSummaryMock;

  // 추가된 상태값 (층 선택, 선택된 슬롯, 모달 창, 주행 경로 토글)
  const [currentFloor, setCurrentFloor] = useState<'B1' | 'B2' | 'B3'>('B1');
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [showPath, setShowPath] = useState<boolean>(true);

  // 구획을 클릭했을 때 실행되는 핸들러
  const handleSlotClick = (slot: ParkingSlot) => {
    setSelectedSlot(slot);
    // '사용가능' 상태인 칸을 누를 때만 예약 모달창 오픈
    if (slot.status === '사용가능') {
      setIsModalOpen(true);
    } else {
      alert(`해당 구획은 현재 [${slot.status}] 상태입니다. 예약할 수 없습니다.`);
    }
  };

  // 예약 확정 버튼 클릭 시
  const handleConfirmReservation = () => {
    if (!selectedSlot) return;
    alert(`[예약 완료] ${selectedSlot.floor}층 ${selectedSlot.slotNumber} 구획이 예약되었습니다.`);
    setIsModalOpen(false);
    setSelectedSlot(null);
  };

  return (
    <div className="container py-4">
      <h2 className="page-title">주차현황 및 예약</h2>
      <p className="page-description">
        {isMobile
          ? '실시간 주차 현황 및 구획별 예약입니다.'
          : '현재 주차장의 실시간 이용 현황을 확인하고 원하는 구획을 간편하게 예약하세요.'}
      </p>

      {/* 상단 요약 카드 영역 */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card summary-card text-center p-3 shadow-sm">
            <div className="text-secondary small mb-1">전체 주차면</div>
            <div className="summary-value fs-4 fw-bold">{totalSpots}</div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card summary-card text-center p-3 shadow-sm">
            <div className="text-secondary small mb-1">현재 주차</div>
            <div className="summary-value fs-4 fw-bold text-primary">{currentParked}</div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card summary-card text-center p-3 shadow-sm">
            <div className="text-secondary small mb-1">잔여 주차면</div>
            <div className="summary-value fs-4 fw-bold text-success">{availableSpots}</div>
          </div>
        </div>
      </div>

      {/* 주차장 맵 컨트롤 영역 (층 선택 & 주행 경로 토글) */}
      <div className="card p-3 shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div className="btn-group" role="group">
            {(['B1', 'B2', 'B3'] as const).map((floor) => (
              <button
                key={floor}
                type="button"
                className={`btn btn-sm ${currentFloor === floor ? 'btn-dark fw-bold px-3' : 'btn-outline-secondary px-3'}`}
                onClick={() => setCurrentFloor(floor)}
              >
                지하 {floor.replace('B', '')}층
              </button>
            ))}
          </div>

          <button
            className={`btn btn-sm ${showPath ? 'btn-primary' : 'btn-outline-primary'} fw-bold`}
            onClick={() => setShowPath(!showPath)}
          >
            {showPath ? '🛣️ 주행 경로 숨기기' : '🛣️ 주행 경로 보기'}
          </button>
        </div>

        {/* Konva 캔버스 맵 영역 */}
        <div style={{ width: '100%', height: '625px', background: '#f8f9fa', overflow: 'auto', position: 'relative', borderRadius: '6px' }}>
          <ParkingMapCanvasCore
            floor={currentFloor}
            showPath={showPath}
            onSelectSlot={handleSlotClick}
            selectedSlotId={selectedSlot?.id}
          />
        </div>
      </div>

      {/* 예약 확인 모달 (팝업창) */}
      {isModalOpen && selectedSlot && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fs-6">🅿️ 주차 구획 예약 확인</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setIsModalOpen(false)}></button>
              </div>
              <div className="modal-body">
                <p className="mb-2">선택하신 구획: <strong className="text-primary">{selectedSlot.floor}층 {selectedSlot.slotNumber}</strong></p>
                <p className="text-muted small mb-0">예약을 진행하시겠습니까? (예약 후 30분 내 입차해야 합니다.)</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(false)}>취소</button>
                <button type="button" className="btn btn-primary btn-sm" onClick={handleConfirmReservation}>예약 확정하기</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
/**
 * 사용자 주차현황 페이지.
 * 주차구획은 관리자와 동일한 useParkingStore 데이터/parkingLayout 좌표를 재사용.
 * 현재 층은 이 페이지 내부 state로 관리하여 관리자와 층 선택을 분리.
 * EMPTY이며 DISABLED 구획이 아닌 곳을 클릭하면 예약 모달만 엽니다.
 * 실제 예약 생성/시간 중복 확인은 예약 담당자의 백엔드 기능에 위임.
 * 프론트만 완성한 동안 상태는 서버 영구 저장 및 브라우저 간 자동 동기화되지 않음.
 */
import React, { useCallback, useState } from 'react';
import { ParkingMapView } from '../../admin/parking/status/ParkingMapView';
import { useParkingStore } from '../../admin/parking/status/useParkingStore';
import type { ExtendedParkingSlot } from '../../admin/parking/status/parking';
import ParkingReservationModal from '../reservation/ParkingReservationModal';

/** 사용자 주차현황: 관리자와 동일한 구획 상태를 읽되, 변경 기능은 제공하지 않습니다. */
/** 학습 해설: 사용자 조회용 페이지로, 관리자의 편집 패널을 가져오지 않습니다. */
export default function ParkingStatus() {
  /** 학습 해설: 상태 선택자(selector)로 slots만 구독합니다. 다른 데이터 변경 시 불필요한 렌더링을 줄이는 패턴입니다. */
  const slots = useParkingStore((state) => state.slots);
  /** 학습 해설: 관리자와 독립적인 사용자 페이지용 현재 층 상태입니다. */
  const [currentFloor, setCurrentFloor] = useState(1);
  /** 학습 해설: null이면 예약 모달이 닫히고 객체이면 열립니다. */
  const [selectedSlot, setSelectedSlot] = useState<ExtendedParkingSlot | null>(null);
  /** 학습 해설: useCallback으로 동일한 닫기 콜백의 참조를 유지합니다. */
  const closeModal = useCallback(() => setSelectedSlot(null), []);

  /** 학습 해설: 현재 층만 걸러서 카드 통계를 계산합니다. */
  const floorSlots = slots.filter((slot) => slot.floor === currentFloor);
  /** 학습 해설: 현재 층 구획 개수입니다. */
  const total = floorSlots.length;
  /** 학습 해설: 사용중이면서 사용불가 유형이 아닌 구획만 계산합니다. */
  const occupied = floorSlots.filter((slot) => slot.status === 'OCCUPIED' && slot.slotType !== 'DISABLED').length;
  /** 학습 해설: 실제 예약 신청 자격/시간 충돌 검사와는 별개의 UI 표시 수치입니다. */
  const available = floorSlots.filter((slot) => slot.status === 'EMPTY' && slot.slotType !== 'DISABLED').length;
  /** 학습 해설: 예약 상태로 표시된 구획 수입니다. */
  const reserved = floorSlots.filter((slot) => slot.status === 'RESERVED' && slot.slotType !== 'DISABLED').length;

  /** 학습 해설: 예약 불가 상태이면 return, 그 외에는 선택 구획을 지정해 모달을 엽니다. */
  const handleSlotClick = (slot: ExtendedParkingSlot) => {
    if (slot.status !== 'EMPTY' || slot.slotType === 'DISABLED') return;
    setSelectedSlot(slot);
  };

  /** 학습 해설: Bootstrap 클래스로 요약 카드와 도면의 화면 구조를 선언합니다. */
  return (
    <div className="container py-4">
      <h2 className="page-title">주차현황 및 예약</h2>
      <p className="page-description">주차구획 현황을 확인하고 구획을 선택하여 예약 화면을 열 수 있습니다.</p>
      <div className="row g-3 mb-4">
        {[
          { label: '전체 주차면', value: total },
          { label: '현재 주차', value: occupied },
          { label: '예약 표시', value: reserved },
          { label: '현재 빈 구획', value: available },
        ].map(({ label, value }) => (
          <div className="col-6 col-md-3" key={label}>
            <div className="card summary-card text-center p-3 shadow-sm h-100">
              <div className="text-secondary small mb-1">{label}</div>
              <div className="summary-value fs-4 fw-bold">{value}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="card border-0 shadow-sm rounded-3 p-4 d-flex align-items-center">
        <ParkingMapView
          mode="user"
          slots={slots}
          currentFloor={currentFloor}
          onFloorChange={(floor) => { setCurrentFloor(floor); closeModal(); }}
          onSlotClick={handleSlotClick}
          selectedSlotId={selectedSlot?.id ?? null}
        />
        {floorSlots.length > 0 && <p className="text-secondary small mt-3 mb-0">빈 구획을 선택하면 예약 모달이 열립니다. 실제 예약 가능 여부는 예약 서비스에서 확인해야 합니다.</p>}
      </div>
      <ParkingReservationModal isOpen={selectedSlot !== null} slot={selectedSlot} onClose={closeModal} />
    </div>
  );
}
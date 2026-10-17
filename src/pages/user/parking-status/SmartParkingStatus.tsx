/**
 -
 사용자 주차현황 페이지.
 -
 주차구획은 관리자와 동일한 useParkingStore 데이터/parkingLayout 좌표를 재사용.
 -
 현재 층은 이 페이지 내부 state로 관리하여 관리자와 층 선택을 분리.
 - EMPTY
 이며 DISABLED 구획이 아닌 곳을 클릭하면 예약 모달만 엽니다.
 -
 실제 예약 생성/시간 중복 확인은 예약 담당자의 백엔드 기능에 위임.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ParkingMapView } from '../../admin/parking/status/ParkingMapView';
import { useParkingStore } from '../../admin/parking/status/useParkingStore';
import type { ExtendedParkingSlot } from '../../admin/parking/status/parking';
import ParkingReservationModal from '../reservation/ParkingReservationModal';

export default function ParkingStatus() {
  // ParkingStatus 정보 가져옴
  const slots = useParkingStore((state) => state.slots);
  const setSlots = useParkingStore((state) => state.setSlots); // 스토어의 기본 슬롯 설정 함수 활용

  const [currentFloor, setCurrentFloor] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState<ExtendedParkingSlot | null>(null);
  const closeModal = useCallback(() => setSelectedSlot(null), []);

  // 모달들과 동일한 계산 공식을 사용하여 내 예약 자리가 정확히 'RESERVED'로 매칭되도록 수정
  // 백엔드에 등록된 정보와 매칭된 자리 비교
  // 예약 시 해당 슬롯의 상태를 강제로 RESERVED로 바꿈, 취소 시 EMPTY로 바꿈
  useEffect(() => {
    const fetchReservationsAndSync = async () => {
      try {
        const response = await fetch('/alpharking/api/reservation', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const reservations = await response.json();
          if (Array.isArray(reservations) && slots.length > 0) {
            const updatedSlots = slots.map((slot) => {
              const matched = reservations.some((res: any) => {
                const resSpaceId = res.parkingSpaceId ?? res.parking_space_id;

                // BookingModal에서 사용하던 정확한 공간 ID 계산 공식 적용
                let computedId = 16;
                const slotIndex = slots.findIndex((s) => s.id === slot.id);
                if (slotIndex !== -1) {
                  computedId = 16 + slotIndex;
                } else {
                  const numericMatch = slot.slotNumber?.replace(/[^0-9]/g, '');
                  computedId = numericMatch ? 15 + Number(numericMatch) : 16;
                }

                const isMatch = Number(resSpaceId) === Number(computedId);
                const isCanceled =
                  res.statusCode === 'CANCELED' || res.status_code === 'CANCELED';

                return isMatch && !isCanceled;
              });

              if (matched) {
                return { ...slot, status: 'RESERVED' as const };
              } else {
                // 이전에 RESERVED였으나 취소되었거나 예약이 없는 경우 EMPTY로 복구
                if (slot.status === 'RESERVED') {
                  return { ...slot, status: 'EMPTY' as const };
                }
                return slot;
              }
            });
            setSlots(updatedSlots);
          }
        }
      } catch (error) {
        console.error('예약 현황 동기화 실패:', error);
      }
    };

    fetchReservationsAndSync();
  }, [setSlots]); // 💡 [수정 포인트] slots.length 대신 setSlots를 넣어 마운트 시 1회만 정확히 동기화되도록 수정 (무한 렌더링 방지)

  const floorSlots = slots.filter((slot) => slot.floor === currentFloor);
  const total = floorSlots.length;
  const occupied = floorSlots.filter(
    (slot) => slot.status === 'OCCUPIED' && slot.slotType !== 'DISABLED',
  ).length;
  const available = floorSlots.filter(
    (slot) => slot.status === 'EMPTY' && slot.slotType !== 'DISABLED',
  ).length;
  const reserved = floorSlots.filter(
    (slot) => slot.status === 'RESERVED' && slot.slotType !== 'DISABLED',
  ).length;

  // 예약된 자리 무시, 빈 자리만 선택할 수 있도록 하는 클릭 관련 이벤트
  const handleSlotClick = (slot: ExtendedParkingSlot) => {
    if (slot.status !== 'EMPTY' || slot.slotType === 'DISABLED') return;
    setSelectedSlot(slot);
  };

  return (
    <div className="container py-4">
      <h2 className="page-title">주차현황 및 예약</h2>
      <p className="page-description">
        주차구획 현황을 확인하고 구획을 선택하여 예약 화면을 열 수 있습니다.
      </p>
      <div className="row g-3 mb-4">
        {[
          { label: '전체 주차면', value: total },
          { label: '현재 주차', value: occupied },
          { label: '주차 완료', value: reserved },
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
          onFloorChange={(floor) => {
            setCurrentFloor(floor);
            closeModal();
          }}
          onSlotClick={handleSlotClick}
          selectedSlotId={selectedSlot?.id ?? null}
        />
      </div>
      <ParkingReservationModal
        isOpen={selectedSlot !== null}
        slot={selectedSlot}
        onClose={closeModal}
      />
    </div>
  );
}

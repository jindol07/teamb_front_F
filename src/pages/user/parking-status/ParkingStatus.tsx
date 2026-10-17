/**
 * 사용자 주차현황 페이지.
 * 주차구획은 관리자와 동일한 useParkingStore 데이터/parkingLayout 좌표를 재사용.
 * 현재 층은 이 페이지 내부 state로 관리하여 관리자와 층 선택을 분리.
 * EMPTY 이며 DISABLED 구획이 아닌 곳을 클릭하면 예약 모달만 엽니다.
 * 실제 예약 생성/시간 중복 확인은 예약 담당자의 백엔드 기능에 위임.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ParkingMapView } from '../../admin/parking/status/ParkingMapView';
import { useParkingStore } from '../../admin/parking/status/useParkingStore';
import type { ExtendedParkingSlot } from '../../admin/parking/status/parking';
import ParkingReservationModal from '../reservation/ParkingReservationModal';

export default function ParkingStatus() {
  const slots = useParkingStore((state) => state.slots);
  const setSlots = useParkingStore((state) => state.setSlots);

  const [currentFloor, setCurrentFloor] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState<ExtendedParkingSlot | null>(null);
  const closeModal = useCallback(() => setSelectedSlot(null), []);

  // 💡 새로고침 없이 주기적으로 예약 정보를 동기화하는 함수
  const fetchReservationsAndSync = useCallback(async () => {
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
  }, [slots, setSlots]);

  // 최초 로드 및 5초마다 자동 갱신 (폴링)
  useEffect(() => {
    fetchReservationsAndSync();

    const timer = window.setInterval(() => {
      fetchReservationsAndSync();
    }, 5000);

    return () => window.clearInterval(timer);
  }, [fetchReservationsAndSync]);

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

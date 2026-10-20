/**
 * [예약 모달 담당]
 * ParkingStatus에서 선택한 구획 정보를 전달받아 예약 모달을 표시합니다.
 * 왼쪽에는 주차 현황 도면, 오른쪽에는 예약 입력 화면을 표시합니다.
 *
 * 예약 모달에서는 별도의 층 선택을 제공하지 않고,
 * 선택된 구획의 층과 구획 정보를 표시합니다.
 */
import { useEffect } from 'react';
import type { ExtendedParkingSlot } from '../../admin/parking/status/parking';
import { ParkingMapView } from '../../../shared/parking/ParkingMapView';
import { useParkingStore } from '../../../shared/parking/useParkingStore';
import BookingModal from './BookingModal';

/** 예약 모달 외부 인터페이스 */
export interface ParkingReservationModalProps {
  /** 모달 표시 여부 */
  isOpen: boolean;

  /** ParkingStatus에서 선택한 구획 정보 */
  slot: ExtendedParkingSlot | null;

  /** 모달 닫기 콜백 */
  onClose: () => void;
}

/**
 * 주차 현황과 예약 입력 폼을 함께 표시하는 모달입니다.
 * 주차 구획 선택은 외부 ParkingStatus에서만 진행합니다.
 */
export default function ParkingReservationModal({
  isOpen,
  slot,
  onClose,
}: ParkingReservationModalProps) {
  /** 관리자와 동일한 주차 구획 상태 */
  const slots = useParkingStore((state) => state.slots);

  /** 선택된 구획의 층 */
  const currentFloor = slot?.floor ?? 1;

  /** Escape 키로 모달 닫기 */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  /** 닫힌 모달 또는 선택 구획이 없으면 렌더링하지 않음 */
  if (!isOpen || !slot) return null;

  return (
    <div
      className="parking-reservation-overlay"
      role="presentation"
      onMouseDown={(event) => {
        /** 모달 바깥 영역을 클릭한 경우에만 닫기 */
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="parking-reservation-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="parking-reservation-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* 모달 제목 및 닫기 버튼 */}
        <header className="parking-reservation-header">
          <div>
            <h3 id="parking-reservation-title">주차 기간 예약</h3>
            <p>주차 현황을 확인하고 이용 기간과 차량 정보를 입력하세요.</p>
          </div>

          <button
            type="button"
            className="btn-close"
            aria-label="모달 닫기"
            onClick={onClose}
          />
        </header>

        {/* 왼쪽 주차 현황 / 오른쪽 예약 폼 */}
        <div className="parking-reservation-body">
          {/* 왼쪽: 주차 현황 */}
          <section className="parking-reservation-map-section">
            <div className="parking-reservation-section-header">
              <div className="parking-reservation-section-title">
                <h4>주차장 현황</h4>
                <p>선택한 주차 구획을 파란색으로 표시합니다.</p>
              </div>

              {/* 선택한 구획의 층만 표시 */}
              <div className="parking-reservation-map-controls">
                <span className="parking-reservation-floor">지하 {slot.floor}층</span>
              </div>
            </div>

            {/* 관리자와 동일한 주차 도면 재사용 */}
            <div className="parking-reservation-map">
              <ParkingMapView
                mode="user"
                slots={slots}
                currentFloor={currentFloor}
                onFloorChange={() => {
                  /** 예약 모달에서는 층을 변경하지 않음 */
                }}
                onSlotClick={() => {
                  /** 구획 선택은 외부 ParkingStatus에서 진행 */
                }}
                selectedSlotId={slot.id}
              />
            </div>

            {/* 주차 상태 범례 */}
            <div className="parking-reservation-legend">
              <span>
                <i className="parking-legend-dot parking-legend-empty" />빈 구획
              </span>

              <span>
                <i className="parking-legend-dot parking-legend-selected" />
                선택 구획
              </span>

              <span>
                <i className="parking-legend-dot parking-legend-occupied" />
                사용 중
              </span>
            </div>

            {/* 선택된 구획 정보 */}
            <div className="parking-reservation-selected-slot">
              <span>선택된 구획</span>
              <strong>{slot.slotNumber}</strong>
              <span>{slot.floor}층</span>
            </div>
          </section>

          {/* 오른쪽: 예약 입력 */}
          <section className="parking-reservation-form-section">
            <BookingModal key={slot.id} slot={slot} onClose={onClose} />
          </section>
        </div>
      </section>
    </div>
  );
}

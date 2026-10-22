
/**
 * 사용자 주차현황 및 예약 페이지
 *
 * [주요 기능]
 * 1. Oracle DB 기반 전체 주차구획 현황 조회
 * 2. 전체 주차장 통계 및 층별 주차현황 표시
 * 3. 층별 카드 클릭 시 해당 층의 React Konva 도면 표시
 * 4. 사용 가능한 주차구획 클릭 시 예약 모달 호출
 * 5. U 서버 웹소켓 수신 결과를 Zustand에서 공유하며 연결 중단 시 5초 주기 조회
 *
 * [주의사항]
 * - 관리자와 동일한 주차구획 데이터를 사용합니다.
 * - 사용자는 구획 상태를 직접 변경할 수 없습니다.
 * - 실제 예약 저장 및 중복 예약 검증은 예약 담당 기능에서 처리합니다.
 * - 차량번호는 사용자 도면에서 표시하지 않습니다.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import { ParkingMapView } from '../../../shared/parking/ParkingMapView';
import { useParkingStore } from '../../../shared/parking/useParkingStore';
import { useParkingSpaceSync } from '../../../shared/parking/useParkingSpaceSync';

import type {
  ExtendedParkingSlot,
} from '../../../shared/parking/parking';

import ParkingReservationModal from '../reservation/ParkingReservationModal';

/**
 * 주차현황 통계 타입
 *
 * 서로 중복되지 않는 상태로 분류합니다.
 * total = occupied + reserved + available + disabled + unknown
 */
interface ParkingSummary {
  total: number;
  occupied: number;
  reserved: number;
  available: number;
  disabled: number;
  unknown: number;
}

/**
 * 실제 예약 선택이 가능한 구획인지 검사합니다.
 *
 * 사용 가능 상태이면서 사용불가 유형이 아니어야 합니다.
 */
function isReservable(slot: ExtendedParkingSlot): boolean {
  return (
    slot.status === 'EMPTY' &&
    slot.slotType !== 'DISABLED'
  );
}

/**
 * 주차구획 배열을 통계로 변환하는 함수입니다.
 *
 * 전체 통계와 층별 통계에서 동일한 기준을 사용합니다.
 */
function calculateSummary(
  targetSlots: ExtendedParkingSlot[]
): ParkingSummary {
  const summary: ParkingSummary = {
    total: targetSlots.length,
    occupied: 0,
    reserved: 0,
    available: 0,
    disabled: 0,
    unknown: 0,
  };

  targetSlots.forEach((slot) => {
    // 사용 불가 상태나 유형은 가장 먼저 분류합니다.
    if (
      slot.status === 'DISABLED' ||
      slot.slotType === 'DISABLED'
    ) {
      summary.disabled += 1;
      return;
    }

    switch (slot.status) {
      case 'OCCUPIED':
        summary.occupied += 1;
        break;

      case 'RESERVED':
        summary.reserved += 1;
        break;

      case 'EMPTY':
        summary.available += 1;
        break;

      default:
        // 서버에서 알 수 없는 상태가 왔을 경우
        // 임의로 사용 가능하다고 판단하지 않습니다.
        summary.unknown += 1;
        break;
    }
  });

  return summary;
}

/**
 * 전체 상태 중 사용 가능한 구획의 비율을 계산합니다.
 */
function getAvailablePercent(
  summary: ParkingSummary
): number {
  if (summary.total === 0) return 0;

  return (summary.available / summary.total) * 100;
}

/**
 * 사용자 주차현황 메인 페이지
 */
export default function ParkingStatus() {
  // 사용자 현황은 U 서버의 조회 API·웹소켓을 사용합니다.
  useParkingSpaceSync('user');

  // 관리자와 공유하는 주차구획 데이터입니다.
  const slots = useParkingStore((state) => state.slots);
  const syncState = useParkingStore((state) => state.syncState);
  const syncError = useParkingStore((state) => state.syncError);

  // 사용자가 선택한 층입니다.
  // 관리자 화면의 selectedFloor와는 독립적으로 관리합니다.
  const [currentFloor, setCurrentFloor] = useState<number>(1);

  // 예약 모달에 전달할 주차구획입니다.
  const [selectedSlot, setSelectedSlot] =
    useState<ExtendedParkingSlot | null>(null);

  /**
   * 예약 모달 닫기
   */
  const closeModal = useCallback(() => {
    setSelectedSlot(null);
  }, []);

  /**
   * 전체 주차장 통계
   *
   * 선택된 층과 무관하게 전체 주차구획을 계산합니다.
   */
  const allSummary = useMemo(() => {
    return calculateSummary(slots);
  }, [slots]);

  /**
   * 층별 주차현황 통계
   */
  const floorSummaries = useMemo(() => {
    return [1, 2, 3].map((floor) => {
      const floorSlots = slots.filter(
        (slot) => slot.floor === floor
      );

      return {
        floor,
        ...calculateSummary(floorSlots),
      };
    });
  }, [slots]);

  /**
   * 현재 선택한 층의 주차구획
   */
  const currentFloorSlots = useMemo(() => {
    return slots.filter(
      (slot) => slot.floor === currentFloor
    );
  }, [slots, currentFloor]);

  /**
   * 현재 선택 층 통계
   */
  const currentFloorSummary = useMemo(() => {
    return calculateSummary(currentFloorSlots);
  }, [currentFloorSlots]);

  /**
   * API 자동 갱신 이후 선택된 구획을 다시 검사합니다.
   *
   * 이미 점유되었거나 예약 상태가 변경된 경우에는
   * 잘못된 구획으로 예약하는 일을 방지하기 위해
   * 선택을 해제합니다.
   */
  useEffect(() => {
    if (!selectedSlot) return;

    const latestSlot = slots.find(
      (slot) => slot.id === selectedSlot.id
    );

    if (!latestSlot || !isReservable(latestSlot)) {
      setSelectedSlot(null);
    }
  }, [slots, selectedSlot]);

  /**
   * 층 변경
   */
  const handleFloorChange = (floor: number) => {
    setCurrentFloor(floor);
    closeModal();
  };

  /**
   * 주차구획 클릭
   *
   * 사용 가능한 구획만 예약 모달을 엽니다.
   */
  const handleSlotClick = (slot: ExtendedParkingSlot) => {
    if (!isReservable(slot)) {
      return;
    }

    setSelectedSlot(slot);
  };

  /**
   * 전체 통계 카드
   */
  const totalCards = [
    {
      label: '전체 주차면',
      value: allSummary.total,
      color: 'text-dark',
    },
    {
      label: '현재 주차',
      value: allSummary.occupied,
      color: 'text-primary',
    },
    {
      label: '예약됨',
      value: allSummary.reserved,
      color: 'text-warning',
    },
    {
      label: '사용 가능',
      value: allSummary.available,
      color: 'text-success',
    },
    {
      label: '사용 불가',
      value: allSummary.disabled,
      color: 'text-secondary',
    },
  ];

  return (
    <div className="container-fluid py-4 px-3 px-md-4">

      {/* =====================================================
          1. 페이지 제목
      ===================================================== */}
      <div className="mb-4">
        <h2 className="fw-bold text-dark fs-3 mb-1">
          주차현황 및 예약
        </h2>

        <p className="text-muted small mb-0">
          전체 주차현황을 확인하고, 원하는 층의 빈 구획을
          선택하여 예약할 수 있습니다.
        </p>
      </div>

      {/* =====================================================
          2. 서버 조회 상태
      ===================================================== */}
      {syncState === 'loading' && (
        <div role="status" className="alert alert-info">
          주차구획 정보를 불러오는 중입니다.
        </div>
      )}

      {syncState === 'error' && (
        <div role="alert" className="alert alert-danger">
          주차구획 조회 실패: {syncError}
        </div>
      )}

      {syncState === 'ready' && (
        <div className="alert alert-light py-2 small">
          DB 주차구획 {slots.length}건 조회 완료
        </div>
      )}

      {/* =====================================================
          3. 전체 주차장 현황
      ===================================================== */}
      <section className="mb-4">
        <h5 className="fw-bold mb-3">
          전체 주차장 현황
        </h5>

        <div className="row g-3">
          {totalCards.map((card) => (
            <div
              key={card.label}
              className="col-6 col-md-4 col-xl"
            >
              <div className="card border-0 shadow-sm rounded-3 p-3 h-100 bg-white">
                <div className="text-secondary small mb-1">
                  {card.label}
                </div>

                <div className={`fs-3 fw-bold ${card.color}`}>
                  {card.value}
                  <span className="fs-6 fw-normal text-muted ms-1">
                    면
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {allSummary.unknown > 0 && (
          <div className="alert alert-warning mt-3 mb-0">
            상태를 확인할 수 없는 구획이
            {' '}{allSummary.unknown}면 있습니다.
          </div>
        )}
      </section>

      {/* =====================================================
          4. 층별 주차현황
      ===================================================== */}
      <section className="mb-4">
        <h5 className="fw-bold mb-3">
          층별 주차현황
        </h5>

        <div className="row g-3">
          {floorSummaries.map((floorData) => {
            const isSelected =
              currentFloor === floorData.floor;

            const availablePercent =
              getAvailablePercent(floorData);

            return (
              <div
                key={floorData.floor}
                className="col-12 col-md-4"
              >
                <button
                  type="button"
                  onClick={() =>
                    handleFloorChange(floorData.floor)
                  }
                  aria-pressed={isSelected}
                  className={[
                    'card w-100 text-start p-3 rounded-3 bg-white',
                    'shadow-sm h-100',
                    isSelected
                      ? 'border border-primary border-2'
                      : 'border border-light',
                  ].join(' ')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold text-dark">
                      지하 {floorData.floor}층
                    </span>

                    {isSelected && (
                      <span className="badge bg-primary">
                        선택됨
                      </span>
                    )}
                  </div>

                  <div className="d-flex align-items-baseline gap-1 mb-2">
                    <span className="fs-3 fw-bold text-success">
                      {floorData.available}
                    </span>

                    <span className="small text-muted">
                      / {floorData.total}면 사용 가능
                    </span>
                  </div>

                  {/* 사용 가능 비율 */}
                  <div
                    className="progress mb-3"
                    style={{ height: '7px' }}
                  >
                    <div
                      className="progress-bar bg-success"
                      role="progressbar"
                      style={{
                        width: `${availablePercent}%`,
                      }}
                      aria-valuenow={availablePercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`지하 ${floorData.floor}층 사용 가능 비율`}
                    />
                  </div>

                  <div className="small text-muted">
                    <div className="d-flex justify-content-between mb-1">
                      <span>주차 중</span>
                      <span>{floorData.occupied}면</span>
                    </div>

                    <div className="d-flex justify-content-between mb-1">
                      <span>예약됨</span>
                      <span>{floorData.reserved}면</span>
                    </div>

                    <div className="d-flex justify-content-between">
                      <span>사용 불가</span>
                      <span>{floorData.disabled}면</span>
                    </div>

                    {floorData.unknown > 0 && (
                      <div className="d-flex justify-content-between mt-1 text-warning">
                        <span>상태 확인 필요</span>
                        <span>{floorData.unknown}면</span>
                      </div>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================
          5. 선택 층 상세 주차 도면
      ===================================================== */}
      <section>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0">
            주차장 상세 도면
          </h5>

          <span className="badge bg-secondary">
            지하 {currentFloor}층
          </span>
        </div>

        <div className="card border-0 shadow-sm rounded-3 p-3 p-md-4 bg-white">
          <div className="d-flex justify-content-between w-100 mb-3">
            <span className="small text-secondary">
              현재 층 전체 {currentFloorSummary.total}면
            </span>

            <span className="small fw-semibold text-success">
              사용 가능 {currentFloorSummary.available}면
            </span>
          </div>

          <div className="d-flex justify-content-center w-100">
            <ParkingMapView
              mode="user"
              slots={slots}
              currentFloor={currentFloor}
              onFloorChange={handleFloorChange}
              onSlotClick={handleSlotClick}
              selectedSlotId={selectedSlot?.id ?? null}
            />
          </div>

          {currentFloorSlots.length > 0 && (
            <p className="text-secondary small mt-3 mb-0 text-center">
              사용 가능한 빈 구획을 선택하면 예약 화면이 열립니다.
              실제 예약 가능 여부는 예약 서비스에서 최종 확인합니다.
            </p>
          )}
        </div>
      </section>

      {/* =====================================================
          6. 예약 담당 팀원의 모달
      ===================================================== */}
      <ParkingReservationModal
        isOpen={selectedSlot !== null}
        slot={selectedSlot}
        onClose={closeModal}
      />

    </div>
  );
}

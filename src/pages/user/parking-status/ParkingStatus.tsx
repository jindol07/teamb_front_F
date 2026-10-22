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

import type { ExtendedParkingSlot } from '../../../shared/parking/parking';

import ParkingReservationModal from '../reservation/ParkingReservationModal';
import './ParkingStatus.css';

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
  return slot.status === 'EMPTY' && slot.slotType !== 'DISABLED';
}

/**
 * 주차구획 배열을 통계로 변환하는 함수입니다.
 *
 * 전체 통계와 층별 통계에서 동일한 기준을 사용합니다.
 */
function calculateSummary(targetSlots: ExtendedParkingSlot[]): ParkingSummary {
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
    if (slot.status === 'DISABLED' || slot.slotType === 'DISABLED') {
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
function getAvailablePercent(summary: ParkingSummary): number {
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
  const [selectedSlot, setSelectedSlot] = useState<ExtendedParkingSlot | null>(null);

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
      const floorSlots = slots.filter((slot) => slot.floor === floor);

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
    return slots.filter((slot) => slot.floor === currentFloor);
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

    const latestSlot = slots.find((slot) => slot.id === selectedSlot.id);

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
      tone: 'total',
    },
    {
      label: '현재 주차',
      value: allSummary.occupied,
      tone: 'occupied',
    },
    {
      label: '예약됨',
      value: allSummary.reserved,
      tone: 'reserved',
    },
    {
      label: '사용 가능',
      value: allSummary.available,
      tone: 'available',
    },
    {
      label: '사용 불가',
      value: allSummary.disabled,
      tone: 'disabled',
    },
  ];

  return (
    <div className="parking-user-status">
      <header className="parking-user-header">
        <div className="parking-user-heading">
          <span className="parking-user-mark" aria-hidden="true">
            P
          </span>
          <div>
            <p className="parking-user-eyebrow">주차 안내</p>
            <h2>주차현황 및 예약</h2>
            <p className="parking-user-description">
              층별 빈자리를 확인하고 사용가능 구획을 선택하세요.
            </p>
          </div>
        </div>
        <span
          className={`parking-user-connection parking-user-connection--${syncState}`}
          role="status"
        >
          <i aria-hidden="true" />
          {syncState === 'ready'
            ? '현황 조회 정상'
            : syncState === 'error'
              ? '연결 확인 필요'
              : '현황 불러오는 중'}
        </span>
      </header>

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
      {allSummary.unknown > 0 && (
        <div role="status" className="alert alert-warning">
          상태 확인이 필요한 구획이 {allSummary.unknown}면 있습니다.
        </div>
      )}

      <section
        className="parking-user-overview"
        aria-labelledby="user-parking-overview-title"
      >
        <div className="parking-user-mobile-overview" aria-label="전체 주차장 현황">
          <div className="parking-user-mobile-available">
            <span>사용가능</span>
            <strong>
              {allSummary.available}
              <small> / 전체 {allSummary.total}면</small>
            </strong>
            <span className="parking-user-mobile-live">실시간</span>
          </div>
          <div className="parking-user-mobile-counts">
            <span>
              주차중 <b>{allSummary.occupied}</b>
            </span>
            <span>
              예약됨 <b>{allSummary.reserved}</b>
            </span>
            <span>
              사용불가 <b>{allSummary.disabled}</b>
            </span>
          </div>
        </div>
        <div className="parking-user-section-heading">
          <h3 id="user-parking-overview-title">전체 주차장 현황</h3>
          <span>지하 1–3층 통합</span>
        </div>
        <div className="parking-user-stats">
          {totalCards.map((card) => (
            <div
              key={card.label}
              className={`parking-user-stat parking-user-stat--${card.tone}`}
            >
              <div className="parking-user-stat-label">
                <i aria-hidden="true" />
                {card.label}
              </div>
              <strong>
                {card.value}
                <span>면</span>
              </strong>
            </div>
          ))}
        </div>
      </section>

      <div className="parking-user-workspace">
        <section
          className="parking-user-floor-section"
          aria-labelledby="user-parking-floors-title"
        >
          <div className="parking-user-section-heading">
            <h3 id="user-parking-floors-title">층별 주차현황</h3>
            <span>층을 선택하면 도면이 바뀝니다.</span>
          </div>
          <div className="parking-user-floors">
            {floorSummaries.map((floorData) => {
              const isSelected = currentFloor === floorData.floor;
              const availablePercent = getAvailablePercent(floorData);
              return (
                <button
                  key={floorData.floor}
                  type="button"
                  className={`parking-user-floor${isSelected ? ' is-selected' : ''}`}
                  aria-pressed={isSelected}
                  aria-label={`지하 ${floorData.floor}층 도면 보기`}
                  onClick={() => handleFloorChange(floorData.floor)}
                >
                  <div className="parking-user-floor-heading">
                    <strong>지하 {floorData.floor}층</strong>
                    <span>{isSelected ? '선택됨' : `전체 ${floorData.total}면`}</span>
                  </div>
                  <div className="parking-user-floor-count">
                    <strong>{floorData.available}</strong>
                    <span>/ {floorData.total}면 사용가능</span>
                    <span className="parking-user-mobile-remaining">자리 남음</span>
                  </div>
                  <div
                    className="parking-user-floor-progress"
                    role="progressbar"
                    aria-valuenow={availablePercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`지하 ${floorData.floor}층 사용가능 비율`}
                  >
                    <span style={{ width: `${availablePercent}%` }} />
                  </div>
                  <div className="parking-user-floor-summary">
                    <span>
                      주차 중 <b>{floorData.occupied}</b>
                    </span>
                    <span>
                      예약 <b>{floorData.reserved}</b>
                    </span>
                    <span>
                      사용불가 <b>{floorData.disabled}</b>
                    </span>
                    {floorData.unknown > 0 && (
                      <span>
                        확인필요 <b>{floorData.unknown}</b>
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="parking-user-selection-help">
            <span aria-hidden="true">↗</span> 도면의 사용가능 구획을 선택하면 예약 화면이
            열립니다.
          </p>
        </section>

        <section
          className="parking-user-map-card"
          aria-labelledby="user-parking-map-title"
        >
          <div className="parking-user-map-heading">
            <div>
              <h3 id="user-parking-map-title">주차장 상세 도면</h3>
              <p>원하시는 구획을 선택해 예약 정보를 확인하세요.</p>
            </div>
            <span className="parking-user-floor-tag">지하 {currentFloor}층</span>
          </div>
          <div className="parking-user-map-summary">
            <span>
              현재 층 전체 <strong>{currentFloorSummary.total}면</strong>
            </span>
            <span>
              사용가능 <strong>{currentFloorSummary.available}면</strong>
            </span>
          </div>
          <div className="parking-user-map-body">
            <ParkingMapView
              mode="user"
              slots={slots}
              currentFloor={currentFloor}
              onFloorChange={handleFloorChange}
              onSlotClick={handleSlotClick}
              selectedSlotId={selectedSlot?.id ?? null}
              compactControls
            />
          </div>
          {currentFloorSlots.length > 0 && (
            <p className="parking-user-reservation-note">
              실제 예약 가능 여부는 예약 시 최종 확인됩니다.
            </p>
          )}
        </section>
      </div>

      <ParkingReservationModal
        isOpen={selectedSlot !== null}
        slot={selectedSlot}
        onClose={closeModal}
      />
    </div>
  );
}

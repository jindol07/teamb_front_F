/**
 * 관리자 페이지: 현재 층 통계 계산, 공통 Konva 지도, 상세 패널을 조립.
 * 클릭한 구획은 Zustand selectedSlot으로 저장; 패널 저장 시 updateSlotDetail 반영.
 * 경고: 현재 Zustand 변경은 새로고침 후 소실됨. 서버 API 연결은 후속 단계.
 * 공통 슬롯 좌표는 parkingLayout.ts만 수정하며 이 파일에서 재생성하지 않음.
 */
import React from 'react';
import { ParkingMapView } from './ParkingMapView';
import { useParkingStore } from './useParkingStore';
import { SlotDetailPanel } from './SlotDetailPanel';
import { useParkingSpaceSync } from './useParkingSpaceSync';

/**
 * [관리자 주차관제 메인 페이지 컴포넌트]
 * 실시간 상태 통계 요약 카드 + 2D Canvas 도면 + 우측 구획 상세설정 패널 제공
 */
/** 학습 해설: 관리자 페이지를 조립합니다. Zustand 훅에서 구획과 선택 상태를 읽고 하위 컴포넌트에 Props를 전달합니다. */
export default function ParkingStatusAdmin() {
  useParkingSpaceSync(); // 페이지 진입 시 API 조회 및 5초 폴링
  const {
    selectedFloor,
    setSelectedFloor,
    selectedSlot,
    setSelectedSlot,
    slots,
    syncState,
    syncError,
  } = useParkingStore();

  // 동적 현황 집계 (전체 구획 스토어 기준 계산)
  /** 학습 해설: 전체 배열에서 선택한 층만 골라 아래 통계에 사용합니다. */
  const currentFloorSlots = slots.filter((s) => s.floor === selectedFloor);
  /** 학습 해설: 현재 층 구획 수. 서버에서 구획을 받기 전에도 레이아웃이 있으면 15로 표시됩니다. */
  const totalSpots = currentFloorSlots.length;
  /** 학습 해설: OCCUPIED인 구획의 수를 셉니다. 상태 문자열 비교는 대소문자를 구분합니다. */
  const currentParked = currentFloorSlots.filter((s) => s.status === 'OCCUPIED').length;
  /** 학습 해설: 예약 상태로 표시된 구획 수이며 시간대별 예약 가능 여부를 보증하지 않습니다. */
  const reservedSpots = currentFloorSlots.filter((s) => s.status === 'RESERVED').length;
  /** 학습 해설: 사용불가 상태 또는 유형을 합쳐 셉니다. 데이터가 모순되면 통계 중복 가능성을 점검해야 합니다. */
  const disabledSpots = currentFloorSlots.filter((s) => s.status === 'DISABLED' || s.slotType === 'DISABLED').length;
  /** 학습 해설: 잔여 구획 수를 구하고 Math.max(0, ...)로 음수 표시를 방지합니다. */
  const availableSpots = Math.max(0, totalSpots - currentParked - reservedSpots - disabledSpots);

  /** 학습 해설: 반복 출력할 통계 카드의 표시용 배열입니다. */
  const cards = [
    { label: '전체 구획', value: totalSpots, unit: '면', color: 'text-dark' },
    { label: '사용중', value: currentParked, unit: '면', color: 'text-primary' },
    { label: '예약됨', value: reservedSpots, unit: '면', color: 'text-warning' },
    { label: '사용가능', value: availableSpots, unit: '면', color: 'text-success' },
  ];



  return (
    <div className="container-fluid p-4">
      {/* 상단 페이지 제목 */}
      <div className="mb-4">
        <h2 className="fw-bold text-dark fs-3 mb-1">실시간 주차관제 현황</h2>
        <p className="text-muted small mb-0">주차장의 구획별 상태를 실시간 모니터링하고 제어합니다.</p>
      </div>

      {/* 서버 연결 결과를 숨기지 않습니다. */}
      {syncState === 'loading' && <div role="status" className="alert alert-info">주차구획 정보를 불러오는 중입니다.</div>}
      {syncState === 'error' && <div role="alert" className="alert alert-danger">주차구획 조회 실패: {syncError}</div>}
      {syncState === 'ready' && <div className="alert alert-light py-2 small">DB 주차구획 {slots.length}건 조회 완료 · 현재 조회는 공개 API 기준입니다.</div>}
      {/* 실시간 현황 카드 */}
      <div className="row g-3 mb-4">
        {cards.map((card) => (
          <div key={card.label} className="col-12 col-sm-6 col-xl-3">
            <div className="card border-0 shadow-sm rounded-3 p-3 h-100 bg-white">
              <div className="text-secondary small fw-medium mb-1">{card.label}</div>
              <div className={`fs-2 fw-bold ${card.color}`}>
                {card.value}
                <span className="fs-6 fw-normal text-muted ms-1">{card.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 관제 메인 레이아웃: [2D Map] + [우측 설정 패널] */}
      <div className="row g-4 align-items-start">
        <div className={selectedSlot ? 'col-12 col-xl-8' : 'col-12'}>
          <div className="card border-0 shadow-sm rounded-3 p-4 bg-white d-flex flex-column align-items-center">
            <ParkingMapView
              mode="admin"
              slots={slots}
              currentFloor={selectedFloor}
              onFloorChange={(floor) => {
                setSelectedFloor(floor);
                setSelectedSlot(null);
              }}
              onSlotClick={(slot) => setSelectedSlot(slot)}
              selectedSlotId={selectedSlot?.id}
            />
          </div>
        </div>

        {/* 구획 선택 시 노출되는 우측 세부 설정 패널 */}
        {selectedSlot && (
          <div className="col-12 col-xl-4">
            <div className="card border-0 shadow-sm rounded-3 bg-white p-2">
              <SlotDetailPanel
                slot={selectedSlot}
                onSave={() => { window.alert("관리자 수정 API가 아직 연결되지 않았습니다. 현재 단계는 조회 전용입니다."); }}
                onClose={() => setSelectedSlot(null)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
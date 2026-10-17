/**
 * 관리자 주차현황 페이지.
 * 전체 45개 및 층별 주차구획 통계, 공통 React Konva 도면, 상세 설정 패널을 조립합니다.
 * 공개 GET API로 실시간 현황을 조회하며, 관리자 설정의 DB 저장은 인증된 PATCH API만 사용합니다.
 * 저장 버튼 클릭 전에는 서버 상태를 변경하지 않습니다.
 */
import { useEffect, useMemo, useState } from 'react';
import { fetchAdminParkingSpaces, saveParkingSpace } from '../../../../shared/parking/parkingSpaceApi';
import type { ParkingSpaceDto } from '../../../../shared/parking/parkingSpaceApi';
import { ParkingMapView } from '../../../../shared/parking/ParkingMapView';
import { useParkingStore } from '../../../../shared/parking/useParkingStore';
import { SlotDetailPanel } from './SlotDetailPanel';
import { useParkingSpaceSync } from '../../../../shared/parking/useParkingSpaceSync';

/**
 * [관리자 주차관제 메인 페이지 컴포넌트]
 * 실시간 상태 통계 요약 카드 + 2D Canvas 도면 + 우측 구획 상세설정 패널 제공
 */
/** 학습 해설: 관리자 페이지를 조립합니다. Zustand 훅에서 구획과 선택 상태를 읽고 하위 컴포넌트에 Props를 전달합니다. */
export default function ParkingStatusAdmin() {
  const { refresh } = useParkingSpaceSync(); // 조회는 공개 API 사용, 수정은 로그인 필수
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  /** 관리자 전용 조회 결과는 공용 Zustand에 넣지 않습니다(사용자 화면 노출 방지). */
  const [adminRows, setAdminRows] = useState<ParkingSpaceDto[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let inFlight = false;
    let authorizationMissing = false;

    const loadAdminRows = async () => {
      if (inFlight || authorizationMissing || controller.signal.aborted) return;
      inFlight = true;
      try {
        const rows = await fetchAdminParkingSpaces(controller.signal);
        if (!controller.signal.aborted) setAdminRows(rows);
      } catch (error) {
        if (controller.signal.aborted) return;
        // 관리자 로그인 이전에는 401이 정상: 공개 상태 조회는 계속 사용합니다.
        if (error instanceof Error && error.message.includes('401')) {
          authorizationMissing = true;
        }
        setAdminRows(null);
      } finally {
        inFlight = false;
      }
    };

    void loadAdminRows();
    const timer = window.setInterval(() => { void loadAdminRows(); }, 5000);
    return () => { window.clearInterval(timer); controller.abort(); };
  }, []);

  const {
    selectedFloor,
    setSelectedFloor,
    selectedSlot,
    setSelectedSlot,
    slots,
    syncState,
    syncError,
  } = useParkingStore();

  /** 서버 저장이 성공하기 전에는 로컬 Zustand/도면 상태를 변경하지 않는다. */
  const handleSave = async (input: {
    spaceStatusCode: string; spaceTypeCode: string; memo: string; changeReason: string;
  }) => {
    if (!selectedSlot?.parkingSpaceId) return;
    setSaving(true);
    setSaveError(null);
    setSaveNotice(null);
    try {
      await saveParkingSpace(selectedSlot.parkingSpaceId, input);
      // 관리자 인증 세션으로 다시 읽어 메모까지 표시한다.
      // 로그인 연동이 완성되면 관리자 조회 API로 메모까지 다시 불러온다.
      // 지금은 공개 조회로만 화면 갱신; 저장 자체는 반드시 관리자 세션 필요.
      await refresh();
      setSaveNotice(`${selectedSlot.spaceCode} 구획의 변경사항을 저장했습니다.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSaveError(message.includes('401') ? '관리자 로그인 세션이 없어 저장할 수 없습니다. 로그인 담당 팀원의 연동이 필요합니다.' : message);
    } finally {
      setSaving(false);
    }
  };

  /** 중복 집계 방지: 각 주차구획은 하나의 상태 범주에만 포함합니다. */
  const summarize = (items: typeof slots) => {
    const total = items.length;
    const disabled = items.filter((slot) => slot.status === 'DISABLED' || slot.slotType === 'DISABLED').length;
    const occupied = items.filter((slot) => slot.status !== 'DISABLED' && slot.slotType !== 'DISABLED' && slot.status === 'OCCUPIED').length;
    const reserved = items.filter((slot) => slot.status !== 'DISABLED' && slot.slotType !== 'DISABLED' && slot.status === 'RESERVED').length;
    const available = items.filter((slot) => slot.status === 'EMPTY' && slot.slotType !== 'DISABLED').length;
    const unknown = total - disabled - occupied - reserved - available;
    return { total, occupied, reserved, available, disabled, unknown };
  };

  /** 관리자 차량번호는 관리자 전용 응답에서만 꺼내 도면에 일시적으로 합칩니다. */
  const adminMapSlots = useMemo(() => {
    const byId = new Map((adminRows ?? []).map((row) => [row.parkingSpaceId, row]));
    return slots.map((slot) => {
      const row = slot.parkingSpaceId == null ? undefined : byId.get(slot.parkingSpaceId);
      return {
        ...slot,
        vehicleNumber: slot.status === 'OCCUPIED' && row?.spaceStatusCode === 'OCCUPIED'
          ? (row.vehicleNumber ?? undefined)
          : undefined,
      };
    });
  }, [slots, adminRows]);

  // 전체 45개에 대한 총괄 통계는 선택한 층과 무관합니다.
  const allSummary = summarize(slots);
  const floorSummaries = [1, 2, 3].map((floor) => ({
    floor,
    ...summarize(slots.filter((slot) => slot.floor === floor)),
  }));

  // 지하 1~3층 전체 주차구획 통계. 아래 카드 JSX에서 card.unit을 참조하므로 단위도 함께 선언합니다.
  const cards = [
    { label: '전체 구획', value: allSummary.total, unit: '면', color: 'text-dark' },
    { label: '사용중', value: allSummary.occupied, unit: '면', color: 'text-primary' },
    { label: '예약됨', value: allSummary.reserved, unit: '면', color: 'text-warning' },
    { label: '사용가능', value: allSummary.available, unit: '면', color: 'text-success' },
    { label: '사용불가', value: allSummary.disabled, unit: '면', color: 'text-secondary' },
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
      {saveError && <div role="alert" className="alert alert-danger">{saveError}</div>}
      {saveNotice && <div role="status" className="alert alert-success">{saveNotice}</div>}
      {/* 전체 1~3층 통계: 층 선택과 무관하게 항상 전체 수치를 표시 */}
      <h5 className="fw-semibold mb-3">전체 주차장 현황 <span className="text-muted fs-6">(지하 1~3층 통합)</span></h5>
      <div className="row g-3 mb-4">
        {cards.map((card) => (
          <div key={card.label} className="col-6 col-md-4 col-xl">
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

      {/* 층별 요약 카드: 눌러서 아래 도면의 층도 변경할 수 있습니다. */}
      <h5 className="fw-semibold mb-3">층별 주차현황</h5>
      <div className="row g-3 mb-4">
        {floorSummaries.map((floor) => {
          const isSelected = selectedFloor === floor.floor;
          const availablePercent = floor.total > 0 ? Math.round((floor.available / floor.total) * 100) : 0;
          return (
            <div className="col-12 col-lg-4" key={floor.floor}>
              <button
                type="button"
                className={`card bg-white rounded-3 p-3 w-100 h-100 text-start ${isSelected ? 'border-primary shadow-sm' : 'border-light shadow-sm'}`}
                onClick={() => { setSelectedFloor(floor.floor); setSelectedSlot(null); }}
                aria-pressed={isSelected}
                aria-label={`지하 ${floor.floor}층 도면 보기`}
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-bold">지하 {floor.floor}층</span>
                  <span className="text-muted small">전체 {floor.total}면</span>
                </div>
                <div className="mb-2">
                  <span className="text-success fs-4 fw-bold">{floor.available}</span>
                  <span className="text-muted small ms-2">사용 가능 · {availablePercent}%</span>
                </div>
                <div className="progress mb-2" style={{ height: 7 }} role="progressbar" aria-valuenow={availablePercent} aria-valuemin={0} aria-valuemax={100} aria-label={`지하 ${floor.floor}층 사용 가능 비율`}>
                  <div className="progress-bar bg-success" style={{ width: `${availablePercent}%` }} />
                </div>
                <div className="text-muted small">
                  사용중 {floor.occupied} · 예약 {floor.reserved} · 사용불가 {floor.disabled}
                  {floor.unknown > 0 && ` · 확인필요 ${floor.unknown}`}
                </div>
              </button>
            </div>
          );
        })}
      </div>
      {allSummary.unknown > 0 && (
        <div className="alert alert-warning py-2" role="status">상태 확인이 필요한 주차구획 {allSummary.unknown}면이 있습니다.</div>
      )}

      <h5 className="fw-semibold mb-3">주차장 상세 도면 <span className="text-muted fs-6">(지하 {selectedFloor}층)</span></h5>
      {/* 관제 메인 레이아웃: [2D Map] + [우측 설정 패널] */}
      <div className="row g-4 align-items-start">
        <div className={selectedSlot ? 'col-12 col-xl-8' : 'col-12'}>
          <div className="card border-0 shadow-sm rounded-3 p-4 bg-white d-flex flex-column align-items-center">
            <ParkingMapView
              mode="admin"
              slots={adminMapSlots}
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
                onSave={handleSave}
                saving={saving}
                onClose={() => setSelectedSlot(null)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
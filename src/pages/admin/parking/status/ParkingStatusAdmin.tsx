/**
 * 관리자 주차현황 페이지.
 * 전체 45개 및 층별 주차구획 통계, 공통 React Konva 도면, 상세 설정 패널을 조립합니다.
 * 공개 GET API로 실시간 현황을 조회하며, 관리자 설정의 DB 저장은 인증된 PATCH API만 사용합니다.
 * 저장 버튼 클릭 전에는 서버 상태를 변경하지 않습니다.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  fetchAdminParkingSpaces,
  saveParkingSpace,
  fetchParkingReservations,
  fetchUpcomingParkingReservations,
  parkingToday,
} from '../../../../shared/parking/parkingSpaceApi';
import type {
  ParkingSpaceDto,
  ParkingCorrectionInput,
} from '../../../../shared/parking/parkingSpaceApi';
import { ParkingMapView } from '../../../../shared/parking/ParkingMapView';
import { useParkingStore } from '../../../../shared/parking/useParkingStore';
import { SlotDetailPanel } from './SlotDetailPanel';
import { useParkingSpaceSync } from '../../../../shared/parking/useParkingSpaceSync';
import './ParkingDashboard.css';

/**
 * [관리자 주차관제 메인 페이지 컴포넌트]
 * 실시간 상태 통계 요약 카드 + 2D Canvas 도면 + 우측 구획 상세설정 패널 제공
 */
/** 학습 해설: 관리자 페이지를 조립합니다. Zustand 훅에서 구획과 선택 상태를 읽고 하위 컴포넌트에 Props를 전달합니다. */
export default function ParkingStatusAdmin() {
  const { refresh } = useParkingSpaceSync('admin');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  /** 관리자 전용 조회 결과는 공용 Zustand에 넣지 않습니다(사용자 화면 노출 방지). */
  const [adminRows, setAdminRows] = useState<ParkingSpaceDto[] | null>(null);
  const [adminReloadVersion, setAdminReloadVersion] = useState(0);
  const [reservationCounts, setReservationCounts] = useState<Record<number, number>>({});
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [reservationLoading, setReservationLoading] = useState(true);
  const [todayReservations, setTodayReservations] = useState<{
    date: string;
    count: number | null;
    bySpace: Record<number, number>;
    error: string | null;
  }>(() => ({ date: parkingToday(), count: null, bySpace: {}, error: null }));

  // 상단 카드는 도면에서 선택한 날짜와 무관하게 한국 시간의 오늘 예약을 집계한다.
  useEffect(() => {
    const controller = new AbortController();
    let inFlight = false;
    const load = async () => {
      if (inFlight || controller.signal.aborted) return;
      inFlight = true;
      const date = parkingToday();
      setTodayReservations((previous) =>
        previous.date === date
          ? previous
          : { date, count: null, bySpace: {}, error: null },
      );
      try {
        const rows = await fetchParkingReservations(date, controller.signal);
        if (!controller.signal.aborted && parkingToday() === date) {
          const bySpace: Record<number, number> = {};
          rows.forEach((row) => {
            bySpace[row.parkingSpaceId] = (bySpace[row.parkingSpaceId] ?? 0) + 1;
          });
          setTodayReservations({ date, count: rows.length, bySpace, error: null });
        }
      } catch (cause) {
        if (!controller.signal.aborted && parkingToday() === date) {
          setTodayReservations({
            date,
            count: null,
            bySpace: {},
            error: cause instanceof Error ? cause.message : '예약 조회 실패',
          });
        }
      } finally {
        inFlight = false;
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 30000);
    const onFocus = () => void load();
    window.addEventListener('focus', onFocus);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let inFlight = false;
    setReservationCounts({});
    setReservationLoading(true);
    setReservationError(null);
    const load = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const rows = await fetchUpcomingParkingReservations(controller.signal);
        if (!controller.signal.aborted) {
          const counts: Record<number, number> = {};
          rows.forEach((row) => {
            counts[row.parkingSpaceId] = (counts[row.parkingSpaceId] ?? 0) + 1;
          });
          setReservationCounts(counts);
          setReservationError(null);
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setReservationCounts({});
          setReservationError(cause instanceof Error ? cause.message : '예약 조회 실패');
        }
      } finally {
        inFlight = false;
        if (!controller.signal.aborted) setReservationLoading(false);
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 30000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let inFlight = false;

    const loadAdminRows = async () => {
      if (inFlight || controller.signal.aborted) return;
      inFlight = true;
      try {
        const rows = await fetchAdminParkingSpaces(controller.signal);
        if (!controller.signal.aborted) setAdminRows(rows);
      } catch {
        if (controller.signal.aborted) return;
        setAdminRows(null);
      } finally {
        inFlight = false;
      }
    };

    void loadAdminRows();
    const timer = window.setInterval(() => {
      void loadAdminRows();
    }, 5000);
    return () => {
      window.clearInterval(timer);
      controller.abort();
    };
  }, [adminReloadVersion]);

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
  const handleSave = async (input: ParkingCorrectionInput) => {
    if (!selectedSlot?.parkingSpaceId) throw new Error('구획을 다시 선택해 주세요.');
    const spaceId = selectedSlot.parkingSpaceId;
    const spaceCode = selectedSlot.spaceCode;
    setSaving(true);
    setSaveError(null);
    setSaveNotice(null);
    try {
      await saveParkingSpace(spaceId, input);
      setSaveNotice(`${spaceCode} 구획의 보정 내용과 변경 사유를 저장했습니다.`);
      setAdminReloadVersion((version) => version + 1);
      try {
        await refresh();
      } catch {
        // 저장 성공과 이후 조회 실패를 구분해 중복 출차 요청을 방지한다.
        setSaveError(
          '보정 내용은 저장되었지만 도면 재조회에 실패했습니다. 최신 기록을 다시 조회해 주세요.',
        );
      }
    } finally {
      setSaving(false);
    }
  };

  /** 중복 집계 방지: 각 주차구획은 하나의 상태 범주에만 포함합니다. */
  const summarize = (items: typeof slots) => {
    const total = items.length;
    const disabled = items.filter(
      (slot) => slot.status === 'DISABLED' || slot.slotType === 'DISABLED',
    ).length;
    const occupied = items.filter(
      (slot) =>
        slot.status !== 'DISABLED' &&
        slot.slotType !== 'DISABLED' &&
        slot.status === 'OCCUPIED',
    ).length;
    const reserved = items.filter(
      (slot) =>
        slot.status !== 'DISABLED' &&
        slot.slotType !== 'DISABLED' &&
        slot.status === 'RESERVED',
    ).length;
    const available = items.filter(
      (slot) => slot.status === 'EMPTY' && slot.slotType !== 'DISABLED',
    ).length;
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
        memo: row?.memo ?? undefined,
        vehicleNumber:
          slot.status === 'OCCUPIED' && row?.spaceStatusCode === 'OCCUPIED'
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
    todayReservationCount: slots
      .filter((slot) => slot.floor === floor)
      .reduce(
        (count, slot) =>
          count + (todayReservations.bySpace[slot.parkingSpaceId ?? -1] ?? 0),
        0,
      ),
  }));

  // 지하 1~3층 전체 주차구획 통계. 아래 카드 JSX에서 card.unit을 참조하므로 단위도 함께 선언합니다.
  const cards = [
    { label: '전체 구획', value: allSummary.total, unit: '면', tone: 'total' },
    { label: '사용중', value: allSummary.occupied, unit: '면', tone: 'occupied' },
    { label: '오늘 예약', value: todayReservations.count, unit: '건', tone: 'reserved' },
    { label: '사용가능', value: allSummary.available, unit: '면', tone: 'available' },
    { label: '사용불가', value: allSummary.disabled, unit: '면', tone: 'disabled' },
  ];

  return (
    <div className="parking-admin">
      <header className="parking-admin-header">
        <div className="parking-admin-heading">
          <span className="parking-admin-mark" aria-hidden="true">
            P
          </span>
          <div>
            <p className="parking-admin-eyebrow">주차관제</p>
            <h2>실시간 주차현황</h2>
            <p className="parking-admin-description">
              구획별 상태를 확인하고 필요한 내용을 보정하세요.
            </p>
          </div>
        </div>
        <span
          className={`parking-connection parking-connection--${syncState}`}
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
      {saveError && (
        <div role="alert" className="alert alert-warning">
          {saveError}
        </div>
      )}
      {saveNotice && (
        <div role="status" className="alert alert-success">
          {saveNotice}
        </div>
      )}
      <section className="parking-admin-section" aria-labelledby="parking-overview-title">
        <div className="parking-section-heading">
          <h3 id="parking-overview-title">전체 주차장 현황</h3>
          <span>지하 1–3층 통합</span>
        </div>
        <div className="parking-stats-grid">
          {cards.map((card) => (
            <div className={`parking-stat parking-stat--${card.tone}`} key={card.label}>
              <div className="parking-stat-label">
                <i aria-hidden="true" />
                {card.label}
              </div>
              <div
                className="parking-stat-value"
                title={
                  card.tone === 'reserved'
                    ? (todayReservations.error ??
                      `${todayReservations.date} · 취소 제외 확정 예약 건수 (한국 시간)`)
                    : undefined
                }
              >
                {card.tone === 'reserved' &&
                (todayReservations.date !== parkingToday() ||
                  todayReservations.error ||
                  card.value == null) ? (
                  <span className="parking-stat-message" role="status">
                    {todayReservations.date === parkingToday() && todayReservations.error
                      ? '조회 실패'
                      : '조회 중…'}
                  </span>
                ) : (
                  <>
                    {card.value}
                    <span>{card.unit}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {allSummary.unknown > 0 && (
        <div className="alert alert-warning" role="status">
          상태 확인이 필요한 주차구획 {allSummary.unknown}면이 있습니다.
        </div>
      )}

      <div className={`parking-workspace${selectedSlot ? ' has-panel' : ''}`}>
        <section className="parking-floor-sidebar" aria-labelledby="parking-floors-title">
          <div className="parking-section-heading">
            <h3 id="parking-floors-title">층별 주차현황</h3>
            <span>층을 선택하면 도면이 바뀝니다.</span>
          </div>
          <div className="parking-floors-grid">
            {floorSummaries.map((floor) => {
              const isSelected = selectedFloor === floor.floor;
              const availablePercent =
                floor.total > 0 ? Math.round((floor.available / floor.total) * 100) : 0;
              return (
                <button
                  type="button"
                  key={floor.floor}
                  disabled={saving}
                  className={`parking-floor-card${isSelected ? ' is-selected' : ''}`}
                  onClick={() => {
                    setSelectedFloor(floor.floor);
                    setSelectedSlot(null);
                  }}
                  aria-pressed={isSelected}
                  aria-label={`지하 ${floor.floor}층 도면 보기`}
                >
                  <div className="parking-floor-card-heading">
                    <strong>지하 {floor.floor}층</strong>
                    <span>{isSelected ? '선택됨' : `전체 ${floor.total}면`}</span>
                  </div>
                  <div className="parking-floor-card-count">
                    <strong>{floor.available}</strong>
                    <span>/ {floor.total}면 사용가능</span>
                  </div>
                  <div
                    className="parking-floor-progress"
                    role="progressbar"
                    aria-valuenow={availablePercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`지하 ${floor.floor}층 사용가능 비율`}
                  >
                    <span style={{ width: `${availablePercent}%` }} />
                  </div>
                  <div className="parking-floor-card-summary">
                    <span>
                      사용중 <b>{floor.occupied}</b>
                    </span>
                    <span>
                      오늘 예약{' '}
                      <b
                        title={
                          todayReservations.error ??
                          `${todayReservations.date} · 취소 제외 확정 예약 건수 (한국 시간)`
                        }
                      >
                        {todayReservations.date !== parkingToday()
                          ? '조회 중…'
                          : todayReservations.error
                            ? '조회 실패'
                            : todayReservations.count == null || slots.length === 0
                              ? '조회 중…'
                              : `${floor.todayReservationCount}건`}
                      </b>
                    </span>
                    <span>
                      사용불가 <b>{floor.disabled}</b>
                    </span>
                    {floor.unknown > 0 && (
                      <span>
                        확인필요 <b>{floor.unknown}</b>
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
        <section className="parking-map-card" aria-labelledby="parking-map-title">
          <div className="parking-section-heading">
            <div>
              <h3 id="parking-map-title">주차장 상세 도면</h3>
              <p>배경색은 상태, 아이콘은 구획 종류를 나타냅니다.</p>
            </div>
            <span className="parking-floor-tag">지하 {selectedFloor}층</span>
          </div>
          <div className="parking-map-card-body">
            {reservationLoading && (
              <p className="parking-map-hint" role="status">
                예약 표시를 불러오는 중입니다.
              </p>
            )}
            {reservationError && (
              <p className="parking-map-hint" role="alert">
                달력 표시 조회 실패: {reservationError}
              </p>
            )}
            <ParkingMapView
              mode="admin"
              slots={adminMapSlots}
              currentFloor={selectedFloor}
              onFloorChange={(floor) => {
                if (!saving) {
                  setSelectedFloor(floor);
                  setSelectedSlot(null);
                }
              }}
              onSlotClick={(slot) => {
                if (!saving) setSelectedSlot(slot);
              }}
              selectedSlotId={selectedSlot?.id}
              reservationCounts={
                reservationError || reservationLoading ? undefined : reservationCounts
              }
            />
          </div>
        </section>
        {selectedSlot && (
          <aside className="parking-panel-card" aria-label="선택한 구획 관리">
            <SlotDetailPanel
              key={selectedSlot.id}
              slot={selectedSlot}
              onSave={handleSave}
              saving={saving}
              onClose={() => setSelectedSlot(null)}
            />
          </aside>
        )}
      </div>
    </div>
  );
}

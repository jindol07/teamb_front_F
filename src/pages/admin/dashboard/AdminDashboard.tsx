/** 관리자 대시보드: 통계·차량 신청은 읽기 전용, 주차현황은 기존 실시간 구독을 공유한다. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { VehicleChangeRequestDTO } from '../../../api/vehicleApi';
import {
  fetchParkingReservations,
  parkingToday,
} from '../../../shared/parking/parkingSpaceApi';
import { useParkingSpaceSync } from '../../../shared/parking/useParkingSpaceSync';
import { useParkingStore } from '../../../shared/parking/useParkingStore';
import {
  dashboardError,
  fetchDailyParkingSummary,
  fetchDashboardVehicleRequests,
  fetchRecentParkingEvents,
} from './dashboardApi';
import type {
  DailyParkingSummaryRow,
  DashboardPeriod,
  DashboardParkingEventRow,
} from './dashboardApi';
import SummaryCards from './SummaryCards';
import VehicleBarChart from './VehicleBarChart';
import VehicleRequestPanel from './VehicleRequestPanel';
import RiskAlertPanel from './RiskAlertPanel';
import ParkingUsagePanel from './ParkingUsagePanel';
import styles from './AdminDashboard.module.css';

export default function AdminDashboard() {
  const { refresh } = useParkingSpaceSync('admin');
  const slots = useParkingStore((state) => state.slots);
  const syncState = useParkingStore((state) => state.syncState);
  const syncError = useParkingStore((state) => state.syncError);
  const lastSyncedAt = useParkingStore((state) => state.lastSyncedAt);
  const [reload, setReload] = useState(0);
  const [period, setPeriod] = useState<DashboardPeriod>('week');
  const [statistics, setStatistics] = useState<DailyParkingSummaryRow[]>([]);
  const [statisticsLoading, setStatisticsLoading] = useState(true);
  const [statisticsError, setStatisticsError] = useState<string | null>(null);
  const [requests, setRequests] = useState<VehicleChangeRequestDTO[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [events, setEvents] = useState<DashboardParkingEventRow[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [reservations, setReservations] = useState<{
    date: string;
    count: number | null;
    error: string | null;
  }>(() => ({ date: parkingToday(), count: null, error: null }));
  const [operationalLoading, setOperationalLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setStatisticsLoading(true);
    setStatisticsError(null);

    // 기간 전환 시 이전 통계 요청을 취소한다. 신청·입출차 폴링은 다시 시작하지 않는다.
    void fetchDailyParkingSummary(period, controller.signal)
      .then((rows) => {
        if (!controller.signal.aborted) setStatistics(rows);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setStatisticsError(dashboardError(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setStatisticsLoading(false);
      });
    return () => controller.abort();
  }, [period, reload]);

  useEffect(() => {
    const controller = new AbortController();
    let inFlight = false;
    setRequestsLoading(true);
    setRequestsError(null);
    setEventsLoading(true);
    setEventsError(null);

    const loadOperational = async () => {
      if (inFlight || controller.signal.aborted) return;
      inFlight = true;
      setOperationalLoading(true);
      const date = parkingToday();
      // 자정이 지나면 전날 예약 건수를 오늘 값처럼 표시하지 않는다.
      setReservations((previous) =>
        previous.date === date ? previous : { date, count: null, error: null },
      );
      try {
        await Promise.all([
          fetchRecentParkingEvents(controller.signal)
            .then((rows) => {
              if (!controller.signal.aborted) {
                setEvents(rows);
                setEventsError(null);
              }
            })
            .catch((error: unknown) => {
              if (!controller.signal.aborted) setEventsError(dashboardError(error));
            })
            .finally(() => {
              if (!controller.signal.aborted) setEventsLoading(false);
            }),
          fetchDashboardVehicleRequests(controller.signal)
            .then((rows) => {
              if (controller.signal.aborted) return;
              setRequests(
                rows.filter(
                  (row) =>
                    row.requesttypecode === 'ADD' &&
                    row.requeststatuscode === 'REQUESTED',
                ),
              );
              setRequestsError(null);
            })
            .catch((error: unknown) => {
              if (!controller.signal.aborted) setRequestsError(dashboardError(error));
            })
            .finally(() => {
              if (!controller.signal.aborted) setRequestsLoading(false);
            }),
          fetchParkingReservations(date, controller.signal)
            .then((rows) => {
              if (!controller.signal.aborted && parkingToday() === date) {
                setReservations({ date, count: rows.length, error: null });
              }
            })
            .catch((error: unknown) => {
              if (!controller.signal.aborted && parkingToday() === date) {
                setReservations({ date, count: null, error: dashboardError(error) });
              }
            }),
        ]);
      } finally {
        inFlight = false;
        if (!controller.signal.aborted) setOperationalLoading(false);
      }
    };
    void loadOperational();
    // 구획은 공통 소켓이 갱신한다. 이 타이머는 신청·입출차·오늘 예약만 보완한다.
    const timer = window.setInterval(() => {
      if (!document.hidden) void loadOperational();
    }, 30000);
    const onFocus = () => {
      void loadOperational();
    };
    window.addEventListener('focus', onFocus);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [reload]);

  const handleRefresh = () => {
    setReload((version) => version + 1);
    void refresh().catch(() => {
      /* 오류는 공통 스토어에서 표시한다. */
    });
  };

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>관리자 운영 현황</span>
          <h1>대시보드</h1>
          <p>주차 현황과 처리할 신청을 한눈에 확인하세요.</p>
        </div>
        <button
          type="button"
          className={styles.refreshButton}
          onClick={handleRefresh}
          disabled={statisticsLoading || operationalLoading}
        >
          {statisticsLoading || operationalLoading ? '조회 중…' : '새로고침'}
        </button>
      </header>

      <section aria-labelledby="dashboard-parking-title">
        <div className={styles.sectionHeading}>
          <h2 id="dashboard-parking-title">실시간 주차현황</h2>
          <Link to="/admin/parking">도면 보기 →</Link>
        </div>
        <SummaryCards
          slots={slots}
          ready={syncState === 'ready'}
          todayReservations={reservations.count}
          reservationDate={reservations.date}
          reservationError={reservations.error}
        />
        <div className={styles.syncNote} role="status">
          {syncState === 'error' ? (
            <span className={styles.errorText}>
              {syncError ?? '주차현황을 조회하지 못했습니다.'}
            </span>
          ) : lastSyncedAt ? (
            `최근 현황 조회 ${lastSyncedAt}`
          ) : (
            '주차현황을 불러오고 있습니다.'
          )}
        </div>
      </section>

      <VehicleBarChart
        rows={statistics}
        loading={statisticsLoading}
        error={statisticsError}
        period={period}
        onPeriodChange={setPeriod}
      />
      <div className={styles.listGrid}>
        <VehicleRequestPanel
          requests={requests}
          loading={requestsLoading}
          error={requestsError}
        />
        <ParkingUsagePanel events={events} loading={eventsLoading} error={eventsError} />
        <RiskAlertPanel />
      </div>
    </div>
  );
}

/** 파일 안내
 * 용도: 주차현황, 일별 통계, 차량 추가 신청, 최근 입출차와 위험알림 영역을 조립하는 관리자 첫 화면.
 * 직접 사용처: AdminRouter의 dashboard 경로.
 * 구획은 useParkingSpaceSync의 공통 연결을 사용하고 통계·신청·입출차·오늘 예약은 각 조회 API에서 받는다.
 * 통계의 주간·월간은 최근 7일·30일이다. 신청·입출차·오늘 예약·위험알림은 30초 주기와 화면 복귀 시 갱신한다.
 * 목록은 읽기 전용이다. 위험알림 상세 조회 성공 뒤 해당 알림만 읽음 처리하며 사건 상태는 변경하지 않는다.
 */
import { useCallback, useEffect, useState } from 'react';
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
  fetchDashboardSafetyAlerts,
} from './dashboardApi';
import type {
  DailyParkingSummaryRow,
  DashboardPeriod,
  DashboardParkingEventRow,
  DashboardSafetyAlert,
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
  const [alerts, setAlerts] = useState<DashboardSafetyAlert[] | null>(null);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const [incidentError, setIncidentError] = useState<string | null>(null);
  const [alertsVersion, setAlertsVersion] = useState(0);
  const [reservations, setReservations] = useState<{
    date: string;
    count: number | null;
    error: string | null;
  }>(() => ({ date: parkingToday(), count: null, error: null }));
  const [operationalLoading, setOperationalLoading] = useState(true);

  // 통계 기간만 바뀌면 차트 요청만 다시 실행하고, 이전 기간의 응답은 취소한다.
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

  // 여러 목록의 성공·실패를 분리해 한 API 장애가 다른 목록을 숨기지 않도록 한다.
  useEffect(() => {
    const controller = new AbortController();
    let inFlight = false;
    setRequestsLoading(true);
    setRequestsError(null);
    setEventsLoading(true);
    setEventsError(null);
    setAlertsLoading(true);

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
          fetchDashboardSafetyAlerts(controller.signal)
            .then((result) => {
              if (controller.signal.aborted) return;
              setAlerts(result.alerts);
              setAlertsVersion((version) => version + 1);
              setIncidentError(result.incidentError);
              setAlertsError(null);
            })
            .catch((error: unknown) => {
              if (!controller.signal.aborted) setAlertsError(dashboardError(error));
            })
            .finally(() => {
              if (!controller.signal.aborted) setAlertsLoading(false);
            }),
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
    // 구획은 공통 소켓이 갱신한다. 이 타이머는 신청·입출차·오늘 예약·위험알림을 보완한다.
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

  // 읽음 PATCH의 성공 응답을 확인한 알림만 갱신한다. 이 로컬 갱신으로 상세 GET을 재실행하지 않는다.
  const handleAlertRead = useCallback((notificationId: number) => {
    setAlerts((previous) => previous?.map((alert) =>
      alert.notificationId === notificationId ? { ...alert, read: true } : alert,
    ) ?? null);
  }, []);

  // 수동 갱신은 목록 effect를 다시 시작하고 공통 구획 현황도 별도로 조회한다.
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
        <RiskAlertPanel
          alerts={alerts}
          loading={alertsLoading}
          error={alertsError}
          incidentError={incidentError}
          refreshVersion={alertsVersion}
          onRead={handleAlertRead}
        />
      </div>
    </div>
  );
}

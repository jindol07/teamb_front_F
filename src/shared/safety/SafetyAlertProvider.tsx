/** 파일 안내
 * 용도: 관리자 모든 페이지에서 위험알림을 한 번만 조회하고 모달·대시보드에 공유한다.
 * 직접 사용처: AdminLayout, GlobalSafetyAlert, RiskAlertPanel.
 * 최근 100건을 5초마다 조회한다. 동일 사건은 묶고, 상세 성공 뒤에만 읽음 처리한다.
 * 업무 상태는 명시적 버튼으로만 변경한다. 계정 변경·종료 때 요청과 타이머를 정리한다.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { getAccessToken, getAuthScope } from '../../api/axios';
import {
  changeSafetyIncidentStatus,
  fetchDashboardSafetyIncident,
  fetchSafetyAlerts,
  markDashboardSafetyAlertRead,
  safetyAuthorizationError,
  safetyError,
} from './safetyAlertApi';
import type {
  DashboardSafetyAlert,
  DashboardSafetyIncident,
  SafetyTargetStatus,
} from './safetyAlertApi';

interface SafetyContextValue {
  alerts: DashboardSafetyAlert[] | null;
  loading: boolean;
  error: string | null;
  incidentError: string | null;
  groups: DashboardSafetyAlert[];
  selectedId: number | null;
  detail: DashboardSafetyIncident | null;
  detailLoading: boolean;
  detailError: string | null;
  readError: string | null;
  saving: boolean;
  actionError: string | null;
  open: (incidentId: number) => void;
  close: () => void;
  refresh: () => void;
  retryDetail: () => void;
  changeStatus: (status: SafetyTargetStatus) => Promise<boolean>;
}
const SafetyContext = createContext<SafetyContextValue | null>(null);

// 계정 식별에만 사용한다. 서명·실제 권한은 서버가 검증하며 토큰 갱신만으로 화면을 초기화하지 않는다.
function currentAccount(): string | null {
  if (getAuthScope() !== 'admin') return null;
  try {
    const encoded = getAccessToken()?.split('.')[1];
    if (!encoded) return null;
    const part = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(part.padEnd(Math.ceil(part.length / 4) * 4, '=')));
    return payload.role === 'ADMIN' && typeof payload.sub === 'string'
      ? payload.sub
      : null;
  } catch {
    return null;
  }
}

export function SafetyAlertProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState(currentAccount);
  const [alerts, setAlerts] = useState<DashboardSafetyAlert[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [incidentError, setIncidentError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<DashboardSafetyIncident | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [detailRetry, setDetailRetry] = useState(0);
  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;
  const presented = useRef(new Set<number>());
  const revision = useRef(0);
  const loadRef = useRef<() => void>(() => {});
  const mutation = useRef<AbortController | null>(null);
  const savingRef = useRef(false);
  const blocked = useRef(false);

  useEffect(() => {
    const onAuth = () => {
      blocked.current = false;
      setAccount(currentAccount());
      loadRef.current();
    };
    window.addEventListener('parking-auth-changed', onAuth);
    window.addEventListener('storage', onAuth);
    return () => {
      window.removeEventListener('parking-auth-changed', onAuth);
      window.removeEventListener('storage', onAuth);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let inFlight = false;
    presented.current.clear();
    blocked.current = false;
    revision.current += 1;
    mutation.current?.abort();
    savingRef.current = false;
    setSaving(false);
    setAlerts(null);
    setSelectedId(null);
    setDetail(null);
    setError(null);
    setIncidentError(null);
    setLoading(account !== null);
    const load = async () => {
      if (
        !account ||
        currentAccount() !== account ||
        inFlight ||
        blocked.current ||
        controller.signal.aborted
      )
        return;
      inFlight = true;
      const version = revision.current;
      try {
        const result = await fetchSafetyAlerts(controller.signal);
        if (
          controller.signal.aborted ||
          currentAccount() !== account ||
          version !== revision.current
        )
          return;
        setAlerts(result.alerts);
        setIncidentError(result.incidentError);
        setError(null);
        // 목록의 최신 업무 상태를 열린 상세에도 반영한다. 상세 전용 메모·위치는 보존한다.
        setDetail((previous) => {
          const summary = result.alerts.find(
            (a) => a.incidentId === previous?.incidentId,
          )?.incident;
          return previous && summary
            ? {
                ...previous,
                status: summary.status,
                risk: summary.risk,
                detectionCount: summary.detectionCount,
                lastDetectedAt: summary.lastDetectedAt,
              }
            : previous;
        });
      } catch (cause) {
        if (!controller.signal.aborted && currentAccount() === account) {
          setError(safetyError(cause));
          if (safetyAuthorizationError(cause)) {
            blocked.current = true;
            setAlerts(null);
            setSelectedId(null);
            setDetail(null);
          }
        }
      } finally {
        inFlight = false;
        if (!controller.signal.aborted && currentAccount() === account) setLoading(false);
      }
    };
    loadRef.current = () => void load();
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    const onFocus = () => void load();
    window.addEventListener('focus', onFocus);
    return () => {
      controller.abort();
      mutation.current?.abort();
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      loadRef.current = () => {};
    };
  }, [account]);

  // 최신 알림 하나를 사건별 대표로 선택한다. 읽음 상태는 완료 여부와 무관하다.
  const groups = useMemo(() => {
    const byIncident = new Map<number, DashboardSafetyAlert>();
    for (const alert of alerts ?? []) {
      const previous = byIncident.get(alert.incidentId);
      if (!previous || alert.notificationId > previous.notificationId)
        byIncident.set(alert.incidentId, alert);
    }
    return [...byIncident.values()]
      .filter((a) => a.incident?.status !== 'RESOLVED')
      .sort(
        (a, b) =>
          Number(b.incident?.risk === 'HIGH') - Number(a.incident?.risk === 'HIGH') ||
          b.notificationId - a.notificationId,
      );
  }, [alerts]);

  useEffect(() => {
    if (!account || selectedId !== null || saving) return;
    const next = groups.find((alert) => !presented.current.has(alert.incidentId));
    if (next) {
      presented.current.add(next.incidentId);
      setSelectedId(next.incidentId);
    }
  }, [account, groups, selectedId, saving]);

  const open = useCallback((id: number) => {
    if (savingRef.current || !currentAccount()) return;
    const alert = alertsRef.current?.find((a) => a.incidentId === id);
    if (alert) presented.current.add(alert.incidentId);
    setSelectedId(id);
    setDetailRetry((n) => n + 1);
  }, []);
  const close = useCallback(() => {
    if (savingRef.current) return;
    // 현재 수신한 모든 사건을 접는다. 같은 사건의 재알림은 접힌 상태를 유지하고 새 사건만 자동 표시한다.
    for (const alert of alertsRef.current ?? []) presented.current.add(alert.incidentId);
    setSelectedId(null);
  }, []);
  const refresh = useCallback(() => loadRef.current(), []);
  const retryDetail = useCallback(() => setDetailRetry((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setDetail(null);
    setDetailError(null);
    setReadError(null);
    setActionError(null);
    if (selectedId === null || !account) {
      setDetailLoading(false);
      return;
    }
    setDetailLoading(true);
    void (async () => {
      try {
        const result = await fetchDashboardSafetyIncident(selectedId, controller.signal);
        if (controller.signal.aborted || currentAccount() !== account) return;
        setDetail(result);
        setAlerts(
          (previous) =>
            previous?.map((a) =>
              a.incidentId === selectedId ? { ...a, incident: result } : a,
            ) ?? null,
        );
        // 상세 조회 성공 후 같은 사건의 본인 미읽음 알림만 읽음 처리한다. 사건 업무 상태는 변경하지 않는다.
        const unread = (alertsRef.current ?? []).filter(
          (a) => a.incidentId === selectedId && !a.read,
        );
        const readResults = await Promise.allSettled(
          unread.map(async (a) => {
            await markDashboardSafetyAlertRead(a.notificationId, controller.signal);
            return a.notificationId;
          }),
        );
        if (controller.signal.aborted || currentAccount() !== account) return;
        revision.current += 1;
        const readIds = new Set(
          readResults.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])),
        );
        setAlerts(
          (previous) =>
            previous?.map((a) =>
              readIds.has(a.notificationId) ? { ...a, read: true } : a,
            ) ?? null,
        );
        if (readResults.some((r) => r.status === 'rejected'))
          setReadError(
            '일부 알림을 읽음 처리하지 못했습니다. 상세를 다시 조회해 주세요.',
          );
      } catch (cause) {
        if (!controller.signal.aborted && currentAccount() === account)
          setDetailError(safetyError(cause));
      } finally {
        if (!controller.signal.aborted && currentAccount() === account)
          setDetailLoading(false);
      }
    })();
    return () => controller.abort();
  }, [selectedId, detailRetry, account]);

  const changeStatus = useCallback(
    async (status: SafetyTargetStatus) => {
      if (
        selectedId === null ||
        !detail ||
        detail.incidentId !== selectedId ||
        savingRef.current ||
        !account ||
        currentAccount() !== account
      )
        return false;
      const controller = new AbortController();
      mutation.current = controller;
      savingRef.current = true;
      revision.current += 1;
      setSaving(true);
      setActionError(null);
      try {
        const result = await changeSafetyIncidentStatus(
          selectedId,
          status,
          controller.signal,
        );
        if (controller.signal.aborted || currentAccount() !== account) return false;
        revision.current += 1;
        setDetail((previous) =>
          previous?.incidentId === selectedId ? { ...previous, ...result } : previous,
        );
        setAlerts(
          (previous) =>
            previous?.map((a) =>
              a.incidentId === selectedId && a.incident
                ? { ...a, incident: { ...a.incident, ...result } }
                : a,
            ) ?? null,
        );
        return true;
      } catch (cause) {
        if (!controller.signal.aborted && currentAccount() === account) {
          setActionError(safetyError(cause));
          // 다른 관리자와의 충돌·응답 불명확 시 GET으로 실제 상태를 재확인한다.
          try {
            const latest = await fetchDashboardSafetyIncident(
              selectedId,
              controller.signal,
            );
            if (!controller.signal.aborted && currentAccount() === account) {
              revision.current += 1;
              setDetail(latest);
              setAlerts(
                (previous) =>
                  previous?.map((a) =>
                    a.incidentId === selectedId ? { ...a, incident: latest } : a,
                  ) ?? null,
              );
            }
          } catch {
            /* 원래 저장 오류를 유지한다. */
          }
        }
        return false;
      } finally {
        if (!controller.signal.aborted && currentAccount() === account) {
          savingRef.current = false;
          setSaving(false);
          mutation.current = null;
        }
      }
    },
    [selectedId, detail, account],
  );

  return (
    <SafetyContext.Provider
      value={{
        alerts,
        loading,
        error,
        incidentError,
        groups,
        selectedId,
        detail,
        detailLoading,
        detailError,
        readError,
        saving,
        actionError,
        open,
        close,
        refresh,
        retryDetail,
        changeStatus,
      }}
    >
      {children}
    </SafetyContext.Provider>
  );
}

export function useSafetyAlerts() {
  const value = useContext(SafetyContext);
  if (!value) throw new Error('관리자 위험알림 Provider가 필요합니다.');
  return value;
}

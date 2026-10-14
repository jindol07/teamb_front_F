/**
 * 주차구획 목록을 공개 GET API에서 조회하여 공용 Zustand 캐시에 저장합니다.
 * 초기 진입 직후 조회하고 이후 5초마다 갱신합니다.
 * 관리자 전용 API는 관리자 백엔드 세션 인증이 연결될 때 별도로 전환해야 합니다.
 */
import { useCallback, useEffect } from 'react';
import { fetchPublicParkingSpaces } from './parkingSpaceApi';
import { useParkingStore } from './useParkingStore';

export function useParkingSpaceSync() {
  const startSync = useParkingStore((s) => s.startSync);
  const failSync = useParkingStore((s) => s.failSync);
  const replaceFromServer = useParkingStore((s) => s.replaceFromServer);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    startSync();
    try {
      const rows = await fetchPublicParkingSpaces(signal);
      if (signal?.aborted) return;
      if (!Array.isArray(rows)) throw new Error('API 응답이 배열이 아닙니다.');
      replaceFromServer(rows);  // 좌표 검증/중복 검증도 여기서 실행됨
    } catch (error) {
      if (signal?.aborted) return;
      failSync(error instanceof Error ? error.message : String(error));
      // 호출부에서도 재조회 실패를 알 수 있도록 전달합니다.
      throw error;
    }
  }, [startSync, failSync, replaceFromServer]);

  useEffect(() => {
    const controller = new AbortController();
    let inFlight = false;
    const load = async () => {
      if (inFlight) return;
      inFlight = true;
      try { await refresh(controller.signal); }
      catch { /* 오류 정보는 Zustand syncError에 기록됩니다. */ }
      finally { inFlight = false; }
    };
    void load();
    const timer = window.setInterval(() => { void load(); }, 5000);
    return () => { window.clearInterval(timer); controller.abort(); };
  }, [refresh]);

  return { refresh: () => refresh() };
}

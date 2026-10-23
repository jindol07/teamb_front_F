/** [1023_1010] 파일 안내
 * 용도: 최근 입출차 목록과 전체 미출차 차량 집계를 보여 주는 조회 화면.
 * 직접 사용처: AdminRouter의 parking-usage 경로.
 * parkingUsageApi로 최근 기록과 현재 입차 목록을 따로 조회한다. 최근 목록 제한과 현재 입차 수를 혼동하지 않는다.
 * 5초마다 보이는 문서에서 갱신하고 수동 갱신을 제공한다. 입출차 변경은 이 화면에서 수행하지 않는다.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchActiveParkingUsages, fetchParkingUsages, type ParkingUsage } from './parkingUsageApi';

/** 관리자 조회 전용. 입차/출차/주차 위치는 AI 이벤트에서 자동으로 반영됩니다. */
export default function ParkingUsageAdmin() {
  // null은 아직 조회에 성공하지 않은 상태이며, 정상 조회 결과 0건과 구분한다.
  const [items, setItems] = useState<ParkingUsage[] | null>(null);
  const [active, setActive] = useState<ParkingUsage[] | null>(null);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [activeLoading, setActiveLoading] = useState(true);
  const [itemsError, setItemsError] = useState('');
  const [activeError, setActiveError] = useState('');
  const requestController = useRef<AbortController | null>(null);

  // [1023_1010] 최근 기록과 현재 입차 목록을 병렬 조회하고 각각의 성공·실패를 따로 표시한다.
  const refresh = useCallback(async () => {
    // 자동 조회와 수동 새로고침이 겹쳐 이전 응답이 최신 결과를 덮어쓰지 않게 한다.
    if (requestController.current) return;
    const controller = new AbortController();
    requestController.current = controller;
    setItemsLoading(true);
    setActiveLoading(true);

    try {
      await Promise.all([
        (async () => {
          try {
            const rows = await fetchParkingUsages(controller.signal);
            if (controller.signal.aborted) return;
            if (!Array.isArray(rows)) throw new Error('입출차 기록 응답이 배열이 아닙니다.');
            setItems(rows);
            setItemsError('');
          } catch (e) {
            if (!controller.signal.aborted) {
              setItemsError(e instanceof Error ? e.message : '조회 실패');
            }
          } finally {
            if (!controller.signal.aborted) setItemsLoading(false);
          }
        })(),
        (async () => {
          try {
            // 최근 200건에 포함되지 않은 장기 주차 차량도 집계한다.
            const rows = await fetchActiveParkingUsages(controller.signal);
            if (controller.signal.aborted) return;
            if (!Array.isArray(rows)) throw new Error('현재 입차 집계 응답이 배열이 아닙니다.');
            setActive(rows);
            setActiveError('');
          } catch (e) {
            if (!controller.signal.aborted) {
              setActiveError(e instanceof Error ? e.message : '조회 실패');
            }
          } finally {
            if (!controller.signal.aborted) setActiveLoading(false);
          }
        })(),
      ]);
    } finally {
      if (requestController.current === controller) requestController.current = null;
    }
  }, []);
  // [1023_1010] 화면 진입 시 조회하고 5초 간격으로 갱신한다. 화면 종료 시 타이머와 진행 중 요청을 정리한다.
  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => { if (!document.hidden) void refresh(); }, 5000);
    return () => {
      window.clearInterval(id);
      requestController.current?.abort();
      requestController.current = null;
    };
  }, [refresh]);
  const unknown = active?.filter(item => item.parkingSpaceId == null);
  const loading = itemsLoading || activeLoading;
  return (
    <div>
      <h2 className="page-title">차량 입출차 현황</h2>
      <p className="page-description">AI 번호판 인식과 차량 동선 추적 결과를 자동 조회합니다. 관리자는 기록을 확인합니다.</p>
      <div className="card p-3 mb-3">
        <div className="d-flex flex-wrap gap-4 align-items-center justify-content-between">
          <div>
            <strong>현재 입차 {active === null ? '—' : `${active.length}대`}</strong>
            <span className="ms-3 text-muted">위치 미확인 {unknown === undefined ? '—' : `${unknown.length}대`}</span>
            {active === null && activeLoading && <span className="ms-3 text-muted" role="status">집계 조회 중...</span>}
          </div>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => void refresh()} disabled={loading}>새로고침</button>
        </div>
        {activeError && (
          <div className={`alert ${active === null ? 'alert-danger' : 'alert-warning'} mt-3 mb-0`} role="alert">
            {active === null ? '현재 입차 집계 조회 실패' : '현재 입차 집계 갱신 실패 · 이전 조회 결과입니다'}: {activeError}
          </div>
        )}
      </div>
      {itemsError && (
        <div className={`alert ${items === null ? 'alert-danger' : 'alert-warning'}`} role="alert">
          {items === null ? '입출차 기록 조회 실패' : '입출차 기록 갱신 실패 · 이전 조회 결과입니다'}: {itemsError}
        </div>
      )}
      <div className="card p-3">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead><tr><th>이용 ID</th><th>차량번호</th><th>주차구획</th><th>입차시간</th><th>출차시간</th><th>상태</th></tr></thead>
            <tbody>
              {items?.map(item => (
                <tr key={item.parkingUsageId}>
                  <td>{item.parkingUsageId}</td><td>{item.vehicleNumber}</td>
                  <td>{item.spaceCode || (item.exitAt ? '미확인' : '위치 확인 중')}</td>
                  <td>{item.entryAt || '-'}</td><td>{item.exitAt || '-'}</td>
                  <td><span className={`badge ${item.exitAt ? 'bg-secondary' : item.parkingSpaceId ? 'bg-success' : 'bg-warning text-dark'}`}>
                    {item.exitAt ? '출차 완료' : item.parkingSpaceId ? '주차 중' : '추적 중'}
                  </span></td>
                </tr>
              ))}
              {items !== null && items.length === 0 && <tr><td colSpan={6} className="text-center text-muted py-4">
                {itemsError ? '마지막으로 조회된 기록은 0건입니다.' : '입출차 기록이 없습니다.'}
              </td></tr>}
              {items === null && itemsLoading && <tr><td colSpan={6} className="text-center py-4">조회 중...</td></tr>}
              {items === null && !itemsLoading && itemsError && <tr><td colSpan={6} className="text-center text-muted py-4">입출차 기록을 불러오지 못했습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-muted small mt-3">기록 목록은 최근 200건 · 현재 입차 집계는 전체 미출차 기록 기준 · 5초 간격 자동 조회 · 차량 위치는 AI가 확정한 경우에만 표시</p>
    </div>
  );
}

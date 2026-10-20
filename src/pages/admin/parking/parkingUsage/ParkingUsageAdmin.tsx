import { useCallback, useEffect, useState } from 'react';
import { fetchParkingUsages, type ParkingUsage } from './parkingUsageApi';

/** 관리자 조회 전용. 입차/출차/주차 위치는 AI 이벤트에서 자동으로 반영됩니다. */
export default function ParkingUsageAdmin() {
  const [items, setItems] = useState<ParkingUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try { setItems(await fetchParkingUsages()); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : '조회 실패'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    void refresh(true);
    const id = window.setInterval(() => { if (!document.hidden) void refresh(); }, 5000);
    return () => window.clearInterval(id);
  }, [refresh]);
  const active = items.filter(item => !item.exitAt);
  const unknown = active.filter(item => !item.parkingSpaceId);
  return (
    <div>
      <h2 className="page-title">차량 입출차 현황</h2>
      <p className="page-description">AI 번호판 인식과 차량 동선 추적 결과를 자동 조회합니다. 관리자는 기록을 확인합니다.</p>
      <div className="card p-3 mb-3">
        <div className="d-flex flex-wrap gap-4 align-items-center justify-content-between">
          <div><strong>현재 입차 {active.length}대</strong><span className="ms-3 text-muted">위치 미확인 {unknown.length}대</span></div>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => void refresh(true)} disabled={loading}>새로고침</button>
        </div>
      </div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <div className="card p-3">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead><tr><th>이용 ID</th><th>차량번호</th><th>주차구획</th><th>입차시간</th><th>출차시간</th><th>상태</th></tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.parkingUsageId}>
                  <td>{item.parkingUsageId}</td><td>{item.vehicleNumber}</td>
                  <td>{item.spaceCode || (item.exitAt ? '미확인' : '위치 확인 중')}</td>
                  <td>{item.entryAt || '-'}</td><td>{item.exitAt || '-'}</td>
                  <td><span className={`badge ${item.exitAt ? 'bg-secondary' : item.parkingSpaceId ? 'bg-success' : 'bg-warning text-dark'}`}>
                    {item.exitAt ? '출차 완료' : item.parkingSpaceId ? '주차 중' : '추적 중'}
                  </span></td>
                </tr>
              ))}
              {!loading && items.length === 0 && <tr><td colSpan={6} className="text-center text-muted py-4">입출차 기록이 없습니다.</td></tr>}
              {loading && <tr><td colSpan={6} className="text-center py-4">조회 중...</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-muted small mt-3">최근 200건 · 5초 간격 자동 조회 · 차량 위치는 AI가 확정한 경우에만 표시</p>
    </div>
  );
}

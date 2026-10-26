/** [1023_1010] 파일 안내
 * 용도: 차량번호로 수동 입차·출차를 요청하는 기존 관리 화면.
 * 직접 사용처: 현재 src 라우터·컴포넌트에서 참조가 확인되지 않는다. 보관 중인 구현이다.
 * parkingUsageApi의 입차·목록·출차 API를 사용한다. 현재 운영 조회 경로는 ParkingUsageAdmin이다.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  createParkingEntry, fetchParkingUsages, finishParkingUsage,
  type ParkingUsage,
} from './parkingUsageApi';

/** 서버의 PARKING_USAGE 조회 결과를 사용합니다. 임의 Mock 데이터는 사용하지 않습니다. */
// [1023_1010] 현재 라우트 미연결인 수동 처리 UI다. 보관 중인 동작을 바꾸지 않고 설명만 추가한다.
export default function ParkingManage() {
  const [items, setItems] = useState<ParkingUsage[]>([]);
  const [plate, setPlate] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await fetchParkingUsages());
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function entry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!plate.trim()) return;
    setBusy(true);
    setNotice('');
    try {
      const result = await createParkingEntry(plate.trim());
      setPlate('');
      setNotice(`${result.vehicleNumber} 입차 처리 완료`);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '입차 실패');
    } finally {
      setBusy(false);
    }
  }

  async function exit(usage: ParkingUsage) {
    if (!window.confirm(`${usage.vehicleNumber} 차량을 출차 처리하시겠습니까?`)) return;
    setBusy(true);
    setNotice('');
    try {
      await finishParkingUsage(usage.parkingUsageId);
      setNotice(`${usage.vehicleNumber} 출차 처리 완료`);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '출차 실패');
    } finally {
      setBusy(false);
    }
  }

  const active = items.filter(item => !item.exitAt);

  return (
    <div>
      <h2 className="page-title">차량 입출차 관리</h2>
      <p className="page-description">등록 승인 차량 입차 및 출차 내역을 관리합니다. 주차구획은 위치 확인 후에만 연결합니다.</p>
      <div className="card p-3 mb-3">
        <div className="d-flex flex-wrap justify-content-between gap-2 align-items-center mb-3">
          <strong>현재 미출차 차량: {active.length}대</strong>
          <button type="button" className="btn btn-outline-secondary btn-sm" disabled={loading || busy} onClick={() => void refresh()}>새로고침</button>
        </div>
        <form className="d-flex flex-wrap gap-2" onSubmit={(e) => void entry(e)}>
          <label htmlFor="parking-plate" className="visually-hidden">입차 차량번호</label>
          <input id="parking-plate" className="form-control" style={{ maxWidth: 250 }} placeholder="차량번호 (예: 456라1234)" value={plate} onChange={e => setPlate(e.target.value)} required maxLength={16} />
          <button type="submit" className="btn btn-primary" disabled={busy}>수동 입차 등록</button>
        </form>
      </div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {notice && <div className="alert alert-success" role="status">{notice}</div>}
      <div className="card p-3">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead><tr><th>이용 ID</th><th>차량번호</th><th>주차구획</th><th>입차시간</th><th>출차시간</th><th>상태</th><th>관리</th></tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.parkingUsageId}>
                  <td>{item.parkingUsageId}</td>
                  <td>{item.vehicleNumber}</td>
                  <td>{item.spaceCode ?? '미확인'}</td>
                  <td>{item.entryAt ?? '-'}</td>
                  <td>{item.exitAt ?? '-'}</td>
                  <td><span className={`badge ${item.exitAt ? 'bg-secondary' : 'bg-success'}`}>{item.exitAt ? '출차' : '주차중'}</span></td>
                  <td>{!item.exitAt && <button type="button" className="btn btn-sm btn-outline-danger" disabled={busy} onClick={() => void exit(item)}>출차 처리</button>}</td>
                </tr>
              ))}
              {!loading && items.length === 0 && <tr><td colSpan={7} className="text-center text-muted py-4">입출차 기록이 없습니다.</td></tr>}
              {loading && <tr><td colSpan={7} className="text-center py-4">조회 중...</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-muted small mt-3">최근 200건 표시 · 주차구획 자동 매칭 및 AI LPR 자동 입출차는 후속 연동 예정</p>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { myPageApi, myPageDate, myPageError } from '../../../api/myPageApi';
import type { MyPageResult, ParkingUsage } from '../../../api/myPageApi';
import styles from './MyInfo.module.css';

// 본인 주차 이용 내역과 조회 상태·페이지 이동 기능을 표시한다.
export default function ParkingHistory() {
  const [page, setPage] = useState(0);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<MyPageResult<ParkingUsage> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // 페이지나 재시도 값이 바뀌면 이용 내역을 조회하고 이전 요청은 정리한다.
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setResult(null);
    myPageApi.parking(page, controller.signal)
      .then(data => { if (!controller.signal.aborted) setResult(data); })
      .catch(failure => { if (!controller.signal.aborted) setError(myPageError(failure, '주차 이용 내역을 불러오지 못했습니다.')); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, retry]);
  return (
    <section className={styles.section} aria-labelledby="mypage-parking-title">
      <h3 id="mypage-parking-title">주차 이용 내역</h3>
      <p className={styles.muted}>입차시간 기준 최신순으로 표시합니다.</p>
      {loading && <p role="status">이용 내역을 불러오는 중입니다.</p>}
      {error && <div role="alert"><p>{error}</p><button className="btn btn-outline-primary" onClick={() => setRetry(value => value + 1)}>다시 조회</button></div>}
      {result && !loading && <>
        <div className={styles.tableWrap}><table className="table align-middle">
          <thead><tr><th>차량번호</th><th>이용 유형</th><th>입차시간</th><th>출차시간</th></tr></thead>
          <tbody>{result.content.map(row => <tr key={row.id}>
            <td>{row.vehicle_number}</td><td>{row.parking_type_name}</td>
            <td>{myPageDate(row.entry_at)}</td><td>{row.exit_at ? myPageDate(row.exit_at) : '주차 중'}</td>
          </tr>)}</tbody>
        </table></div>
        {result.content.length === 0 && <p className={styles.empty}>주차 이용 내역이 없습니다.</p>}
        {result.total_pages > 1 && <nav className={styles.actions} aria-label="주차 내역 페이지">
          <button className="btn btn-outline-primary" disabled={page === 0} onClick={() => setPage(value => value - 1)}>이전</button>
          <span aria-live="polite">{page + 1} / {result.total_pages}</span>
          <button className="btn btn-outline-primary" disabled={page + 1 >= result.total_pages} onClick={() => setPage(value => value + 1)}>다음</button>
        </nav>}
      </>}
    </section>
  );
}

import { FormEvent, useEffect, useState } from 'react';
import { ClipboardList, Receipt, ShieldCheck } from 'lucide-react';
import { myPageApi, myPageDate, myPageError } from '../../../api/myPageApi';
import type { VehiclePenalty, CurrentCharges, MyPageResult, OfficeCharge } from '../../../api/myPageApi';
import styles from './MyInfo.module.css';
import AccountManagement from './AccountManagement';

// 금액을 한국어 천 단위 구분과 최대 소수 둘째 자리 형식으로 표시한다.
const money = (value: number) => Number(value).toLocaleString('ko-KR', { maximumFractionDigits: 2 });
type Detail = 'account' | 'penalty' | 'billing' | null;

// 본인 차량의 실제 패널티 부과 금액과 로딩·오류·페이지 탐색 화면을 제공한다.
function PenaltyHistory() {
  const [page, setPage] = useState(0);
  const [retry, setRetry] = useState(0);
  const [data, setData] = useState<MyPageResult<VehiclePenalty> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // 페이지나 재시도 값이 바뀌면 실제 패널티 내역을 조회하고 이전 요청을 정리한다.
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setData(null);
    myPageApi.penalties(page, controller.signal)
      .then(result => { if (!controller.signal.aborted) setData(result); })
      .catch(failure => { if (!controller.signal.aborted) setError(myPageError(failure, '패널티 내역을 불러오지 못했습니다.')); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, retry]);
  return <>
    <p className={styles.muted}>본인 소속 차량에 관리자가 부과한 패널티 내역입니다.</p>
    {loading && <p role="status">내역을 불러오는 중입니다.</p>}
    {error && <div role="alert"><p>{error}</p><button className="btn btn-outline-primary" onClick={() => setRetry(v => v + 1)}>다시 조회</button></div>}
    {data && <>
      <div className={styles.tableWrap}><table className="table align-middle">
        <thead><tr><th>차량번호</th><th>위반 유형</th><th className="text-end">위반금액</th><th>부과일</th><th>부과 사유</th></tr></thead>
        <tbody>{data.content.map(row => <tr key={row.id}>
          <td>{row.vehicle_number}</td><td>{row.type_name}</td><td className="text-end text-nowrap">{money(row.penalty_amount)}원</td>
          <td>{myPageDate(row.imposed_at)}</td><td className={styles.reason}>{row.reason || '—'}</td>
        </tr>)}</tbody>
      </table></div>
      {data.content.length === 0 && <p className={styles.empty}>부과된 패널티 내역이 없습니다.</p>}
      {data.total_pages > 1 && <nav className={styles.actions} aria-label="패널티 내역 페이지">
        <button className="btn btn-outline-primary" disabled={page === 0} onClick={() => setPage(v => v - 1)}>이전</button>
        <span aria-live="polite">{page + 1} / {data.total_pages}</span>
        <button className="btn btn-outline-primary" disabled={page + 1 >= data.total_pages} onClick={() => setPage(v => v + 1)}>다음</button>
      </nav>}
    </>}
  </>;
}

// 관리비 상세와 사용 가능 마일리지·차감 확인 입력을 표시한다.
function ChargeDetails({ charge, balance, saving, onUse }: {
  charge: OfficeCharge; balance: number; saving: boolean;
  onUse: (charge: OfficeCharge, amount: number) => Promise<void>;
}) {
  const [amount, setAmount] = useState('');
  const [confirmation, setConfirmation] = useState<number | null>(null);
  const [error, setError] = useState('');
  const max = Math.max(0, Math.floor(Math.min(balance, charge.final_amount) / 1000) * 1000);
  // 누적 할인액이 갱신되면 이전 사용 금액과 확인 상태를 초기화한다.
  useEffect(() => { setConfirmation(null); setAmount(''); }, [charge.mileage_discount_amount]);
  // 사용할 금액의 정수·1,000P 단위·최대 금액을 검사하고 확인 화면을 연다.
  function confirm(event: FormEvent) {
    event.preventDefault(); setError('');
    const value = Number(amount);
    if (!Number.isSafeInteger(value) || value < 1000 || value % 1000 !== 0 || value > max) {
      setError('사용 가능 금액 이내에서 1,000P 단위로 입력해 주세요.'); return;
    }
    setConfirmation(value);
  }
  return <article className={styles.charge}>
    <div className={styles.row}><h5>청구 내역 #{charge.id}</h5><span>{charge.status_name}</span></div>
    <div className={styles.tableWrap}><table className="table">
      <thead><tr><th>청구 항목</th><th>내용</th><th className="text-end">금액</th></tr></thead>
      <tbody>{charge.items.map(item => <tr key={item.id}>
        <td>{item.type_name}</td><td>{item.description || '—'}</td><td className="text-end">{money(item.amount)}원</td>
      </tr>)}</tbody>
    </table></div>
    {charge.items.length === 0 && <p className={styles.muted}>등록된 상세 항목이 없습니다.</p>}
    <div className={styles.summary}>
      <div><span className={styles.muted}>청구 합계</span><strong>{money(charge.total_amount)}원</strong></div>
      <div><span className={styles.muted}>누적 마일리지 할인</span><strong>−{money(charge.mileage_discount_amount)}원</strong></div>
      <div className={styles.total}><span>최종 관리비</span><strong>{money(charge.final_amount)}원</strong></div>
      <div><span className={styles.muted}>사용 가능한 마일리지</span><strong>{money(balance)} P</strong></div>
    </div>
    {charge.status_code === 'BILLED' && max >= 1000 && <form className={styles.form} onSubmit={confirm}>
      <label>사용할 마일리지 (1,000P 단위)
        <input className="form-control" type="number" min="1000" max={max} step="1000" required
          value={amount} disabled={saving} onChange={event => { setAmount(event.target.value); setConfirmation(null); setError(''); }} />
      </label>
      <div className={styles.row}><span className={styles.muted}>최대 {money(max)} P 사용 가능</span>
        <button type="button" className="btn btn-link" disabled={saving} onClick={() => { setAmount(String(max)); setConfirmation(null); setError(''); }}>최대 사용</button>
      </div>
      <button className="btn btn-primary" type="submit" disabled={saving}>마일리지 사용</button>
      {error && <p role="alert" className="text-danger">{error}</p>}
      {confirmation !== null && <div aria-live="polite">
        <strong>{money(confirmation)} P를 사용하시겠어요?</strong>
        <p>남는 마일리지 {money(balance - confirmation)} P</p>
        <p>사용 후 최종 관리비 {money(charge.final_amount - confirmation)}원</p>
        <p className={styles.notice}>사용 완료 후 취소할 수 없습니다.</p>
        <div className={styles.actions}>
          <button className="btn btn-primary" type="button" disabled={saving} onClick={async () => {
            const value = confirmation; setConfirmation(null); await onUse(charge, value);
          }}>{saving ? '처리 중…' : '사용 확인'}</button>
          <button className="btn btn-outline-secondary" type="button" disabled={saving} onClick={() => setConfirmation(null)}>돌아가기</button>
        </div>
      </div>}
    </form>}
    {charge.status_code === 'BILLED' && max < 1000 && <p className={styles.notice}>사용 가능한 금액이 1,000P 미만입니다.</p>}
    <p className={styles.notice}>1P = 1원 · 1,000P 단위 사용 · 사용 완료 후 취소 불가</p>
  </article>;
}

// 계정·패널티·관리비 메뉴 상자와 선택된 상세 화면을 관리한다.
export default function MyInfo() {
  const [detail, setDetail] = useState<Detail>(null);
  const [data, setData] = useState<CurrentCharges | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [retry, setRetry] = useState(0);
  // 화면 진입 또는 재시도 시 미반영 패널티를 당월 청구에 합산하고 화면 종료 시 요청을 정리한다.
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setData(null);
    myPageApi.synchronizePenalties(controller.signal)
      .then(result => { if (!controller.signal.aborted) setData(result); })
      .catch(failure => { if (!controller.signal.aborted) setError(myPageError(failure, '관리비 정보를 불러오지 못했습니다.')); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [retry]);
  // 관리비 차감을 요청하고 성공 결과 또는 실패 후 최신 서버 상태를 반영한다.
  async function useMileage(charge: OfficeCharge, amount: number) {
    if (saving) return;
    setSaving(true); setMessage(''); setError('');
    try {
      setData(await myPageApi.useMileage(charge.id, amount, charge.mileage_discount_amount));
      setMessage(`${money(amount)} P를 관리비에 사용했습니다.`);
    } catch (failure) {
      setError(myPageError(failure, '처리 결과를 확인하지 못했습니다. 최신 내역을 확인한 뒤 다시 시도해 주세요.'));
      // 응답 유실 시 같은 차감 요청을 자동 재전송하지 않고 서버 상태만 다시 확인한다.
      try { setData(await myPageApi.charges()); } catch { setData(null); }
    } finally { setSaving(false); }
  }
  const total = data?.charges.reduce((sum, charge) => sum + Number(charge.final_amount), 0) ?? 0;
  const labels = { account: '계정 관리', penalty: '패널티 내역', billing: '이번 달 관리비' };
  return <section className={styles.section} aria-labelledby="mypage-info-title">
    <div className={styles.intro}><h3 id="mypage-info-title">내 정보</h3><p className={styles.muted}>나의 계정과 이용 정보를 확인하세요.</p></div>
    <div className={styles.cards}>
      <button type="button" className={styles.tile} disabled={saving} onClick={() => setDetail('account')}>
        <span className={styles.icon}><ShieldCheck size={21} aria-hidden="true" /></span><strong>계정 관리</strong>
        <small>비밀번호 변경 및 회원 탈퇴</small><span>계정 설정 확인 →</span>
      </button>
      <button type="button" className={styles.tile} disabled={saving} onClick={() => setDetail('penalty')}>
        <span className={styles.icon}><ClipboardList size={21} aria-hidden="true" /></span><strong>패널티 내역</strong>
        <small>관리자가 부과한 위반 금액</small><span>부과 내역 확인 →</span>
      </button>
      <button type="button" className={`${styles.tile} ${styles.billingTile}`} disabled={saving} onClick={() => {
        setDetail('billing'); setRetry(value => value + 1);
      }}>
        <span className={styles.icon}><Receipt size={21} aria-hidden="true" /></span><strong>이번 달 관리비</strong>
        <span className={styles.value}>{loading ? '조회 중…' : !data ? '조회 필요' : data.charges.length ? `${money(total)}원` : '청구 내역 없음'}</span>
        <span>관리비 확인 · 마일리지 사용 →</span>
      </button>
    </div>
    {message && <p role="status" className="text-success mt-3">{message}</p>}
    {error && <div role="alert" className="mt-3"><p>{error}</p><button type="button" className="btn btn-outline-primary" disabled={saving} onClick={() => setRetry(v => v + 1)}>관리비 다시 조회</button></div>}
    {detail && <section className={styles.detail}>
      <div className={styles.row}><h4>{labels[detail]}</h4><button type="button" className="btn btn-link" disabled={saving} onClick={() => setDetail(null)}>접기 ↑</button></div>
      {detail === 'account' && <AccountManagement />}
      {detail === 'penalty' && <PenaltyHistory />}
      {detail === 'billing' && <>
        <button type="button" className="btn btn-outline-primary mb-3" disabled={saving || loading} onClick={() => setRetry(value => value + 1)}>관리비 새로 조회</button>
        {loading && <p role="status">관리비를 불러오는 중입니다.</p>}
        {data && <><p className={styles.muted}>{data.year_month.slice(0, 4)}년 {data.year_month.slice(4)}월 청구 내역</p>
          {data.charges.length === 0 && <p className={styles.empty}>이번 달 청구 내역이 없습니다.</p>}
          {data.charges.map(charge => <ChargeDetails key={charge.id} charge={charge} balance={data.mileage_balance} saving={saving} onUse={useMileage} />)}
        </>}
      </>}
    </section>}
  </section>;
}

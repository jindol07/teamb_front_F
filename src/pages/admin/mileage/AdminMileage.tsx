import { useCallback, useEffect, useState, type FormEvent } from 'react';
import axios from 'axios';
import {
  adminMileageApi,
  getSignedMileageAmount,
  type AdminMileageHistoryDto,
  type AdminMileageOffice,
} from '../../../api/mileageApi';
import styles from './AdminMileage.module.css';

type MileageType = 'ADMIN_REWARD' | 'USE' | 'ON_TIME_EXIT_REWARD';

function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data;
    if (body && typeof body === 'object') {
      const message = (body as Record<string, unknown>).message ?? (body as Record<string, unknown>).detail;
      if (typeof message === 'string' && message.trim()) return message;
    }
    if (error.response) return `요청에 실패했습니다. (HTTP ${error.response.status})`;
  }
  return '마일리지 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
}

function formatDate(value: string | number): string {
  return String(value).replace('T', ' ').replace(/Z$/, '').replace(/(\d{2}:\d{2}):\d{2}(?:\.\d+)?$/, '$1');
}

export default function AdminMileage() {
  const [offices, setOffices] = useState<AdminMileageOffice[]>([]);
  const [history, setHistory] = useState<AdminMileageHistoryDto[]>([]);
  const [officeId, setOfficeId] = useState('');
  const [mileageTypeCode, setMileageTypeCode] = useState<MileageType>('ADMIN_REWARD');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [officeRows, historyRows] = await Promise.all([
        adminMileageApi.getOffices(),
        adminMileageApi.getHistory(),
      ]);
      setOffices(officeRows);
      setHistory(historyRows);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    const validMileageType = ['ADMIN_REWARD', 'USE', 'ON_TIME_EXIT_REWARD'].includes(mileageTypeCode);
    if (!officeId) {
      setError('사무실을 선택해 주세요.');
      return;
    }
    if (!validMileageType) {
      setError('처리 유형을 선택해 주세요.');
      return;
    }
    if (!Number.isSafeInteger(parsedAmount) || parsedAmount <= 0) {
      setError('마일리지는 1 이상의 정수로 입력해 주세요.');
      return;
    }
    if (!description.trim()) {
      setError('처리 사유를 입력해 주세요.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await adminMileageApi.create({
        officeId: Number(officeId),
        mileageTypeCode,
        amount: parsedAmount,
        description: description.trim(),
      });
      setAmount('');
      setDescription('');
      setSuccess('마일리지가 등록되었습니다.');
      await loadData();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>마일리지 관리</h1>
          <p>사무실을 선택해 마일리지를 적립하거나 차감합니다.</p>
        </div>
        <button type="button" className={styles.refreshButton} onClick={() => void loadData()} disabled={loading}>
          새로고침
        </button>
      </header>

      <section className={styles.formCard} aria-labelledby="mileage-form-title">
        <h2 id="mileage-form-title">마일리지 등록</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label>
            사무실
            <select value={officeId} onChange={(event) => setOfficeId(event.target.value)} required>
              <option value="">사무실을 선택하세요</option>
              {offices.map((office) => (
                <option key={office.officeid} value={office.officeid}>
                  {office.officenumber} 
                </option>
              ))}
            </select>
          </label>
          <label>
            처리 유형
            <select value={mileageTypeCode} onChange={(event) => setMileageTypeCode(event.target.value as MileageType)}>
              <option value="ON_TIME_EXIT_REWARD">정시 출차 보상</option>
              <option value="ADMIN_REWARD">적립</option>
              <option value="USE">차감</option>
            </select>
          </label>
          <label>
            마일리지
            <input type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} required />
          </label>
          <label className={styles.reasonField}>
            처리 사유
            <input maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} required />
          </label>
          <button type="submit" className={styles.submitButton} disabled={saving || loading || offices.length === 0}>
            {saving ? '등록 중…' : '마일리지 등록'}
          </button>
        </form>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {success && <p className={styles.success} role="status">{success}</p>}
      </section>

      <section className={styles.historyCard} aria-labelledby="mileage-history-title">
        <div className={styles.historyHeading}>
          <div>
            <h2 id="mileage-history-title">최근 마일리지 이력</h2>
            <p>최근 등록된 항목 {history.length}건</p>
          </div>
        </div>
        {loading ? (
          <p className={styles.empty}>이력을 불러오는 중입니다.</p>
        ) : history.length === 0 ? (
          <p className={styles.empty}>표시할 마일리지 이력이 없습니다.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr><th>일시</th><th>사무실</th><th>유형</th><th>마일리지</th><th>처리 사유</th></tr>
              </thead>
              <tbody>
                {history.map((item) => {
                  const signedAmount = getSignedMileageAmount(item);
                  return (
                    <tr key={item.mileagehistoryid}>
                      <td>{formatDate(item.createdat)}</td>
                      <td>{item.office?.officenumber ?? item.officeid ?? '—'}</td>
                      <td>{item.mileagetypecode === 'USE' ? '차감' : item.mileagetypecode === 'ON_TIME_EXIT_REWARD' ? '정시 출차 보상' : item.mileagetypecode === 'ADMIN_REWARD' ? '적립' : item.mileagetypecode}</td>
                      <td className={signedAmount < 0 ? styles.negativeAmount : styles.positiveAmount}>
                        {signedAmount > 0 ? '+' : ''}{signedAmount.toLocaleString()}
                      </td>
                      <td>{item.description || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

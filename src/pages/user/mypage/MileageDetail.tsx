import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock3,
  Search,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { getSignedMileageAmount, mileageApi, type MileageHistoryDto } from '../../../api/mileageApi';

type MileageTransaction = {
  id: number;
  type: 'earned' | 'used';
  title: string;
  detail: string;
  date: string;
  amount: number;
};
type TransactionType = 'earned' | 'used';
type MileageTab = 'all' | TransactionType;
type MileagePeriod = '이번 달' | '최근 3개월' | '전체 기간';

const formatPoints = (value: number): string =>
  `${Math.abs(value).toLocaleString('ko-KR')} P`;

type MileageDetailProps = {
  initialType: 'earned' | 'used';
};

export default function MileageDetail({ initialType }: MileageDetailProps) {
  const [activeTab, setActiveTab] = useState<MileageTab>(initialType);
  const [history, setHistory] = useState<MileageHistoryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [period, setPeriod] = useState<MileagePeriod>('전체 기간');

  const [search, setSearch] = useState('');

  useEffect(() => {
    let isMounted = true;
    mileageApi.getHistory()
      .then((items) => { if (isMounted) setHistory(items); })
      .catch(() => { if (isMounted) setLoadError('마일리지 내역을 불러오지 못했습니다.'); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, []);

  const transactions: MileageTransaction[] = history.map((item) => {
    const amount = getSignedMileageAmount(item);
    const type: TransactionType = amount < 0 ? 'used' : 'earned';
    const date = new Date(item.createdat.replace(' ', 'T'));
    const formattedDate = Number.isNaN(date.getTime())
      ? item.createdat
      : `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    return {
      id: item.mileagehistoryid,
      type,
      title: item.description || (type === 'used' ? '마일리지 사용' : '마일리지 적립'),
      detail: [item.office?.officename || item.office?.officenumber, item.referencetypecode].filter(Boolean).join(' · '),
      date: formattedDate,
      amount,
    };
  });

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    if (period === '최근 3개월') start.setMonth(now.getMonth() - 2, 1);

    return transactions.filter((item) => {
      const [datePart = '', timePart = '00:00'] = item.date.split(' ');
      const [year = 0, month = 1, day = 1] = datePart.split('.').map(Number);
      const [hour = 0, minute = 0] = timePart.split(':').map(Number);
      const transactionDate = new Date(year, month - 1, day, hour, minute);
      const matchesPeriod =
        period === '전체 기간' || (transactionDate >= start && transactionDate <= now);
      const matchesTab = activeTab === 'all' || item.type === activeTab;
      const matchesSearch = `${item.title} ${item.detail}`
        .toLowerCase()
        .includes(search.toLowerCase());
      return matchesPeriod && matchesTab && matchesSearch;
    });
  }, [activeTab, period, search, history]);
  return (
    <div>
      <section className="history-section">
        <div className="history-header">
          <div>
            <h2>마일리지 이용 내역</h2>
            <p>적립 및 사용 내역을 확인할 수 있어요.</p>
          </div>
          <div className="history-tools">
            <label className="search-box">
              <Search size={17} />
              <input
                id="transaction-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="내역 검색"
              />
            </label>
            <label className="period-select">
              <CalendarDays size={16} />
              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value as MileagePeriod)}
              >
                <option>이번 달</option>
                <option>최근 3개월</option>
                <option>전체 기간</option>
              </select>
              <ChevronDown size={14} />
            </label>
          </div>
        </div>
        <div className="history-tabs" role="tablist" aria-label="마일리지 유형">
          {(
            [
              ['all', '전체 내역'],
              ['earned', '적립 내역'],
              ['used', '사용 내역'],
            ] as [MileageTab, string][]
          ).map(([key, label]) => (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === key}
              className={activeTab === key ? 'active' : ''}
              key={key}
              onClick={() => setActiveTab(key)}
            >
              {label}
              <span>
                {key === 'all'
                  ? transactions.length
                  : transactions.filter((item) => item.type === key).length}
              </span>
            </button>
          ))}
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>유형</th>
                <th>내역</th>
                <th>일시</th>
                <th className="amount-col">마일리지</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {!isLoading && filteredTransactions.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className={`transaction-symbol ${item.type}`}>
                      {item.type === 'earned' ? (
                        <ArrowDownLeft size={17} />
                      ) : (
                        <ArrowUpRight size={17} />
                      )}
                    </span>
                  </td>
                  <td>
                    <div className="transaction-title">{item.title}</div>
                    <div className="transaction-detail">{item.detail}</div>
                  </td>
                  <td className="date-cell">
                    <Clock3 size={14} /> {item.date}
                  </td>
                  <td className={`amount-cell ${item.type}`}>
                    {item.type === 'earned' ? '+' : '−'}
                    {formatPoints(item.amount)}
                  </td>
                  <td>
                    <span className={`transaction-status ${item.type}`}>
                      {item.type === 'earned' ? '적립 완료' : '사용 완료'}
                    </span>
                  </td>
                </tr>
              ))}
              {isLoading && <tr><td colSpan={5} className="empty-state">마일리지 내역을 불러오는 중입니다.</td></tr>}
              {loadError && <tr><td colSpan={5} className="empty-state" role="alert">{loadError}</td></tr>}
              {!isLoading && !loadError && filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-state">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>
            총 <strong>{filteredTransactions.length}</strong>건의 내역
          </span>
          <button
            type="button"
            className="more-button"
            onClick={() => {
              setActiveTab('all');
              setSearch('');
              setPeriod('전체 기간');
            }}
          >
            내역 전체 보기 <ChevronRight size={16} />
          </button>
        </div>
      </section>
      <footer className="page-footer">
        <span>© 2026 AI Alpha Parking</span>
        <span>마일리지 적립 및 사용 내역</span>
      </footer>
    </div>
  );
}

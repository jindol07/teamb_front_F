import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock3,
  Search,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

type MileageTransaction = {
  id: number;
  type: 'earned' | 'used';
  title: string;
  detail: string;
  date: string;
  amount: number;
};
const initialTransactions: MileageTransaction[] = [
  {
    id: 1,
    type: 'earned',
    title: '주차 이용 마일리지 적립',
    detail: '알파킹 강남역점 · 차량 이용 완료',
    date: '2026.10.17 14:32',
    amount: 500,
  },
  {
    id: 2,
    type: 'used',
    title: '마일리지 사용',
    detail: '주차 요금 결제',
    date: '2026.10.15 18:04',
    amount: -1200,
  },
  {
    id: 3,
    type: 'earned',
    title: '방문 이벤트 보너스',
    detail: '이벤트 참여 리워드',
    date: '2026.10.12 10:20',
    amount: 1000,
  },
  {
    id: 4,
    type: 'earned',
    title: '주차 이용 마일리지 적립',
    detail: '알파킹 판교점 · 차량 이용 완료',
    date: '2026.10.08 09:15',
    amount: 300,
  },
  {
    id: 5,
    type: 'used',
    title: '마일리지 사용',
    detail: '주차 요금 할인 적용',
    date: '2026.10.02 20:41',
    amount: -800,
  },
];
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

  const [period, setPeriod] = useState<MileagePeriod>('전체 기간');

  const [search, setSearch] = useState('');

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    if (period === '최근 3개월') start.setMonth(now.getMonth() - 2, 1);

    return initialTransactions.filter((item) => {
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
  }, [activeTab, period, search]);
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
                  ? initialTransactions.length
                  : initialTransactions.filter((item) => item.type === key).length}
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
              {filteredTransactions.map((item) => (
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
              {filteredTransactions.length === 0 && (
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
        <span>본 화면의 잔액과 거래 정보는 프런트엔드 확인용 예시 데이터입니다.</span>
      </footer>
    </div>
  );
}

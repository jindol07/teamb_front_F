import { useCallback, useEffect, useMemo, useState } from 'react';
import { FaHistory, FaSearch } from 'react-icons/fa';
import { adminApi, userApi } from '../../../api/axios';
import { fetchParkingUsages } from '../parking/parkingUsage/parkingUsageApi';
import style from './History.module.css';

type HistoryRecord = Record<string, unknown>;
type HistorySource = 'user' | 'admin';
type HistoryCategory = { table: string; label: string; description: string; source: HistorySource; available?: boolean };

const HISTORY_CATEGORIES: HistoryCategory[] = [
  { table: 'mileage_history', label: '마일리지 이력', description: '마일리지 적립·사용 기록', source: 'user' },
  { table: 'parking_reservation_history', label: '예약 이력', description: '주차 예약·취소 기록', source: 'user' },
  { table: 'vehicle_history', label: '차량 이력', description: '차량 등록·변경 기록', source: 'admin' },
  { table: 'notice_history', label: '공지사항 이력', description: '공지 등록·수정 기록', source: 'admin' },
  { table: 'parking_usage', label: '입·출차 이력', description: '입·출차 기록', source: 'admin' },
  { table: 'office_history', label: '사무실 이력', description: '백엔드 조회 API 미구현', source: 'admin', available: false },
  { table: 'report_history', label: '신고 이력', description: '접수·검토·처리 결과 기록', source: 'admin' },
  { table: 'parking_space_history', label: '주차공간 이력', description: '주차공간 이력 기록', source: 'admin'},
];

const FIELD_LABELS: Record<string, string> = {
  id: '번호', officehistoryid: '이력 번호', mileagehistoryid: '이력 번호',
  parkingreservationhistoryid: '이력 번호', vehiclehistoryid: '이력 번호',
  reporthistoryid: '이력 번호', noticehistoryid: '이력 번호', parkingspacehistoryid: '이력 번호',
  reportid: '신고 번호', reporterofficeid: '신고자 사무실 ID', reporterofficenumber: '신고자 사무실',
  targetvehicleid: '대상 차량 ID', targetvehiclenumber: '신고 대상 차량번호', reporttypecode: '신고 유형',
  revieweradminid: '검토 관리자 번호', reviewreason: '처리 의견', actortypecode: '변경 주체',
  changetypecode: '변경 유형', changereason: '변경 사유',
  officename: '관리사무소', officenumber: '관리사무소 번호', mileagetypecode: '구분',
  amount: '마일리지', description: '내용', referencetypecode: '관련 유형', referenceid: '관련 번호',
  vehiclenumber: '차량번호', parkingreservationid: '예약 번호', parkingspaceid: '주차공간 번호',
  title: '제목', content: '내용', status: '상태', statuscode: '상태', action: '작업',
  changedbyadminid: '처리한 관리자 아이디', writeradminid: '관리자 아이디',
  adminid: '관리자 번호', createdat: '발생 일시', updatedat: '수정 일시',
  changedat: '변경 일시', requestedat: '요청 일시', reviewedat: '처리 일시',
  validfrom: 'Valid From', validto: 'Valid To',
};

const normalizeField = (key: string) => key.replace(/[_-]/g, '').toLowerCase();
const ACTOR_ID_HIDDEN_FIELDS = new Set(['actorid']);
const NOTICE_HISTORY_HIDDEN_FIELDS = new Set(['filepath', 'storedname']);
const MILEAGE_HISTORY_HIDDEN_FIELDS = new Set(['office']);
const RESERVATION_HISTORY_HIDDEN_FIELDS = new Set(['reservation']);
const isDateTimeField = (field: string) => {
  const normalized = normalizeField(field);
  return /(?:at|date|time)$/.test(normalized) || normalized === 'validfrom' || normalized === 'validto';
};

const toRecords = (payload: unknown): HistoryRecord[] => {
  if (Array.isArray(payload)) return payload.filter((row): row is HistoryRecord => !!row && typeof row === 'object');
  if (!payload || typeof payload !== 'object') return [];
  const record = payload as Record<string, unknown>;
  for (const key of ['data', 'items', 'records', 'content', 'history']) {
    if (record[key] != null) {
      const nested = toRecords(record[key]);
      if (nested.length || Array.isArray(record[key])) return nested;
    }
  }
  return [];
};

const fetchCategoryRecords = async (table: string, signal: AbortSignal): Promise<HistoryRecord[]> => {
  if (table === 'parking_usage') {
    const records = await fetchParkingUsages(signal);
    return records as unknown as HistoryRecord[];
  }
  if (table === 'notice_history') {
    const response = await adminApi.get<unknown>('/api/notice', { signal });
    const notices = toRecords(response.data);
    const historyLists = await Promise.all(notices.map(async (notice) => {
      const noticeId = notice.noticeId ?? notice.noticeid ?? notice.id;
      if (noticeId == null || noticeId === '') return [];
      const historyResponse = await adminApi.get<unknown>(`/api/notice/${encodeURIComponent(String(noticeId))}/history`, { signal });
      return toRecords(historyResponse.data);
    }));
    return historyLists.flat();
  }
  if (table === 'parking_space_history') {
    const response = await adminApi.get<unknown>('/api/parking/spaces', { signal });
    return toRecords(response.data);
  }
  if (table === 'mileage_history') {
    const response = await adminApi.get<unknown>('/api/mileage', { signal });
    return toRecords(response.data);
  }
  if (table === 'parking_reservation_history') {
    const response = await userApi.get<unknown>('/api/reservation-histories', { signal });
    return toRecords(response.data);
  }
  if (table === 'vehicle_history') {
    const response = await adminApi.get<unknown>('/api/vehiclehistory', { signal });
    return toRecords(response.data);
  }
  if (table === 'report_history') {
    const response = await adminApi.get<unknown>('/api/reports/history', { signal });
    return toRecords(response.data);
  }
  throw new Error(`이력 API가 연결되지 않았습니다: ${table}`);
};

const getCategoryApiPath = (table: string) => {
  if (table === 'notice_history') return '/api/notice → /api/notice/{noticeId}/history';
  if (table === 'parking_space_history') return '관리자 API /api/parking/spaces';
  if (table === 'parking_usage') return '/api/parking/usages';
  if (table === 'mileage_history') return '관리자 API /api/mileage';
  if (table === 'parking_reservation_history') return '사용자 API /api/reservation-histories';
  if (table === 'vehicle_history') return '/api/vehiclehistory';
  if (table === 'report_history') return '관리자 서버 /api/reports/history';
  return `/api/history/${table}`;
};

const getFieldLabel = (key: string) => FIELD_LABELS[key.replace(/[_-]/g, '').toLowerCase()]
  ?? key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ');

const renderCell = (value: unknown, field?: string) => {
  if (value == null || value === '') return '—';
  if (typeof value === 'boolean') return value ? '예' : '아니오';
  if (field && isDateTimeField(field) && typeof value === 'string') {
    return value
      .replace('T', ' ')
      .replace(/Z$/, '')
      .replace(/(\d{1,2}:\d{2}):\d{2}(?:\.\d+)?/g, '$1');
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

export default function History() {
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const [countErrors, setCountErrors] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<HistoryCategory | null>(null);
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // 신고 이력 조회 API가 관리자 서버에 있으므로 History 진입 시 관리자 서버 탭을 기본으로 연다.
  const [activeSource, setActiveSource] = useState<HistorySource>('admin');
  const visibleCategories = HISTORY_CATEGORIES.filter((category) => category.source === activeSource);

  const loadCounts = useCallback(async (signal: AbortSignal) => {
    const results = await Promise.all(HISTORY_CATEGORIES.filter(({ available }) => available !== false).map(async ({ table }) => {
      try {
        const records = await fetchCategoryRecords(table, signal);
        return { table, count: records.length, failed: false };
      } catch {
        return { table, count: null, failed: true };
      }
    }));
    if (signal.aborted) return;
    setCounts(Object.fromEntries(results.map(({ table, count }) => [table, count])));
    setCountErrors(Object.fromEntries(results.map(({ table, failed }) => [table, failed])));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadCounts(controller.signal);
    return () => controller.abort();
  }, [loadCounts, refreshVersion]);

  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setRecords([]);
    void fetchCategoryRecords(selected.table, controller.signal)
      .then((result) => { if (!controller.signal.aborted) setRecords(result); })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : '이력을 불러오지 못했습니다.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [selected, refreshVersion]);

  const columns = useMemo(() => {
    const keys = new Set<string>();
    records.forEach((record) => Object.keys(record).forEach((key) => keys.add(key)));
    const visibleKeys = Array.from(keys).filter((key) => (
      !ACTOR_ID_HIDDEN_FIELDS.has(normalizeField(key))
      && (selected?.table !== 'notice_history' || !NOTICE_HISTORY_HIDDEN_FIELDS.has(normalizeField(key)))
      && (selected?.table !== 'mileage_history' || !MILEAGE_HISTORY_HIDDEN_FIELDS.has(normalizeField(key)))
      && (selected?.table !== 'parking_reservation_history' || !RESERVATION_HISTORY_HIDDEN_FIELDS.has(normalizeField(key)))
    ));
    const isNumberColumn = (key: string) => {
      const normalized = normalizeField(key);
      return normalized === 'id' || FIELD_LABELS[normalized]?.endsWith('번호') === true;
    };
    visibleKeys.sort((left, right) => Number(isNumberColumn(right)) - Number(isNumberColumn(left)));
    return visibleKeys;
  }, [records, selected]);

  const filteredRecords = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    if (!query) return records;
    return records.filter((record) => Object.values(record).map((value) => renderCell(value)).join(' ').toLowerCase().includes(query));
  }, [keyword, records]);

  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [currentPage, filteredRecords, pageSize]);
  const firstRecord = filteredRecords.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastRecord = Math.min(currentPage * pageSize, filteredRecords.length);

  const selectCategory = (category: HistoryCategory) => {
    setKeyword('');
    setPage(1);
    setSelected(category);
  };

  return (
    <div className={style.historyPage}>
      <h2 className="page-title">이력</h2>
      <p className="page-description">사용자 서버와 관리자 서버의 이력을 구분해 확인합니다.</p>

      <div className={style.sourceTabs} role="tablist" aria-label="이력 서버 구분">
        <button type="button" role="tab" aria-selected={activeSource === 'user'}
          className={activeSource === 'user' ? style.activeSourceTab : ''}
          onClick={() => { setActiveSource('user'); setSelected(null); setRecords([]); setKeyword(''); setPage(1); }}>
          사용자 서버
        </button>
        <button type="button" role="tab" aria-selected={activeSource === 'admin'}
          className={activeSource === 'admin' ? style.activeSourceTab : ''}
          onClick={() => { setActiveSource('admin'); setSelected(null); setRecords([]); setKeyword(''); setPage(1); }}>
          관리자 서버
        </button>
      </div>

      <div className={style.summaryGrid}>
        {visibleCategories.map((category, index) => {
          const active = selected?.table === category.table;
          const count = counts[category.table];
          return (
            <button key={category.table} type="button" disabled={category.available === false}
              className={`${style.summaryCard} ${active ? style.activeCard : ''} ${category.available === false ? style.unavailableCard : ''}`}
              aria-pressed={active} onClick={() => selectCategory(category)}>
              <span className={style.cardLabel}>{category.label}</span>
              <span className={`${style.cardCount} ${style[`countTone${index % 5}`]}`}>
                {category.available === false ? '미연결' : countErrors[category.table] ? '—' : count ?? '…'}
                {category.available !== false && <small>건</small>}
              </span>
              <span className={style.cardDescription}>{category.description}</span>
            </button>
          );
        })}
      </div>

      {selected && (
        <section className={style.detailPanel} aria-labelledby="history-detail-title">
          <div className={style.detailHeader}>
            <div>
              <h3 id="history-detail-title"><FaHistory /> {selected.label}</h3>
              <p>{selected.table} · 총 {counts[selected.table] ?? (loading ? '…' : records.length)}건</p>
            </div>
            <div className={style.detailActions}>
              <label className={style.searchBox}>
                <FaSearch aria-hidden="true" />
                <input type="search" value={keyword} onChange={(event) => { setKeyword(event.target.value); setPage(1); }}
                  placeholder="내역 검색" aria-label="내역 검색" />
              </label>
              <button type="button" className={style.refreshButton} onClick={() => setRefreshVersion((v) => v + 1)}>새로고침</button>
              <button type="button" className={style.closeButton} onClick={() => setSelected(null)}>닫기</button>
            </div>
          </div>
          {loading ? (
            <p className={style.message} role="status">이력을 불러오는 중입니다.</p>
          ) : error ? (
            <p className={`${style.message} ${style.error}`} role="alert">
              {error || '이력을 불러오지 못했습니다.'} API({getCategoryApiPath(selected.table)})를 확인해 주세요.
            </p>
          ) : filteredRecords.length === 0 ? (
            <p className={style.message}>{records.length ? '검색 결과가 없습니다.' : '저장된 내역이 없습니다.'}</p>
          ) : (
            <div className={style.tableWrap}>
              <table>
                <thead><tr>{columns.map((column) => <th key={column}>{getFieldLabel(column)}</th>)}</tr></thead>
                <tbody>{pagedRecords.map((record, rowIndex) => (
                  <tr key={String(record.id ?? record.historyId ?? record.history_id ?? rowIndex)}>
                    {columns.map((column) => <td key={column}>{renderCell(record[column], column)}</td>)}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {!loading && !error && filteredRecords.length > 0 && (
            <div className={style.pagination} aria-label="이력 페이지 이동">
              <span className={style.pageSummary}>{firstRecord}–{lastRecord} / {filteredRecords.length}건</span>
              <label className={style.pageSizeControl}>
                페이지당
                <select aria-label="페이지당 표시 개수" value={pageSize} onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}>
                  <option value={10}>10개</option>
                  <option value={20}>20개</option>
                  <option value={50}>50개</option>
                </select>
              </label>
              <div className={style.pageControls}>
                <button type="button" aria-label="이전 페이지" disabled={currentPage <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}>이전</button>
                <span aria-live="polite">{currentPage} / {pageCount}</span>
                <button type="button" aria-label="다음 페이지" disabled={currentPage >= pageCount}
                  onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>다음</button>
              </div>
            </div>
          )}
        </section>
      )}

      <div className={style.footerActions}>
        <button type="button" onClick={() => setRefreshVersion((v) => v + 1)}>집계 새로고침</button>
      </div>
    </div>
  );
}

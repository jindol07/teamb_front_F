/** [1023_1010] 파일 안내
 * 용도: 선택 구획의 보정 입력·기존 미출차 차량 검색·변경 이력·예약 내역 표시.
 * 직접 사용처: ParkingStatusAdmin.tsx. 예약 탭에서 ParkingReservationList를 사용한다.
 * parkingSpaceApi의 correction·usage-candidates 조회를 사용하고 저장은 부모 onSave에 위임한다.
 * 새 입차 기록은 생성하지 않는다. expected 값은 서버의 동시 변경 검사에 전달하는 조회 기준값이다.
 */
/** 기존 입출차 기록을 이용한 관리자 일회성 보정. AI 반영을 고정하지 않는다. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ParkingReservationList } from './ParkingReservationList';
import type { ExtendedParkingSlot } from '../../../../shared/parking/parking';
import {
  fetchParkingCorrection,
  searchParkingUsageRecords,
} from '../../../../shared/parking/parkingSpaceApi';
import type {
  ParkingCorrectionDetail,
  ParkingCorrectionInput,
  ParkingUsageAction,
  ParkingUsageRecord,
} from '../../../../shared/parking/parkingSpaceApi';

interface SlotDetailPanelProps {
  slot: ExtendedParkingSlot;
  onSave: (input: ParkingCorrectionInput) => Promise<void>;
  saving?: boolean;
  onClose: () => void;
}

const statusLabels: Record<string, string> = {
  AVAILABLE: '사용가능',
  EMPTY: '사용가능',
  OCCUPIED: '사용중',
  RESERVED: '예약됨',
  DISABLED: '사용불가',
};
const typeLabels: Record<string, string> = {
  NORMAL: '일반',
  ELECTRIC: '전기차',
  DISABLED_PERSON: '장애인',
  DISABLED: '기존 사용불가 구분',
};
// [1023_1010] datetime-local 입력에 맞도록 현재 브라우저의 로컬 시각 문자열을 만든다.
const nowInput = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 19);
};
// [1023_1010] unknown 예외를 사용자에게 표시할 문자열로 변환한다.
const errorText = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export function SlotDetailPanel({
  slot,
  onSave,
  saving = false,
  onClose,
}: SlotDetailPanelProps) {
  const [tab, setTab] = useState<'manage' | 'reservations'>('manage');
  const id = slot.parkingSpaceId;
  const [detail, setDetail] = useState<ParkingCorrectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [type, setType] = useState('NORMAL');
  const [memo, setMemo] = useState('');
  const [reason, setReason] = useState('');
  const [action, setAction] = useState<ParkingUsageAction | ''>('KEEP');
  const [selectedUsage, setSelectedUsage] = useState<ParkingUsageRecord | null>(null);
  const [exitAt, setExitAt] = useState(nowInput);
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState<ParkingUsageRecord[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [dirty, setDirty] = useState(false);
  const detailRequest = useRef<AbortController | null>(null);
  const searchRequest = useRef<AbortController | null>(null);
  const submitLock = useRef(false);
  const mounted = useRef(true);

  // [1023_1010] 이전 상세·검색 요청을 취소한 뒤 구획 원본과 이력을 다시 읽고 편집 기준값을 초기화한다.
  const reload = useCallback(async () => {
    detailRequest.current?.abort();
    searchRequest.current?.abort();
    setSearching(false);
    const controller = new AbortController();
    detailRequest.current = controller;
    setLoading(true);
    setError(null);
    try {
      if (!id) throw new Error('구획 ID를 확인할 수 없습니다.');
      const next = await fetchParkingCorrection(id, controller.signal);
      if (controller.signal.aborted) return;
      setDetail(next);
      const code =
        next.space.spaceStatusCode === 'EMPTY' ? 'AVAILABLE' : next.space.spaceStatusCode;
      setStatus(code);
      setType(
        next.space.spaceTypeCode === 'DISABLED' ? 'NORMAL' : next.space.spaceTypeCode,
      );
      setMemo(next.space.memo ?? '');
      setReason('');
      setAction(
        code === 'OCCUPIED'
          ? 'ASSIGN'
          : code === 'AVAILABLE' && next.activeUsages.length
            ? ''
            : 'KEEP',
      );
      setSelectedUsage(next.activeUsages.length === 1 ? next.activeUsages[0] : null);
      setCandidates([]);
      setQuery('');
      setSearched(false);
      setExitAt(nowInput());
      setDirty(false);
    } catch (cause) {
      if (!controller.signal.aborted) setError(errorText(cause));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [id]);

  // [1023_1010] 구획 변경·언마운트 시 이전 요청을 취소하고 화면 종료 후 상태 갱신을 막는다.
  useEffect(() => {
    mounted.current = true;
    void reload();
    return () => {
      mounted.current = false;
      detailRequest.current?.abort();
      searchRequest.current?.abort();
    };
  }, [reload]);

  const active = detail?.activeUsages ?? [];
  // [1023_1010] 사용중에는 기존 기록 연결을, 차량이 연결된 사용가능에는 정리 방법 선택을 요구한다.
  const chooseStatus = (next: string) => {
    setStatus(next);
    setDirty(true);
    setAction(
      next === 'OCCUPIED'
        ? 'ASSIGN'
        : next === 'AVAILABLE' && active.length
          ? ''
          : 'KEEP',
    );
  };

  // [1023_1010] 차량번호로 기존 미출차 기록만 검색한다. 검색 자체로 입차·배정은 수행하지 않는다.
  const search = async () => {
    if (query.replace(/\s/g, '').length < 2) {
      setError('차량번호를 두 글자 이상 입력해 주세요.');
      return;
    }
    searchRequest.current?.abort();
    const controller = new AbortController();
    searchRequest.current = controller;
    setSearching(true);
    setSearched(false);
    setCandidates([]);
    setError(null);
    try {
      const records = await searchParkingUsageRecords(query, controller.signal);
      if (!controller.signal.aborted) {
        setCandidates(records);
        setSearched(true);
      }
    } catch (cause) {
      if (!controller.signal.aborted) setError(errorText(cause));
    } finally {
      if (!controller.signal.aborted) setSearching(false);
    }
  };

  // [1023_1010] 필수 사유·대상 기록·출차 시각을 확인하고 관리자 확인 후 부모 저장 함수를 호출한다.
  const save = async () => {
    if (!detail || submitLock.current) return;
    setError(null);
    if (!statusLabels[status] || !typeLabels[type] || type === 'DISABLED') {
      setError('변경할 구획 상태와 종류를 선택해 주세요.');
      return;
    }
    if (!reason.trim()) {
      setError('변경 사유를 입력해 주세요.');
      return;
    }
    if (!action) {
      setError('현재 차량의 구획 연결 해제 또는 누락 출차 처리를 선택해 주세요.');
      return;
    }
    if (status === 'OCCUPIED' && !selectedUsage) {
      setError('사용중으로 연결할 기존 미출차 기록을 선택해 주세요.');
      return;
    }
    if (action === 'EXIT' && !exitAt) {
      setError('실제 출차 시각을 입력해 주세요.');
      return;
    }
    const record = action === 'ASSIGN' ? selectedUsage : active[0];
    const operation =
      action === 'EXIT'
        ? `누락 출차 처리 (${exitAt.replace('T', ' ')})`
        : action === 'DETACH'
          ? '구획 연결 해제 (입차 기록 유지)'
          : action === 'ASSIGN'
            ? '기존 입차 기록 연결'
            : '차량 이용 기록 유지';
    if (
      !window.confirm(
        `${slot.spaceCode}: ${statusLabels[status]}\n${operation}\n차량: ${record?.vehicleNumber ?? '없음'}\n사유: ${reason.trim()}\n\n저장하시겠습니까? 이후 AI 감지는 기존 규칙대로 반영됩니다.`,
      )
    )
      return;
    // [1023_1010] React 렌더링보다 먼저 잠금을 설정해 빠른 연속 클릭에 의한 중복 저장을 막는다.
    submitLock.current = true;
    try {
      // [1023_1010] 변경값과 조회 당시 expected 값들을 함께 보내 서버가 동시 변경을 확인하도록 한다.
      await onSave({
        spaceStatusCode: status,
        spaceTypeCode: type,
        memo,
        changeReason: reason.trim(),
        usageAction: action,
        parkingUsageId: action === 'KEEP' ? null : (record?.parkingUsageId ?? null),
        vehicleNumber:
          action === 'ASSIGN' ? (selectedUsage?.vehicleNumber ?? null) : null,
        exitAt:
          action === 'EXIT' ? (exitAt.length === 16 ? `${exitAt}:00` : exitAt) : null,
        expectedStatus: detail.space.spaceStatusCode,
        expectedType: detail.space.spaceTypeCode,
        expectedMemo: detail.space.memo ?? null,
        expectedUpdatedAt: detail.space.updatedAt ?? null,
        expectedHistoryId: detail.history[0]?.parkingSpaceHistoryId ?? null,
        expectedActiveUsageIds: active.map((item) => item.parkingUsageId),
      });
      if (mounted.current) await reload();
    } catch (cause) {
      if (mounted.current) setError(errorText(cause));
    } finally {
      submitLock.current = false;
    }
  };

  return (
    <section className="parking-panel" aria-label={`${slot.spaceCode} 구획 보정`}>
      <div className="parking-panel-header">
        <div>
          <div className="parking-panel-floor">지하 {slot.floor}층 · 구획 관리</div>
          <h5>{slot.spaceCode}</h5>
        </div>
        <button
          type="button"
          className="btn-close"
          aria-label="구획 정보 닫기"
          disabled={saving}
          onClick={onClose}
        />
      </div>
      <div className="parking-panel-tabs" role="group" aria-label="구획 정보 보기">
        <button
          type="button"
          aria-pressed={tab === 'manage'}
          disabled={saving}
          onClick={() => setTab('manage')}
        >
          구획 관리{dirty ? ' •' : ''}
        </button>
        <button
          type="button"
          aria-pressed={tab === 'reservations'}
          disabled={saving}
          onClick={() => setTab('reservations')}
        >
          예약 내역
        </button>
      </div>
      {tab === 'reservations' && <ParkingReservationList spaceId={id} />}
      <div hidden={tab !== 'manage'}>
        <p className="parking-panel-description">
          구획 상태와 연결된 차량 기록을 확인하고, 필요한 내용을 보정하세요.
        </p>
        {error && (
          <div className="alert alert-danger small" role="alert">
            {error}
          </div>
        )}
        <button
          type="button"
          className="parking-panel-refresh"
          disabled={loading || saving}
          onClick={() => {
            if (
              !dirty ||
              window.confirm('입력 중인 내용을 버리고 최신 기록을 조회하시겠습니까?')
            )
              void reload();
          }}
        >
          {loading ? '조회 중...' : '최신 기록 다시 조회'}
        </button>
        {detail && (
          <>
            <div className="parking-panel-current">
              <strong>
                현재 상태 ·{' '}
                {statusLabels[detail.space.spaceStatusCode] ??
                  detail.space.spaceStatusCode}
              </strong>
              <div>마지막 변경 {detail.space.updatedAt?.replace('T', ' ') ?? '-'}</div>
              {active.length === 0 ? (
                <div>연결된 미출차 기록 없음</div>
              ) : (
                active.map((item) => (
                  <div key={item.parkingUsageId} className="mt-1">
                    차량 {item.vehicleNumber} · 기록 #{item.parkingUsageId}
                    <br />
                    입차 {item.entryAt?.replace('T', ' ')}
                  </div>
                ))
              )}
              {active.length > 1 && (
                <div className="text-danger">
                  여러 미출차 기록이 연결돼 있습니다. 이용 기록을 먼저 확인해 주세요.
                </div>
              )}
            </div>
            <fieldset disabled={saving || loading}>
              <legend>변경할 구획 상태</legend>
              <div className="parking-panel-statuses">
                {['AVAILABLE', 'OCCUPIED', 'RESERVED', 'DISABLED'].map((code) => (
                  <button
                    key={code}
                    type="button"
                    data-status={code}
                    className={`parking-panel-status${status === code ? ' is-selected' : ''}`}
                    aria-pressed={status === code}
                    onClick={() => chooseStatus(code)}
                  >
                    {statusLabels[code]}
                  </button>
                ))}
              </div>
              {status === 'AVAILABLE' && active.length > 0 && (
                <div className="mb-3">
                  <label className="form-label" htmlFor="parking-usage-action">
                    현재 차량 기록 처리
                  </label>
                  <select
                    id="parking-usage-action"
                    className="form-select form-select-sm"
                    value={action}
                    onChange={(event) => {
                      setAction(event.target.value as ParkingUsageAction | '');
                      setDirty(true);
                    }}
                  >
                    <option value="">처리 방법을 선택해 주세요</option>
                    <option value="DETACH">구획 연결만 해제 (입차 기록 유지)</option>
                    <option value="EXIT">누락 출차 처리 (주차장 밖으로 나간 차량)</option>
                  </select>
                  {action === 'EXIT' && (
                    <>
                      <label className="form-label mt-2" htmlFor="parking-exit-at">
                        실제 출차 시각
                      </label>
                      <input
                        id="parking-exit-at"
                        type="datetime-local"
                        step="1"
                        className="form-control form-control-sm"
                        value={exitAt}
                        max={nowInput()}
                        onChange={(event) => {
                          setExitAt(event.target.value);
                          setDirty(true);
                        }}
                      />
                    </>
                  )}
                </div>
              )}
              {status === 'OCCUPIED' && (
                <div className="parking-panel-search">
                  <label className="form-label small" htmlFor="parking-vehicle-search">
                    기존 미출차 차량번호 검색
                  </label>
                  <div className="d-flex gap-2">
                    <input
                      id="parking-vehicle-search"
                      className="form-control form-control-sm"
                      maxLength={20}
                      placeholder="예: 123가4567 또는 4567"
                      value={query}
                      onChange={(event) => {
                        searchRequest.current?.abort();
                        setSearching(false);
                        setSearched(false);
                        setCandidates([]);
                        setQuery(event.target.value);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          void search();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary text-nowrap"
                      disabled={searching}
                      onClick={() => void search()}
                    >
                      {searching ? '검색 중' : '검색'}
                    </button>
                  </div>
                  <div className="small mt-2">
                    선택 차량:{' '}
                    <strong>
                      {selectedUsage
                        ? `${selectedUsage.vehicleNumber} (기록 #${selectedUsage.parkingUsageId})`
                        : '선택하지 않음'}
                    </strong>
                  </div>
                  {searched && candidates.length === 0 && (
                    <p className="small text-muted mt-2 mb-0">
                      일치하는 미출차 기록이 없습니다. 입차 등록이 필요한지 먼저 확인해
                      주세요.
                    </p>
                  )}
                  <div className="parking-panel-candidates">
                    {candidates.map((item) => {
                      const elsewhere =
                        item.parkingSpaceId != null && item.parkingSpaceId !== id;
                      return (
                        <label
                          key={item.parkingUsageId}
                          className="parking-panel-candidate"
                        >
                          <input
                            type="radio"
                            name="parking-usage-record"
                            className="me-2"
                            disabled={elsewhere}
                            checked={
                              selectedUsage?.parkingUsageId === item.parkingUsageId
                            }
                            onChange={() => {
                              setSelectedUsage(item);
                              setDirty(true);
                            }}
                          />
                          {item.vehicleNumber} · #{item.parkingUsageId}
                          <br />
                          입차 {item.entryAt?.replace('T', ' ')} ·{' '}
                          {item.spaceCode ?? '구획 미연결'}
                          {elsewhere && (
                            <div className="text-warning">
                              기존 구획에서 연결을 해제한 뒤 선택해 주세요.
                            </div>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
              {status === 'RESERVED' && (
                <div className="alert alert-warning small">
                  구획 상태만 예약됨으로 표시합니다. 실제 예약 생성·취소는 처리하지
                  않습니다. 사용자 예약 내역도 별도로 확인해 주세요.
                </div>
              )}
              {['RESERVED', 'DISABLED'].includes(status) && active.length > 0 && (
                <p className="small text-warning">
                  연결된 차량의 입차 기록은 유지됩니다. 출차가 필요한 경우 사용가능에서
                  누락 출차 처리를 먼저 해 주세요.
                </p>
              )}
              <label className="form-label small" htmlFor="parking-space-type">
                구획 종류
              </label>
              <select
                id="parking-space-type"
                className="form-select form-select-sm mb-3"
                value={type}
                onChange={(event) => {
                  setType(event.target.value);
                  setDirty(true);
                }}
              >
                {!['NORMAL', 'ELECTRIC', 'DISABLED_PERSON'].includes(type) && (
                  <option value={type}>종류를 선택해 주세요</option>
                )}
                {['NORMAL', 'ELECTRIC', 'DISABLED_PERSON'].map((code) => (
                  <option key={code} value={code}>
                    {typeLabels[code]}
                  </option>
                ))}
              </select>
              {type === 'ELECTRIC' && (
                <p className="parking-panel-type-note">
                  ⚡ 저장하면 도면에 전기차 전용 아이콘이 표시됩니다.
                </p>
              )}
              {type === 'DISABLED_PERSON' && (
                <p className="parking-panel-type-note">
                  ♿ 저장하면 도면에 장애인 전용 아이콘이 표시됩니다.
                </p>
              )}
              {detail.space.spaceTypeCode === 'DISABLED' && (
                <p className="small text-muted">
                  기존 사용불가 종류는 저장 시 선택한 구획 종류로 정리됩니다.
                </p>
              )}
              <label className="form-label small" htmlFor="parking-space-memo">
                관리자 메모
              </label>
              <textarea
                id="parking-space-memo"
                className="form-control form-control-sm mb-3"
                rows={2}
                maxLength={500}
                value={memo}
                onChange={(event) => {
                  setMemo(event.target.value);
                  setDirty(true);
                }}
              />
              <label className="form-label small" htmlFor="parking-change-reason">
                변경 사유 (필수)
              </label>
              <textarea
                id="parking-change-reason"
                className="form-control form-control-sm mb-2"
                rows={2}
                maxLength={250}
                value={reason}
                placeholder="예: 출차 감지 누락을 확인하여 이용 기록과 구획 상태 보정"
                onChange={(event) => {
                  setReason(event.target.value);
                  setDirty(true);
                }}
              />
              <p className="parking-panel-policy">
                저장 이후 새 AI 감지는 계속 반영됩니다. 예약됨·사용불가는 기존 AI 보호
                규칙이 유지됩니다.
              </p>
              {dirty && (
                <p className="parking-panel-dirty" role="status">
                  저장하지 않은 변경사항이 있습니다.
                </p>
              )}
              <button
                type="button"
                className="parking-panel-save"
                disabled={active.length > 1}
                onClick={() => void save()}
              >
                {saving ? '저장 중...' : '보정 내용 저장'}
              </button>
            </fieldset>
            <div className="parking-panel-history">
              <div className="parking-panel-history-heading">
                <h6>최근 변경 이력</h6>
                <span>최대 30건</span>
              </div>
              {detail.history.length === 0 && (
                <p className="small text-muted">저장된 변경 이력이 없습니다.</p>
              )}
              <div className="parking-panel-history-list">
                {detail.history.map((item) => (
                  <div
                    key={item.parkingSpaceHistoryId}
                    className="parking-panel-history-item"
                  >
                    <strong>
                      {statusLabels[item.spaceStatusCode] ?? item.spaceStatusCode}
                    </strong>{' '}
                    · {typeLabels[item.spaceTypeCode] ?? item.spaceTypeCode}
                    <div className="parking-panel-history-time">
                      {item.validFrom?.replace('T', ' ')} ·{' '}
                      {item.changeSourceCode === 'ADMIN'
                        ? `관리자 #${item.changedByAdminId ?? '-'}`
                        : item.changeSourceCode}
                    </div>
                    <div className="parking-panel-history-reason">
                      {item.changeReason || '사유 없음'}
                    </div>
                    {item.memo && <div className="text-muted">메모: {item.memo}</div>}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

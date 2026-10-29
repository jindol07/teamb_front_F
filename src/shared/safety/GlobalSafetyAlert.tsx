/** 파일 안내
 * 용도: 관리자 모든 페이지 위에 위험 사건 모달과 미처리 배너를 표시한다.
 * 직접 사용처: AdminLayout. 데이터·업무 상태 변경은 SafetyAlertProvider를 사용한다.
 * 자동 팝업 자체로 사건을 처리하지 않는다. 명시적인 처리 완료 버튼만으로 완료한다. 접어 두기는 현재 알림 전체에 적용한다.
 */
import { useEffect, useRef } from 'react';
import { useParkingStore } from '../parking/useParkingStore';
import { useSafetyAlerts } from './SafetyAlertProvider';
import styles from './GlobalSafetyAlert.module.css';

export const safetyStatusLabels: Record<string, string> = {
  RECEIVED: '접수',
  PROCESSING: '처리 중',
  HOLD: '보류',
  RESOLVED: '처리 완료',
};
const riskLabels: Record<string, string> = { HIGH: '높음', MEDIUM: '보통', LOW: '낮음' };
const typeLabels: Record<string, string> = { FIRE: '화재', SMOKE: '연기' };
export function safetyDisplayTime(value: string | null): string {
  if (!value) return '시각 미확인';
  if (/(Z|[+-]\d{2}:?\d{2})$/i.test(value)) {
    const time = new Date(value);
    if (Number.isFinite(time.getTime()))
      return new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      }).format(time);
  }
  return value.replace('T', ' ').slice(0, 19);
}

export default function GlobalSafetyAlert() {
  const safety = useSafetyAlerts();
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const slots = useParkingStore((state) => state.slots);
  const selected = safety.alerts?.find((a) => a.incidentId === safety.selectedId);
  const detail = safety.detail?.incidentId === safety.selectedId ? safety.detail : null;
  const canResolve =
    detail != null && ['RECEIVED', 'PROCESSING', 'HOLD'].includes(detail.status);
  const canClose = !safety.saving;
  const location =
    detail?.parkingSpaceId == null
      ? '위치 미확인'
      : (slots.find((s) => s.parkingSpaceId === detail.parkingSpaceId)?.spaceCode ??
        `구획 #${detail.parkingSpaceId}`);

  useEffect(() => {
    if (safety.selectedId === null) return;
    const element = dialog.current;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (element && !element.open) element.showModal();
    heading.current?.focus();
    return () => {
      element?.close();
      document.body.style.overflow = oldOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [safety.selectedId]);

  const banner = safety.groups.length > 0 || safety.error || safety.incidentError;
  return (
    <>
      {banner && (
        <aside className={styles.banner} aria-label="미처리 위험알림">
          <div aria-live="polite">
            <strong>
              {safety.groups.length
                ? `확인할 위험 사건 ${safety.groups.length}건 · 시험 포함`
                : '위험알림 조회 확인 필요'}
            </strong>
            <span>
              {safety.error ??
                safety.incidentError ??
                '읽음과 처리 완료는 별개입니다. 현장 확인 후 완료해 주세요.'}
            </span>
          </div>
          {safety.groups[0] && (
            <button
              type="button"
              onClick={() => safety.open(safety.groups[0].incidentId)}
            >
              위험알림 열기
            </button>
          )}
          <button type="button" onClick={safety.refresh}>
            다시 조회
          </button>
        </aside>
      )}
      {safety.selectedId !== null && (
        <dialog
          ref={dialog}
          className={styles.dialog}
          aria-labelledby="global-safety-title"
          aria-describedby="global-safety-description"
          onCancel={(event) => event.preventDefault()}
        >
          <header
            className={`${styles.header} ${detail?.isTest ? styles.testHeader : ''}`}
          >
            <div>
              <span>
                {detail?.isTest
                  ? '시험 알림 · 테스트 데이터'
                  : detail
                    ? '관리자 위험알림'
                    : '위험 사건 상세 확인'}
              </span>
              <h2 ref={heading} tabIndex={-1} id="global-safety-title">
                {detail
                  ? `${typeLabels[detail.type] ?? detail.type} 감지${detail.isTest ? ' (시험)' : ''}`
                  : '위험알림 확인'}
              </h2>
              <p id="global-safety-description">
                현장을 확인한 뒤 처리 상태를 변경해 주세요. 알림을 읽는 것만으로 완료되지
                않습니다.
              </p>
            </div>
            {canClose && (
              <button
                type="button"
                className={styles.headerClose}
                onClick={safety.close}
                aria-label="현재 위험알림 모두 접어 두기"
              >
                ×
              </button>
            )}
          </header>
          <div className={styles.body}>
            {safety.groups.length > 1 && (
              <nav className={styles.queue} aria-label="미처리 사건 선택">
                {safety.groups.map((a) => (
                  <button
                    key={a.incidentId}
                    type="button"
                    disabled={safety.saving}
                    aria-pressed={a.incidentId === safety.selectedId}
                    onClick={() => safety.open(a.incidentId)}
                  >
                    #{a.incidentId} {a.incident?.isTest ? '[시험] ' : ''}
                    {typeLabels[a.incident?.type ?? ''] ?? '사건'}
                  </button>
                ))}
              </nav>
            )}
            {(safety.error || safety.incidentError) && (
              <p className={styles.error} role="alert">
                목록 갱신 확인 필요: {safety.error ?? safety.incidentError}
              </p>
            )}
            {safety.detailLoading && <p role="status">사건 상세를 확인하고 있습니다…</p>}
            {safety.detailError && (
              <div className={styles.error} role="alert">
                <p>{safety.detailError}</p>
                <button type="button" onClick={safety.retryDetail}>
                  상세 다시 조회
                </button>
              </div>
            )}
            {detail && (
              <>
                <div className={styles.summary}>
                  <strong>{safetyStatusLabels[detail.status] ?? detail.status}</strong>
                  <span>위험도 {riskLabels[detail.risk] ?? detail.risk}</span>
                  {detail.isTest && <b className={styles.testBadge}>시험</b>}
                  <span>사건 #{detail.incidentId}</span>
                </div>
                {selected?.content && (
                  <p className={styles.message}>{selected.content}</p>
                )}
                <dl className={styles.facts}>
                  <div>
                    <dt>감지 위치</dt>
                    <dd>{location}</dd>
                  </div>
                  <div>
                    <dt>감지 횟수</dt>
                    <dd>{detail.detectionCount}회</dd>
                  </div>
                  <div>
                    <dt>최초 감지</dt>
                    <dd>{safetyDisplayTime(detail.firstDetectedAt)}</dd>
                  </div>
                  <div>
                    <dt>최근 감지</dt>
                    <dd>{safetyDisplayTime(detail.lastDetectedAt)}</dd>
                  </div>
                </dl>
                {safety.readError && (
                  <p className={styles.error} role="alert">
                    {safety.readError}
                  </p>
                )}
                {detail.status === 'RESOLVED' && (
                  <div className={styles.completed} role="status">
                    <strong>처리 완료된 사건입니다.</strong>
                    {detail.resolutionNote && <p>{detail.resolutionNote}</p>}
                    <span>업무 처리 결과이며 AI의 감지 상태와는 별개입니다.</span>
                  </div>
                )}
                {safety.actionError && (
                  <p className={styles.error} role="alert">
                    {safety.actionError} 완료 여부를 최신 상태로 확인한 뒤 다시 시도해
                    주세요.
                  </p>
                )}
              </>
            )}
          </div>
          <footer className={styles.footer}>
            <small>최근 알림 최대 100건 기준 · 5초 간격 조회</small>
            <div>
              {canClose && (
                <button type="button" onClick={safety.close}>
                  {detail?.status === 'RESOLVED' ? '모두 닫기' : '모두 접어 두기'}
                </button>
              )}
              {canResolve && (
                <button
                  type="button"
                  className={styles.primary}
                  disabled={safety.saving || safety.detailLoading}
                  onClick={() => void safety.changeStatus('RESOLVED')}
                >
                  {safety.saving ? '저장 중…' : '처리 완료'}
                </button>
              )}
            </div>
          </footer>
        </dialog>
      )}
    </>
  );
}

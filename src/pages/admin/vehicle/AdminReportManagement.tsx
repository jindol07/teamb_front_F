import { useCallback, useEffect, useState } from 'react';
import {
  listReportsForAdmin,
  reviewReport,
  type ReportRecord,
} from '../../../api/reportApi';
import styles from './AdminReportManagement.module.css';

type ReviewDraft = { penalty: string; reward: string; reason: string; violation: string };
const createDraft = (report: ReportRecord): ReviewDraft => ({
  penalty: '50000',
  reward: '100',
  reason: '',
  violation: report.reporttypecode === 'SAFETY_ISSUE' ? '통행 방해' : '지정구역 위반',
});
const typeLabels: Record<string, string> = {
  ZONE_VIOLATION: '불법 주차',
  FACILITY_DAMAGE: '시설물 파손',
  SAFETY_ISSUE: '안전 문제',
  ETC: '기타',
};

export default function AdminReportManagement({
  initialReports,
  onReportsChange,
}: {
  initialReports: ReportRecord[];
  onReportsChange: (reports: ReportRecord[]) => void;
}) {
  const [reports, setReports] = useState(initialReports);
  const [drafts, setDrafts] = useState<Record<number, ReviewDraft>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await listReportsForAdmin();
      setReports(result);
      onReportsChange(result);
      setError('');
    } catch {
      setError('신고 목록을 불러오지 못했습니다. 관리자 로그인을 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  }, [onReportsChange]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 15000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const setDraft = (report: ReportRecord, patch: Partial<ReviewDraft>) => {
    setDrafts((current) => ({
      ...current,
      [report.reportid]: {
        ...createDraft(report),
        ...current[report.reportid],
        ...patch,
      },
    }));
  };

  const handleReview = async (
    report: ReportRecord,
    statusCode: 'ACCEPTED' | 'REJECTED',
  ) => {
    const draft = { ...createDraft(report), ...drafts[report.reportid] };
    if (
      statusCode === 'ACCEPTED' &&
      (!Number.isFinite(Number(draft.penalty)) || Number(draft.penalty) < 1 ||
        !Number.isFinite(Number(draft.reward)) || Number(draft.reward) < 1)
    ) {
      setError('패널티와 보상 마일리지는 1 이상으로 입력해 주세요.');
      return;
    }
    setBusyId(report.reportid);
    setError('');
    try {
      await reviewReport(report.reportid, {
        statusCode,
        reviewReason: draft.reason,
        violationTypeCode: draft.violation,
        ...(statusCode === 'ACCEPTED'
          ? { penaltyAmount: Number(draft.penalty), rewardAmount: Number(draft.reward) }
          : {}),
      });
      await refresh();
    } catch {
      setError(`신고 #${report.reportid} 처리에 실패했습니다.`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className={styles.page}>
      <header className={styles.heading}>
        <div>
          <h3>신고 검토</h3>
          <p>접수된 신고를 확인하고 승인 시 패널티와 마일리지를 처리합니다.</p>
        </div>
        <button type="button" onClick={() => void refresh()}>
          새로고침
        </button>
      </header>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p className={styles.message}>신고 목록을 불러오는 중입니다.</p>
      ) : reports.length === 0 ? (
        <p className={styles.message}>접수된 신고가 없습니다.</p>
      ) : (
        <div className={styles.list}>
          {reports.map((report) => {
            const draft = { ...createDraft(report), ...drafts[report.reportid] };
            const pending = report.statuscode === 'RECEIVED';
            return (
              <article className={styles.card} key={report.reportid}>
                <div className={styles.cardTop}>
                  <div>
                    <strong>
                      신고 #{report.reportid} ·{' '}
                      {typeLabels[report.reporttypecode] ?? report.reporttypecode}
                    </strong>
                    <span>
                      {report.createdat
                        ? new Date(report.createdat).toLocaleString('ko-KR')
                        : ''}
                    </span>
                  </div>
                  <span
                    className={`${styles.status} ${pending ? styles.pending : report.statuscode === 'ACCEPTED' ? styles.accepted : styles.rejected}`}
                  >
                    {pending
                      ? '접수'
                      : report.statuscode === 'ACCEPTED'
                        ? '승인'
                        : '미승인'}
                  </span>
                </div>
                <dl className={styles.meta}>
                  <div>
                    <dt>신고 대상</dt>
                    <dd>{report.targetvehiclenumber}</dd>
                  </div>
                  <div>
                    <dt>신고자</dt>
                    <dd>
                      {report.reporterofficenumber ??
                        `사무실 #${report.reporterofficeid}`}
                    </dd>
                  </div>
                </dl>
                <p className={styles.content}>{report.content}</p>
                {!pending && report.reviewreason && (
                  <p className={styles.reviewReason}>처리 의견: {report.reviewreason}</p>
                )}
                {pending && (
                  <>
                    <div className={styles.fields}>
                      <label>
                        패널티 금액
                        <input
                          type="number"
                          min="1"
                          step="1000"
                          value={draft.penalty}
                          onChange={(event) =>
                            setDraft(report, { penalty: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        신고 보상 마일리지
                        <input
                          type="number"
                          min="1"
                          step="10"
                          value={draft.reward}
                          onChange={(event) =>
                            setDraft(report, { reward: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        패널티 유형
                        <select
                          value={draft.violation}
                          onChange={(event) =>
                            setDraft(report, { violation: event.target.value })
                          }
                        >
                          <option>지정구역 위반</option>
                          <option>장기 주차</option>
                          <option>통행 방해</option>
                          <option>기타</option>
                        </select>
                      </label>
                      <label className={styles.reason}>
                        처리 의견
                        <textarea
                          value={draft.reason}
                          maxLength={500}
                          onChange={(event) =>
                            setDraft(report, { reason: event.target.value })
                          }
                          placeholder="승인 또는 미승인 사유"
                        />
                      </label>
                    </div>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.reject}
                        disabled={busyId === report.reportid}
                        onClick={() => void handleReview(report, 'REJECTED')}
                      >
                        미승인
                      </button>
                      <button
                        type="button"
                        className={styles.approve}
                        disabled={busyId === report.reportid}
                        onClick={() => void handleReview(report, 'ACCEPTED')}
                      >
                        {busyId === report.reportid ? '처리 중…' : '승인 및 보상 처리'}
                      </button>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

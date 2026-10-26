import { useState, type FormEvent } from 'react';
import axios from 'axios';
import { CircleAlert, Settings, X } from 'lucide-react';
import { submitReport } from '../../api/reportApi';
import './report-button.css';

const reportReasons = [
  { label: '불법 주차', code: 'ZONE_VIOLATION' },
  { label: '시설물 파손', code: 'FACILITY_DAMAGE' },
  { label: '안전 문제', code: 'SAFETY_ISSUE' },
  { label: '기타', code: 'ETC' },
];
const preferencesKey = 'apcms-report-button-preferences';
type Preferences = {
  label: string;
  position: 'left' | 'right';
  color: 'red' | 'blue' | 'navy';
};
const defaultPreferences: Preferences = {
  label: '신고하기',
  position: 'right',
  color: 'red',
};

function getSubmitError(error: unknown): string {
  if (!axios.isAxiosError(error)) return '신고 접수 중 오류가 발생했습니다.';
  const payload = error.response?.data;
  if (payload && typeof payload === 'object') {
    const body = payload as Record<string, unknown>;
    const detail = body.detail ?? body.message ?? body.error;
    if (typeof detail === 'string' && detail.trim()) return detail;
  }
  if (error.response?.status === 401) {
    return '사용자 서버가 이 요청의 로그인 토큰을 인증하지 못했습니다. 신고 POST와 같은 요청의 JWT 검증 로그를 확인해 주세요. (HTTP 401)';
  }
  if (error.response?.status === 403) {
    return '사용자 서버 보안 설정이 신고 요청을 거부했습니다. /api/reports POST 권한 규칙이 배포됐는지 확인해 주세요. (HTTP 403)';
  }
  if (error.response) return `신고 접수에 실패했습니다. (HTTP ${error.response.status})`;
  return '사용자 서버에 연결할 수 없습니다. 서버 주소와 실행 상태를 확인해 주세요.';
}

function readPreferences(): Preferences {
  try {
    const saved = localStorage.getItem(preferencesKey);
    return saved ? { ...defaultPreferences, ...JSON.parse(saved) } : defaultPreferences;
  } catch {
    return defaultPreferences;
  }
}

/** 로그인한 사용자 화면에서 신고를 접수하는 플로팅 버튼과 폼입니다. */
export default function ReportButton() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(reportReasons[0].code);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>(readPreferences);

  const updatePreferences = (update: Partial<Preferences>) => {
    const next = { ...preferences, ...update };
    setPreferences(next);
    localStorage.setItem(preferencesKey, JSON.stringify(next));
  };
  const positionStyle =
    preferences.position === 'right'
      ? { right: 164, left: 'auto' }
      : { left: 24, right: 'auto' };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      await submitReport({
        targetVehicleNumber: vehicleNumber.trim(),
        reportTypeCode: reason,
        content: details.trim(),
      });
      setOpen(false);
      setVehicleNumber('');
      setDetails('');
      setReason(reportReasons[0].code);
      window.alert('신고가 접수되어 관리자에게 전달되었습니다.');
    } catch (error) {
      setSubmitError(getSubmitError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="report-widget" style={{ ...positionStyle, bottom: 26 }}>
        {customizeOpen && (
          <section className="report-customizer" aria-label="신고 버튼 꾸미기">
            <div className="report-customizer-heading">
              <strong>버튼 꾸미기</strong>
              <button
                type="button"
                aria-label="설정 닫기"
                onClick={() => setCustomizeOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <label className="report-customizer-field">
              버튼 문구
              <input
                maxLength={16}
                value={preferences.label}
                onChange={(event) => updatePreferences({ label: event.target.value })}
                placeholder="신고하기"
              />
            </label>
            <label className="report-customizer-field">
              위치
              <select
                value={preferences.position}
                onChange={(event) =>
                  updatePreferences({
                    position: event.target.value as Preferences['position'],
                  })
                }
              >
                <option value="right">오른쪽 아래</option>
                <option value="left">왼쪽 아래</option>
              </select>
            </label>
            <label className="report-customizer-field">
              색상
              <select
                value={preferences.color}
                onChange={(event) =>
                  updatePreferences({ color: event.target.value as Preferences['color'] })
                }
              >
                <option value="red">레드</option>
                <option value="blue">블루</option>
                <option value="navy">네이비</option>
              </select>
            </label>
            <button
              className="report-customizer-reset"
              type="button"
              onClick={() => updatePreferences(defaultPreferences)}
            >
              기본값으로 초기화
            </button>
          </section>
        )}
        <div
          className={`report-trigger-shell report-trigger-shell--${preferences.color}`}
        >
          <button className="report-trigger" type="button" onClick={() => setOpen(true)}>
            <CircleAlert size={19} aria-hidden="true" />
            <span>{preferences.label || '신고하기'}</span>
          </button>
          <button
            className="report-customize-toggle"
            type="button"
            aria-label="신고 버튼 꾸미기"
            aria-expanded={customizeOpen}
            onClick={() => setCustomizeOpen((value) => !value)}
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {open && (
        <div
          className="report-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <form
            className="report-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-title"
            onSubmit={(event) => void handleSubmit(event)}
          >
            <header className="report-dialog-header">
              <div className="report-title-icon">
                <CircleAlert size={21} />
              </div>
              <div>
                <h2 id="report-title">신고하기</h2>
                <p>신고 사유를 선택하고 상세 내용을 작성해 주세요.</p>
              </div>
              <button
                className="report-close"
                type="button"
                aria-label="닫기"
                onClick={() => setOpen(false)}
              >
                <X size={20} />
              </button>
            </header>

            <div className="report-dialog-body">
              <label className="report-details-label" htmlFor="report-vehicle-number">
                신고 대상 차량번호 <span>(필수)</span>
              </label>
              <input
                id="report-vehicle-number"
                className="report-text-input"
                value={vehicleNumber}
                onChange={(event) => setVehicleNumber(event.target.value)}
                placeholder="예: 12가3456"
                maxLength={20}
                required
              />
              <p className="report-field-help">등록된 타인 소속 차량만 신고할 수 있습니다.</p>
              <fieldset className="report-reasons">
                <legend>신고 사유</legend>
                {reportReasons.map((item) => (
                  <label
                    className={`report-reason${reason === item.code ? ' selected' : ''}`}
                    key={item.code}
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      value={item.code}
                      checked={reason === item.code}
                      onChange={() => setReason(item.code)}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </fieldset>
              <label className="report-details-label" htmlFor="report-details">
                상세 내용 <span>(필수)</span>
              </label>
              <textarea
                id="report-details"
                className="report-textarea"
                placeholder="신고 내용을 입력해 주세요."
                rows={4}
                maxLength={500}
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                required
              />
              {submitError && <p className="report-error" role="alert">{submitError}</p>}
            </div>

            <footer className="report-dialog-footer">
              <button
                className="report-cancel"
                type="button"
                onClick={() => setOpen(false)}
              >
                닫기
              </button>
              <button className="report-submit" type="submit" disabled={submitting}>
                {submitting ? '접수 중…' : '신고 접수'}
              </button>
            </footer>
          </form>
        </div>
      )}
    </>
  );
}

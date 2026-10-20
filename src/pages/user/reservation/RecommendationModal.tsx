import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import type { ExtendedParkingSlot } from '../../admin/parking/status/parking';

interface RecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  slots: ExtendedParkingSlot[];
  onSelectAndBook: (slot: ExtendedParkingSlot, startDate: Date, endDate: Date) => void;
}

interface RecommendationResponse {
  parking_space_id: number;
  floor_no: number;
  zone_code: string;
  space_number: number;
}

export default function RecommendationModal({
  isOpen,
  onClose,
  slots,
  onSelectAndBook,
}: RecommendationModalProps) {
  const [loading, setLoading] = useState(false);
  const [recommendedSlot, setRecommendedSlot] = useState<ExtendedParkingSlot | null>(
    null,
  );
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  if (!isOpen) return null;

  const formatDateString = (date: Date | null) => {
    if (!date) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const compareDates = (first: Date, second: Date) => {
    const firstTime = new Date(first);
    const secondTime = new Date(second);
    firstTime.setHours(0, 0, 0, 0);
    secondTime.setHours(0, 0, 0, 0);
    return firstTime.getTime() - secondTime.getTime();
  };

  const getToday = () => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const today = getToday();
  const maxAllowedStartDate = new Date(today);
  maxAllowedStartDate.setDate(today.getDate() + 30);

  const getMaxEndDate = (start: Date) => {
    const maxEnd = new Date(start);
    maxEnd.setDate(start.getDate() + 2);
    return maxEnd;
  };

  const handleDateClick = (value: Date) => {
    setResultMessage(null);
    setRecommendedSlot(null);

    const clickedDate = new Date(value);
    clickedDate.setHours(0, 0, 0, 0);

    if (!startDate || endDate) {
      if (compareDates(clickedDate, today) < 0) {
        setResultMessage('오늘 이후의 날짜만 선택할 수 있습니다.');
        return;
      }
      if (compareDates(clickedDate, maxAllowedStartDate) > 0) {
        setResultMessage('예약 시작일은 오늘부터 30일 이내까지만 선택할 수 있습니다.');
        return;
      }
      setStartDate(clickedDate);
      setEndDate(null);
      return;
    }

    if (compareDates(clickedDate, startDate) < 0) {
      setStartDate(clickedDate);
      setEndDate(null);
      return;
    }

    if (compareDates(clickedDate, getMaxEndDate(startDate)) > 0) {
      setResultMessage('주차 이용 기간은 최대 3일까지 선택할 수 있습니다.');
      return;
    }

    setEndDate(clickedDate);
  };

  const getDateTileClassName = ({ date }: { date: Date }) => {
    const current = formatDateString(date);
    const start = formatDateString(startDate);
    const end = formatDateString(endDate);

    if (start && end && start === end && current === start) return 'range-single';
    if (start && current === start) return 'range-start';
    if (end && current === end) return 'range-end';
    if (start && end && current > start && current < end) return 'range-middle';
    return '';
  };

  const handleRunAnalysis = async () => {
    if (!startDate || !endDate) {
      setResultMessage('예약 시작일과 종료일을 달력에서 선택해 주세요.');
      return;
    }

    setLoading(true);
    setResultMessage(null);
    setRecommendedSlot(null);

    try {
      const apiBaseUrl = (
        import.meta.env.VITE_BOOT_API_BASE_URL_U || 'http://localhost/alpharking'
      ).replace(/\/$/, '');
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBaseUrl}/api/recmn/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          start_date: formatDateString(startDate),
          end_date: formatDateString(endDate),
        }),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          responseData?.message || `추천 요청에 실패했습니다. (${response.status})`,
        );
      }

      const recommendation = responseData as RecommendationResponse;
      const targetSpaceId = Number(recommendation.parking_space_id);
      const targetFloor = Number(recommendation.floor_no);
      const targetZone = String(recommendation.zone_code ?? '').trim().toUpperCase();
      const targetNumber = Number(recommendation.space_number);
      const matchedSlot = slots.find((slot) => {
        const slotSpaceId = Number(slot.parkingSpaceId);
        if (Number.isFinite(slotSpaceId) && slotSpaceId === targetSpaceId) {
          return true;
        }

        const rawSlotNumber = String(slot.slotNumber ?? '').trim();
        const numberMatch = rawSlotNumber.match(/[0-9]+/);
        const slotZone = String(
          slot.zoneCode ?? rawSlotNumber.match(/[A-C]/i)?.[0] ?? '',
        ).trim().toUpperCase();

        return (
          Number(slot.floor) === targetFloor &&
          slotZone === targetZone &&
          Number(numberMatch?.[0]) === targetNumber
        );
      });

      if (!matchedSlot) {
        throw new Error('추천 결과의 주차 공간을 화면에서 찾지 못했습니다.');
      }

      setRecommendedSlot(matchedSlot);
      setResultMessage(
        `지하 ${recommendation.floor_no}층 ${recommendation.zone_code}구역 ${String(
          recommendation.space_number,
        ).padStart(2, '0')}번 자리입니다. 해당 자리로 예약하시겠습니까?`,
      );
    } catch (error) {
      console.error('AI 주차 추천 실패:', error);
      setResultMessage(
        error instanceof Error ? error.message : '추천 처리 중 오류가 발생했습니다.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="ai-recommend-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="ai-recommend-modal"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="ai-recommend-header">
          <div>
            <h3>🤖 AI 스마트 주차 추천</h3>
            <p>
              현재 주차장 상태와 사용자 패턴을 분석하여 가장 적합한 주차 구역을 추천해
              드립니다.
            </p>
          </div>
          <button type="button" className="btn-close" onClick={onClose} />
        </div>

        <div className="ai-recommend-content">
          <p className="ai-recommend-hint">
            먼저 예약 기간을 선택한 뒤 '실행' 버튼을 눌러주세요.
          </p>

          <div className="ai-recommend-calendar">
            <div className="d-flex justify-content-between mb-2">
              <span>시작일: {startDate ? formatDateString(startDate) : '선택 필요'}</span>
              <span>종료일: {endDate ? formatDateString(endDate) : '선택 필요'}</span>
            </div>
            <Calendar
              onClickDay={handleDateClick}
              minDate={today}
              maxDate={getMaxEndDate(startDate ?? maxAllowedStartDate)}
              tileClassName={getDateTileClassName}
              value={endDate || startDate || today}
              calendarType="gregory"
            />
            <small className="text-muted d-block mt-2">
              시작일을 선택한 뒤 종료일을 선택해 주세요. 이용 기간은 최대 3일입니다.
            </small>
          </div>

          {loading && (
            <div className="text-center py-4">
              <div className="spinner-border text-primary mb-3" role="status"></div>
              <p className="text-muted">AI가 최적의 주차 공간을 분석 중입니다...</p>
            </div>
          )}

          {resultMessage && !loading && (
            <div className="ai-recommend-results">
              <h4>분석 결과</h4>
              <div className="ai-recommend-item">
                <div>
                  <strong>
                    {recommendedSlot
                      ? `${recommendedSlot.floor}층 - ${recommendedSlot.zoneCode ?? recommendedSlot.slotNumber.replace(/[0-9]/g, '')}구역 ${recommendedSlot.slotNumber.replace(/^[^0-9]*/, '').padStart(2, '0')}번`
                      : '추천 결과 없음'}
                  </strong>
                  <p>{resultMessage}</p>
                </div>

                {recommendedSlot && (
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => {
                        if (!startDate || !endDate) return;
                        onSelectAndBook(recommendedSlot, startDate, endDate);
                        onClose();
                      }}
                    >
                      예약하기
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={handleRunAnalysis}
                      disabled={loading}
                    >
                      재추천 받기
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <p className="ai-recommend-disclaimer">
            * AI 추천 자리는 실시간 현황에 따라 변동될 수 있으며, 예약 시점에 타인에 의해
            선점될 수 있습니다.
          </p>
        </div>

        <div className="modal-footer px-4 pb-4 border-0 d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-secondary px-4" onClick={onClose}>
            닫기
          </button>
          {!recommendedSlot && (
            <button
              type="button"
              className="btn btn-primary px-4"
              onClick={handleRunAnalysis}
              disabled={loading || !startDate || !endDate}
            >
              {loading ? '분석 중...' : '실행'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

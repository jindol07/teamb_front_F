import { useState } from 'react';
import type { ExtendedParkingSlot } from '../../admin/parking/status/parking';

interface RecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  slots: ExtendedParkingSlot[];
  onSelectAndBook: (slot: ExtendedParkingSlot) => void;
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

  if (!isOpen) return null;

  const handleRunAnalysis = () => {
    setLoading(true);
    setResultMessage(null);
    setRecommendedSlot(null);

    // AI 분석 시뮬레이션 (1.5초 지연)
    setTimeout(() => {
      setLoading(false);

      // 빈 슬롯 중 첫 번째 자리를 추천 자리로 선정 (없으면 첫 번째 슬롯)
      const targetSlot =
        slots.find((s) => s.status === 'EMPTY' && s.slotType !== 'DISABLED') || slots[0];

      if (targetSlot) {
        setRecommendedSlot(targetSlot);
        setResultMessage(
          `AI 분석 완료: ${targetSlot.floor}층 ${targetSlot.slotNumber}구역이 출구와 가장 가깝고 비어있는 확률이 높습니다. 이 자리를 추천합니다!`,
        );
      } else {
        setResultMessage('현재 예약 가능한 주차 공간이 없습니다.');
      }
    }, 1500);
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
            아래 '실행' 버튼을 누르면 실시간 빅데이터 기반 분석이 시작됩니다.
          </p>

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
                      ? `${recommendedSlot.floor}층 - ${recommendedSlot.slotNumber} 구역`
                      : '추천 결과 없음'}
                  </strong>
                  <p>{resultMessage}</p>
                  <small>예상 소요 시간 단축: 약 3분</small>
                </div>

                {recommendedSlot && (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => {
                      onSelectAndBook(recommendedSlot);
                      onClose();
                    }}
                  >
                    이 자리로 예약하기
                  </button>
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
              disabled={loading}
            >
              {loading ? '분석 중...' : '실행'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

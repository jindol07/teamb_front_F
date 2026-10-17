import { useState } from 'react';
import type { ExtendedParkingSlot } from '../../../shared/parking/parking';
import axios from 'axios';

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

  //10/15
  // const handleRunAnalysis = () => {
  //   setLoading(true);
  //   setResultMessage(null);
  //   setRecommendedSlot(null);

  //   // AI 분석 시뮬레이션 (1.5초 지연)
  //   setTimeout(() => {
  //     setLoading(false);

  //     // 빈 슬롯 중 첫 번째 자리를 추천 자리로 선정 (없으면 첫 번째 슬롯)
  //     const targetSlot =
  //       slots.find((s) => s.status === 'EMPTY' && s.slotType !== 'DISABLED') || slots[0];

  //     if (targetSlot) {
  //       setRecommendedSlot(targetSlot);
  //       setResultMessage(
  //         `AI 분석 완료: ${targetSlot.floor}층 ${targetSlot.slotNumber}구역이 출구와 가장 가깝고 비어있는 확률이 높습니다. 이 자리를 추천합니다!`,
  //       );
  //     } else {
  //       setResultMessage('현재 예약 가능한 주차 공간이 없습니다.');
  //     }
  //   }, 1500);
  // };

  const handleRunAnalysis = async () => {
    setLoading(true);
    setResultMessage(null);
    setRecommendedSlot(null);

    //부트 서버(사용자) 주소
    const BOOT_API_BASE_URL_U = import.meta.env.VITE_BOOT_API_BASE_URL_U
    // FastAPI 서버 주소
    const FASTAPI_BASE_URL = import.meta.env.VITE_AI_API_BASE_URL

    // 로그인 기능 구현 전까지 office_id = 1로 고정
    const officeId = 1;
    // 테스트용 예약 예정 시간 (나중에 React 예약시간 상태값으로 변경)
    const reservationAt = '2026-10-16T09:00:00';

    try {
      // Spring Boot에 사용자 과거 주차이력 조회 요청
      const response = await axios.get(`${BOOT_API_BASE_URL_U}/api/recmn/${officeId}`);

      // Spring Boot에서 반환한 주차이력 데이터
      const history = response.data;

      console.log('사용자 과거 주차이력:', history);

      if (!Array.isArray(history) || history.length === 0) {
        setResultMessage('사용자의 과거 주차이력이 없습니다.');
        return;
      }

      // 주차이력 조회 성공 메시지
      //setResultMessage(
      //`주차이력 ${history.length}건 조회 완료! AI 추천을 요청할 준비가 되었습니다.`,
      //);

      // 2. FastAPI 요청 형식에 맞게 변환
      const historyData = history.map((item) => ({
        entry_at: item.usage_date,
        zone_code: item.target_zone,
      }));

      const requestData = {
        office_id: officeId,
        reservation_at: reservationAt,
        history: historyData
      };

      console.log('FastAPI 요청 데이터:', requestData);

      const aiResponse = await axios.post(
        `${FASTAPI_BASE_URL}/api/recmn/predict`,
        requestData
      );

      // 5. FastAPI 추천 결과 수신
      const aiResult = aiResponse.data;

      console.log('AI 추천 결과:', aiResult);

      setResultMessage(
        `AI 분석 완료! 추천 결과: ${JSON.stringify(aiResult)}`
      );

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('요청 URL:', error.config?.url);
        console.error('상태 코드:', error.response?.status);

        // FastAPI가 반환한 검증 오류 목록
        const details = error.response?.data?.detail;

        if (Array.isArray(details)) {
          console.table(details);

          // 처음 5개 오류를 자세히 확인
          console.log(
            'FastAPI 검증 오류:',
            JSON.stringify(details.slice(0, 5), null, 2)
          );
        } else {
          console.error('서버 오류 상세:', error.response?.data);
        }
      }

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

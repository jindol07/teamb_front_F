import { useState } from 'react';
import styles from './Vehicle.module.css';
import type { AdditionalVehicleRequest } from './vehicleStore';

interface AdditionalVehicleDetailProps {
  request: AdditionalVehicleRequest;
  onBack: () => void;
  onApprove: (request: AdditionalVehicleRequest) => void;
  onReject: (
    request: AdditionalVehicleRequest,
    reason: string,
  ) => Promise<boolean>;
}

export interface RequestType {
  building?: string | null;
  officenumber ?: string | null;
}

export default function AdditionalVehicleDetail({
  request,
  onBack,
  onApprove,
  onReject,
}: AdditionalVehicleDetailProps) {
  const [showRejectModal, setShowRejectModal] =
    useState(false);

  const [rejectReason, setRejectReason] = useState('');

  const isPending = request.requeststatus === '접수';

  const openRejectModal = () => {
    setRejectReason('');
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectReason('');
  };

  const handleReject = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const reason = rejectReason.trim();

    if (!reason) {
      window.alert('반려 사유를 입력해주세요.');
      return;
    }

    const succeeded = await onReject(request, reason);
    if (succeeded) closeRejectModal();
  };

  const handleApprove = () => {
    onApprove(request);
  };

  return (
    <div className={styles.vehicleContent}>
      <div className={styles.contentHeader}>
        <div>
          <h3>신청 관리 상세</h3>
          <p>
            신청 차량의 정보를 확인하고 처리 상태를 관리합니다.
          </p>
        </div>

        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onBack}
        >
          신청 목록
        </button>
      </div>

      <div className={styles.vehicleSummary}>
        <div className={styles.summaryItem}>
          <span>신청 상태</span>
          <strong>{request.requeststatus}</strong>
        </div>

        <div className={styles.summaryItem}>
          <span>신청 번호</span>
          <strong>{request.id}</strong>
        </div>
      </div>

      <div className={styles.vehicleForm}>
        <div className={styles.formGroup}>
          <label>차량번호</label>
          <div className={styles.selectedUnit}>
            <strong>{request.vehiclenumber}</strong>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>차량 형태</label>
          <div className={styles.selectedUnit}>
            <span>{request.vehicletype}</span>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>차량 모델</label>
          <div className={styles.selectedUnit}>
            <span>{request.vehiclemodel || '-'}</span>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>차주명</label>
          <div className={styles.selectedUnit}>
            <span>{request.ownername || '-'}</span>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>호수</label>
          <div className={styles.selectedUnit}>
            <span>
              {request.officenumber ? ` ${request.officenumber}호` : ''}
            </span>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>등록 희망일</label>
          <div className={styles.selectedUnit}>
            <span>{request.registeredat || '-'}</span>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>신청 일시</label>
          <div className={styles.selectedUnit}>
            <span>
              {request.requestedat
                ? new Date(
                    request.requestedat,
                  ).toLocaleString('ko-KR')
                : '-'}
            </span>
          </div>
        </div>

        {request.requeststatus === '반려' && (
          <div className={styles.formGroup}>
            <label>반려 사유</label>
            <div className={styles.selectedUnit}>
              <span>
                {request.requestmemo || '반려 사유가 없습니다.'}
              </span>
            </div>
          </div>
        )}

        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onBack}
          >
            목록으로
          </button>

          {isPending && (
            <>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleApprove}
              >
                신청 승인
              </button>

              <button
                type="button"
                className={styles.secondaryButton}
                onClick={openRejectModal}
              >
                신청 반려
              </button>
            </>
          )}
        </div>
      </div>

      {/* 반려 사유 입력 모달 */}
      {showRejectModal && (
        <div
          className={styles.modalOverlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeRejectModal();
            }
          }}
        >
          <div
            className={styles.rejectModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="rejectModalTitle"
          >
            <div className={styles.modalHeader}>
              <div>
                <h3 id="rejectModalTitle">신청 반려</h3>
                <p>
                  신청을 반려하는 사유를 입력해주세요.
                </p>
              </div>

              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={closeRejectModal}
                aria-label="모달 닫기"
              >
                ×
              </button>
            </div>

            <div className={styles.modalRequestInfo}>
              <span>차량번호</span>
              <strong>{request.vehiclenumber}</strong>
            </div>

            <form onSubmit={handleReject}>
              <div className={styles.formGroup}>
                <label htmlFor="rejectReason">
                  반려 사유 <span className={styles.requiredMark}>*</span>
                </label>

                <textarea
                  id="rejectReason"
                  className={styles.rejectTextarea}
                  value={rejectReason}
                  onChange={(event) =>
                    setRejectReason(event.target.value)
                  }
                  placeholder="반려 사유를 입력해주세요."
                  rows={5}
                  maxLength={500}
                  autoFocus
                  required
                />

                <span className={styles.characterCount}>
                  {rejectReason.length}/500
                </span>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={closeRejectModal}
                >
                  취소
                </button>

                <button
                  type="submit"
                  className={styles.dangerButton}
                >
                  반려 확정
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

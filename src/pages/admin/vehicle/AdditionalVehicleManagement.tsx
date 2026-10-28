import { useState } from 'react';
import styles from './Vehicle.module.css';
import { useVehicleStore } from './vehicleStore';
import type { AdditionalVehicleRequest } from './vehicleStore';

// 추가 등록 신청 상태 정의
type AdditionalVehicleStatus = '접수' | '승인' | '반려' | '취소';
const REQUEST_PAGE_SIZE = 8;

// AdditionalVehicleManagement 컴포넌트 Props 인터페이스
interface AdditionalVehicleManagementProps {
  requests: AdditionalVehicleRequest[];
  onDetail: (request: AdditionalVehicleRequest) => void;
  onApprove: (request: AdditionalVehicleRequest) => Promise<boolean>;
  onReject: (request: AdditionalVehicleRequest, reason: string) => Promise<boolean>;
}

export default function AdditionalVehicleManagement({
  requests,
  onDetail,
  onApprove,
  onReject,
}: AdditionalVehicleManagementProps) {
  // Zustand 스토어에서 기존 차량 목록 가져오기 (중복 체크용)
  const vehicles = useVehicleStore((state) => state.vehicles);
  const fetchAdditionalVehicleRequests = useVehicleStore(
    (state) => state.fetchAdditionalVehicleRequests,
  );

  // 검색어 상태
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // 신청 상태 필터 상태 ('전체' 또는 특정 상태)
  const [statusFilter, setStatusFilter] = useState<'전체' | AdditionalVehicleStatus>(
    '전체',
  );

  // 반려 처리 대상 요청 객체 상태
  const [rejectTarget, setRejectTarget] = useState<AdditionalVehicleRequest | null>(null);
  const [approvalTarget, setApprovalTarget] = useState<AdditionalVehicleRequest | null>(null);

  // 반려 사유 입력 텍스트 상태
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setLoadError('');
    try {
      await fetchAdditionalVehicleRequests();
    } catch (error) {
      console.error('추가 차량 신청 목록 새로고침 실패:', error);
      setLoadError('신청 목록을 불러오지 못했습니다. 서버 연결과 API 응답을 확인해주세요.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // 검색어 및 상태 필터가 적용된 요청 목록 필터링
  const filteredRequests = requests.filter((request) => {
    const keyword = search.trim().toLowerCase();

    const matchesSearch =
      !keyword ||
      request.vehiclenumber.toLowerCase().includes(keyword) ||
      request.ownername.toLowerCase().includes(keyword) ||
      (request as any).building?.toLowerCase().includes(keyword) ||
      (request as any).officenumber?.toLowerCase().includes(keyword);

    const matchesStatus =
      statusFilter === '전체' || request.requeststatus === statusFilter;

    return matchesSearch && matchesStatus;
  });
  const pageCount = Math.max(1, Math.ceil(filteredRequests.length / REQUEST_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRequests = filteredRequests.slice(
    (currentPage - 1) * REQUEST_PAGE_SIZE,
    currentPage * REQUEST_PAGE_SIZE,
  );
  const firstVisiblePage = Math.max(1, Math.min(currentPage - 2, pageCount - 4));
  const pageNumbers = Array.from(
    { length: Math.min(5, pageCount) },
    (_, index) => firstVisiblePage + index,
  );

  // 추가 등록 신청 승인 핸들러
  const handleApprove = (request: AdditionalVehicleRequest) => {
    if (request.requeststatus !== '접수') {
      window.alert('접수 상태의 신청만 처리할 수 있습니다.');
      return;
    }

    // 기존 등록 차량 목록과 차량번호 중복 검사 (공백 제거 및 대소문자 무시)
    const duplicate = vehicles.some(
      (vehicle) =>
        vehicle.vehiclenumber.replace(/\s/g, '').toLowerCase() ===
        request.vehiclenumber.replace(/\s/g, '').toLowerCase(),
    );

    if (duplicate) {
      window.alert('동일한 차량번호가 기존 차량 목록에 이미 등록되어 있습니다.');
      return;
    }

    setApprovalTarget(request);
  };

  const confirmApprove = async () => {
    if (!approvalTarget || isApproving) return;

    setIsApproving(true);
    try {
      const succeeded = await onApprove(approvalTarget);
      if (succeeded) setApprovalTarget(null);
    } catch (error) {
      console.error('차량 신청 승인 처리 실패:', error);
      setLoadError('차량 신청 승인 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsApproving(false);
    }
  };

  // 추가 등록 신청 반려 확정 핸들러
  const handleReject = async () => {
    if (!rejectTarget || isRejecting) {
      return;
    }

    if (rejectTarget.requeststatus !== '접수') {
      window.alert('접수 중인 상태의 신청만 반려할 수 있습니다.');
      return;
    }

    if (!rejectReason.trim()) {
      window.alert('반려 사유를 입력해주세요.');
      return;
    }

    setIsRejecting(true);
    let succeeded = false;
    try {
      succeeded = await onReject(rejectTarget, rejectReason.trim());
    } catch (error) {
      console.error('차량 신청 반려 처리 실패:', error);
      window.alert('반려 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsRejecting(false);
    }
    if (!succeeded) return;

    // 반려 모드 초기화
    setRejectTarget(null);
    setRejectReason('');
  };

  return (
    <div className={styles.vehicleContent}>
      <div className={styles.contentHeader}>
        <div>
          <h3>추가 등록 차량 관리</h3>

          <p>사용자가 신청한 차량을 검토하고 승인 또는 반려합니다.</p>
        </div>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? '불러오는 중…' : '목록 새로고침'}
        </button>
      </div>

      {loadError && (
        <div role="alert" className={styles.requestLoadError}>
          {loadError}
        </div>
      )}

      {/* 요약 통계 영역 */}
      <div className={styles.vehicleSummary}>
        <button
          type="button"
          className={`${styles.summaryItem} ${styles.summaryItemButton} ${statusFilter === '전체' ? styles.summaryItemActive : ''}`}
          aria-pressed={statusFilter === '전체'}
          onClick={() => { setStatusFilter('전체'); setPage(1); }}
        >
          <span>전체 신청</span>

          <strong>
            {requests.length}
            <small>건</small>
          </strong>
        </button>

        <button
          type="button"
          className={`${styles.summaryItem} ${styles.summaryItemButton} ${statusFilter === '접수' ? styles.summaryItemActive : ''}`}
          aria-pressed={statusFilter === '접수'}
          onClick={() => { setStatusFilter('접수'); setPage(1); }}
        >
          <span>접수</span>

          <strong className={styles.summaryStopped}>
            {requests.filter((request) => request.requeststatus === '접수').length}
            <small>건</small>
          </strong>
        </button>

        <button
          type="button"
          className={`${styles.summaryItem} ${styles.summaryItemButton} ${statusFilter === '승인' ? styles.summaryItemActive : ''}`}
          aria-pressed={statusFilter === '승인'}
          onClick={() => { setStatusFilter('승인'); setPage(1); }}
        >
          <span>승인</span>

          <strong className={styles.summaryNormal}>
            {requests.filter((request) => request.requeststatus === '승인').length}
            <small>건</small>
          </strong>
        </button>

        <button
          type="button"
          className={`${styles.summaryItem} ${styles.summaryItemButton} ${statusFilter === '반려' ? styles.summaryItemActive : ''}`}
          aria-pressed={statusFilter === '반려'}
          onClick={() => { setStatusFilter('반려'); setPage(1); }}
        >
          <span>반려</span>

          <strong>
            {requests.filter((request) => request.requeststatus === '반려').length}
            <small>건</small>
          </strong>
        </button>
        <button
          type="button"
          className={`${styles.summaryItem} ${styles.summaryItemButton} ${statusFilter === '취소' ? styles.summaryItemActive : ''}`}
          aria-pressed={statusFilter === '취소'}
          onClick={() => { setStatusFilter('취소'); setPage(1); }}
        >
          <span>취소</span>

          <strong>
            {requests.filter((request) => request.requeststatus === '취소').length}
            <small>건</small>
          </strong>
        </button>
      </div>

      {/* 검색 및 필터 툴바 영역 */}
      <div className={styles.vehicleToolbar}>
        <div className={styles.searchBox}>
          <span aria-hidden="true">⌕</span>

          <input
            type="text"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="차량번호, 차주명 검색"
          />
        </div>

      </div>

      {/* 목록 렌더링 영역 */}
      {filteredRequests.length === 0 ? (
        <div className={styles.emptyVehicle}>
          <div className={styles.emptyIcon}>🚗</div>

          <strong>추가 등록 신청 내역이 없습니다.</strong>

          <p>검색어나 상태 필터를 확인해주세요.</p>
        </div>
      ) : (
        <div className={`${styles.vehicleTableWrap} ${styles.requestTableWrap}`}>
          <table className={styles.vehicleTable}>
            <thead>
              <tr>
                <th>차량번호</th>
                <th>차종</th>
                <th>차주</th>
                <th>호수</th>
                <th>신청일</th>
                <th>승인/반려일</th>
                <th>승인 상태</th>
                <th>관리</th>
              </tr>
            </thead>

            <tbody>
              {pageRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.vehiclenumber}</td>

                  <td>{request.vehicletype}</td>

                  <td>{request.ownername}</td>

                  <td>
                    {request.officenumber
                      ? /호$/.test(request.officenumber)
                      ? request.officenumber: `${request.officenumber}호` : '-'}
                  </td>

                  <td>{request.requestedat || '-'}</td>

                  <td>{request.reviewedat || '-'}</td>

                  <td>{request.requeststatus}</td>

                  <td>
                    {request.requeststatus === '접수' && (
                      <div className={styles.requestActions}>
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() => onDetail(request)}
                        >
                          상세보기
                        </button>
                        <button
                          type="button"
                          className={styles.primaryButton}
                          onClick={() => handleApprove(request)}
                        >
                          승인
                        </button>

                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() => {
                            setRejectTarget(request);
                            setRejectReason('');
                          }}
                        >
                          반려
                        </button>
                      </div>
                    )}
                    {request.requeststatus !== '접수' && (
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => onDetail(request)}
                      >
                        상세보기
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {filteredRequests.length > 0 && (
        <nav className={styles.vehiclePagination} aria-label="차량 신청 페이지">
          <span className={styles.vehiclePageSummary}>
            {(currentPage - 1) * REQUEST_PAGE_SIZE + 1}–{Math.min(currentPage * REQUEST_PAGE_SIZE, filteredRequests.length)} / {filteredRequests.length}건
          </span>
          <div className={styles.vehiclePageControls}>
            <button type="button" onClick={() => setPage(1)} disabled={currentPage === 1} aria-label="첫 페이지">«</button>
            <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} aria-label="이전 페이지">‹</button>
            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={pageNumber === currentPage ? styles.vehicleActivePage : undefined}
                onClick={() => setPage(pageNumber)}
                aria-current={pageNumber === currentPage ? 'page' : undefined}
                aria-label={`${pageNumber}페이지`}
              >
                {pageNumber}
              </button>
            ))}
            <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage === pageCount} aria-label="다음 페이지">›</button>
            <button type="button" onClick={() => setPage(pageCount)} disabled={currentPage === pageCount} aria-label="마지막 페이지">»</button>
          </div>
        </nav>
      )}

      {approvalTarget && (
        <div
          className={styles.modalOverlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isApproving) {
              setApprovalTarget(null);
            }
          }}
        >
          <section
            className={styles.rejectModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="approveModalTitle"
          >
            <div className={styles.modalHeader}>
              <div>
                <h3 id="approveModalTitle">차량 등록 승인</h3>
                <p>이 차량의 추가 등록 신청을 승인할까요?</p>
              </div>
              <button
                type="button"
                className={styles.modalCloseButton}
                aria-label="닫기"
                disabled={isApproving}
                onClick={() => setApprovalTarget(null)}
              >
                ×
              </button>
            </div>

            <div className={styles.modalRequestInfo}>
              <span>차량번호</span>
              <strong>{approvalTarget.vehiclenumber}</strong>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={isApproving}
                onClick={() => setApprovalTarget(null)}
              >
                취소
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                disabled={isApproving}
                onClick={() => void confirmApprove()}
              >
                {isApproving ? '승인 중…' : '승인 확정'}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* 반려 사유 모달 */}
      {rejectTarget && (
        <div
          className={styles.modalOverlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isRejecting) {
              setRejectTarget(null);
              setRejectReason('');
            }
          }}
        >
          <section
            className={styles.rejectModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="rejectModalTitle"
          >
            <div className={styles.modalHeader}>
              <div>
                <h3 id="rejectModalTitle">추가 등록 신청 반려</h3>
                <p>반려 사유를 입력한 뒤 반려를 확정해주세요.</p>
              </div>
              <button
                type="button"
                className={styles.modalCloseButton}
                aria-label="닫기"
                disabled={isRejecting}
                onClick={() => {
                  setRejectTarget(null);
                  setRejectReason('');
                }}
              >
                ×
              </button>
            </div>

            <div className={styles.modalRequestInfo}>
              <span>차량번호</span>
              <strong>{rejectTarget.vehiclenumber}</strong>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="rejectReason">
                반려 사유 <span className={styles.requiredMark}>*</span>
              </label>
              <textarea
                id="rejectReason"
                className={styles.rejectTextarea}
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="반려 사유를 입력해주세요."
                rows={5}
                autoFocus
                disabled={isRejecting}
              />
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={isRejecting}
                onClick={() => {
                  setRejectTarget(null);
                  setRejectReason('');
                }}
              >
                취소
              </button>

              <button
                type="button"
                className={styles.dangerButton}
                onClick={handleReject}
                disabled={isRejecting}
              >
                {isRejecting ? '처리 중...' : '반려 확정'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import styles from './Vehicle.module.css';
import { useVehicleStore } from './vehicleStore';
import type { AdditionalVehicleRequest } from './vehicleStore';

// 추가 등록 신청 상태 정의
type AdditionalVehicleStatus = '접수' | '승인' | '반려' | '취소';

// AdditionalVehicleManagement 컴포넌트 Props 인터페이스
interface AdditionalVehicleManagementProps {
  requests: AdditionalVehicleRequest[];
  onDetail: (request: AdditionalVehicleRequest) => void;
  onApprove: (request: AdditionalVehicleRequest) => void;
  onReject: (request: AdditionalVehicleRequest, reason: string) => void;
}

export default function AdditionalVehicleManagement({
  requests,
  onDetail,
  onApprove,
  onReject,
}: AdditionalVehicleManagementProps) {
  // Zustand 스토어에서 기존 차량 목록 가져오기 (중복 체크용)
  const vehicles = useVehicleStore((state) => state.vehicles);

  // 검색어 상태
  const [search, setSearch] = useState('');

  // 신청 상태 필터 상태 ('전체' 또는 특정 상태)
  const [statusFilter, setStatusFilter] = useState<'전체' | AdditionalVehicleStatus>(
    '전체',
  );

  // 반려 처리 대상 요청 객체 상태
  const [rejectTarget, setRejectTarget] = useState<AdditionalVehicleRequest | null>(null);

  // 반려 사유 입력 텍스트 상태
  const [rejectReason, setRejectReason] = useState('');

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

    const confirmed = window.confirm(
      `${request.vehiclenumber} 차량의 추가 등록 신청을 승인하시겠습니까?`,
    );

    if (!confirmed) {
      return;
    }

    onApprove(request);
  };

  // 추가 등록 신청 반려 확정 핸들러
  const handleReject = () => {
    if (!rejectTarget) {
      return;
    }

    if (rejectTarget.requeststatus !== '접수') {
      window.alert('접수 중인 상태의 신청만 반려할 수 있습니다.');
      return;
    }

    const confirmed = window.confirm(
      `${rejectTarget.vehiclenumber} 차량의 신청을 반려하시겠습니까?`,
    );

    if (!confirmed) {
      return;
    }

    onReject(rejectTarget, rejectReason.trim());

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
      </div>

      {/* 요약 통계 영역 */}
      <div className={styles.vehicleSummary}>
        <div className={styles.summaryItem}>
          <span>전체 신청</span>

          <strong>
            {requests.length}
            <small>건</small>
          </strong>
        </div>

        <div className={styles.summaryItem}>
          <span>접수</span>

          <strong className={styles.summaryStopped}>
            {requests.filter((request) => request.requeststatus === '접수').length}
            <small>건</small>
          </strong>
        </div>

        <div className={styles.summaryItem}>
          <span>승인</span>

          <strong className={styles.summaryNormal}>
            {requests.filter((request) => request.requeststatus === '승인').length}
            <small>건</small>
          </strong>
        </div>

        <div className={styles.summaryItem}>
          <span>반려</span>

          <strong>
            {requests.filter((request) => request.requeststatus === '반려').length}
            <small>건</small>
          </strong>
        </div>
        <div className={styles.summaryItem}>
          <span>취소</span>

          <strong>
            {requests.filter((request) => request.requeststatus === '취소').length}
            <small>건</small>
          </strong>
        </div>
      </div>

      {/* 검색 및 필터 툴바 영역 */}
      <div className={styles.vehicleToolbar}>
        <div className={styles.searchBox}>
          <span aria-hidden="true">⌕</span>

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="차량번호, 차주명 검색"
          />
        </div>

        <select
          aria-label="신청 상태 필터"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as '전체' | AdditionalVehicleStatus)
          }
        >
          <option value="전체">전체 상태</option>
          <option value="접수">접수</option>
          <option value="승인">승인</option>
          <option value="반려">반려</option>
          <option value="취소">취소</option>
        </select>
      </div>

      {/* 목록 렌더링 영역 */}
      {filteredRequests.length === 0 ? (
        <div className={styles.emptyVehicle}>
          <div className={styles.emptyIcon}>🚗</div>

          <strong>추가 등록 신청 내역이 없습니다.</strong>

          <p>검색어나 상태 필터를 확인해주세요.</p>
        </div>
      ) : (
        <div className={styles.vehicleTableWrap}>
          <table className={styles.vehicleTable}>
            <thead>
              <tr>
                <th>차량번호</th>
                <th>차종</th>
                <th>차주</th>
                <th>호수</th>
                <th>신청일</th>
                <th>승인 상태</th>
                <th>관리</th>
              </tr>
            </thead>

            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.vehiclenumber}</td>

                  <td>{request.vehicletype}</td>

                  <td>{request.ownername}</td>

                  <td>
                    {request.officenumber
                      ? /호$/.test(request.officenumber)
                      ? request.officenumber: `${request.officenumber}호` : '-'}
                  </td>

                  <td>{request.registeredat || '-'}</td>

                  <td>{request.requeststatus}</td>

                  <td>
                    {/* 모든 상태에서 상세보기 표시 */}
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => onDetail(request)}
                    >
                      상세보기
                    </button>
                    {request.requeststatus === '접수' && (
                      <div className={styles.formActions}>
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
                          onClick={() => setRejectTarget(request)}
                        >
                          반려
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 반려 사유 입력 폼 영역 (반려 버튼 클릭 시 표시) */}
      {rejectTarget && (
        <div className={styles.vehicleContent}>
          <h3>추가 등록 신청 반려</h3>

          <p>차량번호: {rejectTarget.vehiclenumber}</p>

          <div className={styles.formGroup}>
            <label htmlFor="rejectReason">반려 사유</label>

            <textarea
              id="rejectReason"
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="반려 사유를 입력해주세요."
              rows={4}
            />
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => {
                setRejectTarget(null);
                setRejectReason('');
              }}
            >
              취소
            </button>

            <button type="button" className={styles.primaryButton} onClick={handleReject}>
              반려 확정
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import styles from './Vehicle.module.css';
import { useVehicleStore } from './vehicleStore';
import type { Vehicle } from './vehicleStore';
import { mockVehicleData } from '../../../mock/additionalMock'

type AdditionalVehicleStatus =
  | '승인대기'
  | '승인완료'
  | '승인반려';

interface AdditionalVehicleRequest extends Vehicle {
  requestStatus: AdditionalVehicleStatus;
  requestMemo?: string;
}

interface AdditionalVehicleManagementProps {
  requests: AdditionalVehicleRequest[];
  onApprove: (request: AdditionalVehicleRequest) => void;
  onReject: (
    request: AdditionalVehicleRequest,
    reason: string,
  ) => void;
}
// 컴파일러의 엄격한 타입 검사를 강제로 회피(우회)하기 위한 용도 => unknown(임시 데이터 받아오기 위해서 추후 수정)
export default function AdditionalVehicleManagement({
  requests = mockVehicleData as unknown as AdditionalVehicleRequest[],
  onApprove,
  onReject,
}: AdditionalVehicleManagementProps) {
  const vehicles = useVehicleStore(
    (state) => state.vehicles,
  );

  const [search, setSearch] = useState('');

  const [statusFilter, setStatusFilter] =
    useState<'전체' | AdditionalVehicleStatus>('전체');

  const [rejectTarget, setRejectTarget] =
    useState<AdditionalVehicleRequest | null>(null);

  const [rejectReason, setRejectReason] =
    useState('');

  const filteredRequests = requests.filter((request) => {
    const keyword = search.trim().toLowerCase();

    const matchesSearch =
      !keyword ||
      request.vehicleNumber.toLowerCase().includes(keyword) ||
      request.ownerName.toLowerCase().includes(keyword) ||
      request.building.toLowerCase().includes(keyword) ||
      request.unit.toLowerCase().includes(keyword);

    const matchesStatus =
      statusFilter === '전체' ||
      request.requestStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleApprove = (
    request: AdditionalVehicleRequest,
  ) => {
    if (request.requestStatus !== '승인대기') {
      window.alert('승인대기 상태의 신청만 처리할 수 있습니다.');
      return;
    }

    const duplicate = vehicles.some(
      (vehicle) =>
        vehicle.vehicleNumber.replace(/\s/g, '').toLowerCase() ===
        request.vehicleNumber.replace(/\s/g, '').toLowerCase(),
    );

    if (duplicate) {
      window.alert(
        '동일한 차량번호가 기존 차량 목록에 이미 등록되어 있습니다.',
      );
      return;
    }

    const confirmed = window.confirm(
      `${request.vehicleNumber} 차량의 추가 등록 신청을 승인하시겠습니까?`,
    );

    if (!confirmed) {
      return;
    }

    onApprove(request);
  };

  const handleReject = () => {
    if (!rejectTarget) {
      return;
    }

    if (rejectTarget.requestStatus !== '승인대기') {
      window.alert('승인대기 상태의 신청만 반려할 수 있습니다.');
      return;
    }

    const confirmed = window.confirm(
      `${rejectTarget.vehicleNumber} 차량의 신청을 반려하시겠습니까?`,
    );

    if (!confirmed) {
      return;
    }

    onReject(rejectTarget, rejectReason.trim());

    setRejectTarget(null);
    setRejectReason('');
  };

  return (
    <div className={styles.vehicleContent}>
      <div className={styles.contentHeader}>
        <div>
          <h3>추가 등록 차량 관리</h3>

          <p>
            사용자가 신청한 차량을 검토하고 승인 또는 반려합니다.
          </p>
        </div>
      </div>

      <div className={styles.vehicleSummary}>
        <div className={styles.summaryItem}>
          <span>전체 신청</span>

          <strong>
            {requests.length}
            <small>건</small>
          </strong>
        </div>

        <div className={styles.summaryItem}>
          <span>승인대기</span>

          <strong className={styles.summaryStopped}>
            {
              requests.filter(
                (request) =>
                  request.requestStatus === '승인대기',
              ).length
            }
            <small>건</small>
          </strong>
        </div>

        <div className={styles.summaryItem}>
          <span>승인완료</span>

          <strong className={styles.summaryNormal}>
            {
              requests.filter(
                (request) =>
                  request.requestStatus === '승인완료',
              ).length
            }
            <small>건</small>
          </strong>
        </div>

        <div className={styles.summaryItem}>
          <span>승인반려</span>

          <strong>
            {
              requests.filter(
                (request) =>
                  request.requestStatus === '승인반려',
              ).length
            }
            <small>건</small>
          </strong>
        </div>
      </div>

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
            setStatusFilter(
              event.target.value as
                | '전체'
                | AdditionalVehicleStatus,
            )
          }
        >
          <option value="전체">전체 상태</option>
          <option value="승인대기">승인대기</option>
          <option value="승인완료">승인완료</option>
          <option value="승인반려">승인반려</option>
        </select>
      </div>

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
                <th>동·호수</th>
                <th>신청일</th>
                <th>승인 상태</th>
                <th>관리</th>
              </tr>
            </thead>

            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.vehicleNumber}</td>

                  <td>{request.vehicleType}</td>

                  <td>{request.ownerName}</td>

                  <td>
                    {request.building}동 {request.unit}호
                  </td>

                  <td>{request.registeredAt || '-'}</td>

                  <td>{request.requestStatus}</td>

                  <td>
                    {request.requestStatus === '승인대기' ? (
                      <div className={styles.formActions}>
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
                    ) : (
                      <span>{request.requestStatus}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rejectTarget && (
        <div className={styles.vehicleContent}>
          <h3>추가 등록 신청 반려</h3>

          <p>
            차량번호: {rejectTarget.vehicleNumber}
          </p>

          <div className={styles.formGroup}>
            <label htmlFor="rejectReason">
              반려 사유
            </label>

            <textarea
              id="rejectReason"
              value={rejectReason}
              onChange={(event) =>
                setRejectReason(event.target.value)
              }
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

            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleReject}
            >
              반려 확정
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
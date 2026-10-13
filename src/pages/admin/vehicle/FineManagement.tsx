import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import styles from './Vehicle.module.css';
import { useVehicleStore } from './vehicleStore';
import type { Fine, FineReason, FineStatus } from './vehicleStore';
import type { FineForm, FineManagementProps } from './vehicleManage.interface';
import { createInitialFineForm } from './vehicleUtils';

export default function FineManagement({
  onVehicleDetail,
}: FineManagementProps) {
  const vehicles = useVehicleStore(
    (state) => state.vehicles,
  );

  const fines = useVehicleStore(
    (state) => state.fines,
  );

  const addFine = useVehicleStore(
    (state) => state.addFine,
  );

  const updateFine = useVehicleStore(
    (state) => state.updateFine,
  );

  const deleteFine = useVehicleStore(
    (state) => state.deleteFine,
  );

  const [fineForm, setFineForm] =
    useState<FineForm>(createInitialFineForm());

  const [editingFineId, setEditingFineId] =
    useState<number | null>(null);

  const [fineSearch, setFineSearch] =
    useState('');

  const [fineStatusFilter, setFineStatusFilter] =
    useState<'전체' | FineStatus>('전체');

  const resetFineForm = () => {
    setFineForm(createInitialFineForm());
    setEditingFineId(null);
  };

  const handleFineFormChange = (
    event: ChangeEvent<
      HTMLInputElement |
      HTMLSelectElement |
      HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target;

    setFineForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleFineSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const vehicleId = Number(fineForm.vehicleId);

    const amount = Number(
      fineForm.amount.replace(/,/g, ''),
    );

    if (!vehicleId) {
      window.alert('차량을 선택해주세요.');
      return;
    }

    if (!fineForm.violationDate) {
      window.alert('주차위반 날짜를 선택해주세요.');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      window.alert(
        '올바른 주정차 위반 금액을 입력해주세요.',
      );
      return;
    }

    const vehicleExists = vehicles.some(
      (vehicle) => vehicle.id === vehicleId,
    );

    if (!vehicleExists) {
      window.alert('선택한 차량을 찾을 수 없습니다.');
      return;
    }

    const fine: Fine = {
      id: editingFineId ?? Date.now(),
      vehicleId,
      violationDate: fineForm.violationDate,
      reason: fineForm.reason,
      amount,
      status: fineForm.status,
      memo: fineForm.memo.trim(),
    };

    if (editingFineId !== null) {
      updateFine(fine);
      window.alert('주정차 위반 정보가 수정되었습니다.');
    } else {
      addFine(fine);
      window.alert('주정차 위반 정보가 등록되었습니다.');
    }

    resetFineForm();
  };

  const handleEditFine = (fine: Fine) => {
    setEditingFineId(fine.id);

    setFineForm({
      vehicleId: String(fine.vehicleId),
      violationDate: fine.violationDate,
      reason: fine.reason,
      amount: String(fine.amount),
      status: fine.status,
      memo: fine.memo,
    });
  };

  const handleDeleteFine = (fine: Fine) => {
    const confirmed = window.confirm(
      '해당 주정차 위반 정보를 삭제하시겠습니까?',
    );

    if (!confirmed) {
      return;
    }

    deleteFine(fine.id);

    if (editingFineId === fine.id) {
      resetFineForm();
    }

    window.alert('주정차 위반 정보가 삭제되었습니다.');
  };

  const keyword = fineSearch.trim().toLowerCase();

  const filteredFines = fines.filter((fine) => {
    const vehicle = vehicles.find(
      (item) => item.id === fine.vehicleId,
    );

    const matchesKeyword =
      !keyword ||
      (vehicle?.vehicleNumber ?? '')
        .toLowerCase()
        .includes(keyword) ||
      (vehicle?.ownerName ?? '')
        .toLowerCase()
        .includes(keyword) ||
      fine.reason.toLowerCase().includes(keyword);

    const matchesStatus =
      fineStatusFilter === '전체' ||
      fine.status === fineStatusFilter;

    return matchesKeyword && matchesStatus;
  });

  return (
    <div className={styles.vehicleContent}>
      <div className={styles.contentHeader}>
        <div>
          <h3>주정차 관리</h3>
          <p>
            차량의 주정차 위반 정보를 관리합니다.
          </p>
        </div>
      </div>

      <div className={styles.vehicleSummary}>
        <div className={styles.summaryItem}>
          <span>전체 위반 건수</span>
          <strong>
            {fines.length}
            <small>건</small>
          </strong>
        </div>

        <div className={styles.summaryItem}>
          <span>조치 중</span>
          <strong className={styles.summaryStopped}>
            {
              fines.filter(
                (fine) => fine.status === '조치 중',
              ).length
            }
            <small>건</small>
          </strong>
        </div>

        <div className={styles.summaryItem}>
          <span>조치 완료</span>
          <strong className={styles.summaryNormal}>
            {
              fines.filter(
                (fine) => fine.status === '조치 완료',
              ).length
            }
            <small>건</small>
          </strong>
        </div>
      </div>

      <form
        className={styles.vehicleForm}
        onSubmit={handleFineSubmit}
      >
        <div className={styles.formGroup}>
          <label htmlFor="fineVehicleId">차량</label>

          <select
            id="fineVehicleId"
            name="vehicleId"
            value={fineForm.vehicleId}
            onChange={handleFineFormChange}
            required
          >
            <option value="">차량을 선택해주세요</option>

            {vehicles.map((vehicle) => (
              <option
                key={vehicle.id}
                value={vehicle.id}
              >
                {vehicle.vehicleNumber} -{' '}
                {vehicle.ownerName || '차주 미등록'}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="violationDate">위반일자</label>

          <input
            id="violationDate"
            name="violationDate"
            type="date"
            value={fineForm.violationDate}
            onChange={handleFineFormChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="fineReason">위반 사유</label>

          <select
            id="fineReason"
            name="reason"
            value={fineForm.reason}
            onChange={handleFineFormChange}
          >
            <option value="지정구역 위반">
              지정구역 위반
            </option>
            <option value="장기 주차">장기 주차</option>
            <option value="통행 방해">통행 방해</option>
            <option value="기타">기타</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="fineAmount">위반 금액</label>

          <input
            id="fineAmount"
            name="amount"
            type="number"
            min="1"
            value={fineForm.amount}
            onChange={handleFineFormChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="fineStatus">현재 차량 상태</label>

          <select
            id="fineStatus"
            name="status"
            value={fineForm.status}
            onChange={handleFineFormChange}
          >
            <option value="미조치">미조치</option>
            <option value="조치 중">조치 중</option>
            <option value="조치 완료">조치 완료</option>
            <option value="처리 불가">처리 불가</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="fineMemo">메모</label>

          <textarea
            id="fineMemo"
            name="memo"
            value={fineForm.memo}
            onChange={handleFineFormChange}
            placeholder="메모를 입력하세요."
            rows={4}
          />
        </div>

        <div className={styles.formActions}>
          {editingFineId !== null && (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={resetFineForm}
            >
              수정 취소
            </button>
          )}

          <button
            type="submit"
            className={styles.primaryButton}
          >
            {editingFineId !== null
              ? '주정차 위반 수정'
              : '주정차 위반 등록'}
          </button>
        </div>
      </form>

      {fines.length > 0 && (
        <div className={styles.vehicleToolbar}>
          <div className={styles.searchBox}>
            <span aria-hidden="true">⌕</span>

            <input
              type="text"
              value={fineSearch}
              onChange={(event) =>
                setFineSearch(event.target.value)
              }
              placeholder="차량번호, 차주명, 위반사유 검색"
            />
          </div>

          <select
            aria-label="위반 상태 필터"
            value={fineStatusFilter}
            onChange={(event) =>
              setFineStatusFilter(
                event.target.value as '전체' | FineStatus,
              )
            }
          >
            <option value="전체">전체</option>
            <option value="승인대기">승인대기</option>
            <option value="조치 중">조치 중</option>
            <option value="조치 완료">조치 완료</option>
            <option value="미조치">미조치</option>
            <option value="처리 불가">처리 불가</option>
          </select>
        </div>
      )}

      {fines.length === 0 ? (
        <div className={styles.emptyVehicle}>
          <div className={styles.emptyIcon}>📋</div>
          <strong>
            등록된 주정차 위반 정보가 없습니다.
          </strong>
          <p>
            차량을 선택하고 주정차 위반 사항을
            등록할 수 있습니다.
          </p>
        </div>
      ) : filteredFines.length === 0 ? (
        <div className={styles.emptySearch}>
          <strong>검색 결과가 없습니다.</strong>
          <p>검색어나 필터를 변경해주세요.</p>

          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => {
              setFineSearch('');
              setFineStatusFilter('전체');
            }}
          >
            필터 초기화
          </button>
        </div>
      ) : (
        <div className={styles.vehicleTableWrap}>
          <table className={styles.vehicleTable}>
            <thead>
              <tr>
                <th>차량번호</th>
                <th>위반일자</th>
                <th>위반 사유</th>
                <th>금액</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>

            <tbody>
              {filteredFines.map((fine) => {
                const vehicle = vehicles.find(
                  (item) => item.id === fine.vehicleId,
                );

                return (
                  <tr key={fine.id}>
                    <td>
                      <button
                        type="button"
                        className={styles.vehicleDetailLink}
                        onClick={() =>
                          onVehicleDetail(fine.vehicleId)
                        }
                      >
                        {vehicle?.vehicleNumber ?? '-'}
                      </button>
                    </td>

                    <td>{fine.violationDate}</td>
                    <td>{fine.reason}</td>
                    <td>{fine.amount.toLocaleString()}원</td>
                    <td>{fine.status}</td>

                    <td>
                      <div className={styles.formActions}>
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() => handleEditFine(fine)}
                        >
                          수정
                        </button>

                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() => handleDeleteFine(fine)}
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
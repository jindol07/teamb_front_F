import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import styles from './Vehicle.module.css';
import { useVehicleStore } from './vehicleStore';
import type { Fine, FineStatus } from './vehicleStore';
import type {FineForm, FineManagementProps } from './vehicleManage.interface';

import { createInitialFineForm } from './vehicleUtils';

export default function FineManagement({
  onVehicleDetail,
}: FineManagementProps) {
  // Zustand 스토어에서 차량 목록, 위반 목록 및 관련 액션 함수 가져오기
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

  // 주정차 위반 등록/수정 폼 입력 상태
  const [fineForm, setFineForm] =
    useState<FineForm>(createInitialFineForm());

  // 현재 수정 중인 위반 정보의 ID (null인 경우 신규 등록)
  const [editingFineId, setEditingFineId] =
    useState<number | null>(null);

  // 검색어 상태
  const [fineSearch, setFineSearch] =
    useState('');

  // 위반 상태 필터 상태 ('전체' 또는 특정 상태)
  const [fineStatusFilter, setFineStatusFilter] =
    useState<'전체' | FineStatus>('전체');

  // 폼 초기화 및 수정 모드 해제
  const resetFineForm = () => {
    setFineForm(createInitialFineForm());
    setEditingFineId(null);
  };

  // 폼 입력 값 변경 핸들러
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

  // 주정차 위반 등록/수정 폼 제출 핸들러
  const handleFineSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const vehicleid = Number(fineForm.vehicleid);

    const amount = Number(
      fineForm.amount.replace(/,/g, ''),
    );

    if (!vehicleid) {
      window.alert('차량을 선택해주세요.');
      return;
    }

    if (!fineForm.violationdate) {
      window.alert('주차위반 날짜를 선택해주세요.');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      window.alert(
        '올바른 주정차 위반 금액을 입력해주세요.',
      );
      return;
    }

    // 선택한 차량이 실제 존재하는지 확인 (vehicleid 기준)
    const vehicleExists = vehicles.some(
      (vehicle) => vehicle.vehicleid === vehicleid,
    );

    if (!vehicleExists) {
      window.alert('선택한 차량을 찾을 수 없습니다.');
      return;
    }

    const fine: Fine = {
      id: editingFineId ?? Date.now(),
      vehicleid,
      violationdate: fineForm.violationdate,
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

  // 수정 모드 진입 핸들러
  const handleEditFine = (fine: Fine) => {
    setEditingFineId(fine.id);

    setFineForm({
      vehicleid: String(fine.vehicleid),
      violationdate: fine.violationdate,
      reason: fine.reason,
      amount: String(fine.amount),
      status: fine.status,
      memo: fine.memo,
    });
  };

  // 주정차 위반 삭제 핸들러
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

  // 검색어 및 상태 필터가 적용된 위반 목록 필터링
  const filteredFines = fines.filter((fine) => {
    const vehicle = vehicles.find(
      (item) => item.vehicleid === fine.vehicleid,
    );

    const matchesKeyword =
      !keyword ||
      (vehicle?.vehiclenumber ?? '')
        .toLowerCase()
        .includes(keyword) ||
      (vehicle?.ownername ?? '')
        .toLowerCase()
        .includes(keyword) ||
      fine.reason.toLowerCase().includes(keyword);

    const matchesStatus =
      fineStatusFilter === '전체' ||
      fine.status === fineStatusFilter;

    return matchesKeyword && matchesStatus;
  });

  // 상태별 통계 카운트 계산
  const untreatedFineCount = fines.filter(
    (fine) => fine.status === '미조치',
  ).length;

  const processingFineCount = fines.filter(
    (fine) => fine.status === '조치 중',
  ).length;

  const completedFineCount = fines.filter(
    (fine) => fine.status === '조치 완료',
  ).length;

  const unprocessableFineCount = fines.filter(
    (fine) => fine.status === '처리 불가',
  ).length;

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

      {/* 요약 통계 영역 */}
      <div className={styles.vehicleSummary}>
        <div className={styles.summaryItem}>
          <span>전체 위반 건수</span>
          <strong>
            {fines.length}
            <small>건</small>
          </strong>
        </div>

        <div className={styles.summaryItem}>
          <span>미조치</span>
          <strong>
            {untreatedFineCount}
            <small>건</small>
          </strong>
        </div>

        <div className={styles.summaryItem}>
          <span>조치 중</span>
          <strong className={styles.summaryStopped}>
            {processingFineCount}
            <small>건</small>
          </strong>
        </div>

        <div className={styles.summaryItem}>
          <span>조치 완료</span>
          <strong className={styles.summaryNormal}>
            {completedFineCount}
            <small>건</small>
          </strong>
        </div>

        <div className={styles.summaryItem}>
          <span>처리 불가</span>
          <strong>
            {unprocessableFineCount}
            <small>건</small>
          </strong>
        </div>
      </div>

      {/* 위반 등록/수정 폼 영역 */}
      <form
        className={styles.vehicleForm}
        onSubmit={handleFineSubmit}
      >
        <div className={styles.formGroup}>
          <label htmlFor="fineVehicleId">차량</label>

          <select
            id="fineVehicleId"
            name="vehicleid"
            value={fineForm.vehicleid}
            onChange={handleFineFormChange}
            required
          >
            <option value="">
              차량을 선택해주세요
            </option>

            {vehicles.map((vehicle) => (
              <option
                key={vehicle.vehicleid}
                value={vehicle.vehicleid}
              >
                {vehicle.vehiclenumber} -{' '}
                {vehicle.ownername || '차주 미등록'}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="violationDate">
            위반일자
          </label>

          <input
            id="violationDate"
            name="violationDate"
            type="date"
            value={fineForm.violationdate}
            onChange={handleFineFormChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="fineReason">
            위반 사유
          </label>

          <select
            id="fineReason"
            name="reason"
            value={fineForm.reason}
            onChange={handleFineFormChange}
          >
            <option value="지정구역 위반">
              지정구역 위반
            </option>
            <option value="장기 주차">
              장기 주차
            </option>
            <option value="통행 방해">
              통행 방해
            </option>
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
          <label htmlFor="fineStatus">
            현재 차량 상태
          </label>

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

      {/* 검색 및 필터 툴바 영역 */}
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
            <option value="미조치">미조치</option>
            <option value="조치 중">조치 중</option>
            <option value="조치 완료">조치 완료</option>
            <option value="처리 불가">처리 불가</option>
          </select>
        </div>
      )}

      {/* 목록 렌더링 영역 */}
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
                  (item) => item.vehicleid === fine.vehicleid,
                );

                return (
                  <tr key={fine.id}>
                    <td>
                      <button
                        type="button"
                        className={styles.vehicleDetailLink}
                        onClick={() =>
                          onVehicleDetail(fine.vehicleid)
                        }
                      >
                        {vehicle?.vehiclenumber ?? '-'}
                      </button>
                    </td>

                    <td>{fine.violationdate}</td>

                    <td>{fine.reason}</td>

                    <td>
                      {fine.amount.toLocaleString()}원
                    </td>

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
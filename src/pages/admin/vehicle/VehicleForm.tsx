import type { FormEvent } from 'react';
import styles from './Vehicle.module.css';
import ApartmentMap from './apartment/ApartmentMap';
import type { VehicleFormProps } from './vehicleManage.interface';

export default function VehicleForm({
  editingVehicleId,
  vehicleForm,
  prediction,
  predictionChecked,
  isPredicting,
  onSubmit,
  onCancel,
  onChange,
  onPredict,
}: VehicleFormProps) {
  // 차량 등록 및 수정 폼 제출
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(vehicleForm);
  };

  // 상가 배치도에서 동·호수 선택
  const handleUnitSelect = (building: string, unit: string) => {
    onChange('building', building);
    onChange('unit', unit);
  };

  // 입력값 변경 처리
  const handleInputChange = (
    field: 'vehicleNumber' | 'ownerName' | 'vehicleModel' | 'registeredAt',
    value: string,
  ) => {
    onChange(field, value);
  };

  // 수정 모드 여부
  const isEditing = editingVehicleId !== null;

  return (
    <div className={styles.vehicleContent}>
      {/* 페이지 헤더 */}
      <div className={styles.contentHeader}>
        <div>
          <h3>{isEditing ? '차량 정보 수정' : '차량 등록'}</h3>

          <p>
            상가 배치도에서 세대를 선택하고 차량 정보를
            입력해주세요.
          </p>
        </div>

        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onCancel}
        >
          차량 등록 현황
        </button>
      </div>

      {/* 배치도 및 차량 입력 폼 */}
      <div className={styles.registerLayout}>
        {/* 상가 배치도 */}
        <div className={styles.apartmentMapArea}>
          <ApartmentMap
            selectedBuilding={vehicleForm.building}
            selectedUnit={vehicleForm.unit}
            onUnitSelect={handleUnitSelect}
          />
        </div>

        {/* 차량 정보 입력 */}
        <form
          className={styles.vehicleForm}
          onSubmit={handleSubmit}
        >
          {/* 선택한 동·호수 */}
          <div className={styles.formGroup}>
            <label>선택 호수</label>

            <div className={styles.selectedUnit}>
              {vehicleForm.building && vehicleForm.unit ? (
                <>
                  <strong>
                    {vehicleForm.building}동 {vehicleForm.unit}호
                  </strong>

                  <span>선택된 호수</span>
                </>
              ) : (
                <span>
                  상가 배치도에서 세대를 선택해주세요.
                </span>
              )}
            </div>
          </div>

          {/* 차량번호 및 차량 형태 조회 */}
          <div className={styles.formGroup}>
            <label htmlFor="vehicleNumber">차량번호</label>

            <div className={styles.inputWithButton}>
              <input
                id="vehicleNumber"
                name="vehicleNumber"
                value={vehicleForm.vehicleNumber}
                onChange={(event) =>
                  handleInputChange(
                    'vehicleNumber',
                    event.target.value,
                  )
                }
                placeholder="예: 12가 3456"
                autoComplete="off"
                required
              />

              <button
                type="button"
                className={styles.secondaryButton}
                onClick={onPredict}
                disabled={isPredicting}
              >
                {isPredicting ? '조회 중...' : '조회'}
              </button>
            </div>

            {predictionChecked && prediction && (
              <div className={styles.predictionResult}>
                차량 형태: <strong>{prediction.vehicleType}</strong>
              </div>
            )}
          </div>

          {/* 차량 형태 */}
          <div className={styles.formGroup}>
            <label htmlFor="vehicleType">차량 형태</label>

            <select
              id="vehicleType"
              name="vehicleType"
              value={vehicleForm.vehicleType}
              onChange={(event) =>
                onChange('vehicleType', event.target.value)
              }
            >
              <option value="승용차">승용차</option>
              <option value="SUV">SUV</option>
              <option value="승합차">승합차</option>
              <option value="경차">경차</option>
            </select>
          </div>

          {/* 차주 */}
          <div className={styles.formGroup}>
            <label htmlFor="ownerName">차주</label>

            <input
              id="ownerName"
              name="ownerName"
              value={vehicleForm.ownerName}
              onChange={(event) =>
                handleInputChange('ownerName', event.target.value)
              }
              placeholder="차주명을 입력하세요"
              required
            />
          </div>

          {/* 차량 모델 */}
          <div className={styles.formGroup}>
            <label htmlFor="vehicleModel">차량 모델</label>

            <input
              id="vehicleModel"
              name="vehicleModel"
              value={vehicleForm.vehicleModel}
              onChange={(event) =>
                handleInputChange('vehicleModel', event.target.value)
              }
              placeholder="차량 모델을 입력하세요"
            />
          </div>

          {/* 등록일 */}
          <div className={styles.formGroup}>
            <label htmlFor="registeredAt">등록일</label>

            <input
              id="registeredAt"
              name="registeredAt"
              type="date"
              value={vehicleForm.registeredAt}
              onChange={(event) =>
                handleInputChange('registeredAt', event.target.value)
              }
              required
            />
          </div>

          {/* 폼 버튼 */}
          <div className={styles.formActions}>
            {isEditing && (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={onCancel}
              >
                수정 취소
              </button>
            )}

            <button
              type="submit"
              className={styles.primaryButton}
            >
              {isEditing ? '수정 완료' : '차량 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
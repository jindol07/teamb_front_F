import styles from './Vehicle.module.css';

import type {
  VehicleListProps,
} from './vehicleManage.interface';

export default function VehicleList({
  vehicles,
  vehicleSearch,
  onSearchChange,
  onRegister,
  onDetail,
  onEdit,
  onDelete,
}: VehicleListProps) {
  const keyword = vehicleSearch.trim().toLowerCase();

  const filteredVehicles = vehicles.filter((vehicle) => {
    if (!keyword) return true;

    return (
      vehicle.vehiclenumber.toLowerCase().includes(keyword) ||
      vehicle.ownername.toLowerCase().includes(keyword) ||
      (vehicle as any).building?.toLowerCase().includes(keyword) ||
      (vehicle as any).unit?.toLowerCase().includes(keyword) ||
      vehicle.vehiclemodel.toLowerCase().includes(keyword)
    );
  });

  const originalCount = vehicles.filter(
    (vehicle) =>
      (vehicle.registrationtypecode ?? 'INITIAL') === 'INITIAL',
  ).length;

  const additionalCount = vehicles.filter(
    (vehicle) => vehicle.registrationtypecode === 'ADDITIONAL',
  ).length;

  return (
    <div className={styles.vehicleContent}>
      <div className={styles.contentHeader}>
        <div>
          <h3>차량 등록 현황</h3>
          <p>등록된 차량을 검색하여 관리할 수 있습니다.</p>
        </div>

        <button
          type="button"
          className={styles.primaryButton}
          onClick={onRegister}
        >
          + 차량 등록
        </button>
      </div>

      <div className={styles.vehicleSummary}>
        <div className={styles.summaryItem}>
          <span>전체 차량</span>
          <strong>
            {vehicles.length}<small>대</small>
          </strong>
        </div>

        <div className={styles.summaryItem}>
          <span>기존 등록 차량</span>
          <strong className={styles.summaryNormal}>
            {originalCount}<small>대</small>
          </strong>
        </div>

        <div className={styles.summaryItem}>
          <span>추가 등록 차량</span>
          <strong className={styles.summaryStopped}>
            {additionalCount}<small>대</small>
          </strong>
        </div>
      </div>

      {vehicles.length > 0 && (
        <div className={styles.vehicleToolbar}>
          <div className={styles.searchBox}>
            <span aria-hidden="true">⌕</span>
            <input
              type="text"
              value={vehicleSearch}
              onChange={(event) =>
                onSearchChange(event.target.value)
              }
              placeholder="차량번호, 차주명, 동·호수 검색"
            />
          </div>
        </div>
      )}

      {vehicles.length === 0 ? (
        <div className={styles.emptyVehicle}>
          <div className={styles.emptyIcon}>🚗</div>
          <strong>등록된 차량이 없습니다.</strong>
          <p>
            차량을 등록하면 이곳에서 차량 등록 현황을 확인할 수 있습니다.
          </p>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onRegister}
          >
            + 첫 차량 등록
          </button>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className={styles.emptySearch}>
          <strong>검색 결과가 없습니다.</strong>
          <p>검색어를 변경해주세요.</p>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => onSearchChange('')}
          >
            검색 초기화
          </button>
        </div>
      ) : (
        <div className={styles.vehicleTableWrap}>
          <table className={styles.vehicleTable}>
            <thead>
              <tr>
                <th>차량번호</th>
                <th>차종</th>
                <th>차량 모델</th>
                <th>차주</th>
                <th>호수</th>
                <th>등록일</th>
                <th>등록 구분</th>
                <th>관리</th>
              </tr>
            </thead>

            <tbody>
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.vehicleid}>
                  <td>
                    <button
                      type="button"
                      className={styles.vehicleDetailLink}
                      onClick={() => onDetail(vehicle.vehicleid)}
                    >
                      {vehicle.vehiclenumber}
                    </button>
                  </td>
                  <td>{vehicle.vehicletypecode}</td>
                  <td>{vehicle.vehiclemodel || '-'}</td>
                  <td>{vehicle.ownername || '-'}</td>
                  <td>
                    {(vehicle as any).building
                      ? `${(vehicle as any).building}동`
                      : '동 미지정'}
                    {(vehicle as any).unit ? ` ${(vehicle as any).unit}호` : ''}
                  </td>
                  <td>{vehicle.registeredat || '-'}</td>
                  <td>
                    {vehicle.registrationtypecode === 'ADDITIONAL'
                      ? '추가 등록'
                      : '기존 등록'}
                  </td>
                  <td>
                    <div className={styles.formActions}>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => onEdit(vehicle)}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => onDelete(vehicle)}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredVehicles.length > 0 && (
        <div className={styles.tableFooter}>
          총 <strong>{filteredVehicles.length}</strong>건
        </div>
      )}
    </div>
  );
}
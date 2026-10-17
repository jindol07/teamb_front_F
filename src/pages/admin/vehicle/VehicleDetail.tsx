import styles from './Vehicle.module.css';
import { useVehicleStore } from '../vehicle/vehicleStore';

interface VehicleDetailProps {
  vehicleId?: number | string; // 부모 컴포넌트에서 전달받는 차량 ID
  onBack?: () => void; // 목록으로 돌아가기 콜백
  onEdit?: (id: number) => void; // 수정 화면으로 이동하기 콜백
}

export default function VehicleDetail({ vehicleId, onBack, onEdit }: VehicleDetailProps) {
  const vehicles = useVehicleStore((state) => state.vehicles);
  const fines = useVehicleStore((state) => state.fines);
  const deleteVehicle = useVehicleStore((state) => state.deleteVehicle);

  // 전달받은 ID를 안전하게 숫자로 변환
  const numericId =
    vehicleId !== undefined && vehicleId !== '' ? Number(vehicleId) : null;

  // 스토어에서 차량 정보 찾기 (vehicleid 사용)
  const vehicle =
    numericId !== null
      ? (vehicles.find((item) => item.vehicleid === numericId) ?? null)
      : null;

  // 해당 차량의 주정차 위반 내역 필터링
  const vehicleFines =
    numericId !== null ? fines.filter((fine) => fine.vehicleid === numericId) : [];

  const handleDelete = async () => {
    if (!vehicle) return;

    const confirmed = window.confirm(
      `"${vehicle.vehiclenumber}" 차량을 삭제하시겠습니까?\n\n차량과 연결된 주정차 위반 정보도 함께 삭제됩니다.`,
    );

    if (!confirmed) return;

    try {
      await deleteVehicle(vehicle.vehicleid);
      alert('차량이 삭제되었습니다.');

      // 삭제 후 목록으로 복귀
      if (onBack) {
        onBack();
      }
    } catch (error) {
      alert('차량 삭제에 실패했습니다.');
    }
  };

  // 차량 정보를 찾지 못한 경우
  if (!vehicle) {
    return (
      <div className={styles.vehiclePage}>
        <h2 className={styles.pageTitle}>차량 상세정보</h2>

        <div className={styles.emptyVehicle}>
          <div className={styles.emptyIcon}>🚗</div>
          <strong>차량 정보를 찾을 수 없습니다.</strong>
          <p>삭제되었거나 존재하지 않는 차량입니다.</p>
          {onBack && (
            <button type="button" className={styles.primaryButton} onClick={onBack}>
              차량 등록 현황
            </button>
          )}
        </div>
      </div>
    );
  }

  // 정상 렌더링
  return (
    <div className={styles.vehiclePage}>
      <h2 className={styles.pageTitle}>차량 상세정보</h2>
      <p className={styles.pageDescription}>
        등록된 차량의 상세 정보를 확인할 수 있습니다.
      </p>

      <div className={styles.vehicleContent}>
        <div className={styles.contentHeader}>
          <div>
            <h3>{vehicle.vehiclenumber}</h3>
            <p>차량 등록 정보를 확인해주세요.</p>
          </div>

          {onBack && (
            <button type="button" className={styles.secondaryButton} onClick={onBack}>
              목록으로
            </button>
          )}
        </div>

        <div className={styles.vehicleDetail}>
          <div className={styles.vehicleDetailRow}>
            <span>차량번호</span>
            <strong>{vehicle.vehiclenumber}</strong>
          </div>

          <div className={styles.vehicleDetailRow}>
            <span>차량 형태</span>
            <strong>{vehicle.vehicletypecode}</strong>
          </div>

          <div className={styles.vehicleDetailRow}>
            <span>차량 모델</span>
            <strong>{vehicle.vehiclemodel || '-'}</strong>
          </div>

          <div className={styles.vehicleDetailRow}>
            <span>차주</span>
            <strong>{vehicle.ownername || '-'}</strong>
          </div>

          <div className={styles.vehicleDetailRow}>
            <span>상가 호수</span>
            <strong>
              {vehicle.officenumber ? `${vehicle.officenumber}호` : '호수 미지정'}
            </strong>
          </div>

          <div className={styles.vehicleDetailRow}>
            <span>등록일</span>
            <strong>{vehicle.registeredat || '-'}</strong>
          </div>
        </div>

        <div className={styles.vehicleDetailActions}>
          {onEdit && (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => onEdit(vehicle.vehicleid)}
            >
              수정
            </button>
          )}

          <button type="button" className={styles.secondaryButton} onClick={handleDelete}>
            삭제
          </button>
        </div>
      </div>

      {/* 주정차 위반 정보 영역 */}
      <div className={styles.vehicleContent}>
        <div className={styles.contentHeader}>
          <div>
            <h3>주정차 위반 정보</h3>
            <p>해당 차량의 주정차 위반 내역입니다.</p>
          </div>
        </div>

        {vehicleFines.length === 0 ? (
          <div className={styles.emptyVehicle}>
            <div className={styles.emptyIcon}>📋</div>
            <strong>주정차 위반 정보가 없습니다.</strong>
          </div>
        ) : (
          <div className={styles.vehicleTableWrap}>
            <table className={styles.vehicleTable}>
              <thead>
                <tr>
                  <th>위반일자</th>
                  <th>위반 사유</th>
                  <th>상태</th>
                  <th>벌금</th>
                  <th>메모</th>
                </tr>
              </thead>
              <tbody>
                {vehicleFines.map((fine) => (
                  <tr key={fine.id}>
                    <td>{fine.violationdate}</td>
                    <td>{fine.reason}</td>
                    <td>{fine.status}</td>
                    <td>{fine.amount.toLocaleString('ko-KR')} 원</td>
                    <td>{fine.memo || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

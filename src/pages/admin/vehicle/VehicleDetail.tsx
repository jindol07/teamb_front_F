import { useEffect, useState } from 'react';
import styles from './Vehicle.module.css';
import { useVehicleStore } from '../vehicle/vehicleStore';
import { fetchParkingUsages, type ParkingUsage } from '../parking/parkingUsage/parkingUsageApi';

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(date);
}

function formatParkingDuration(entryAt: string, exitAt: string | null): string {
  const start = new Date(entryAt).getTime();
  const end = exitAt ? new Date(exitAt).getTime() : Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return '—';
  const minutes = Math.floor((end - start) / 60_000);
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  const duration = hours > 0 ? `${hours}시간${remainder ? ` ${remainder}분` : ''}` : `${remainder}분`;
  return exitAt ? duration : `주차 중 · ${duration}`;
}

const REGISTRATION_STATUS_LABELS: Record<string, string> = {
  REGISTERED: '등록 완료',
  APPROVED: '승인 완료',
  REQUESTED: '승인 대기',
  REJECTED: '반려',
};

interface VehicleDetailProps {
  vehicleId?: number | string; // 부모 컴포넌트에서 전달받는 차량 ID
  onBack?: () => void; // 목록으로 돌아가기 콜백
  onEdit?: (id: number) => void; // 수정 화면으로 이동하기 콜백
}

export default function VehicleDetail({ vehicleId, onBack, onEdit }: VehicleDetailProps) {
  const vehicles = useVehicleStore((state) => state.vehicles);
  const fines = useVehicleStore((state) => state.fines);
  const deleteVehicle = useVehicleStore((state) => state.deleteVehicle);
  const [parkingHistory, setParkingHistory] = useState<ParkingUsage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [historyRefresh, setHistoryRefresh] = useState(0);

  // 전달받은 ID를 안전하게 숫자로 변환
  const numericId =
    vehicleId !== undefined && vehicleId !== '' ? Number(vehicleId) : null;

  // 스토어에서 차량 정보 찾기 (vehicleid 사용)
  const vehicle =
    numericId !== null
      ? (vehicles.find((item) => item.vehicleid === numericId) ?? null)
      : null;

  useEffect(() => {
    if (numericId === null) {
      setParkingHistory([]);
      setHistoryLoading(false);
      return;
    }

    const controller = new AbortController();
    setHistoryLoading(true);
    setHistoryError('');
    const normalizedNumber = vehicle?.vehiclenumber.replace(/\s/g, '').toLowerCase();

    fetchParkingUsages(controller.signal)
      .then((records) => {
        if (controller.signal.aborted) return;
        setParkingHistory(
          records
            .filter((record) =>
              record.vehicleId === numericId ||
              (!!normalizedNumber && record.vehicleNumber.replace(/\s/g, '').toLowerCase() === normalizedNumber),
            )
            .sort((a, b) => new Date(b.entryAt).getTime() - new Date(a.entryAt).getTime()),
        );
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error('차량 주차 이력 조회 실패:', error);
        setHistoryError('주차 이력을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setHistoryLoading(false);
      });

    return () => controller.abort();
  }, [numericId, vehicle?.vehiclenumber, historyRefresh]);

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

  const activeParkingCount = parkingHistory.filter((item) => !item.exitAt).length;
  const registrationStatus = REGISTRATION_STATUS_LABELS[vehicle.registrationstatuscode]
    ?? vehicle.registrationstatuscode
    ?? '상태 미확인';

  return (
    <div className={`${styles.vehiclePage} ${styles.vehicleDetailPage}`}>
      <header className={styles.detailPageHeader}>
        <div>
          <span className={styles.detailEyebrow}>VEHICLE MANAGEMENT</span>
          <h2>차량 상세정보</h2>
          <p>차량 정보와 주차 이용 내역을 한눈에 확인합니다.</p>
        </div>
        {onBack && (
          <button type="button" className={styles.secondaryButton} onClick={onBack}>
            ← 차량 목록
          </button>
        )}
      </header>

      <section className={styles.detailHero} aria-label="차량 요약">
        <div className={styles.detailHeroMain}>
          <div className={styles.detailVehicleIcon} aria-hidden="true">🚘</div>
          <div className={styles.detailHeroText}>
            <div className={styles.detailBadges}>
              <span className={styles.detailRegistrationBadge}>
                {vehicle.registrationtypecode === 'ADDITIONAL' ? '추가 등록' : '기존 등록'}
              </span>
              <span className={styles.detailStatusBadge}>{registrationStatus}</span>
            </div>
            <h1>{vehicle.vehiclenumber}</h1>
            <p>{vehicle.vehiclemodel || '차량 모델 미등록'} <span>·</span> {vehicle.ownername || '차주 미등록'}</p>
          </div>
        </div>
        <div className={styles.detailHeroActions}>
          {onEdit && (
            <button type="button" className={styles.detailActionButton} onClick={() => onEdit(vehicle.vehicleid)}>
              수정
            </button>
          )}
          <button type="button" className={styles.detailActionButton} onClick={handleDelete}>
            삭제
          </button>
        </div>
      </section>

      <section className={styles.detailStats} aria-label="차량 이용 요약">
        <article className={styles.detailStatCard}>
          <span>전체 주차 기록</span>
          <strong>{historyLoading ? '—' : parkingHistory.length}<small>회</small></strong>
        </article>
        <article className={styles.detailStatCard}>
          <span>현재 주차 중</span>
          <strong>{historyLoading ? '—' : activeParkingCount}<small>대</small></strong>
        </article>
        <article className={styles.detailStatCard}>
          <span>주정차 위반</span>
          <strong>{vehicleFines.length}<small>건</small></strong>
        </article>
      </section>

      <section className={styles.detailPanel} aria-labelledby="vehicle-info-title">
        <div className={styles.detailPanelHeader}>
          <div>
            <h3 id="vehicle-info-title">차량 정보</h3>
            <p>등록된 차량의 기본 정보입니다.</p>
          </div>
        </div>
        <div className={styles.detailInfoGrid}>
          <div className={styles.detailInfoItem}><span>차량번호</span><strong>{vehicle.vehiclenumber}</strong></div>
          <div className={styles.detailInfoItem}><span>차량 형태</span><strong>{vehicle.vehicletypecode || '—'}</strong></div>
          <div className={styles.detailInfoItem}><span>차량 모델</span><strong>{vehicle.vehiclemodel || '—'}</strong></div>
          <div className={styles.detailInfoItem}><span>차주</span><strong>{vehicle.ownername || '—'}</strong></div>
          <div className={styles.detailInfoItem}><span>상가 호수</span><strong>{vehicle.officenumber ? `${vehicle.officenumber}호` : '미지정'}</strong></div>
          <div className={styles.detailInfoItem}><span>등록일</span><strong>{vehicle.registeredat || '—'}</strong></div>
          <div className={styles.detailInfoItem}><span>최근 수정일</span><strong>{vehicle.updatedat || '—'}</strong></div>
        </div>
      </section>

      <section className={styles.detailPanel} aria-labelledby="parking-history-title">
        <div className={styles.detailPanelHeader}>
          <div>
            <h3 id="parking-history-title">주차 이력</h3>
            <p>차량의 입차·출차 기록을 최근 순으로 표시합니다.</p>
          </div>
          <span className={styles.detailPanelCount}>{parkingHistory.length}건</span>
        </div>

        {historyLoading ? (
          <div className={styles.detailEmptyState}>주차 이력을 불러오는 중입니다.</div>
        ) : historyError ? (
          <div className={styles.detailErrorState} role="alert">
            <span>{historyError}</span>
            <button type="button" className={styles.secondaryButton} onClick={() => setHistoryRefresh((count) => count + 1)}>
              다시 시도
            </button>
          </div>
        ) : parkingHistory.length === 0 ? (
          <div className={styles.detailEmptyState}>
            <span className={styles.detailEmptyIcon} aria-hidden="true">▤</span>
            <strong>아직 주차 이력이 없습니다.</strong>
            <p>이 차량의 입차·출차 기록이 생기면 여기에 표시됩니다.</p>
          </div>
        ) : (
          <div className={styles.detailTableWrap}>
            <table className={styles.detailTable}>
              <thead>
                <tr><th>입차 일시</th><th>출차 일시</th><th>주차 구역</th><th>유형</th><th>이용 시간</th></tr>
              </thead>
              <tbody>
                {parkingHistory.map((item) => (
                  <tr key={item.parkingUsageId}>
                    <td>{formatDateTime(item.entryAt)}</td>
                    <td>
                      {item.exitAt ? formatDateTime(item.exitAt) : <span className={styles.parkingActiveBadge}>주차 중</span>}
                    </td>
                    <td>{item.spaceCode || '구역 미배정'}</td>
                    <td>{item.parkingTypeCode || '—'}</td>
                    <td>{formatParkingDuration(item.entryAt, item.exitAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={styles.detailPanel} aria-labelledby="vehicle-fines-title">
        <div className={styles.detailPanelHeader}>
          <div>
            <h3 id="vehicle-fines-title">주정차 위반 정보</h3>
            <p>해당 차량의 위반 내역입니다.</p>
          </div>
          <span className={styles.detailPanelCount}>{vehicleFines.length}건</span>
        </div>
        {vehicleFines.length === 0 ? (
          <div className={styles.detailEmptyState}>
            <strong>주정차 위반 정보가 없습니다.</strong>
          </div>
        ) : (
          <div className={styles.detailTableWrap}>
            <table className={styles.detailTable}>
              <thead>
                <tr><th>위반 일자</th><th>위반 사유</th><th>상태</th><th>벌금</th><th>메모</th></tr>
              </thead>
              <tbody>
                {vehicleFines.map((fine) => (
                  <tr key={fine.id}>
                    <td>{fine.violationdate}</td>
                    <td>{fine.reason}</td>
                    <td>{fine.status}</td>
                    <td>{fine.amount.toLocaleString('ko-KR')}원</td>
                    <td>{fine.memo || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

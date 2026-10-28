/** 파일 안내
 * 용도: 전체 구획·사용중·오늘 예약·사용가능·사용불가를 표시하는 대시보드 카드.
 * 직접 사용처: AdminDashboard. 구획과 오늘 예약 건수는 부모에서 전달받는다.
 * 사용가능 면수는 전달된 구획 상태로 집계하며 예약 기록 수를 다시 빼지 않는다. 오늘 예약의 단위는 건이다.
 * 미조회·예약 조회 실패는 0 대신 대시로 표시하며 확인필요 구획은 사용가능에 넣지 않는다.
 */
import type { ExtendedParkingSlot } from '../../../shared/parking/parking';
import styles from './AdminDashboard.module.css';

interface SummaryCardsProps {
  slots: ExtendedParkingSlot[];
  ready: boolean;
  todayReservations: number | null;
  reservationDate: string;
  reservationError: string | null;
}

export default function SummaryCards({
  slots,
  ready,
  todayReservations,
  reservationDate,
  reservationError,
}: SummaryCardsProps) {
  // 사용불가 유형은 점유 상태보다 우선한다. 서로 다른 카드에 같은 구획을 중복 집계하지 않는다.
  const disabled = slots.filter(
    (slot) => slot.status === 'DISABLED' || slot.slotType === 'DISABLED',
  ).length;
  const occupied = slots.filter(
    (slot) => slot.status === 'OCCUPIED' && slot.slotType !== 'DISABLED',
  ).length;
  const available = slots.filter(
    (slot) => slot.status === 'EMPTY' && slot.slotType !== 'DISABLED',
  ).length;
  const unknown = slots.filter(
    (slot) => slot.status === 'UNKNOWN' && slot.slotType !== 'DISABLED',
  ).length;
  const cards = [
    {
      label: '전체 구획',
      value: ready ? slots.length : null,
      unit: '면',
      tone: 'neutral',
    },
    { label: '사용중', value: ready ? occupied : null, unit: '면', tone: 'occupied' },
    {
      label: '오늘 예약',
      value: reservationError ? null : todayReservations,
      unit: '건',
      tone: 'reserved',
    },
    { label: '사용가능', value: ready ? available : null, unit: '면', tone: 'available' },
    { label: '사용불가', value: ready ? disabled : null, unit: '면', tone: 'disabled' },
  ];
  return (
    <>
      <div className={styles.summaryGrid}>
        {cards.map((card) => (
          <div key={card.label} className={`${styles.summaryCard} ${styles[card.tone]}`}>
            <span className={styles.cardLabel}>
              <i aria-hidden="true" />
              {card.label}
            </span>
            <span className={styles.cardValue}>
              {card.value === null ? '—' : card.value.toLocaleString('ko-KR')}
              <small>{card.unit}</small>
            </span>
          </div>
        ))}
      </div>
      {reservationError && (
        <p className={styles.errorText} role="alert">
          오늘 예약 조회 실패: {reservationError}
        </p>
      )}
      {ready && unknown > 0 && (
        <p className={styles.muted}>
          상태 확인이 필요한 구획 {unknown}면은 사용가능에 포함하지 않습니다.
        </p>
      )}
      <p className={styles.caption}>
        오늘 예약은 {reservationDate} 확정·미취소 예약 건수입니다. 사용가능 면수는 구획
        상태로 집계합니다.
      </p>
    </>
  );
}

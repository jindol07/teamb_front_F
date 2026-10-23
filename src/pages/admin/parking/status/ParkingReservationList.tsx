/** [1023_1010] 파일 안내
 * 용도: 관리자 패널에서 한 구획의 전체 예약 이력을 조회·표시한다.
 * 직접 사용처: SlotDetailPanel의 예약 내역 탭.
 * fetchParkingReservationHistory → A ParkingSpaceController → ParkingSpaceService → parking-space.xml.
 * 과거·취소 예약도 표시한다. 30초 조회와 수동 새로고침을 지원하며 구획 변경 시 이전 요청을 취소한다.
 */
import { useEffect, useState } from 'react';
import { fetchParkingReservationHistory } from '../../../../shared/parking/parkingSpaceApi';
import type { ParkingReservationRecord } from '../../../../shared/parking/parkingSpaceApi';

export function ParkingReservationList({ spaceId }: { spaceId?: number }) {
  const [version, setVersion] = useState(0);
  const [rows, setRows] = useState<ParkingReservationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // [1023_1010] 구획 또는 수동 새로고침 버전이 바뀌면 새로 조회한다. 이전 요청·타이머는 해제한다.
  useEffect(() => {
    const controller = new AbortController();
    let inFlight = false;
    setRows([]);
    setLoading(true);
    // [1023_1010] 진행 중 조회가 있으면 겹치지 않는다. 실패 시 빈 목록을 정상 0건으로 표시하지 않고 오류를 표시한다.
    const load = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        if (spaceId == null) throw new Error('구획 ID를 확인할 수 없습니다.');
        const next = await fetchParkingReservationHistory(spaceId, controller.signal);
        if (!controller.signal.aborted) {
          setRows(next);
          setError(null);
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setRows([]);
          setError(cause instanceof Error ? cause.message : '예약 조회 실패');
        }
      } finally {
        inFlight = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 30000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [spaceId, version]);
  return (
    <div className="parking-reservations">
      <p>
        실제 예약 기록입니다. 구획 관리에서 수동으로 설정한 ‘예약됨’과 별도로 조회합니다.
      </p>
      <div className="parking-reservation-actions">
        <button type="button" disabled={loading} onClick={() => setVersion((v) => v + 1)}>
          새로고침
        </button>
      </div>
      <p>이 구획의 전체 예약 내역 · 날짜 제한 없음 · 한국 시간 기준</p>
      {loading ? (
        <p role="status">예약을 조회하고 있습니다.</p>
      ) : error ? (
        <p role="alert" className="text-danger">
          {error}
        </p>
      ) : (
        <>
          <strong>총 {rows.length}건</strong>
          {!rows.length && <p>이 구획에 저장된 예약이 없습니다.</p>}
          <ul className="parking-reservation-list">
            {rows.map((row) => (
              <li key={row.parkingReservationId}>
                <strong>
                  {row.reservationStartAt.replace('T', ' ')}
                  <br />~ {row.reservationEndAt.replace('T', ' ')}
                </strong>
                <div>차량번호: {row.vehicleNumber}</div>
                <span>
                  {(
                    {
                      CONFIRMED: '예약 확정',
                      CANCELED: '취소됨',
                      CANCELLED: '취소됨',
                    } as Record<string, string>
                  )[row.statusCode] ?? row.statusCode}{' '}
                  · #{row.parkingReservationId}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      <p>
        지난 예약과 취소된 예약도 포함하며 최근 예약일 순으로 표시합니다. 30초마다 다시
        조회합니다.
      </p>
    </div>
  );
}

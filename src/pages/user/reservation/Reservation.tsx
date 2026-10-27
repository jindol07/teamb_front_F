import { useEffect, useState, useCallback } from 'react';
import { FaCarSide } from 'react-icons/fa';
import MyBookingModal from './MyBookingModal';
import RecommendationModal from './RecommendationModal';
import { ParkingMapView } from '../../../shared/parking/ParkingMapView';
import { useParkingStore } from '../../../shared/parking/useParkingStore';
import { useParkingSpaceSync } from '../../../shared/parking/useParkingSpaceSync';
import { authFetch } from '../../../api/axios';
import type { ExtendedParkingSlot } from '../../../shared/parking/parking';
import './Reservation.css';

interface ReservationResponse {
  parking_reservation_id: number;
  parking_space_id: number;
  vehicle_id: number | null;
  vehicle_number: string;
  reservation_type_code: string;
  reservation_start_at: string;
  reservation_end_at: string;
  status_code: string;
}

export default function Reservation() {
  const { refresh: refreshParkingSpaces } = useParkingSpaceSync('user');
  const [reservation, setReservation] = useState<ReservationResponse | null>(null);
  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const rawSlots = useParkingStore((state) => state.slots);

  const [now, setNow] = useState(new Date());
  const [currentFloor, setCurrentFloor] = useState(1);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [reservationExpired, setReservationExpired] = useState(false);

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingSlot, setBookingSlot] = useState<ExtendedParkingSlot | null>(null);
  const [bookingDates, setBookingDates] = useState<{ startDate: Date; endDate: Date } | null>(null);
  const [isAiRecommendedBooking, setIsAiRecommendedBooking] = useState(false);
  const [isRecommendationModalOpen, setIsRecommendationModalOpen] = useState(false);

  // 백엔드에서 최신 예약 정보 불러오기 (HTML 응답 에러 방어 로직 포함)
  const loadReservationFromApi = useCallback(async () => {
    try {
      const response = await authFetch(
        import.meta.env.VITE_BOOT_API_BASE_URL_U + '/api/reservation',
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );


      if (!response.ok) {
        throw new Error(`예약 정보를 불러오지 못했습니다. 상태 코드: ${response.status}`);
      }

      // 서버가 JSON 대신 HTML(로그인/에러 페이지)을 줄 경우를 대비해 텍스트로 먼저 받기
      const text = await response.text();
      console.log(text);
      if (
        !text ||
        text.trim().startsWith('<!DOCTYPE') ||
        text.trim().startsWith('<!doctype') ||
        text.trim().startsWith('<html')
      ) {
        console.warn(
          '서버가 JSON 대신 HTML을 반환했습니다. 로그인이 필요할 수 있습니다.',
        );
        setReservations([]);
        setReservation(null);
        return;
      }

      const data = JSON.parse(text);

      const reservationList: ReservationResponse[] = Array.isArray(data)
        ? data
        : data && typeof data === 'object'
          ? [data]
          : [];
      const activeReservations = reservationList.filter(
        (item) => item.status_code !== 'CANCELED',
      );

      setReservations(activeReservations);
      setReservation((currentReservation) =>
        activeReservations.find(
          (item) =>
            item.parking_reservation_id ===
            currentReservation?.parking_reservation_id,
        ) ?? activeReservations[0] ?? null,
      );
    } catch (error) {
      console.error('예약 정보 조회 실패:', error);
      setReservations([]);
      setReservation(null);
    }
  }, []);

  // 5초마다 자동으로 최신 예약 상태 폴링
  useEffect(() => {
    loadReservationFromApi();

    const timer = window.setInterval(() => {
      loadReservationFromApi();
    }, 5000);

    return () => window.clearInterval(timer);
  }, [loadReservationFromApi]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!reservation || !reservation.reservation_end_at) {
      setRemainingTime(null);
      setReservationExpired(false);
      return;
    }

    const expirationDate = new Date(reservation.reservation_end_at);
    const expirationTime = expirationDate.getTime() - now.getTime();

    if (Number.isNaN(expirationTime) || expirationTime <= 0) {
      setRemainingTime(0);
      setReservationExpired(true);
      return;
    }

    setReservationExpired(false);
    setRemainingTime(expirationTime);
  }, [reservation, now]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (value: number) => String(value).padStart(2, '0');

    if (days > 0) {
      return `${days}일 ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const handleCancelReservation = async () => {
    if (!reservation) return;

    const selectedSpaceLabel = currentSlot
      ? `지하 ${currentSlot.floor}층 ${currentSlot.slotNumber}`
      : `주차 구획 ID ${reservation.parking_space_id}`;
    const confirmMessage =
      `${selectedSpaceLabel} · 차량 ${reservation.vehicle_number}\n` +
      '선택한 예약을 취소하시겠습니까?';

    if (!window.confirm(confirmMessage)) return;

    try {
      const response = await authFetch(
        import.meta.env.VITE_BOOT_API_BASE_URL_U + `/api/reservation/${reservation.parking_reservation_id}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error('예약 취소에 실패했습니다.');
      }

      setReservation(null);
      setReservations((currentReservations) =>
        currentReservations.filter(
          (item) =>
            item.parking_reservation_id !== reservation.parking_reservation_id,
        ),
      );
      setRemainingTime(null);
      setReservationExpired(false);
      alert('예약이 성공적으로 취소되었습니다.');

      loadReservationFromApi();
    } catch (error) {
      console.error('예약 취소 오류:', error);
      alert('예약 취소 중 오류가 발생했습니다.');
    }
  };

  const slots = rawSlots.map((parkingSlot) => {
    const isActiveReservation = reservations.some(
      (item) =>
        Number(item.parking_space_id) === Number(parkingSlot.parkingSpaceId) &&
        new Date(item.reservation_end_at).getTime() > now.getTime(),
    );

    if (!isActiveReservation || parkingSlot.status !== 'EMPTY') {
      return parkingSlot;
    }

    return { ...parkingSlot, status: 'RESERVED' as const };
  });
  const currentSlot =
    slots.find((s) => {
      if (!reservation) return false;
      return Number(reservation.parking_space_id) === Number(s.parkingSpaceId);
    }) ?? null;

  const selectedSlotId = currentSlot?.id ?? null;

  useEffect(() => {
    if (!reservation) return;

    const reservationSlot = rawSlots.find(
      (slot) =>
        Number(slot.parkingSpaceId) === Number(reservation.parking_space_id),
    );
    if (reservationSlot) setCurrentFloor(reservationSlot.floor);
  }, [reservation?.parking_space_id, rawSlots]);

  const handleReservationSlotClick = (slot: ExtendedParkingSlot) => {
    const selectedReservation = reservations.find(
      (item) => Number(item.parking_space_id) === Number(slot.parkingSpaceId),
    );
    if (!selectedReservation) return;

    setReservation(selectedReservation);
  };

  return (
    <div className="myreservation-page">
      <div className="reservation-header">
        <h2 className="page-title">&nbsp;주차 확인</h2>
        <p className="page-description">주차 현황과 예약 정보를 확인하세요.</p>
      </div>

      <div className="myreservation-grid">
        <div className="parking-status-area">
          <div className="parking-status-header">
            <div>
              <h4>&nbsp;주차 현황</h4>
              <p>
                {reservation
                  ? '내 예약 구획을 선택하면 해당 예약 정보를 확인할 수 있습니다.'
                  : '예약 후 주차 현황을 확인할 수 있습니다.'}
              </p>
            </div>
          </div>

          <div className="parking-status-board">
            {!reservation ? (
              <div className="text-center py-5">
                <div
                  style={{ fontSize: '3rem', marginBottom: '15px', color: 'cadetblue' }}
                >
                  <FaCarSide aria-hidden="true" />
                </div>
                <h4 className="fw-bold mb-2">주차 정보를 찾을 수 없습니다</h4>
                <p className="text-muted mb-4">
                  현재 진행 중인 주차 예약이 없습니다.
                  <br />
                  원하는 방식으로 예약을 진행해 보세요.
                </p>

                <div className="d-flex justify-content-center gap-2 flex-wrap">
                  <button
                    type="button"
                    className="btn btn-primary px-4 py-2 reservation-action-button"
                    onClick={() => {
                      setBookingSlot(null);
                      setIsAiRecommendedBooking(false);
                      setBookingDates(null);
                      setIsBookingModalOpen(true);
                    }}
                  >
                    바로 예약하기
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-success px-4 py-2 reservation-action-button"
                    onClick={() => setIsRecommendationModalOpen(true)}
                  >
                    AI 추천받기
                  </button>
                </div>
              </div>
            ) : (
              <div className="parking-reservation-map">
                <ParkingMapView
                  mode="user"
                  slots={slots}
                  currentFloor={currentFloor}
                  onFloorChange={setCurrentFloor}
                  onSlotClick={handleReservationSlotClick}
                  selectedSlotId={selectedSlotId}
                />
                <div className="reservation-map-legend" aria-label="도면 범례">
                  <span><i className="reservation-map-legend__reserved" /> 내 예약 구획</span>
                  <span><i className="reservation-map-legend__selected" /> 선택 중</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 예약 정보 */}
        <div className="reservation-summary-area">
          <div className="reservation-summary-header">
            <div>
              <h4>&nbsp;예약 확인</h4>
              <p>예약 정보를 확인하세요.</p>
            </div>
          </div>

          {reservation && (
            <div className="reservation-detail">
              <div className="reservation-card">
                <div className="reservation-card-header">
                  <div>
                    <h5>&nbsp;예약 정보</h5>
                    <p>현재 예약 내용을 확인하세요.</p>
                  </div>
                </div>

                <div className="reservation-info">
                  <div className="info-item">
                    <span>주차 구획</span>
                    <strong>
                      {currentSlot
                        ? `지하 ${currentSlot.floor}층 ${currentSlot.slotNumber}`
                        : `구획 ID ${reservation.parking_space_id}`}
                    </strong>
                  </div>
                  <div className="info-item">
                    <span>예약 기간</span>
                    <strong>
                      {reservation.reservation_start_at?.split('T')[0]} ~{' '}
                      {reservation.reservation_end_at?.split('T')[0]}
                    </strong>
                  </div>

                  <div className="info-item">
                    <span>차량 번호</span>
                    <div>
                      <strong>{reservation.vehicle_number}</strong>
                      <small className="vehicle-type-label">
                        {reservation.reservation_type_code === 'VISITOR'
                          ? '방문 차량'
                          : '내 차량'}
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              {/* 남은 시간 카드 */}
              <div className="reservation-card timer-card">
                <div className="reservation-card-header">
                  <div>
                    <h5>이용 만료까지 남은 시간</h5>
                    <p>종료일 23:59:59까지 주차 가능합니다.</p>
                  </div>
                </div>

                <div className="timer-content">
                  {reservationExpired ? (
                    <>
                      <div className="timer-expired">00:00:00</div>
                      <p>주차 이용 기간이 만료되었습니다.</p>
                    </>
                  ) : (
                    <>
                      <p>남은 이용 시간</p>
                      <div className="timer-value">
                        {remainingTime !== null ? formatTime(remainingTime) : '--:--:--'}
                      </div>
                      <small className="timer-warning">
                        종료일시 전까지 출차해주세요.
                      </small>
                    </>
                  )}
                </div>

                {!reservationExpired && (
                  <button
                    type="button"
                    className="btn btn-outline-danger w-100 mt-2"
                    onClick={handleCancelReservation}
                  >
                    선택한 예약 취소
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {isBookingModalOpen && (
        <MyBookingModal
          slot={bookingSlot}
          allowSlotChange={!isAiRecommendedBooking}
          allowDateChange={!isAiRecommendedBooking}
          initialStartDate={bookingDates?.startDate ?? null}
          initialEndDate={bookingDates?.endDate ?? null}
          onClose={() => {
            setIsBookingModalOpen(false);
            setBookingSlot(null);
            setIsAiRecommendedBooking(false);
            setBookingDates(null);
            void refreshParkingSpaces().catch((error) => {
              console.error('주차 현황 새로고침 실패:', error);
            });
            loadReservationFromApi();
          }}
        />
      )}

      <RecommendationModal
        isOpen={isRecommendationModalOpen}
        onClose={() => setIsRecommendationModalOpen(false)}
        slots={slots}
        onSelectAndBook={(selectedSlot, selectedStartDate, selectedEndDate) => {
          setBookingSlot(selectedSlot);
          setIsAiRecommendedBooking(true);
          setBookingDates({ startDate: selectedStartDate, endDate: selectedEndDate });
          setIsBookingModalOpen(true);
        }}
      />
    </div>
  );
}

import { useEffect, useState, useCallback } from 'react';
import { FaCarSide } from 'react-icons/fa';
import MyBookingModal from './MyBookingModal';
import RecommendationModal from './RecommendationModal';
import { ParkingMapView } from '../../../shared/parking/ParkingMapView';
import { useParkingStore } from '../../../shared/parking/useParkingStore';
import { useParkingSpaceSync } from '../../../shared/parking/useParkingSpaceSync';
import type { ExtendedParkingSlot } from '../../admin/parking/status/parking';
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
  const rawSlots = useParkingStore((state) => state.slots);

  const [now, setNow] = useState(new Date());
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [reservationExpired, setReservationExpired] = useState(false);

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingSlot, setBookingSlot] = useState<ExtendedParkingSlot | null>(null);
  const [bookingDates, setBookingDates] = useState<{ startDate: Date; endDate: Date } | null>(null);
  const [isAiRecommendedBooking, setIsAiRecommendedBooking] = useState(false);
  const [isRecommendationModalOpen, setIsRecommendationModalOpen] = useState(false);

  // 백엔드에서 최신 예약 정보 불러오기 (HTML 응답 에러 방어 로직 포함)
  const loadReservationFromApi = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(import.meta.env.VITE_BOOT_API_BASE_URL_U + '/api/reservation', {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
      });


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
        setReservation(null);
        return;
      }

      const data = JSON.parse(text);

      if (Array.isArray(data) && data.length > 0) {

        const activeReservations = data.filter(
          (r: ReservationResponse) => r.status_code !== 'CANCELED',
        );

        if (activeReservations.length > 0) {
          setReservation(activeReservations[activeReservations.length - 1]);
        } else {
          setReservation(null);
        }
      } else if (data && !Array.isArray(data) && data.status_code !== 'CANCELED') {
        setReservation(data);
      } else {
        setReservation(null);
      }
    } catch (error) {
      console.error('예약 정보 조회 실패:', error);
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

    if (!window.confirm('예약을 취소하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        import.meta.env.VITE_BOOT_API_BASE_URL_U + `/api/reservation/${reservation.parking_reservation_id}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error('예약 취소에 실패했습니다.');
      }

      setReservation(null);
      setRemainingTime(null);
      setReservationExpired(false);
      alert('예약이 성공적으로 취소되었습니다.');

      loadReservationFromApi();
    } catch (error) {
      console.error('예약 취소 오류:', error);
      alert('예약 취소 중 오류가 발생했습니다.');
    }
  };

  const slots = rawSlots;
  const currentSlot =
    slots.find((s) => {
      if (!reservation) return false;
      return Number(reservation.parking_space_id) === Number(s.parkingSpaceId);
    }) ?? null;

  const currentFloor = currentSlot?.floor ?? 1;
  const selectedSlotId = currentSlot?.id ?? null;

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
                  ? '현재 주차장의 주차 현황을 확인하세요.'
                  : '예약 후 주차 현황을 확인할 수 있습니다.'}
              </p>
            </div>
          </div>

          <div className="parking-status-board">
            {!reservation ? (
              <div className="text-center py-5">
                <div style={{ fontSize: '3rem', marginBottom: '15px', color: 'cadetblue' }}>
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
                  onFloorChange={() => {}}
                  onSlotClick={() => {}}
                  selectedSlotId={selectedSlotId}
                />
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
                    예약 취소
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

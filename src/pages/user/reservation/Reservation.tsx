import { useEffect, useState, useCallback } from 'react';
import MyBookingModal from './MyBookingModal'; // <-- 기존 BookingModal 대신 MyBookingModal 임포트
import RecommendationModal from './RecommendationModal';
import { ParkingMapView } from '../../admin/parking/status/ParkingMapView';
import { useParkingStore } from '../../admin/parking/status/useParkingStore';
import type { ExtendedParkingSlot } from '../../admin/parking/status/parking';
import './Reservation.css';

interface Reservation {
  date?: string;
  hour?: string | number;
  minute?: string | number;
  startDate?: string;
  endDate?: string;
  vehicleType?: 'my' | 'visitor';
  vehicleId?: string | null;
  vehicleLabel?: string;
  spaceId?: string | number | null;
  spaceNumber?: string;
  floor?: number;
  createdAt?: string;
  status?: string;
}

const RESERVATION_KEY = 'myReservation';

export default function Reservation() {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const slots = useParkingStore((state) => state.slots);

  const [now, setNow] = useState(new Date());
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [reservationExpired, setReservationExpired] = useState(false);

  // MyBookingModal 전용 상태 관리 (슬롯 정보 포함)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingSlot, setBookingSlot] = useState<ExtendedParkingSlot | null>(null);

  // RecommendationModal 전용 상태 관리
  const [isRecommendationModalOpen, setIsRecommendationModalOpen] = useState(false);

  const isValidReservation = (data: unknown): data is Reservation => {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const item = data as Reservation;

    return Boolean(
      (item.date && typeof item.date === 'string') ||
      (item.startDate &&
        typeof item.startDate === 'string' &&
        item.endDate &&
        typeof item.endDate === 'string'),
    );
  };

  const loadReservation = useCallback(() => {
    const saved = sessionStorage.getItem(RESERVATION_KEY);

    if (!saved) {
      setReservation(null);
      return;
    }

    try {
      const parsed: unknown = JSON.parse(saved);

      if (!isValidReservation(parsed)) {
        setReservation(null);
        return;
      }

      setReservation(parsed);
    } catch (error) {
      console.error('예약 정보 불러오기 실패:', error);
      setReservation(null);
    }
  }, []);

  useEffect(() => {
    loadReservation();

    const timer = window.setInterval(() => {
      loadReservation();
    }, 1000);

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === RESERVATION_KEY || event.key === null) {
        loadReservation();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const handleFocus = () => loadReservation();
    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadReservation]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!reservation) {
      setRemainingTime(null);
      setReservationExpired(false);
      return;
    }

    let expirationDate: Date;

    if (reservation.startDate && reservation.endDate) {
      const [year, month, day] = reservation.endDate.split('-').map(Number);
      expirationDate = new Date(year, month - 1, day, 23, 59, 59);
    } else if (reservation.date) {
      const hour = Number(reservation.hour ?? 0);
      const minute = Number(reservation.minute ?? 0);

      const baseDate = new Date(
        `${reservation.date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(
          2,
          '0',
        )}:00`,
      );
      expirationDate = new Date(baseDate.getTime() + 10 * 60 * 1000);
    } else {
      setRemainingTime(null);
      setReservationExpired(false);
      return;
    }

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

  const handleCancelReservation = () => {
    if (!reservation) {
      return;
    }

    if (!window.confirm('예약을 취소하시겠습니까?')) {
      return;
    }

    sessionStorage.removeItem(RESERVATION_KEY);

    setReservation(null);
    setRemainingTime(null);
    setReservationExpired(false);

    setIsBookingModalOpen(false);
  };

  const reservationDateLabel = reservation
    ? reservation.startDate && reservation.endDate
      ? `${reservation.startDate} ~ ${reservation.endDate}`
      : reservation.date || ''
    : '';

  const reservationTimeLabel = reservation
    ? reservation.date
      ? `${String(reservation.hour ?? '').padStart(2, '0')}:${String(
          reservation.minute ?? '',
        ).padStart(2, '0')}`
      : reservation.startDate && reservation.endDate
        ? '기간 예약'
        : ''
    : '';

  const currentSlot = reservation?.spaceId
    ? (slots.find((s) => String(s.id) === String(reservation.spaceId)) ?? null)
    : reservation?.spaceNumber
      ? (slots.find((s) => s.slotNumber === reservation.spaceNumber) ?? null)
      : null;

  const currentFloor = currentSlot?.floor ?? reservation?.floor ?? 1;
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
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🚗</div>
                <h4 className="fw-bold mb-2">주차 정보를 찾을 수 없습니다 :(</h4>
                <p className="text-muted mb-4">
                  현재 진행 중인 주차 예약이 없습니다.
                  <br />
                  원하는 방식으로 예약을 진행해 보세요.
                </p>

                <div className="d-flex justify-content-center gap-2 flex-wrap">
                  <button
                    type="button"
                    className="btn btn-primary px-4 py-2"
                    onClick={() => {
                      setBookingSlot(null); // 일반 예약은 지정 슬롯 없이 오픈
                      setIsBookingModalOpen(true);
                    }}
                  >
                    바로 예약하기
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-success px-4 py-2"
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
              {/* 예약 정보 카드 */}
              <div className="reservation-card">
                <div className="reservation-card-header">
                  <div>
                    <h5>&nbsp;예약 정보</h5>
                    <p>현재 예약 내용을 확인하세요.</p>
                  </div>
                </div>

                <div className="reservation-info">
                  <div className="info-item">
                    <span>주차 자리</span>
                    <strong>{reservation.spaceNumber || '지정석 없음'}</strong>
                  </div>

                  <div className="info-item">
                    <span>예약 날짜</span>
                    <strong>{reservationDateLabel}</strong>
                  </div>

                  <div className="info-item">
                    <span>차량</span>
                    <div>
                      <strong>
                        {reservation.vehicleLabel
                          ? reservation.vehicleType === 'visitor' &&
                            reservation.vehicleLabel.length > 4
                            ? `${reservation.vehicleLabel.slice(0, -4)}••••`
                            : reservation.vehicleLabel
                          : ''}
                      </strong>
                      {reservation.vehicleType && (
                        <small className="vehicle-type-label">
                          {reservation.vehicleType === 'my' ? '내 차량' : '방문 차량'}
                        </small>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 남은 시간 카드 */}
              <div className="reservation-card timer-card">
                <div className="reservation-card-header">
                  <div>
                    <h5>
                      {reservation.startDate
                        ? '이용 만료까지 남은 시간'
                        : '예약 취소까지 남은 시간'}
                    </h5>
                    <p>
                      {reservation.startDate
                        ? '종료일 23:59:59까지 주차 가능합니다.'
                        : '예약 시간 이후 10분까지 입차할 수 있습니다.'}
                    </p>
                  </div>
                </div>

                <div className="timer-content">
                  {reservationExpired ? (
                    <>
                      <div className="timer-expired">00:00:00</div>
                      <p>
                        {reservation.startDate
                          ? '주차 이용 기간이 만료되었습니다.'
                          : '예약 시간이 지나 자동 취소되었습니다.'}
                      </p>
                    </>
                  ) : (
                    <>
                      <p>{reservation.startDate ? '남은 이용 시간' : '예약 취소까지'}</p>
                      <div className="timer-value">
                        {remainingTime !== null ? formatTime(remainingTime) : '--:--:--'}
                      </div>
                      <small className="timer-warning">
                        {reservation.startDate
                          ? '종료일시 전까지 출차해주세요.'
                          : '마감 전까지 입차해주세요.'}
                      </small>
                    </>
                  )}
                </div>

                <div className="timer-date">
                  <span>{reservation.startDate ? '예약 기간' : '예약 시간'}</span>
                  <strong>
                    {reservationDateLabel}
                    {reservation.date && ` ${reservationTimeLabel}`}
                  </strong>
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

      {/* MyBookingModal (일반 예약 및 AI 추천 예약 연동) */}
      {isBookingModalOpen && (
        <MyBookingModal
          slot={bookingSlot}
          onClose={() => {
            setIsBookingModalOpen(false);
            setBookingSlot(null);
            loadReservation();
          }}
        />
      )}

      {/* RecommendationModal */}
      <RecommendationModal
        isOpen={isRecommendationModalOpen}
        onClose={() => setIsRecommendationModalOpen(false)}
        slots={slots}
        onSelectAndBook={(selectedSlot) => {
          setBookingSlot(selectedSlot); // AI가 추천한 슬롯을 주입
          setIsBookingModalOpen(true); // MyBookingModal 오픈
        }}
      />
    </div>
  );
}

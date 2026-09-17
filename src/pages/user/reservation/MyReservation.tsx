import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyReservation.css';

interface Reservation {
  date: string;
  hour: string;
  minute: string;
  vehicleType: 'my' | 'visitor';
  vehicleId: string | null;
  vehicleLabel: string;
  createdAt: string;
  status: string;
}

export default function MyReservation() {
  const navigate = useNavigate();

  const [reservation, setReservation] =
    useState<Reservation | null>(null);

  const [now, setNow] = useState(new Date());

  const [remainingTime, setRemainingTime] =
    useState<number | null>(null);

  const [reservationExpired, setReservationExpired] =
    useState(false);

  useEffect(() => {
    const savedReservation =
      sessionStorage.getItem('myReservation');

    if (!savedReservation) {
      navigate('/user/reservation');
      return;
    }

    try {
      setReservation(JSON.parse(savedReservation));
    } catch (error) {
      console.error('예약 정보 불러오기 실패', error);
      navigate('/user/reservation');
    }
  }, [navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!reservation) return;

    const reservationDate = new Date(
      `${reservation.date}T${String(reservation.hour).padStart(
        2,
        '0'
      )}:${String(reservation.minute).padStart(2, '0')}:00`
    );

    const expirationDate = new Date(
      reservationDate.getTime() + 10 * 60 * 1000
    );

    const expirationTime =
      expirationDate.getTime() - now.getTime();

    if (expirationTime <= 0) {
      setRemainingTime(0);
      setReservationExpired(true);
      return;
    }

    setReservationExpired(false);
    setRemainingTime(expirationTime);
  }, [reservation, now]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);

    const hours = Math.floor(totalSeconds / 3600);

    const minutes = Math.floor(
      (totalSeconds % 3600) / 60
    );

    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(
      minutes
    ).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleCancelReservation = () => {
    if (!window.confirm('예약을 취소하시겠습니까?')) {
      return;
    }

    sessionStorage.removeItem('myReservation');

    navigate('/user/reservation');
  };

  if (!reservation) {
    return null;
  }

  return (
    <div className="container py-4 myreservation-page">

      {/* 페이지 헤더 (Reservation.tsx와 완벽히 동일한 구조) */}
      <div className="reservation-header">
        <h2 className="page-title">
          나의 주차예약
        </h2>

        <p className="page-description">
          현재 예약 상태와 주차 현황을 확인하세요.
        </p>
      </div>

      <div className="myreservation-grid">

        {/* 첫 번째 열: 예약 정보 + 타이머 카드 세로 배치 */}
        <div className="myreservation-left">

          {/* 카드 1: 예약 정보 */}
          <div className="reservation-card">

            <div className="reservation-card-header">
              <span className="reservation-number">
                01
              </span>

              <div>
                <h5>예약 정보</h5>

                <p>
                  현재 예약 내용을 확인하세요.
                </p>
              </div>
            </div>

            <div className="reservation-info">

              <div className="info-item">
                <span>예약 날짜</span>

                <strong>
                  {reservation.date}
                </strong>
              </div>

              <div className="info-item">
                <span>예약 시간</span>

                <strong>
                  {String(reservation.hour).padStart(2, '0')}
                  :
                  {String(reservation.minute).padStart(2, '0')}
                </strong>
              </div>

              <div className="info-item">
                <span>차량</span>

                <div>
                  <strong>
                    {reservation.vehicleType === 'my'
                      ? reservation.vehicleLabel
                      : `${reservation.vehicleLabel.slice(
                          0,
                          -4
                        )}••••`}
                  </strong>

                  <small className="vehicle-type-label">
                    {reservation.vehicleType === 'my'
                      ? '내 차량'
                      : '방문 차량'}
                  </small>
                </div>
              </div>

            </div>

            <div
              className={`reservation-status ${
                reservationExpired ? 'expired' : ''
              }`}
            >
              {reservationExpired
                ? '예약 시간이 지나 자동 취소되었습니다.'
                : '예약이 정상적으로 접수되었습니다.'}
            </div>

          </div>


          {/* 카드 2: 예약 취소까지 남은 시간 (타이머) */}
          <div className="reservation-card timer-card">

            <div className="reservation-card-header">
              <span className="reservation-number">
                02
              </span>

              <div>
                <h5>
                  예약 취소까지 남은 시간
                </h5>

                <p>
                  예약 시간 이후 10분까지 입차할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="timer-content">

              {reservationExpired ? (
                <>
                  <div className="timer-expired">
                    00:00:00
                  </div>

                  <p>
                    예약 시간이 지나 자동 취소되었습니다.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    예약 취소까지
                  </p>

                  <div className="timer-value">
                    {remainingTime !== null
                      ? formatTime(remainingTime)
                      : '--:--:--'}
                  </div>

                  <small className="timer-warning">
                    예약 마감 전까지 입차해주세요.
                  </small>
                </>
              )}

            </div>

            <div className="timer-date">
              <span>예약 시간</span>

              <strong>
                {reservation.date}{' '}
                {String(reservation.hour).padStart(2, '0')}:
                {String(reservation.minute).padStart(2, '0')}
              </strong>
            </div>

            {!reservationExpired && (
              <button
                type="button"
                className="btn btn-outline-danger w-100 mt-3"
                onClick={handleCancelReservation}
              >
                예약 취소
              </button>
            )}

          </div>

        </div>


        {/* 두 번째 영역: 주차 현황 등 빈 공간 처리 (필요시 컴포넌트 확장) */}
        <div className="parking-status-area">
          {/* 현황표 영역 */}
        </div>

      </div>

    </div>
  );
}
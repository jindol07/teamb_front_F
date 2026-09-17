// src/pages/user/reservation/Reservation.tsx
import { FormEvent, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { myVehiclesMock } from '../../../mock/userMock';
import './Reservation.css';

// ==========================================
// 1. 타입 및 데이터, API 함수 정의
// ==========================================
export interface ParkingSpace {
  id: number;
  number: string;
  status: 'available' | 'reserved';
}

const USE_MOCK = true;

/**
 * 주차장 현황 조회 함수
 */
export const fetchParkingSpaces = async (): Promise<ParkingSpace[]> => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      // 추후 API 연동 시 실제 데이터를 받아올 부분
      setTimeout(() => resolve([]), 200);
    });
  }
  return [];
};

/**
 * 주차 예약 요청 페이로드 타입
 */
export interface ReservationPayload {
  date: string;
  hour: string;
  minute: string;
  vehicleType: 'my' | 'visitor';
  vehicleId: string | null;
  vehicleLabel: string;
  spaceId: number | null;
}

/**
 * 주차 예약 제출 함수
 */
export const submitReservation = async (data: ReservationPayload) => {
  if (USE_MOCK) {
    console.log('[Mock API] 예약 데이터 전송 성공:', data);
    
    const reservationData = {
      ...data,
      createdAt: new Date().toISOString(),
      status: 'reserved',
    };
    sessionStorage.setItem('myReservation', JSON.stringify(reservationData));

    return { success: true, message: '예약이 완료되었습니다.' };
  }
};


// ==========================================
// 2. React 메인 컴포넌트 (Default Export)
// ==========================================
export default function Reservation() {
  const navigate = useNavigate();

  // --- 주차장 현황 상태 (2/3 영역) ---
  const [spaces, setSpaces] = useState<ParkingSpace[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);

  // --- 예약 정보 입력 상태 (1/3 영역) ---
  const [date, setDate] = useState('');
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [message, setMessage] = useState('');
  const [vehicleType, setVehicleType] = useState<'my' | 'visitor'>('my');
  const [visitorNumber, setVisitorNumber] = useState('');
  const [selectedVisitorVehicle, setSelectedVisitorVehicle] = useState<{
    id: number;
    number: string;
  } | null>(null);

  // 페이지 진입 시 주차장 현황 불러오기
  useEffect(() => {
    loadParkingStatus();
  }, []);

  const loadParkingStatus = async () => {
    const data = await fetchParkingSpaces();
    setSpaces(data);
  };

  // 오늘 날짜 계산
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const selectedVehicle = myVehiclesMock.find((v) => String(v.id) === vehicleId);
  const hourList = Array.from({ length: 24 }, (_, index) => index);
  const minuteList = Array.from({ length: 60 }, (_, index) => index);

  const isToday = () => date === todayString;

  const isValidReservationTime = () => {
    if (!date || hour === '' || minute === '') return false;
    const reservationDate = new Date(`${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
    const minimumReservationTime = new Date(Date.now() + 5 * 60 * 1000);
    return reservationDate >= minimumReservationTime;
  };

  const isHourDisabled = (selectedHour: number) => {
    if (!date || !isToday()) return false;
    const minimumHour = new Date(Date.now() + 5 * 60 * 1000).getHours();
    return selectedHour < minimumHour;
  };

  const isMinuteDisabled = (selectedMinute: number) => {
    if (!date || hour === '' || !isToday()) return false;
    const selectedHour = Number(hour);
    const minTime = new Date(Date.now() + 5 * 60 * 1000);
    if (selectedHour < minTime.getHours()) return true;
    if (selectedHour > minTime.getHours()) return false;
    return selectedMinute < minTime.getMinutes();
  };

  const handleVisitorSearch = () => {
    if (visitorNumber.length !== 4) return;
    setSelectedVisitorVehicle({ id: 999, number: `12가${visitorNumber}` });
    setMessage('');
  };

  // 예약 제출 처리
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!date || hour === '' || minute === '' || selectedSpaceId === null || (vehicleType === 'my' && !vehicleId) || (vehicleType === 'visitor' && !selectedVisitorVehicle)) {
      setMessage('주차 자리, 날짜, 시간, 차량 정보를 모두 선택해주세요.');
      return;
    }

    if (!isValidReservationTime()) {
      setMessage('현재 시간보다 최소 5분 이후의 시간만 예약할 수 있습니다.');
      return;
    }

    const payload = {
      date,
      hour,
      minute,
      vehicleType,
      vehicleId: vehicleType === 'my' ? vehicleId : null,
      vehicleLabel: vehicleType === 'my' ? selectedVehicle?.label ?? '' : selectedVisitorVehicle?.number ?? '',
      spaceId: selectedSpaceId,
    };

    await submitReservation(payload);
    navigate('/user/myreservation');
  };

  return (
    <div className="container py-4 reservation-page">
      {/* 페이지 헤더 */}
      <div className="reservation-header">
        <h2 className="page-title">주차예약</h2>
        <p className="page-description">
          원하는 날짜와 시간을 선택해 주차를 예약하세요.
        </p>
      </div>

      {/* 2:1 그리드 레이아웃 (좌측 2: 주차 현황 / 우측 1: 예약 정보 입력) */}
      <div className="reservation-layout-grid mt-4">
        
        {/* =================================================================
            [2/3 영역] 주차장 실시간 현황 (하드코딩 더미 좌석 데이터 제거됨)
        ================================================================= */}
        <div className="parking-status-section">
          <div className="section-title-box">
            <h5>🚗 주차장 실시간 현황</h5>
            <span className="badge bg-secondary">실시간 연동</span>
          </div>
          <p className="section-desc">원하는 주차 자리를 먼저 선택해주세요.</p>

          <div className="parking-seat-grid">
            {spaces.length === 0 ? (
              <div className="col-span-full py-5 text-center text-muted w-100">
                해당 부분은 이제 현황표(실시간)와 연동해야 합니다.
              </div>
            ) : (
              spaces.map((space) => {
                const isSelected = space.id === selectedSpaceId;
                const isReserved = space.status === 'reserved';

                return (
                  <button
                    key={space.id}
                    type="button"
                    disabled={isReserved}
                    className={`parking-seat-item ${isReserved ? 'reserved' : isSelected ? 'selected' : 'available'}`}
                    onClick={() => {
                      setSelectedSpaceId(space.id);
                      setMessage('');
                    }}
                  >
                    <div className="seat-number">{space.number}</div>
                    <div className="seat-state-text">
                      {isReserved ? '예약됨' : isSelected ? '선택됨' : '빈 자리'}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>


        {/* =================================================================
            [1/3 영역] 예약하기 박스 (유지됨)
        ================================================================= */}
        <div className="reservation-card">

          <div className="reservation-card-header">
            <span className="reservation-number">01</span>
            <div>
              <h5>예약하기</h5>
              <p>
                선택된 자리: <strong>{selectedSpaceId ? spaces.find(s => s.id === selectedSpaceId)?.number : '없음'}</strong>
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>

            {/* 예약 날짜 */}
            <div className="mb-3">
              <label htmlFor="date" className="form-label">
                예약 날짜
              </label>
              <input
                type="date"
                id="date"
                className="form-control"
                value={date}
                min={todayString}
                onChange={(e) => {
                  setDate(e.target.value);
                  setHour('');
                  setMinute('');
                  setMessage('');
                }}
              />
            </div>

            {/* 예약 시간 */}
            <div className="mb-3">
              <label className="form-label">
                예약 시간
              </label>
              <div className="time-select-wrapper">
                {/* 시간 */}
                <select
                  className="form-select"
                  value={hour}
                  disabled={!date}
                  onChange={(e) => {
                    setHour(e.target.value);
                    setMinute('');
                    setMessage('');
                  }}
                >
                  <option value="">시간 선택</option>
                  {hourList.map((item) => (
                    <option
                      key={item}
                      value={item}
                      disabled={isHourDisabled(item)}
                    >
                      {String(item).padStart(2, '0')}시
                    </option>
                  ))}
                </select>

                {/* 분 */}
                <select
                  className="form-select"
                  value={minute}
                  disabled={!date || hour === ''}
                  onChange={(e) => {
                    setMinute(e.target.value);
                    setMessage('');
                  }}
                >
                  <option value="">분 선택</option>
                  {minuteList.map((item) => (
                    <option
                      key={item}
                      value={item}
                      disabled={isMinuteDisabled(item)}
                    >
                      {String(item).padStart(2, '0')}분
                    </option>
                  ))}
                </select>
              </div>
              <small className="form-text text-muted">
                현재 시간 기준 최소 5분 이후부터 예약할 수 있습니다.
              </small>
            </div>

            {/* 예약 차량 */}
            <div className="mb-3 reservation-vehicle">
              <label className="form-label">
                예약 차량
              </label>
              <p className="vehicle-description">
                주차할 차량을 선택해주세요.
              </p>

              {/* 내 차량 / 방문 차량 탭 */}
              <div className="vehicle-type-tabs">
                <button
                  type="button"
                  className={`vehicle-type-tab ${
                    vehicleType === 'my' ? 'active' : ''
                  }`}
                  onClick={() => {
                    setVehicleType('my');
                    setSelectedVisitorVehicle(null);
                    setVisitorNumber('');
                    setMessage('');
                  }}
                >
                  <span className="vehicle-type-icon">🚗</span>
                  <span>
                    <strong>내 차량</strong>
                    <small>등록된 차량 선택</small>
                  </span>
                </button>

                <button
                  type="button"
                  className={`vehicle-type-tab ${
                    vehicleType === 'visitor' ? 'active' : ''
                  }`}
                  onClick={() => {
                    setVehicleType('visitor');
                    setVehicleId('');
                    setMessage('');
                  }}
                >
                  <span className="vehicle-type-icon">👤</span>
                  <span>
                    <strong>방문 차량</strong>
                    <small>차량번호로 검색</small>
                  </span>
                </button>
              </div>

              {/* 내 차량 목록 */}
              {vehicleType === 'my' && (
                <div className="my-vehicle-list">
                  {myVehiclesMock.map((v) => (
                    <button
                      type="button"
                      key={v.id}
                      className={`my-vehicle-item ${
                        String(v.id) === vehicleId ? 'selected' : ''
                      }`}
                      onClick={() => {
                        setVehicleId(String(v.id));
                        setMessage('');
                      }}
                    >
                      <span className="vehicle-icon">🚗</span>
                      <span className="vehicle-name">{v.label}</span>
                      {String(v.id) === vehicleId && (
                        <span className="vehicle-check">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* 방문 차량 검색 */}
              {vehicleType === 'visitor' && (
                <div className="visitor-vehicle">
                  <div className="visitor-search">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="차량번호 뒷자리 4자리"
                      value={visitorNumber}
                      maxLength={4}
                      onChange={(e) => {
                        setVisitorNumber(
                          e.target.value.replace(/\D/g, '')
                        );
                        setSelectedVisitorVehicle(null);
                        setMessage('');
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={handleVisitorSearch}
                      disabled={visitorNumber.length !== 4}
                    >
                      차량 검색
                    </button>
                  </div>

                  {selectedVisitorVehicle && (
                    <div className="selected-visitor-vehicle mt-2">
                      <span>✓</span>
                      <div>
                        <strong>방문 차량 선택 완료</strong>
                        <p>
                          {selectedVisitorVehicle.number.slice(0, -4)}••••
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 예약 버튼 */}
            <button
              type="submit"
              className="btn btn-primary w-100 reservation-button"
              disabled={
                !date ||
                hour === '' ||
                minute === '' ||
                selectedSpaceId === null ||
                (vehicleType === 'my' && !vehicleId) ||
                (vehicleType === 'visitor' && !selectedVisitorVehicle) ||
                !isValidReservationTime()
              }
            >
              주차 예약하기
            </button>

            {message && (
              <div className="alert alert-info mt-3 mb-0">
                {message}
              </div>
            )}

          </form>

        </div>

      </div>
    </div>
  );
}
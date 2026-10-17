import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './MyBookingModal.css';
import VehicleSearchModal from './VehicleSearchModal';
import { ParkingMapView } from '../../../shared/parking/ParkingMapView';
import { useParkingStore } from '../../../shared/parking/useParkingStore';
import type { ExtendedParkingSlot } from '../../../shared/parking/parking';

interface MyBookingModalProps {
  slot: ExtendedParkingSlot | null;
  onClose: () => void;
}

interface VisitorVehicle {
  id: number;
  number: string;
}

interface ReservationRequest {
  parking_space_id: number;
  vehicle_id: number | null;
  vehicle_number: string;
  reservation_type_code: string;
  start_date_str: string;
  end_date_str: string;
}

export default function MyBookingModal({ slot, onClose }: MyBookingModalProps) {
  const navigate = useNavigate();
  const slots = useParkingStore((state) => state.slots);

  const [currentFloor, setCurrentFloor] = useState<number>(slot?.floor ?? 1);
  const [selectedSlot, setSelectedSlot] = useState<ExtendedParkingSlot | null>(slot);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [message, setMessage] = useState('');
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [selectedVisitorVehicle, setSelectedVisitorVehicle] =
    useState<VisitorVehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (slot) {
      setCurrentFloor(slot.floor);
      setSelectedSlot(slot);
    }
  }, [slot]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, isSubmitting]);

  const getToday = () => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const today = getToday();
  const maxAllowedStartDate = new Date(today);
  maxAllowedStartDate.setDate(today.getDate() + 30);

  const getMaxEndDate = (start: Date) => {
    const maxEnd = new Date(start);
    maxEnd.setDate(start.getDate() + 2);
    return maxEnd;
  };

  const formatDateString = (date: Date | null) => {
    if (!date) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const compareDates = (first: Date, second: Date) => {
    const firstTime = new Date(first);
    const secondTime = new Date(second);
    firstTime.setHours(0, 0, 0, 0);
    secondTime.setHours(0, 0, 0, 0);
    return firstTime.getTime() - secondTime.getTime();
  };

  const handleDateClick = (value: Date) => {
    setMessage('');
    const clickedDate = new Date(value);
    clickedDate.setHours(0, 0, 0, 0);

    if (!startDate || endDate) {
      if (compareDates(clickedDate, today) < 0) {
        setMessage('오늘 이후의 날짜만 선택할 수 있습니다.');
        return;
      }
      if (compareDates(clickedDate, maxAllowedStartDate) > 0) {
        setMessage('예약 시작일은 오늘부터 30일 이내까지만 선택할 수 있습니다.');
        return;
      }
      setStartDate(clickedDate);
      setEndDate(null);
      return;
    }

    const maxEndDate = getMaxEndDate(startDate);

    if (compareDates(clickedDate, startDate) < 0) {
      setStartDate(clickedDate);
      setEndDate(null);
      return;
    }

    if (compareDates(clickedDate, maxEndDate) > 0) {
      setMessage('주차 이용 기간은 최대 3일까지 선택할 수 있습니다.');
      return;
    }

    setEndDate(clickedDate);
  };

  const getDateTileClassName = ({ date }: { date: Date }) => {
    const current = formatDateString(date);
    const start = formatDateString(startDate);
    const end = formatDateString(endDate);

    if (start && end && start === end && current === start) return 'range-single';
    if (start && current === start) return 'range-start';
    if (end && current === end) return 'range-end';
    if (start && end && current > start && current < end) return 'range-middle';
    return '';
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setMessage('');

    if (!selectedSlot) {
      setMessage('주차할 구획을 선택해주세요.');
      return;
    }

    if (!startDate || !endDate || !selectedVisitorVehicle) {
      setMessage('시작일, 종료일, 방문 차량 정보를 모두 입력 및 선택해주세요.');
      return;
    }

    // 💡 BookingModal과 동일한 parking_space_id 계산 로직 적용
    let parkingSpaceId = 16;
    const slotIndex = slots.findIndex((s) => s.id === selectedSlot.id);
    if (slotIndex !== -1) {
      parkingSpaceId = 16 + slotIndex;
    } else {
      const numericMatch = selectedSlot.slotNumber?.replace(/[^0-9]/g, '');
      parkingSpaceId = numericMatch ? 15 + Number(numericMatch) : 16;
    }

    if (!Number.isSafeInteger(parkingSpaceId) || parkingSpaceId <= 0) {
      setMessage('주차 공간 ID를 확인할 수 없습니다.');
      return;
    }

    const request: ReservationRequest = {
      parking_space_id: parkingSpaceId,
      vehicle_id: selectedVisitorVehicle.id || null,
      vehicle_number: selectedVisitorVehicle.number,
      reservation_type_code: 'VISITOR',
      start_date_str: formatDateString(startDate),
      end_date_str: formatDateString(endDate),
    };

    setIsSubmitting(true);

    try {
      const targetUrl = '/alpharking/api/reservation';
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMsg =
          errorData?.message || `예약 등록에 실패했습니다. (${response.status})`;
        throw new Error(errorMsg);
      }

      alert('예약이 성공적으로 완료되었습니다.');
      onClose();
      navigate('/user/Reservation');
    } catch (error) {
      console.error('예약 등록 실패:', error);
      setMessage(
        error instanceof Error ? error.message : '예약 처리 중 오류가 발생했습니다.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="reservation-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        className="reservation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="reservation-modal-content">
          <div className="reservation-modal-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h3 id="booking-modal-title" className="mb-1 fw-bold fs-5">
                  주차 기간 예약
                </h3>
                <p className="text-muted mb-0 small">
                  선택한 주차 구획과 이용 기간을 확인하고 예약을 완료하세요.
                </p>
              </div>
              <button
                type="button"
                className="btn-close"
                aria-label="모달 닫기"
                onClick={onClose}
                disabled={isSubmitting}
              />
            </div>

            <div className="reservation-layout-grid">
              {/* 현황표 (모달 내부에서 직접 자리 선택 가능) */}
              <section className="parking-status-section">
                <div className="section-title-box">
                  <h5>주차장 현황 정보</h5>
                  <p className="section-desc">
                    이용 가능한 빈 자리를 클릭하여 선택하세요.
                  </p>
                </div>

                <div className="parking-map">
                  <ParkingMapView
                    mode="user"
                    slots={slots}
                    currentFloor={currentFloor}
                    onFloorChange={(floor) => setCurrentFloor(floor)}
                    onSlotClick={(clickedSlot) => {
                      const statusStr = String(clickedSlot.status).toUpperCase();
                      if (
                        statusStr === 'RESERVED' ||
                        statusStr === 'OCCUPIED' ||
                        clickedSlot.slotType === 'DISABLED'
                      ) {
                        setMessage('이미 예약되었거나 이용할 수 없는 자리입니다.');
                        return;
                      }
                      setSelectedSlot(clickedSlot);
                      setMessage('');
                    }}
                    selectedSlotId={selectedSlot?.id ?? null}
                  />
                </div>
              </section>

              {/* 예약 정보 입력 폼 */}
              <section className="reservation-card">
                <div className="reservation-card-header">
                  <h5>예약 정보 입력</h5>
                  <p>
                    선택된 자리:{' '}
                    <strong className="selected-space-text">
                      {selectedSlot ? selectedSlot.slotNumber : '선택 안됨'}
                    </strong>
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="reservation-form-section">
                    <label className="form-label fw-bold">주차 이용 기간 선택</label>

                    <div className="date-range-display">
                      <span className="text-primary fw-semibold">
                        {startDate ? formatDateString(startDate) : '시작일 선택'}
                      </span>
                      <span>{' ~ '}</span>
                      <span className="text-danger fw-semibold">
                        {endDate ? formatDateString(endDate) : '종료일 선택'}
                      </span>
                    </div>

                    <div className="calendar-wrapper">
                      <Calendar
                        onChange={(value) => {
                          if (value instanceof Date) {
                            handleDateClick(value);
                          }
                        }}
                        minDate={today}
                        maxDate={
                          startDate && !endDate
                            ? getMaxEndDate(startDate)
                            : maxAllowedStartDate
                        }
                        value={endDate || startDate || today}
                        tileClassName={getDateTileClassName}
                        calendarType="gregory"
                      />
                    </div>
                  </div>

                  <div className="reservation-form-section">
                    <label className="form-label fw-bold">방문 차량 번호</label>
                    <div className="visitor-search">
                      <input
                        type="text"
                        className="form-control bg-white"
                        placeholder="차량 검색을 이용해주세요"
                        value={selectedVisitorVehicle?.number ?? ''}
                        readOnly
                      />
                      <button
                        type="button"
                        className="btn btn-outline-primary text-nowrap"
                        onClick={() => setIsVehicleModalOpen(true)}
                        disabled={isSubmitting}
                      >
                        차량 검색
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 reservation-button"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? '예약 처리 중...' : '예약하기'}
                  </button>

                  {message && (
                    <div className="alert alert-info mt-3 mb-0" role="status">
                      {message}
                    </div>
                  )}
                </form>
              </section>
            </div>
          </div>
        </div>

        <VehicleSearchModal
          isOpen={isVehicleModalOpen}
          onClose={() => setIsVehicleModalOpen(false)}
          onSelectVehicle={(vehicleNumber) => {
            setSelectedVisitorVehicle({
              id: 0,
              number: vehicleNumber,
            });
            setMessage('');
          }}
        />
      </div>
    </div>
  );
}

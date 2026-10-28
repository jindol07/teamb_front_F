import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './BookingModal.css';
import VehicleSearchModal from './VehicleSearchModal';
import { ParkingMapView } from '../../../shared/parking/ParkingMapView';
import { useParkingStore } from '../../../shared/parking/useParkingStore';
import type { ExtendedParkingSlot } from '../../../shared/parking/parking';
import { authFetch } from '../../../api/axios';
import { useReservationAvailability } from './reservationAvailabilityApi';

interface BookingModalProps {
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

export default function BookingModal({ slot, onClose }: BookingModalProps) {
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
  const availability = useReservationAvailability(startDate, endDate ?? startDate);
  const dateAwareSlots = useMemo(() => {
    if (!startDate) return slots;
    if (!availability.availableSpaceIds) {
      return slots.map((parkingSlot) =>
        parkingSlot.status === 'EMPTY' || parkingSlot.status === 'RESERVED'
          ? { ...parkingSlot, status: 'UNKNOWN' as const }
          : parkingSlot,
      );
    }
    return slots.map((parkingSlot) => {
      if (parkingSlot.status === 'OCCUPIED' || parkingSlot.status === 'DISABLED'
          || parkingSlot.slotType === 'DISABLED') return parkingSlot;
      const isAvailable = parkingSlot.parkingSpaceId != null
        && availability.availableSpaceIds.has(parkingSlot.parkingSpaceId);
      return { ...parkingSlot, status: isAvailable ? 'EMPTY' as const : 'RESERVED' as const };
    });
  }, [slots, availability.availableSpaceIds, startDate]);

  // 🛑 [이중 방어 1] 모달이 렌더링될 때 선택된 자리가 빈 자리('EMPTY')가 아니면 즉시 모달 차단 및 닫기
  useEffect(() => {
    if (slot) {
      setCurrentFloor(slot.floor);
      setSelectedSlot(slot);
      if (slot.status !== 'EMPTY') {
        alert('이미 주차되어 있거나 예약된 자리입니다. 예약할 수 없습니다.');
        onClose();
      }
    }
  }, [slot, onClose]);

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
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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

    if (compareDates(clickedDate, startDate) < 0) {
      setStartDate(clickedDate);
      setEndDate(null);
      return;
    }

    if (compareDates(clickedDate, getMaxEndDate(startDate)) > 0) {
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

    // 🛑 [이중 방어 2] 제출 직전에도 한 번 더 상태 검증
    if (!selectedSlot || selectedSlot.status === 'OCCUPIED'
        || selectedSlot.status === 'DISABLED' || selectedSlot.slotType === 'DISABLED') {
      setMessage('이미 차 있는 자리는 예약할 수 없습니다.');
      return;
    }

    if (!startDate || !endDate || !selectedVisitorVehicle) {
      setMessage('시작일, 종료일, 방문 차량 정보를 모두 입력 및 선택해주세요.');
      return;
    }
    if (availability.error || !availability.availableSpaceIds) {
      setMessage(availability.error || '선택한 날짜의 자리 현황을 확인 중입니다.');
      return;
    }
    if (selectedSlot.parkingSpaceId == null
        || !availability.availableSpaceIds.has(selectedSlot.parkingSpaceId)) {
      setMessage('선택한 날짜에는 예약할 수 없는 자리입니다.');
      return;
    }
    let parkingSpaceId = selectedSlot.parkingSpaceId ?? 0;
    if (!parkingSpaceId) {
      const slotIndex = slots.findIndex((s) => s.id === selectedSlot.id);
      if (slotIndex !== -1) parkingSpaceId = 16 + slotIndex;
      else {
        const numericMatch = selectedSlot.slotNumber?.replace(/[^0-9]/g, '');
        parkingSpaceId = numericMatch ? 15 + Number(numericMatch) : 16;
      }
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
      const targetUrl = '/api/reservation';
      const response = await authFetch(import.meta.env.VITE_BOOT_API_BASE_URL_U + targetUrl, {
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
              <section className="parking-status-section">
                <div className="section-title-box">
                  <h5>주차장 현황 정보</h5>
                  <p className="section-desc">선택된 자리의 위치를 확인하세요.</p>
                </div>
                <div className="parking-map">
                  <ParkingMapView
                    mode="user"
                    slots={dateAwareSlots}
                    currentFloor={currentFloor}
                    onFloorChange={(floor) => setCurrentFloor(floor)}
                    onSlotClick={(clickedSlot) => {
                      if (availability.error || availability.loading) {
                        setMessage(availability.error || '선택한 날짜의 자리 현황을 확인 중입니다.');
                        return;
                      }
                      if (clickedSlot.status !== 'EMPTY' || clickedSlot.parkingSpaceId == null) {
                        setMessage(startDate
                          ? `${formatDateString(startDate)} ~ ${formatDateString(endDate ?? startDate)} 기간에는 예약할 수 없는 자리입니다.`
                          : '현재 이용 중이거나 이용할 수 없는 자리입니다.');
                        return;
                      }
                      setSelectedSlot(clickedSlot);
                      setMessage('');
                    }}
                    selectedSlotId={selectedSlot?.id ?? null}
                  />
                </div>
              </section>

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
                      <span> ~ </span>
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
          onSelectVehicle={(vehicle) => {
            setSelectedVisitorVehicle({
              id: vehicle.id,
              number: vehicle.number,
            });
            setMessage('');
          }}
        />
      </div>
    </div>
  );
}

/**
 * 사용자 주차현황 페이지 (SmartParkingStatus).
 * 주차구획은 관리자와 동일한 useParkingStore 데이터/parkingLayout 좌표를 재사용.
 * 현재 층은 이 페이지 내부 state로 관리하여 관리자와 층 선택을 분리.
 * 백엔드 웹소켓 연동을 통해 실시간 주차/예약 상태 동기화 지원.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ParkingMapView } from '../../../shared/parking/ParkingMapView';
import { useParkingStore } from '../../../shared/parking/useParkingStore';
import type { ExtendedParkingSlot } from '../../admin/parking/status/parking';
import ParkingReservationModal from '../reservation/ParkingReservationModal';

export default function SmartParkingStatus() {
  const slots = useParkingStore((state) => state.slots);
  const setSlots = useParkingStore((state) => state.setSlots);

  const [currentFloor, setCurrentFloor] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState<ExtendedParkingSlot | null>(null);
  const closeModal = useCallback(() => setSelectedSlot(null), []);

  // 1. 초기 예약 정보 로드 및 2. 웹소켓 실시간 동기화
  useEffect(() => {
    // 최초 진입 시 REST API로 전체 예약 상태 동기화
    const fetchInitialReservations = async () => {
      try {
        const response = await fetch('/alpharking/api/reservation', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const reservations = await response.json();
          if (Array.isArray(reservations) && slots.length > 0) {
            updateSlotsByReservations(reservations);
          }
        }
      } catch (error) {
        console.error('초기 예약 현황 동기화 실패:', error);
      }
    };

    // 예약 데이터 기반으로 슬롯 상태 업데이트 헬퍼 함수 (16 + slotIndex 계산식 완전 제거)
    const updateSlotsByReservations = (reservations: any[]) => {
      const updatedSlots = slots.map((slot) => {
        const matched = reservations.some((res: any) => {
          const resSpaceId = res.parkingSpaceId ?? res.parking_space_id;
          const isMatch = Number(resSpaceId) === Number(slot.id);
          const isCanceled =
            res.statusCode === 'CANCELED' || res.status_code === 'CANCELED';

          return isMatch && !isCanceled;
        });

        if (matched) {
          return { ...slot, status: 'RESERVED' as const };
        } else {
          if (slot.status === 'RESERVED') {
            return { ...slot, status: 'EMPTY' as const };
          }
          return slot;
        }
      });
      setSlots(updatedSlots);
    };

    fetchInitialReservations();

    // 💡 웹소켓(WebSocket) 연결 설정
    // 백엔드 웹소켓 엔드포인트 경로에 맞게 프로토콜(ws/wss) 자동 판별
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/alpharking/ws`; // 백엔드 웹소켓 주소

    let socket: WebSocket | null = null;

    try {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('🟢 주차현황 웹소켓 연결 성공');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📥 웹소켓 실시간 메시지 수신:', data);

          // 서버에서 단일 예약 변경 건 또는 전체 리스트를 보낼 때 유연하게 대응
          if (Array.isArray(data)) {
            updateSlotsByReservations(data);
          } else if (data) {
            // 단일 예약/구획 변경 이벤트인 경우 재조회 또는 직접 병합 처리
            fetchInitialReservations();
          }
        } catch (e) {
          console.error('웹소켓 메시지 파싱 에러:', e);
        }
      };

      socket.onerror = (error) => {
        console.error('🔴 주차현황 웹소켓 에러:', error);
      };

      socket.onclose = () => {
        console.log('⚪ 주차현황 웹소켓 연결 종료');
      };
    } catch (e) {
      console.error('웹소켓 초기화 실패:', e);
    }

    // 컴포넌트 언마운트 시 웹소켓 연결 해제
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [setSlots]);

  const floorSlots = slots.filter((slot) => slot.floor === currentFloor);
  const total = floorSlots.length;
  const occupied = floorSlots.filter(
    (slot) => slot.status === 'OCCUPIED' && slot.slotType !== 'DISABLED',
  ).length;
  const available = floorSlots.filter(
    (slot) => slot.status === 'EMPTY' && slot.slotType !== 'DISABLED',
  ).length;
  const reserved = floorSlots.filter(
    (slot) => slot.status === 'RESERVED' && slot.slotType !== 'DISABLED',
  ).length;

  const handleSlotClick = (slot: ExtendedParkingSlot) => {
    if (slot.status !== 'EMPTY' || slot.slotType === 'DISABLED') return;
    setSelectedSlot(slot);
  };

  return (
    <div className="container py-4">
      <h2 className="page-title">주차현황 및 예약</h2>
      <p className="page-description">
        주차구획 현황을 확인하고 구획을 선택하여 예약 화면을 열 수 있습니다.
      </p>
      <div className="row g-3 mb-4">
        {[
          { label: '전체 주차면', value: total },
          { label: '현재 주차', value: occupied },
          { label: '주차 완료', value: reserved },
          { label: '현재 빈 구획', value: available },
        ].map(({ label, value }) => (
          <div className="col-6 col-md-3" key={label}>
            <div className="card summary-card text-center p-3 shadow-sm h-100">
              <div className="text-secondary small mb-1">{label}</div>
              <div className="summary-value fs-4 fw-bold">{value}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="card border-0 shadow-sm rounded-3 p-4 d-flex align-items-center">
        <ParkingMapView
          mode="user"
          slots={slots}
          currentFloor={currentFloor}
          onFloorChange={(floor) => {
            setCurrentFloor(floor);
            closeModal();
          }}
          onSlotClick={handleSlotClick}
          selectedSlotId={selectedSlot?.id ?? null}
        />
      </div>
      <ParkingReservationModal
        isOpen={selectedSlot !== null}
        slot={selectedSlot}
        onClose={closeModal}
      />
    </div>
  );
}

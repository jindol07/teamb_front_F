/**
 * [예약 담당자에게 전달할 협업 경계]
 * isOpen: 열림 여부 / slot: 선택 구획 전체 정보 / onClose: 닫기 콜백
 * 모달 내부 예약폼 및 신청 API 연결은 예약 담당자가 구현.
 * 선택한 slot.id는 지금 '1F-A01' 같은 프론트 ID, DB의 숫자 ID와 다름.
 * 실제 예약 저장 시 PARKING_SPACE_ID를 조회하여 전달하도록 API 계약 수정 필요.
 * 현재 코드는 예약 확정을 가장하지 않으며 ESC/배경 클릭으로 닫을 수 있음.
 */
import React, { useEffect } from 'react';
import type { ExtendedParkingSlot } from '../../../shared/parking/parking';

/** 예약 담당자와 연동할 모달의 경계 컴포넌트. 실제 신청/확정은 구현하지 않습니다. */
/** 학습 해설: 예약 담당자와 합의할 외부 인터페이스. slot에는 선택 구획 전체 정보가 들어갑니다. */
export interface ParkingReservationModalProps {
  isOpen: boolean;
  slot: ExtendedParkingSlot | null;
  onClose: () => void;
}

/** 학습 해설: 주차현황 페이지에서 선택한 구획을 받아 모달을 렌더링하는 껍데기 컴포넌트입니다. */
export default function ParkingReservationModal({ isOpen, slot, onClose }: ParkingReservationModalProps) {
  /** 학습 해설: 모달이 열려 있을 때만 Escape 키 리스너를 등록하고, 닫히거나 제거되면 정리합니다. */
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);
  /** 학습 해설: isOpen이 false이거나 선택 구획이 없으면 DOM에 모달을 만들지 않습니다. */
  if (!isOpen || !slot) return null;
  /** 학습 해설: 이 아래 JSX는 예약 신청 저장 로직 없이 모달 UI만 구성합니다. */
  return (
    <div role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.55)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <section role="dialog" aria-modal="true" aria-labelledby="parking-reservation-title"
        style={{ background: 'white', borderRadius: 12, padding: 24, maxWidth: 440, width: '100%', boxShadow: '0 12px 40px rgba(0,0,0,.2)' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 id="parking-reservation-title" className="fs-5 fw-bold mb-0">주차 예약</h3>
          <button type="button" className="btn-close" aria-label="닫기" onClick={onClose} />
        </div>
        <p className="mb-2">선택 구획: <strong>{slot.slotNumber}</strong> (지하 {slot.floor}층)</p>
        <p className="text-secondary small mb-3">구획 ID: {slot.id}</p>
        <p role="status" className="alert alert-light border small">
          우선 이렇게 만들어놨고 모르는거나 필요한거 있으면 말해주세요
        </p>
        <button type="button" className="btn btn-secondary w-100" onClick={onClose}>닫기</button>
      </section>
    </div>
  );
}

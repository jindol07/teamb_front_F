/**
 * 관리자/사용자 페이지가 같은 React 앱에서 재사용하는 Zustand 임시 상태.
 * - slots: AI팀 합의 좌표 기반 구획 목록 / 향후 서버 GET 결과로 setSlots 교체
 * - selectedFloor: 관리자 화면에서 선택한 층 (사용자 페이지는 자체 층 상태 사용)
 * - selectedSlot: 관리자 설정 패널의 현재 선택 객체
 * - updateSlotDetail: 관리자 UI 임시 수정; DB에 영구 저장되지 않음
 * 주의: 다른 브라우저 또는 새로고침 시 동기화되지 않으므로 '실시간' 데이터로 오인 금지.
 */
import { create } from 'zustand';
import { createInitialParkingSpaces } from './parkingLayout';
import { ExtendedParkingSlot, SlotStatusType, ExtendedSlotType } from './parking';

/**
 * [주차 관제 전역 상태 인터페이스]
 * 전역 층수, 선택 구획, 전체 구획 목록 상태 및 변경 함수 관리
 */
/** 학습 해설: 스토어의 데이터와 각 변경 함수의 매개변수·반환형을 정의합니다. 타입 선언은 실행 시 별도 데이터를 만들지 않습니다. */
interface ParkingState {
  slots: ExtendedParkingSlot[];                                                     // 현재 층의 전체 구획 목록
  selectedFloor: number;                                                            // 현재 선택된 층수 (기본 1층)
  selectedSlot: ExtendedParkingSlot | null;                                         // 현재 상세 설정 중인 구획
  setSlots: (slots: ExtendedParkingSlot[]) => void;                                 // 전체 구획 배열 설정
  setSelectedFloor: (floor: number) => void;                                        // 선택 층수 변경
  setSelectedSlot: (slot: ExtendedParkingSlot | null) => void;                      // 선택 구획 변경
  updateSlotDetail: (slotId: string, updatedData: Partial<ExtendedParkingSlot>) => void; // 구획 상세정보 부분 업데이트
}

/**
 * [주차 관제 전역 Zustand 스토어]
 */
/** 학습 해설: create<ParkingState>로 Zustand 훅을 만들며, set 콜백으로 불변 객체를 갱신합니다. 사용 컴포넌트는 해당 상태가 바뀌면 다시 렌더링됩니다. */
export const useParkingStore = create<ParkingState>((set) => ({
  // AI팀 합의 좌표 45개(층별 15개)는 항상 유지. 초기 EMPTY는 실제 센서값이 아님.
  slots: createInitialParkingSpaces(),
  selectedFloor: 1,
  selectedSlot: null,

  /** 학습 해설: 새 배열 전체로 교체합니다. 추후 서버에서 구획 목록을 GET한 뒤 이 액션을 사용할 수 있습니다. */
  setSlots: (slots) => set({ slots }),

  /** 학습 해설: 관리자에서 현재 바라보는 지하층 번호를 교체합니다. 다른 구획 자체는 변경하지 않습니다. */
  setSelectedFloor: (floor) => set({ selectedFloor: floor }),

  /** 학습 해설: 상세 편집 중인 구획을 지정하거나 null로 선택을 해제합니다. */
  setSelectedSlot: (slot) => set({ selectedSlot: slot }),

  // 구획 ID 기반으로 상태, 전용 구분, 메모 등 개별 수정
  /** 학습 해설: map으로 모든 구획 중 ID가 같은 항목에만 변경값을 병합합니다. ...updatedData가 앞 객체의 같은 키를 덮어씁니다. */
  updateSlotDetail: (slotId, updatedData) =>
    set((state) => ({
      slots: state.slots.map((s) => (s.id === slotId ? { ...s, ...updatedData } : s)),
      selectedSlot:
        state.selectedSlot?.id === slotId
          ? { ...state.selectedSlot, ...updatedData }
          : state.selectedSlot,
    })),
}));
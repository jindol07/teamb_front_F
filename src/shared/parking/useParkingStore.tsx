/** 파일 안내
 * 용도: 서버 구획 스냅샷·선택한 층/구획·조회 상태를 보관하는 Zustand 스토어.
 * 직접 사용처: useParkingSpaceSync, 관리자·사용자 현황, 공통 스토어를 읽는 예약 화면·모달.
 * parkingSpaceAdapter로 검증·변환한 결과를 반영한다. DB를 직접 수정하거나 입차 기록을 생성하지 않는다.
 */
/**
 * Zustand는 화면 간 공유 캐시일 뿐 DB 자체가 아닙니다.
 * 서버 GET 성공 시 replaceFromServer로 교체하고, 실패 시 가짜 EMPTY를 만들지 않습니다.
 * 관리자의 저장도 서버 PATCH 성공 후에만 로컬 캐시를 새로고침합니다.
 */
import { create } from 'zustand';
import { mergeParkingSpaces } from './parkingSpaceAdapter';
import type { ParkingSpaceDto } from './parkingSpaceApi';
import type { ExtendedParkingSlot } from './parking';

export type SyncState = 'idle' | 'loading' | 'ready' | 'error';

// 구획 데이터·선택 상태·동기화 상태와 갱신 함수를 한 계약으로 묶는다.
interface ParkingState {
  slots: ExtendedParkingSlot[];
  selectedFloor: number;
  selectedSlot: ExtendedParkingSlot | null;
  syncState: SyncState;
  syncError: string | null;
  lastSyncedAt: string | null;
  unmappedNumbers: string[];
  setSelectedFloor: (floor: number) => void;
  setSelectedSlot: (slot: ExtendedParkingSlot | null) => void;
  startSync: () => void;
  failSync: (message: string) => void;
  resetParking: () => void;
  replaceFromServer: (rows: ParkingSpaceDto[]) => void;
}

// 서버 스냅샷을 표시하는 캐시다. 상태 변경 함수 호출만으로 DB가 수정되지는 않는다.
export const useParkingStore = create<ParkingState>((set) => ({
  // 최초에는 구획이 없다. 검증된 서버 응답을 받아 DB 좌표와 상태를 함께 채운다.
  slots: [],
  selectedFloor: 1,
  selectedSlot: null,
  syncState: 'idle',
  syncError: null,
  lastSyncedAt: null,
  unmappedNumbers: [],
  setSelectedFloor: (selectedFloor) => set({ selectedFloor }),
  setSelectedSlot: (selectedSlot) => set({ selectedSlot }),
  startSync: () => set((s) => ({
    // 성공 후 다음 폴링에서는 화면을 '로딩'으로 깜빡이지 않도록 유지.
    syncState: s.syncState === 'ready' ? 'ready' : 'loading',
    syncError: null,
  })),
  failSync: (syncError) => set({ syncState: 'error', syncError, slots: [], selectedSlot: null }),
  resetParking: () => set({
    slots: [], selectedFloor: 1, selectedSlot: null, syncState: 'idle',
    syncError: null, lastSyncedAt: null, unmappedNumbers: [],
  }),
  // 서버 응답 전체를 변환한 후 반영한다. 검증 예외가 나면 부분 목록으로 교체하지 않는다.
  replaceFromServer: (rows) => {
    const { slots, unmappedNumbers } = mergeParkingSpaces(rows);
    set((state) => ({
      slots,
      unmappedNumbers,
      syncState: 'ready',
      syncError: null,
      lastSyncedAt: new Date().toLocaleString('ko-KR'),
      // 폴링 때 선택 객체가 오래된 상태로 남지 않게 최신 DB 객체로 교체.
      selectedSlot: state.selectedSlot
        ? slots.find((slot) => slot.parkingSpaceId != null && slot.parkingSpaceId === state.selectedSlot?.parkingSpaceId) ?? null
        : null,
    }));
  },
}));

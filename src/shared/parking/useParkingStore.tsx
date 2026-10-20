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

export const useParkingStore = create<ParkingState>((set) => ({
  // 도면 형상은 AI팀과 약속한 정적 좌표임. 점유 상태는 모두 UNKNOWN에서 출발.
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

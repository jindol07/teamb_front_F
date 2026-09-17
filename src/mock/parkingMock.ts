// src/mock/parkingMock.ts

export type SlotType = 'NORMAL' | 'EV' | 'DISABLED' | 'LARGE';
export type SlotStatus = '사용중' | '예약' | '사용가능';

export interface ParkingSlot {
  id: number;
  floor: 'B1' | 'B2' | 'B3';
  slotNumber: string; // 예: B1-A01
  status: SlotStatus;
  type: SlotType;
  vehicleNumber: string | null;
  entryTime: string | null;
  expectedExit: string | null;
  row: number; // 행 번호 (0 ~ 3)
  col: number; // 열 번호 (0 ~ 19)
}

// 층별 80개 주차면 Mock Data 자동 생성 함수 (총 240면)
const generateFloorSlots = (floor: 'B1' | 'B2' | 'B3'): ParkingSlot[] => {
  const slots: ParkingSlot[] = [];
  let idCounter = floor === 'B1' ? 100 : floor === 'B2' ? 200 : 300;

  for (let r = 0; r < 4; r++) {
    const rowPrefix = String.fromCharCode(65 + r); // A, B, C, D
    for (let c = 1; c <= 20; c++) {
      idCounter++;
      const slotNum = `${floor}-${rowPrefix}${c < 10 ? '0' + c : c}`;
      
      let type: SlotType = 'NORMAL';
      if (r === 0 && c <= 10) type = 'EV'; // A구역 일부 전기차
      else if (r === 0 && c > 18) type = 'DISABLED'; // 장애인/배려
      else if (r === 1 && c <= 6) type = 'LARGE'; // 광폭/대형

      let status: SlotStatus = '사용가능';
      let vehicleNumber: string | null = null;
      let entryTime: string | null = null;

      if ((c + r) % 3 === 0) {
        status = '사용중';
        vehicleNumber = `${10 + c}가 ${1000 + idCounter}`;
        entryTime = '2026-09-07 14:10';
      } else if ((c + r) % 7 === 0) {
        status = '예약';
        vehicleNumber = `${70 + c}나 ${2000 + idCounter}`;
      }

      slots.push({
        id: idCounter,
        floor,
        slotNumber: slotNum,
        status,
        type,
        vehicleNumber,
        entryTime,
        expectedExit: entryTime ? '2026-09-07 22:00' : null,
        row: r,
        col: c - 1,
      });
    }
  }
  return slots;
};

// 1. 2D 도면용 전체 주차면 데이터 (층당 80면)
export const allParkingSlotsMock: ParkingSlot[] = [
  ...generateFloorSlots('B1'),
  ...generateFloorSlots('B2'),
  ...generateFloorSlots('B3'),
];

// 2. 기존 컴포넌트 호환용 (첫번째 층 B1 데이터만 전달)
export const parkingSlotListMock = allParkingSlotsMock.filter((s) => s.floor === 'B1');

// 3. 상단 현황 카드 요약 데이터
export const parkingSummaryMock = {
  totalSpots: 240,
  currentParked: 95,
  availableSpots: 125,
  reservedSpots: 20,
  todayEntries: 310,
};

// 4. 대시보드 차트용 데이터 (에러 원인 해결 파트)
export const parkingUsageRatioMock = {
  labels: ['주차중', '잔여', '예약'],
  values: [95, 125, 20],
};

export const hourlyUsageMock = {
  labels: ['09시', '11시', '13시', '15시', '17시', '19시'],
  values: [42, 65, 58, 71, 90, 76],
};
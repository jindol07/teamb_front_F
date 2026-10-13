/**
 * AI팀과 사전에 합의한 주차구획 번호/좌표의 단일 원본(Single Source of Truth).
 * 640x480 Konva 좌표계를 기준으로 하며 A4/A3 출력 도면과 대응시키는 값입니다.
 * 임의로 삭제하거나 숫자를 바꾸지 마세요. AI팀과 협의하여 변경해야 합니다.
 * 이 파일은 임의 차량 점유 Mock이 아닙니다. 실제 시설 배치의 정적 설정입니다.
 * 층별 좌표가 동일하다는 현재 합의를 반영하며, 향후 층별 도면이 달라지면 확장합니다.
 */
export interface ParkingSpaceGeometry {
  slotNum: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const PARKING_FLOORS = [1, 2, 3] as const;
export const PARKING_STAGE_SIZE = { width: 640, height: 480 } as const;
export const PARKING_MAP_BOUNDS = { x: 25, y: 25, width: 530, height: 430 } as const;

export const PARKING_SPACE_LAYOUT: ParkingSpaceGeometry[] = [
  { slotNum: 'A01', x: 200, y: 45, width: 50, height: 80 },
  { slotNum: 'A02', x: 270, y: 45, width: 50, height: 80 },
  { slotNum: 'A03', x: 340, y: 45, width: 50, height: 80 },
  { slotNum: 'A04', x: 410, y: 45, width: 50, height: 80 },
  { slotNum: 'A05', x: 480, y: 45, width: 50, height: 80 },

  { slotNum: 'B01', x: 50, y: 80, width: 80, height: 50 },
  { slotNum: 'B02', x: 50, y: 150, width: 80, height: 50 },
  { slotNum: 'B03', x: 50, y: 220, width: 80, height: 50 },
  { slotNum: 'B04', x: 50, y: 290, width: 80, height: 50 },
  { slotNum: 'B05', x: 50, y: 360, width: 80, height: 50 },

  { slotNum: 'C01', x: 200, y: 360, width: 50, height: 80 },
  { slotNum: 'C02', x: 270, y: 360, width: 50, height: 80 },
  { slotNum: 'C03', x: 340, y: 360, width: 50, height: 80 },
  { slotNum: 'C04', x: 410, y: 360, width: 50, height: 80 },
  { slotNum: 'C05', x: 480, y: 360, width: 50, height: 80 },
];

/** 최초 화면에 표시할 정적 구획 형상 생성. 현재 점유/예약 여부를 추정하지 않습니다. */
export function createInitialParkingSpaces() {
  return PARKING_FLOORS.flatMap((floor) => PARKING_SPACE_LAYOUT.map((space) => ({
    id: `${floor}F-${space.slotNum}`,
    slotNumber: space.slotNum,
    floor,
    x: space.x,
    y: space.y,
    width: space.width,
    height: space.height,
    // 상태값은 실제 감지 데이터가 아닙니다. UI 편집 확인용 기본값입니다.
    status: 'EMPTY' as const,
    slotType: 'NORMAL' as const,
  })));
}

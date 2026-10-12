/**
 * AI팀과 사전에 합의한 주차구획 번호/좌표의 단일 원본(Single Source of Truth).
 * 640x480 Konva 좌표계를 기준으로 하며 A4/A3 출력 도면과 대응시키는 값입니다.
 * 임의로 삭제하거나 숫자를 바꾸지 마세요. AI팀과 협의하여 변경해야 합니다.
 * 이 파일은 임의 차량 점유 Mock이 아닙니다. 실제 시설 배치의 정적 설정입니다.
 * 층별 좌표가 동일하다는 현재 합의를 반영하며, 향후 층별 도면이 달라지면 확장합니다.
 */
/** 학습 해설: 각 구획의 물리적 배치 정보에 대한 타입 계약. slotNum은 화면상의 라벨, x/y는 좌상단 좌표, width/height는 가로·세로 길이(px)입니다. */
export interface ParkingSpaceGeometry {
  slotNum: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 학습 해설: as const는 값을 변경 불가능한 리터럴 튜플로 추론하게 합니다. 1·2·3은 현재 UI에서 지하층 번호로 표시합니다. */
export const PARKING_FLOORS = [1, 2, 3] as const;
/** 학습 해설: Konva Stage의 논리 크기입니다. 인쇄물 종이 크기(mm)와 같지 않으므로 AI팀과 좌표 변환 규칙을 별도로 합의해야 합니다. */
export const PARKING_STAGE_SIZE = { width: 640, height: 480 } as const;
/** 학습 해설: 주차장 외곽 사각형의 원점(x,y), 너비, 높이입니다. */
export const PARKING_MAP_BOUNDS = { x: 25, y: 25, width: 530, height: 430 } as const;

/** 학습 해설: 배치 정보를 배열로 선언합니다. A/B/C의 각 구획은 좌표와 폭·높이가 고정되어 있으며 상태값은 여기 두지 않습니다. */
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
/** 학습 해설: flatMap은 각 층에 대해 15개 구획 배열을 만들고 합쳐 총 45개를 생성합니다. map 안의 spread는 배치 좌표를 구획 객체 속성으로 복사하는 대신 명시적으로 대입합니다. */
export function createInitialParkingSpaces() {
  return PARKING_FLOORS.flatMap((floor) => PARKING_SPACE_LAYOUT.map((space) => ({
    /** 학습 해설: 층별 구획을 구분하는 문자열 ID를 만듭니다(예: 1F-A01). Oracle의 숫자형 PARKING_SPACE_ID와는 아직 별도입니다. */
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

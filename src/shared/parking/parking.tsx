/** [1023_1010] 파일 안내
 * 용도: 관리자·사용자·예약 도면이 공유하는 구획 타입과 도면 Props 계약.
 * 직접 사용처: ParkingMapView, parkingSpaceAdapter, useParkingStore, SlotDetailPanel, ParkingStatus 및 사용자 예약 모달.
 * status는 화면 코드, rawStatusCode는 응답의 코드이며 DB PK와 화면 선택용 id를 구분한다.
 */
/**
 * 주차구획 도메인 타입(관리자/사용자 공용).
 *
 * 중요한 구분:
 * 1) x/y/width/height: Oracle DB에서 제공하는 2D 도면 위치.
 * 2) parkingSpaceId: Oracle PARKING_SPACE.PARKING_SPACE_ID (DB 기본키).
 * 3) status: 서버에서 확인된 점유 상태. 서버에서 확인하지 못하면 UNKNOWN.
 * 4) rawStatusCode/rawTypeCode: 실제 DB 코드값. 임의로 EMPTY 등으로 추측하지 않음.
 */
export type SlotStatusType = 'EMPTY' | 'OCCUPIED' | 'RESERVED' | 'DISABLED' | 'UNKNOWN';
export type ExtendedSlotType =
  'NORMAL' | 'ELECTRIC' | 'DISABLED_PERSON' | 'DISABLED' | 'UNKNOWN';

export interface ParkingSlot {
  /** React key / 선택 비교용. DB에 연결되면 숫자 PK를 문자열로 변환한 값. */
  id: string;
  /** Oracle PK가 존재할 때만 지정. 예약 담당자는 반드시 이 값을 사용해야 함. */
  parkingSpaceId?: number;
  slotNumber: string;
  /** AI팀 공통 구획 코드. 예: 1F-A01 */
  spaceCode: string;
  floor: number;
  x: number;
  y: number;
  width: number;
  height: number;
  status: SlotStatusType;
  /** 구획 탐지 결과와 번호판 식별 결과가 DB에서 확정된 경우에만 표시. */
  vehicleNumber?: string;
}

export interface ExtendedParkingSlot extends ParkingSlot {
  slotType?: ExtendedSlotType;
  memo?: string;
  zoneCode?: string;
  rawStatusCode?: string;
  rawTypeCode?: string;
  /** DB 업데이트 시각; 서버 GET 응답에서 가져온 문자열. */
  updatedAt?: string;
}

/**
 * 화면 역할에 관계없이 Konva 도면에 필요한 입력값만 받음.
 * 이전 주석본에서 mode/slots가 중복 선언된 오류를 수정함.
 */
export interface ParkingMapProps {
  mode: 'admin' | 'user';
  slots: ExtendedParkingSlot[];
  currentFloor: number;
  onFloorChange: (floor: number) => void;
  onSlotClick: (slot: ExtendedParkingSlot) => void;
  selectedSlotId?: string | null;
  /** 호출 페이지에 층 선택이 있을 때 모바일에서 중복 도구를 줄이는 표시 옵션. */
  compactControls?: boolean;
  /** 관리자만 전달. 현재 점유 상태와 별개인 진행 중·향후 확정 예약 건수. */
  reservationCounts?: Record<number, number>;
}

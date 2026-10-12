/**
 * [주차 관제 데이터 타입 정의]
 * 주차 구획, 전용 구분, 실시간 상태 및 도면 좌표 인터페이스
 */

// 실시간 상태: 사용가능, 사용중, 예약됨, 사용불가
/** 학습 해설: 문자열 유니언 타입: 허용된 4개 상태 외에는 TypeScript 컴파일 단계에서 막습니다. */
export type SlotStatusType = 'EMPTY' | 'OCCUPIED' | 'RESERVED' | 'DISABLED';

// 구획 전용 구분: 일반, 전기차, 장애인, 사용불가
/** 학습 해설: 점유 상태(status)와 전용 구획 유형(slotType)을 별도로 모델링합니다. */
export type ExtendedSlotType = 'NORMAL' | 'ELECTRIC' | 'DISABLED_PERSON' | 'DISABLED';

// 기본 주차 구획 인터페이스
/** 학습 해설: 기본 주차구획 속성의 타입. 물음표(?)는 값이 없어도 된다는 뜻입니다. */
export interface ParkingSlot {
  id: string;
  slotNumber: string;
  floor: number;
  x: number;
  y: number;
  width: number;
  height: number;
  status: SlotStatusType;
  vehicleNumber?: string;
}

// 상세 정보(구획 구분, 메모)가 확장된 주차 구획 인터페이스
/** 학습 해설: extends는 ParkingSlot의 필드를 상속하고 메모·구획 유형을 더합니다. */
export interface ExtendedParkingSlot extends ParkingSlot {
  slotType?: ExtendedSlotType;
  memo?: string;
}

// 2D 도면 컴포넌트 Props
/** 학습 해설: 부모 페이지가 공통 도면에 제공하는 입력값과 이벤트 콜백을 명시합니다. */
export interface ParkingMapProps {
  /** admin=상세편집 패널, user=예약 모달 (클릭 실행은 부모에서 구현) */
  mode?: 'admin' | 'user';
  /** 도면에 표시할 주차구획: 동일한 배열을 관리자/사용자 화면에서 공유 */
  slots: ExtendedParkingSlot[];
  mode: 'admin' | 'user';
  slots: ExtendedParkingSlot[];
  currentFloor: number;
  onFloorChange: (floor: number) => void;
  onSlotClick: (slot: ExtendedParkingSlot) => void;
  selectedSlotId?: string | null;
}
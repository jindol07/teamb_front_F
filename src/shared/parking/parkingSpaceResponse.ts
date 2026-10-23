/** [1023_1010] 파일 안내
 * 용도: HTTP·WebSocket 구획 응답을 검증하고 공통 camelCase DTO로 정규화한다.
 * 직접 사용처: parkingSpaceApi.tsx(HTTP), useParkingSpaceSync.tsx(WebSocket).
 * 흐름: 외부 unknown 데이터 → 필드·타입 검증 → ParkingSpaceDto → 공통 스토어.
 * 두 필드 표기(camelCase/snake_case)를 지원하며 서로 충돌하면 오류로 처리한다.
 * 좌표의 null은 여기서 보존하고, 실제 도면 배치 가능 여부는 parkingSpaceAdapter가 검사한다.
 */
import type { ParkingSpaceDto } from './parkingSpaceApi';

/** A의 camelCase와 U의 snake_case 응답을 주차 화면의 공통 DTO로 변환한다. */
function field(row: Record<string, unknown>, camelName: string, snakeName = camelName): unknown {
  // [1023_1010] 프로토타입의 속성이 아니라 응답 객체에 직접 포함된 필드만 읽는다.
  const hasCamel = Object.prototype.hasOwnProperty.call(row, camelName);
  const hasSnake = Object.prototype.hasOwnProperty.call(row, snakeName);
  if (hasCamel && hasSnake && row[camelName] !== row[snakeName]) {
    throw new Error(`주차구획 응답의 필드 값이 서로 다릅니다: ${camelName} / ${snakeName}`);
  }
  return hasCamel ? row[camelName] : row[snakeName];
}

/** [1023_1010] 숫자 문자열을 자동 변환하지 않으며 NaN·Infinity·누락 필드를 거절한다. */
function numberValue(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`주차구획 응답의 ${name} 값이 없거나 유효한 숫자가 아닙니다.`);
  }
  return value;
}

/** [1023_1010] 명시적인 DB null만 허용한다. 필드 누락(undefined)은 유효한 좌표로 취급하지 않는다. */
function nullableNumber(value: unknown, name: string): number | null {
  // DB의 null은 유지하고, 누락된 값을 임의의 좌표로 채우지 않는다.
  return value === null ? null : numberValue(value, name);
}

/** [1023_1010] 필수 문자열 검증. 검사 후에는 서버가 준 원래 문자열을 반환한다. */
function stringValue(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`주차구획 응답의 ${name} 값이 없거나 유효한 문자열이 아닙니다.`);
  }
  return value;
}

/** [1023_1010] 관리자 전용·선택 필드는 누락과 null을 허용하되 다른 자료형은 거절한다. */
function optionalString(value: unknown, name: string): string | null | undefined {
  if (value === undefined || value === null || typeof value === 'string') return value;
  throw new Error(`주차구획 응답의 ${name} 값이 문자열이 아닙니다.`);
}

/** [1023_1010] 단일 구획을 검증한다. 필수 필드가 잘못되면 정상 현황을 만들지 않고 예외를 전달한다. */
export function normalizeParkingSpace(value: unknown): ParkingSpaceDto {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('주차구획 응답 항목이 객체가 아닙니다.');
  }
  const row = value as Record<string, unknown>;
  // [1023_1010] 구획 PK는 양의 안전한 정수, 층 번호는 안전한 정수여야 한다.
  const parkingSpaceId = numberValue(field(row, 'parkingSpaceId', 'parking_space_id'), 'parkingSpaceId');
  const floorNo = numberValue(field(row, 'floorNo', 'floor_no'), 'floorNo');
  if (!Number.isSafeInteger(parkingSpaceId) || parkingSpaceId <= 0 || !Number.isSafeInteger(floorNo)) {
    throw new Error('주차구획 응답의 구획 ID 또는 층 번호가 유효하지 않습니다.');
  }

  return {
    parkingSpaceId,
    floorNo,
    zoneCode: stringValue(field(row, 'zoneCode', 'zone_code'), 'zoneCode'),
    spaceNumber: stringValue(field(row, 'spaceNumber', 'space_number'), 'spaceNumber'),
    spaceCode: stringValue(field(row, 'spaceCode', 'space_code'), 'spaceCode'),
    spaceTypeCode: stringValue(field(row, 'spaceTypeCode', 'space_type_code'), 'spaceTypeCode'),
    spaceStatusCode: stringValue(field(row, 'spaceStatusCode', 'space_status_code'), 'spaceStatusCode'),
    xPosition: nullableNumber(field(row, 'xPosition', 'x_position'), 'xPosition'),
    yPosition: nullableNumber(field(row, 'yPosition', 'y_position'), 'yPosition'),
    width: nullableNumber(field(row, 'width'), 'width'),
    height: nullableNumber(field(row, 'height'), 'height'),
    memo: optionalString(field(row, 'memo'), 'memo'),
    vehicleNumber: optionalString(field(row, 'vehicleNumber', 'vehicle_number'), 'vehicleNumber'),
    updatedAt: optionalString(field(row, 'updatedAt', 'updated_at'), 'updatedAt'),
  };
}

/** [1023_1010] 목록 전체를 검증한다. 일부 오류 구획만 조용히 제외하여 집계를 왜곡하지 않는다. */
export function normalizeParkingSpaces(value: unknown): ParkingSpaceDto[] {
  if (!Array.isArray(value)) throw new Error('주차구획 응답이 배열이 아닙니다.');
  return value.map(normalizeParkingSpace);
}

import type { ParkingSpaceDto } from './parkingSpaceApi';

/** A의 camelCase와 U의 snake_case 응답을 주차 화면의 공통 DTO로 변환한다. */
function field(row: Record<string, unknown>, camelName: string, snakeName = camelName): unknown {
  const hasCamel = Object.prototype.hasOwnProperty.call(row, camelName);
  const hasSnake = Object.prototype.hasOwnProperty.call(row, snakeName);
  if (hasCamel && hasSnake && row[camelName] !== row[snakeName]) {
    throw new Error(`주차구획 응답의 필드 값이 서로 다릅니다: ${camelName} / ${snakeName}`);
  }
  return hasCamel ? row[camelName] : row[snakeName];
}

function numberValue(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`주차구획 응답의 ${name} 값이 없거나 유효한 숫자가 아닙니다.`);
  }
  return value;
}

function nullableNumber(value: unknown, name: string): number | null {
  // DB의 null은 유지하고, 누락된 값을 임의의 좌표로 채우지 않는다.
  return value === null ? null : numberValue(value, name);
}

function stringValue(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`주차구획 응답의 ${name} 값이 없거나 유효한 문자열이 아닙니다.`);
  }
  return value;
}

function optionalString(value: unknown, name: string): string | null | undefined {
  if (value === undefined || value === null || typeof value === 'string') return value;
  throw new Error(`주차구획 응답의 ${name} 값이 문자열이 아닙니다.`);
}

export function normalizeParkingSpace(value: unknown): ParkingSpaceDto {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('주차구획 응답 항목이 객체가 아닙니다.');
  }
  const row = value as Record<string, unknown>;
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

export function normalizeParkingSpaces(value: unknown): ParkingSpaceDto[] {
  if (!Array.isArray(value)) throw new Error('주차구획 응답이 배열이 아닙니다.');
  return value.map(normalizeParkingSpace);
}

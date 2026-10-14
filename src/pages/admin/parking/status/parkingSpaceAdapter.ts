/** Oracle 응답을 Konva가 사용할 구획 데이터로 변환합니다. 좌표는 DB만 신뢰합니다. */
import type { ExtendedParkingSlot, SlotStatusType, ExtendedSlotType } from './parking';
import type { ParkingSpaceDto } from './parkingSpaceApi';

function parseStatus(code: string): SlotStatusType {
  switch (code?.trim().toUpperCase()) {
    case 'AVAILABLE': case 'EMPTY': return 'EMPTY';
    case 'OCCUPIED': return 'OCCUPIED';
    case 'RESERVED': return 'RESERVED';
    case 'DISABLED': return 'DISABLED';
    default: return 'UNKNOWN';
  }
}
function parseType(code: string): ExtendedSlotType {
  switch (code?.trim().toUpperCase()) {
    case 'NORMAL': return 'NORMAL';
    case 'ELECTRIC': return 'ELECTRIC';
    case 'DISABLED_PERSON': return 'DISABLED_PERSON';
    case 'DISABLED': return 'DISABLED';
    default: return 'UNKNOWN';
  }
}

/** 잘못된 좌표/중복을 조용히 건너뛰지 않습니다. 도면의 신뢰성이 중요합니다. */
export function mergeParkingSpaces(rows: ParkingSpaceDto[]): {
  slots: ExtendedParkingSlot[];
  unmappedNumbers: string[];
} {
  const usedCodes = new Set<string>();
  const usedIds = new Set<number>();
  const slots = rows.map((row): ExtendedParkingSlot => {
    const spaceCode = `${row.floorNo}F-${row.zoneCode.trim().toUpperCase()}${row.spaceNumber.trim().toUpperCase()}`;
    if (row.spaceCode && row.spaceCode.trim().toUpperCase() !== spaceCode) {
      throw new Error(`구획 코드 불일치: 서버 ${row.spaceCode}, 계산 ${spaceCode}`);
    }
    if (usedCodes.has(spaceCode) || usedIds.has(row.parkingSpaceId)) {
      throw new Error(`주차구획 중복: ${spaceCode} / ${row.parkingSpaceId}`);
    }
    usedCodes.add(spaceCode);
    usedIds.add(row.parkingSpaceId);
    const { xPosition: x, yPosition: y, width, height } = row;
    if ([x, y, width, height].some((v) => v == null || !Number.isFinite(v)) ||
      width! <= 0 || height! <= 0 || x! < 0 || y! < 0 || x! + width! > 640 || y! + height! > 480) {
      throw new Error(`주차구획 ${spaceCode}: DB 좌표·크기가 없거나 640×480 도면 밖입니다.`);
    }
    return {
      id: String(row.parkingSpaceId), parkingSpaceId: row.parkingSpaceId,
      spaceCode, slotNumber: `${row.zoneCode.trim().toUpperCase()}${row.spaceNumber.trim().toUpperCase()}`, floor: row.floorNo,
      x: x!, y: y!, width: width!, height: height!,
      status: parseStatus(row.spaceStatusCode), slotType: parseType(row.spaceTypeCode),
      rawStatusCode: row.spaceStatusCode, rawTypeCode: row.spaceTypeCode,
      zoneCode: row.zoneCode, memo: row.memo ?? undefined,
      updatedAt: row.updatedAt ?? undefined,
    };
  });
  return { slots, unmappedNumbers: [] };
}

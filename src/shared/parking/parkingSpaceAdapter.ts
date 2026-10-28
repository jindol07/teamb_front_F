/** 파일 안내
 * 용도: 검증된 API DTO를 Konva 도면용 구획 모델로 변환한다.
 * 직접 사용처: useParkingStore.tsx의 replaceFromServer().
 * 간접 사용처: 관리자·사용자 현황 및 공통 스토어를 읽는 예약 도면.
 * 주요 처리: 상태·종류 변환, 구획 코드·ID 중복 검사, 640×480 기준 좌표 검증.
 * 반환: slots와 unmappedNumbers. 현재 구현의 unmappedNumbers는 빈 배열이다.
 * 좌표를 추정하거나 잘못된 항목만 건너뛰지 않으며 검증 실패를 호출자에게 전달한다.
 */
/** Oracle 응답을 Konva가 사용할 구획 데이터로 변환합니다. 좌표는 DB만 신뢰합니다. */
import type { ExtendedParkingSlot, SlotStatusType, ExtendedSlotType } from './parking';
import type { ParkingSpaceDto } from './parkingSpaceApi';

/** AVAILABLE·EMPTY는 사용가능으로 통일하고 미지원 코드는 UNKNOWN으로 남긴다. */
function parseStatus(code: string): SlotStatusType {
  switch (code?.trim().toUpperCase()) {
    case 'AVAILABLE': case 'EMPTY': return 'EMPTY';
    case 'OCCUPIED': return 'OCCUPIED';
    case 'RESERVED': return 'RESERVED';
    case 'DISABLED': return 'DISABLED';
    default: return 'UNKNOWN';
  }
}
/** 구획 종류는 점유 상태와 별개다. 전기차·장애인 등 전용 표시를 결정한다. */
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
  // 구획 코드와 DB PK 중 어느 쪽이 중복되어도 이중 표시·집계를 막는다.
  const usedCodes = new Set<string>();
  const usedIds = new Set<number>();
  const slots = rows.map((row): ExtendedParkingSlot => {
    // 층·구역·번호로 계산한 AI 공통 코드와 서버 코드를 대조한다.
    const spaceCode = `${row.floorNo}F-${row.zoneCode.trim().toUpperCase()}${row.spaceNumber.trim().toUpperCase()}`;
    if (row.spaceCode && row.spaceCode.trim().toUpperCase() !== spaceCode) {
      throw new Error(`구획 코드 불일치: 서버 ${row.spaceCode}, 계산 ${spaceCode}`);
    }
    if (usedCodes.has(spaceCode) || usedIds.has(row.parkingSpaceId)) {
      throw new Error(`주차구획 중복: ${spaceCode} / ${row.parkingSpaceId}`);
    }
    usedCodes.add(spaceCode);
    usedIds.add(row.parkingSpaceId);
    // 원본 좌표는 DB 값을 사용한다. 화면 확대·축소는 ParkingMapView가 별도로 담당한다.
    const { xPosition: x, yPosition: y, width, height } = row;
    if ([x, y, width, height].some((v) => v == null || !Number.isFinite(v)) ||
      width! <= 0 || height! <= 0 || x! < 0 || y! < 0 || x! + width! > 640 || y! + height! > 480) {
      throw new Error(`주차구획 ${spaceCode}: DB 좌표·크기가 없거나 640×480 도면 밖입니다.`);
    }
    // 원본 코드도 보관하며, 차량번호는 서버 상태가 사용중일 때만 도면 모델에 넣는다.
    return {
      id: String(row.parkingSpaceId), parkingSpaceId: row.parkingSpaceId,
      spaceCode, slotNumber: `${row.zoneCode.trim().toUpperCase()}${row.spaceNumber.trim().toUpperCase()}`, floor: row.floorNo,
      x: x!, y: y!, width: width!, height: height!,
      status: parseStatus(row.spaceStatusCode), slotType: parseType(row.spaceTypeCode),
      rawStatusCode: row.spaceStatusCode, rawTypeCode: row.spaceTypeCode,
      zoneCode: row.zoneCode, memo: row.memo ?? undefined,
      vehicleNumber: row.spaceStatusCode === 'OCCUPIED' ? (row.vehicleNumber ?? undefined) : undefined,
      updatedAt: row.updatedAt ?? undefined,
    };
  });
  return { slots, unmappedNumbers: [] };
}

/** [1023_1010] 파일 안내
 * 용도: 도면의 층 목록·기준 해상도·배경 외곽 설정.
 * 직접 사용처: ParkingMapView.tsx.
 * 640×480은 AI와 공유하는 좌표 기준이다. 개별 구획 위치·크기는 DB 응답에서 가져온다.
 */
export const PARKING_FLOORS = [1, 2, 3] as const;
/** 주차장 공통 배경 설정만 유지합니다. 구획별 X/Y/Width/Height의 원본은 Oracle PARKING_SPACE입니다. */
export const PARKING_STAGE_SIZE = { width: 640, height: 480 } as const;
export const PARKING_MAP_BOUNDS = { x: 25, y: 25, width: 530, height: 430 } as const;

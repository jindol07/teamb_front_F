/** 파일 안내
 * 용도: DB 기준 좌표로 구획·동선·전용 아이콘·예약 달력 표시를 그리는 공통 도면.
 * 직접 사용처: 관리자·사용자 현황, Reservation, BookingModal, MyBookingModal, 실제 예약 ParkingReservationModal.
 * 클릭 처리는 부모에 위임한다. 표시 배율을 바꿔도 DB 좌표와 640×480 기준은 바꾸지 않는다.
 */
/** DB 좌표는 유지하고 화면 크기에 맞춰 확대·축소하는 관리자/사용자 공통 도면. */
import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text, Group, Arc, Arrow, Path, Circle } from 'react-konva';
import type { ExtendedParkingSlot, ParkingMapProps } from './parking';
import { PARKING_FLOORS, PARKING_STAGE_SIZE, PARKING_MAP_BOUNDS } from './parkingLayout';
import './ParkingMapView.css';

// 구획 상태에 따른 문구·색상이다. 전용 구획 종류와는 별도 기준이다.
const STATUS = {
  EMPTY: {
    label: '사용가능',
    color: '#236b56',
    background: '#e4f2eb',
    border: '#afd3c2',
  },
  OCCUPIED: {
    label: '사용중',
    color: '#a63850',
    background: '#fbe7ec',
    border: '#e6b5c1',
  },
  RESERVED: {
    label: '예약됨',
    color: '#885b16',
    background: '#fff2d8',
    border: '#e5cd98',
  },
  DISABLED: {
    label: '사용불가',
    color: '#526177',
    background: '#e9edf3',
    border: '#c2ccd9',
  },
  UNKNOWN: {
    label: '확인필요',
    color: '#685780',
    background: '#f0eaf7',
    border: '#d0c2e0',
  },
};
// 사용불가 종류는 상태보다 우선하여 표시하고 미지원 상태는 확인필요로 표시한다.
const statusFor = (slot: ExtendedParkingSlot) =>
  STATUS[slot.slotType === 'DISABLED' ? 'DISABLED' : slot.status] ?? STATUS.UNKNOWN;
const TYPE_COLORS = { ELECTRIC: '#0f6d82', DISABLED_PERSON: '#2458b5' };
// 24×24 벡터 아이콘으로 운영체제별 이모지 모양 차이를 없앤다.
const boltPath = 'M14 2L5 13h6l-1 9 9-12h-6z';
const wheelchairPath = 'M8 7l1 6h6l4 7 3-2M9 9h6M6 10a6 6 0 1 0 7 8';

export function ParkingMapView({
  mode,
  slots,
  currentFloor,
  onFloorChange,
  onSlotClick,
  selectedSlotId,
  reservationCounts,
  compactControls = false,
}: ParkingMapProps) {
  const [showPath, setShowPath] = useState(true);
  const [canvasWidth, setCanvasWidth] = useState<number>(PARKING_STAGE_SIZE.width);
  const viewport = useRef<HTMLDivElement>(null);
  // 컨테이너 크기를 관찰해 표시 배율만 조정한다. 언마운트 시 ResizeObserver를 해제한다.
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const resize = () => {
      if (element.clientWidth > 0) setCanvasWidth(Math.min(800, element.clientWidth));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // 기준 좌표는 640×480으로 두고 Stage 전체에 같은 배율을 적용한다.
  const scale = canvasWidth / PARKING_STAGE_SIZE.width;
  const floorSlots = slots.filter((slot) => slot.floor === currentFloor);
  const electric = floorSlots.filter((slot) => slot.slotType === 'ELECTRIC').length;
  const accessible = floorSlots.filter(
    (slot) => slot.slotType === 'DISABLED_PERSON',
  ).length;
  const selected = floorSlots.find((slot) => slot.id === selectedSlotId);

  return (
    <div
      className={`parking-map-view${compactControls ? ' parking-map-view--compact-controls' : ''}`}
    >
      <div className="parking-map-toolbar">
        <div className="parking-map-floors" role="group" aria-label="도면 층 선택">
          {PARKING_FLOORS.map((floor) => (
            <button
              key={floor}
              type="button"
              aria-pressed={currentFloor === floor}
              className={currentFloor === floor ? 'is-active' : ''}
              onClick={() => onFloorChange(floor)}
            >
              지하 {floor}층
            </button>
          ))}
        </div>
        <button
          type="button"
          className="parking-map-path"
          aria-pressed={showPath}
          onClick={() => setShowPath((value) => !value)}
        >
          <span aria-hidden="true">↳</span> {showPath ? '동선 숨기기' : '동선 보기'}
        </button>
      </div>
      <div className="parking-map-meta">
        <span>
          지하 {currentFloor}층 <strong>{floorSlots.length}면</strong>
        </span>
        <span className="parking-map-special-counts">
          <span>⚡ 전기차 {electric}</span>
          <span>♿ 장애인 {accessible}</span>
        </span>
      </div>
      <div
        ref={viewport}
        className="parking-map-viewport"
        role="group"
        aria-label={`지하 ${currentFloor}층 주차 도면`}
      >
        <Stage
          width={canvasWidth}
          height={PARKING_STAGE_SIZE.height * scale}
          scaleX={scale}
          scaleY={scale}
        >
          <Layer>
            <Rect width={640} height={480} fill="#f7f9fc" listening={false} />
            <Rect
              {...PARKING_MAP_BOUNDS}
              stroke="#53657d"
              strokeWidth={2}
              fill="#ffffff"
              cornerRadius={8}
              listening={false}
            />
            <Group x={570} y={240} listening={false}>
              <Arc
                angle={180}
                innerRadius={20}
                outerRadius={40}
                fill="#e1e8f1"
                stroke="#94a3b8"
                strokeWidth={1.5}
                rotation={270}
              />
              <Text
                x={-15}
                y={-22}
                text="OUT ▲"
                fontSize={9}
                fontStyle="bold"
                fill="#dc5263"
              />
              <Text
                x={-12}
                y={12}
                text="IN  ▼"
                fontSize={9}
                fontStyle="bold"
                fill="#16856a"
              />
              <Text x={-32} y={-4} text="지하램프" fontSize={10} fill="#334155" />
            </Group>
            <Group x={220} y={195} listening={false}>
              <Rect
                width={180}
                height={85}
                fill="#f1f5f9"
                stroke="#d8e1ed"
                cornerRadius={7}
              />
              <Text
                x={16}
                y={19}
                text="E/V · Stair"
                fontSize={12}
                fontStyle="bold"
                fill="#475569"
              />
              <Text x={16} y={48} text="보행자 전용 구역" fontSize={10} fill="#7c8ba0" />
            </Group>
            {showPath && (
              <Group listening={false} opacity={0.8}>
                <Arrow
                  points={[540, 315, 500, 315]}
                  stroke="#16856a"
                  fill="#16856a"
                  strokeWidth={2}
                  pointerLength={6}
                  pointerWidth={6}
                />
                <Arrow
                  points={[500, 315, 160, 315, 160, 150, 500, 150]}
                  stroke="#4d8ac1"
                  fill="#4d8ac1"
                  strokeWidth={2}
                  pointerLength={6}
                  pointerWidth={6}
                />
                <Arrow
                  points={[500, 150, 540, 150]}
                  stroke="#dc5263"
                  fill="#dc5263"
                  strokeWidth={2}
                  pointerLength={6}
                  pointerWidth={6}
                />
              </Group>
            )}
            {floorSlots.map((slot) => {
              // 구획별 표시 계산: 선택 테두리·점유 상태·전용 아이콘을 독립적으로 결정한다.
              const isSelected = selectedSlotId === slot.id;
              const state = statusFor(slot);
              const special =
                slot.slotType === 'ELECTRIC' || slot.slotType === 'DISABLED_PERSON';
              const vertical = slot.height >= 68;
              const iconScale = vertical ? 0.8 : 0.6;
              const typeColor =
                slot.slotType === 'ELECTRIC'
                  ? TYPE_COLORS.ELECTRIC
                  : TYPE_COLORS.DISABLED_PERSON;
              return (
                <Group
                  key={slot.id}
                  x={slot.x}
                  y={slot.y}
                  onClick={() => onSlotClick(slot)}
                  onTap={() => onSlotClick(slot)}
                  onMouseEnter={(event) => {
                    event.target.getStage()!.container().style.cursor = 'pointer';
                  }}
                  onMouseLeave={(event) => {
                    event.target.getStage()!.container().style.cursor = 'default';
                  }}
                >
                  {isSelected && (
                    <Rect
                      x={-4}
                      y={-4}
                      width={slot.width + 8}
                      height={slot.height + 8}
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      cornerRadius={7}
                      listening={false}
                    />
                  )}
                  <Rect
                    width={slot.width}
                    height={slot.height}
                    fill={state.background}
                    stroke={state.border}
                    strokeWidth={1.2}
                    cornerRadius={4}
                  />
                  {special && (
                    <Group listening={false}>
                      <Group
                        x={vertical ? (slot.width - 24 * iconScale) / 2 : slot.width - 21}
                        y={vertical ? 43 : 20}
                        scaleX={iconScale}
                        scaleY={iconScale}
                      >
                        <Path
                          data={slot.slotType === 'ELECTRIC' ? boltPath : wheelchairPath}
                          fill={slot.slotType === 'ELECTRIC' ? typeColor : undefined}
                          stroke={typeColor}
                          strokeWidth={1.8}
                          lineCap="round"
                          lineJoin="round"
                        />
                        {slot.slotType === 'DISABLED_PERSON' && (
                          <Circle x={9} y={3} radius={2} fill={typeColor} />
                        )}
                      </Group>
                    </Group>
                  )}
                  <Text
                    x={5}
                    y={6}
                    width={Math.max(
                      10,
                      slot.width -
                        (mode === 'admin' &&
                        reservationCounts?.[slot.parkingSpaceId ?? -1]
                          ? 22
                          : 10),
                    )}
                    text={slot.slotNumber}
                    fontSize={10}
                    fontStyle="bold"
                    fill={state.color}
                    listening={false}
                  />
                  {mode === 'admin' &&
                    !!reservationCounts?.[slot.parkingSpaceId ?? -1] && (
                      <Group x={slot.width - 15} y={4} listening={false}>
                        <Rect
                          width={12}
                          height={12}
                          cornerRadius={2}
                          fill="#ffffff"
                          stroke="#5a54a1"
                          strokeWidth={1}
                        />
                        <Path
                          data="M0 4H12M3 0V3M9 0V3"
                          stroke="#5a54a1"
                          strokeWidth={1}
                        />
                        <Circle x={4} y={7} radius={1} fill="#5a54a1" />
                        <Circle x={8} y={7} radius={1} fill="#5a54a1" />
                      </Group>
                    )}
                  <Text
                    x={5}
                    y={21}
                    width={Math.max(10, slot.width - (special && !vertical ? 27 : 10))}
                    text={state.label}
                    fontSize={8.5}
                    fill={state.color}
                    listening={false}
                  />
                  {mode === 'admin' && slot.vehicleNumber && slot.height >= 45 && (
                    <Text
                      x={3}
                      y={slot.height - 12}
                      width={slot.width - 6}
                      align="center"
                      text={slot.vehicleNumber}
                      fontSize={7.5}
                      fill={state.color}
                      listening={false}
                    />
                  )}
                </Group>
              );
            })}
          </Layer>
        </Stage>
      </div>
      {floorSlots.length === 0 && (
        <p className="parking-map-empty" role="status">
          조회된 주차구획이 없습니다.
        </p>
      )}
      <div className="parking-map-legend" aria-label="구획 표시 범례">
        {mode === 'admin' && reservationCounts && (
          <span className="parking-map-reservation-key">
            ▦ 달력 표시: 진행 중·향후 확정 예약 있음 (현재 상태와 별도)
          </span>
        )}
        <div className="parking-map-legend-status">
          {Object.entries(STATUS).map(([code, item]) => (
            <span key={code}>
              <i
                style={{
                  backgroundColor: item.background,
                  border: `1px solid ${item.border}`,
                }}
                aria-hidden="true"
              />
              {item.label}
            </span>
          ))}
        </div>
        <div className="parking-map-legend-types">
          <span>
            <i
              className="parking-map-type-key"
              style={{ color: TYPE_COLORS.ELECTRIC }}
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={boltPath} fill="currentColor" />
              </svg>
            </i>
            전기차 전용
          </span>
          <span>
            <i
              className="parking-map-type-key"
              style={{ color: TYPE_COLORS.DISABLED_PERSON }}
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="3" r="2" fill="currentColor" stroke="none" />
                <path d={wheelchairPath} />
              </svg>
            </i>
            장애인 전용
          </span>
          <span>
            <i className="parking-map-selected-key" aria-hidden="true" />
            선택 구획
          </span>
        </div>
      </div>
      <p className="parking-map-hint">
        {selected ? `${selected.spaceCode} · ${statusFor(selected).label} · ` : ''}
        {mode === 'admin'
          ? '구획을 선택하면 관리 패널이 열립니다.'
          : '사용가능 구획을 선택해 예약 정보를 확인하세요.'}
      </p>
      {/* 캔버스를 조작할 수 없는 환경에서도 같은 구획 선택 기능을 제공한다. */}
      <details className="parking-map-list">
        <summary>구획 목록으로 선택</summary>
        <div>
          {floorSlots.map((slot) => (
            <button
              key={slot.id}
              type="button"
              aria-pressed={slot.id === selectedSlotId}
              onClick={() => onSlotClick(slot)}
            >
              {slot.slotNumber} · {statusFor(slot).label}
              {slot.slotType === 'ELECTRIC'
                ? ' · 전기차'
                : slot.slotType === 'DISABLED_PERSON'
                  ? ' · 장애인'
                  : ''}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}

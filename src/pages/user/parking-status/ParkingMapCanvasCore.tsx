// src/pages/user/parking/ParkingMapCanvasCore.tsx
import React, { useState } from 'react';
import { Stage, Layer, Rect, Text, Group, Line, Arc, Circle, Arrow } from 'react-konva';
import { allParkingSlotsMock, ParkingSlot, SlotStatus, SlotType } from '../../../mock/parkingMock';

export type ExtendedSlotType = SlotType | 'BLOCKED';

const STATUS_STYLES: Record<SlotStatus, { fill: string; stroke: string; text: string }> = {
  '사용가능': { fill: '#e6f4ea', stroke: '#34a853', text: '#137333' },
  '사용중':   { fill: '#e8f0fe', stroke: '#1a73e8', text: '#155724' },
  '예약':     { fill: '#fef7e0', stroke: '#f9ab00', text: '#b06000' },
};

const INITIAL_SLOT_TYPE_MAP: Record<string, ExtendedSlotType> = {
  'A01': 'DISABLED', 'A02': 'DISABLED',
  'A03': 'EV', 'A04': 'EV',
  'A05': 'NORMAL', 'A06': 'NORMAL', 'A07': 'NORMAL', 'A08': 'NORMAL', 'A09': 'NORMAL', 'A10': 'NORMAL',
  'A12': 'EV', 'A13': 'EV',
  'A14': 'DISABLED', 'A15': 'DISABLED',
  'D01': 'DISABLED', 'D02': 'DISABLED',
  'D03': 'EV', 'D04': 'EV',
  'D12': 'EV', 'D13': 'EV',
  'D14': 'DISABLED', 'D15': 'DISABLED',
  'E01': 'DISABLED', 'E02': 'NORMAL', 'E03': 'NORMAL', 'E04': 'EV', 'E05': 'EV', 'E06': 'NORMAL', 'E07': 'NORMAL', 'E08': 'DISABLED',
};

const INITIAL_SLOT_MEMO_MAP: Record<string, string> = {
  'A03': '센서 감지 민감함 (점검예정)',
  'B05': '우천 시 천장 누수 우려 구획',
};

const HORIZONTAL_LAYOUT: { [slotNum: string]: { row: number; col: number } } = {
  'A01': { row: 0, col: 0 },  'A02': { row: 0, col: 1 },  'A03': { row: 0, col: 2 },  'A04': { row: 0, col: 3 },
  'A05': { row: 0, col: 4 },  'A06': { row: 0, col: 5 },  'A07': { row: 0, col: 6 },  'A08': { row: 0, col: 7 },
  'A09': { row: 0, col: 8 },  'A10': { row: 0, col: 9 },  'A11': { row: 0, col: 10 }, 'A12': { row: 0, col: 11 },
  'A13': { row: 0, col: 12 }, 'A14': { row: 0, col: 13 }, 'A15': { row: 0, col: 14 },
  'B01': { row: 1, col: 0 },  'B02': { row: 1, col: 1 },  'B03': { row: 1, col: 2 },  'B04': { row: 1, col: 3 },
  'B05': { row: 1, col: 4 },  'B06': { row: 1, col: 5 },  'B07': { row: 1, col: 6 },  'B08': { row: 1, col: 7 },
  'B09': { row: 1, col: 8 },  'B10': { row: 1, col: 9 },  'B11': { row: 1, col: 10 }, 'B12': { row: 1, col: 11 },
  'B13': { row: 1, col: 12 }, 'B14': { row: 1, col: 13 }, 'B15': { row: 1, col: 14 },
  'C01': { row: 2, col: 0 },  'C02': { row: 2, col: 1 },  'C03': { row: 2, col: 2 },  'C04': { row: 2, col: 3 },
  'C05': { row: 2, col: 4 },  'C06': { row: 2, col: 5 },  'C07': { row: 2, col: 6 },  'C08': { row: 2, col: 7 },
  'C09': { row: 2, col: 8 },  'C10': { row: 2, col: 9 },  'C11': { row: 2, col: 10 }, 'C12': { row: 2, col: 11 },
  'C13': { row: 2, col: 12 }, 'C14': { row: 2, col: 13 }, 'C15': { row: 2, col: 14 },
  'D01': { row: 3, col: 0 },  'D02': { row: 3, col: 1 },  'D03': { row: 3, col: 2 },  'D04': { row: 3, col: 3 },
  'D05': { row: 3, col: 4 },  'D06': { row: 3, col: 5 },  'D07': { row: 3, col: 6 },  'D08': { row: 3, col: 7 },
  'D09': { row: 3, col: 8 },  'D10': { row: 3, col: 9 },  'D11': { row: 3, col: 10 }, 'D12': { row: 3, col: 11 },
  'D13': { row: 3, col: 12 }, 'D14': { row: 3, col: 13 }, 'D15': { row: 3, col: 14 },
};

interface LeftVerticalSlot {
  code: string;
  status: SlotStatus;
  vehicleNumber: string;
}

const INITIAL_LEFT_VERTICAL_SLOTS: LeftVerticalSlot[] = [
  { code: 'E01', status: '사용가능', vehicleNumber: '' },
  { code: 'E02', status: '사용가능', vehicleNumber: '' },
  { code: 'E03', status: '사용중',   vehicleNumber: '12가 3456' },
  { code: 'E04', status: '사용중',   vehicleNumber: '55가 1234' },
  { code: 'E05', status: '사용가능', vehicleNumber: '' },
  { code: 'E06', status: '사용가능', vehicleNumber: '' },
  { code: 'E07', status: '사용가능', vehicleNumber: '' },
  { code: 'E08', status: '사용가능', vehicleNumber: '' },
];

interface ParkingMapCanvasCoreProps {
  floor: 'B1' | 'B2' | 'B3';
  showPath: boolean;
  onSelectSlot: (slot: ParkingSlot) => void;
  selectedSlotId?: number | string;
}

export default function ParkingMapCanvasCore({
  floor,
  showPath,
  onSelectSlot,
  selectedSlotId,
}: ParkingMapCanvasCoreProps) {
  const [slotTypeMap] = useState<Record<string, ExtendedSlotType>>(INITIAL_SLOT_TYPE_MAP);
  const [slotsData] = useState<ParkingSlot[]>(allParkingSlotsMock);
  const [leftSlotsData] = useState<LeftVerticalSlot[]>(INITIAL_LEFT_VERTICAL_SLOTS);
  const [slotMemoMap] = useState<Record<string, string>>(INITIAL_SLOT_MEMO_MAP);

  const floorSlots = slotsData.filter((s) => s.floor === floor);

  const SLOT_W = 40;
  const SLOT_H = 75;
  const V_SLOT_W = 75;
  const V_SLOT_H = 40;

  const ROW_Y_MAP: { [row: number]: number } = {
    0: 85,
    1: 255,
    2: 330,
    3: 545,
  };

  const START_X = 175;

  return (
    <Stage width={1180} height={665}>
      <Layer>
        {/* 상단 범례 (Legend) 영역 */}
        <Group x={350} y={10}>
          {/* 동 출입구 */}
          <Rect x={0} y={2} width={12} height={12} fill="#f3e8ff" stroke="#a855f7" strokeWidth={1} cornerRadius={2} />
          <Text x={16} y={2} text="동 출입구 🏢" fontSize={11} fill="#475569" />

          {/* 전기차 */}
          <Rect x={100} y={2} width={12} height={12} fill="#0ea5e9" cornerRadius={2} />
          <Text x={116} y={2} text="전기차 ⚡" fontSize={11} fill="#475569" />

          {/* 장애인 */}
          <Rect x={180} y={2} width={12} height={12} fill="#6366f1" cornerRadius={2} />
          <Text x={196} y={2} text="장애인 ♿" fontSize={11} fill="#475569" />

          {/* 사용금지 */}
          <Rect x={260} y={2} width={12} height={12} fill="#64748b" cornerRadius={2} />
          <Text x={276} y={2} text="사용금지 🚫" fontSize={11} fill="#475569" />

          {/* 사용가능 */}
          <Rect x={475} y={2} width={12} height={12} fill="#e6f4ea" stroke="#34a853" strokeWidth={1} cornerRadius={2} />
          <Text x={491} y={2} text="사용가능" fontSize={11} fill="#475569" />

          {/* 사용중 */}
          <Rect x={555} y={2} width={12} height={12} fill="#e8f0fe" stroke="#1a73e8" strokeWidth={1} cornerRadius={2} />
          <Text x={571} y={2} text="사용중" fontSize={11} fill="#475569" />
        </Group>

        {/* 전체 주차장 외각 라인 */}
        <Rect x={35} y={35 + 40} width={935} height={555} fill="#ffffff" stroke="#0f172a" strokeWidth={3} />

        {/* 우측 회전 램프 영역 */}
        <Group x={970} y={312 + 40}>
          <Arc innerRadius={55} outerRadius={115} angle={230} rotation={-115} fill="#f1f5f9" stroke="#0f172a" strokeWidth={3} />
          <Circle radius={55} fill="#0f172a" />
          <Text x={-26} y={-6} text="램프 코어" fill="#ffffff" fontSize={10} fontStyle="bold" />
          <Text x={62} y={-15} text="🚗 회전 램프" fill="#0284c7" fontSize={11} fontStyle="bold" />
        </Group>

        {/* 4개 동 출입구 */}
        <Group x={40} y={40 + 40}>
          <Rect width={115} height={42} fill="#f3e8ff" stroke="#a855f7" strokeWidth={1.5} cornerRadius={4} />
          <Text text="🚪 1동 출입구" x={14} y={8} fontSize={11} fontStyle="bold" fill="#6b21a8" />
          <Text text="(EV / 계단)" x={30} y={24} fontSize={8} fill="#7e22ce" />
        </Group>
        <Group x={850} y={40 + 40}>
          <Rect width={115} height={42} fill="#f3e8ff" stroke="#a855f7" strokeWidth={1.5} cornerRadius={4} />
          <Text text="🚪 2동 출입구" x={14} y={8} fontSize={11} fontStyle="bold" fill="#6b21a8" />
          <Text text="(EV / 계단)" x={30} y={24} fontSize={8} fill="#7e22ce" />
        </Group>
        <Group x={40} y={543 + 40}>
          <Rect width={115} height={42} fill="#f3e8ff" stroke="#a855f7" strokeWidth={1.5} cornerRadius={4} />
          <Text text="🚪 3동 출입구" x={14} y={8} fontSize={11} fontStyle="bold" fill="#6b21a8" />
          <Text text="(EV / 계단)" x={30} y={24} fontSize={8} fill="#7e22ce" />
        </Group>
        <Group x={850} y={543 + 40}>
          <Rect width={115} height={42} fill="#f3e8ff" stroke="#a855f7" strokeWidth={1.5} cornerRadius={4} />
          <Text text="🚪 4동 출입구" x={14} y={8} fontSize={11} fontStyle="bold" fill="#6b21a8" />
          <Text text="(EV / 계단)" x={30} y={24} fontSize={8} fill="#7e22ce" />
        </Group>

        {/* 통행 차로선 및 회차 경계선 */}
        <Line points={[165, 150 + 40, 920, 150 + 40]} stroke="#cbd5e1" strokeWidth={1.5} dash={[6, 4]} />
        <Line points={[165, 475 + 40, 920, 475 + 40]} stroke="#cbd5e1" strokeWidth={1.5} dash={[6, 4]} />
        <Line points={[480, 150 + 40, 480, 475 + 40]} stroke="#f59e0b" strokeWidth={2} dash={[6, 4]} />

        {/* 1. 메인 가로 주차 구획 렌더링 */}
        {floorSlots.map((slot) => {
          const code = slot.slotNumber.includes('-') ? slot.slotNumber.split('-')[1] : slot.slotNumber;
          const layout = HORIZONTAL_LAYOUT[code];
          if (!layout) return null;

          const posX = START_X + layout.col * 42;
          const posY = ROW_Y_MAP[layout.row];
          const isSelected = selectedSlotId === slot.id;

          const slotType: ExtendedSlotType = slotTypeMap[code] || slot.type || 'NORMAL';
          const isBlocked = slotType === 'BLOCKED';
          const hasMemo = Boolean(slotMemoMap[code]);

          const style = isBlocked
            ? { fill: '#f1f5f9', stroke: '#94a3b8', text: '#64748b' }
            : STATUS_STYLES[slot.status];

          return (
            <Group
              key={slot.id}
              x={posX}
              y={posY}
              onClick={() => onSelectSlot(slot)}
              onTap={() => onSelectSlot(slot)}
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'pointer';
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'default';
              }}
            >
              <Rect
                width={SLOT_W}
                height={SLOT_H}
                fill={style.fill}
                stroke={isSelected ? '#0f172a' : style.stroke}
                strokeWidth={isSelected ? 2.5 : 1}
                cornerRadius={2}
              />

              {slotType === 'EV' && (
                <Group>
                  <Rect x={1} y={1} width={SLOT_W - 2} height={14} fill="#0ea5e9" cornerRadius={[2, 2, 0, 0]} />
                  <Text text="⚡" x={14} y={2} fontSize={9} />
                </Group>
              )}
              {slotType === 'DISABLED' && (
                <Group>
                  <Rect x={1} y={1} width={SLOT_W - 2} height={14} fill="#6366f1" cornerRadius={[2, 2, 0, 0]} />
                  <Text text="♿" x={14} y={2} fontSize={9} />
                </Group>
              )}
              {slotType === 'BLOCKED' && (
                <Group>
                  <Rect x={1} y={1} width={SLOT_W - 2} height={14} fill="#64748b" cornerRadius={[2, 2, 0, 0]} />
                  <Text text="🚫" x={14} y={2} fontSize={9} />
                </Group>
              )}

              {hasMemo && (
                <Group x={SLOT_W - 10} y={3}>
                  <Circle radius={4} fill="#eab308" stroke="#ffffff" strokeWidth={1} />
                </Group>
              )}

              <Text text={code} x={2} y={slotType !== 'NORMAL' ? 17 : 4} fontSize={9} fontStyle="bold" fill="#1e293b" />

              {isBlocked ? (
                <Text text="금지" x={1} y={45} fontSize={8} fill="#94a3b8" align="center" width={SLOT_W - 2} />
              ) : slot.vehicleNumber ? (
                <Text text={slot.vehicleNumber.replace(' ', '\n')} x={1} y={40} fontSize={8} fill="#0f172a" fontStyle="bold" align="center" width={SLOT_W - 2} />
              ) : (
                <Text text={slot.status} x={1} y={45} fontSize={8} fill="#64748b" align="center" width={SLOT_W - 2} />
              )}
            </Group>
          );
        })}

        {/* 2. 좌측 세로 주차 구획 (E01 ~ E08) */}
        {leftSlotsData.map((slot, idx) => {
          const posX = 40;
          const posY = 152 + 40 + idx * (V_SLOT_H + 2);
          const slotType: ExtendedSlotType = slotTypeMap[slot.code] || 'NORMAL';
          const isBlocked = slotType === 'BLOCKED';
          const style = isBlocked ? { fill: '#f1f5f9', stroke: '#94a3b8' } : STATUS_STYLES[slot.status];
          const slotUniqueId = 9000 + idx;
          const isSelected = selectedSlotId === slotUniqueId;

          return (
            <Group
              key={`v-slot-${slot.code}`}
              x={posX}
              y={posY}
              onClick={() =>
                onSelectSlot({
                  id: slotUniqueId,
                  floor: floor,
                  slotNumber: `${floor}-${slot.code}`,
                  type: 'NORMAL',
                  status: slot.status,
                  vehicleNumber: slot.vehicleNumber,
                } as unknown as ParkingSlot)
              }
              onTap={() =>
                onSelectSlot({
                  id: slotUniqueId,
                  floor: floor,
                  slotNumber: `${floor}-${slot.code}`,
                  type: 'NORMAL',
                  status: slot.status,
                  vehicleNumber: slot.vehicleNumber,
                } as unknown as ParkingSlot)
              }
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'pointer';
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'default';
              }}
            >
              <Rect width={V_SLOT_W} height={V_SLOT_H} fill={style.fill} stroke={isSelected ? '#0f172a' : style.stroke} strokeWidth={isSelected ? 2.5 : 1} />
              <Text text={slot.code} x={16} y={14} fontSize={10} fontStyle="bold" fill="#1e293b" />
              <Text text={slot.status} x={40} y={15} fontSize={8.5} fill="#64748b" />
            </Group>
          );
        })}

        {/* 3. 회차 안내 박스 */}
        <Group x={455} y={365 + 40}>
          <Rect width={50} height={18} fill="#ffffff" stroke="#f59e0b" strokeWidth={1} cornerRadius={3} />
          <Text text="🔄 회차" fill="#b45309" fontSize={9} fontStyle="bold" x={6} y={4} />
        </Group>

        {/* 4. 최적 주행 경로 */}
        {showPath && (
          <Group>
            <Arrow points={[935, 220 + 40, 900, 150 + 40, 650, 150 + 40]} stroke="#0284c7" fill="#0284c7" strokeWidth={3} pointerLength={8} pointerWidth={8} />
            <Arrow points={[650, 150 + 40, 165, 150 + 40]} stroke="#0284c7" fill="#0284c7" strokeWidth={3} pointerLength={8} pointerWidth={8} />
            <Text x={680} y={128 + 40} text="▶  진입 동선 (ONE WAY)" fill="#0284c7" fontSize={11} fontStyle="bold" />
            <Arrow points={[165, 150 + 40, 165, 475 + 40]} stroke="#0284c7" fill="#0284c7" strokeWidth={3} pointerLength={8} pointerWidth={8} />
            <Arrow points={[165, 475 + 40, 650, 475 + 40]} stroke="#dc2626" fill="#dc2626" strokeWidth={3} pointerLength={8} pointerWidth={8} />
            <Arrow points={[650, 475 + 40, 900, 475 + 40, 935, 400 + 40]} stroke="#dc2626" fill="#dc2626" strokeWidth={3} pointerLength={8} pointerWidth={8} />
            <Text x={680} y={485 + 40} text="◀  출차 동선 (RAMP OUT)" fill="#dc2626" fontSize={11} fontStyle="bold" />
          </Group>
        )}
      </Layer>
    </Stage>
  );
}
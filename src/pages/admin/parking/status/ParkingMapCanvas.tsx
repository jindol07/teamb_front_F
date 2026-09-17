// src/pages/admin/parking/status/ParkingMapCanvas.tsx
import React, { useState } from 'react';
import { Stage, Layer, Rect, Text, Group, Line, Arc, Circle, Arrow } from 'react-konva';
import { allParkingSlotsMock, ParkingSlot, SlotStatus, SlotType } from '../../../../mock/parkingMock';

export type ExtendedSlotType = SlotType | 'BLOCKED';

// 구획 설정 변경/메모 로그
export interface SlotLogItem {
  id: string;
  timestamp: string;
  slotNumber: string;
  type: 'AUTO' | 'MANUAL';
  action: string;
  operator: string;
}

// 입출차 로그 인터페이스
export interface EntryExitLogItem {
  id: string;
  slotNumber: string;
  vehicleNumber: string;
  type: 'IN' | 'OUT'; // IN: 입차, OUT: 출차
  timestamp: string;
}

const STATUS_STYLES: Record<SlotStatus, { fill: string; stroke: string; text: string }> = {
  '사용가능': { fill: '#e6f4ea', stroke: '#34a853', text: '#137333' },
  '사용중':   { fill: '#e8f0fe', stroke: '#1a73e8', text: '#155724' },
  '예약':     { fill: '#fef7e0', stroke: '#f9ab00', text: '#b06000' },
};

const TYPE_LABELS: Record<ExtendedSlotType, string> = {
  NORMAL: '일반 구획',
  BLOCKED: '사용금지 🚫',
  EV: '전기차 전용 ⚡',
  DISABLED: '장애인 전용 ♿',
  LARGE: '대형(광폭)',
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

  'E01': 'DISABLED', 'E02': 'NORMAL', 'E03': 'NORMAL', 'E04': 'EV',
  'E05': 'EV', 'E06': 'NORMAL', 'E07': 'NORMAL', 'E08': 'DISABLED',
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

const INITIAL_LOGS: SlotLogItem[] = [
  {
    id: 'log-1',
    timestamp: '2026-09-15 10:30:12',
    slotNumber: 'B1-A03',
    type: 'AUTO',
    action: '구획 속성을 [전기차 전용 ⚡] (으)로 변경',
    operator: '최고관리자',
  },
  {
    id: 'log-2',
    timestamp: '2026-09-15 10:32:45',
    slotNumber: 'B1-A03',
    type: 'AUTO',
    action: '특이사항 메모 추가: "센서 감지 민감함 (점검예정)"',
    operator: '최고관리자',
  },
];

// 입출차 모의 데이터 샘플
const INITIAL_ENTRY_EXIT_LOGS: EntryExitLogItem[] = [
  { id: 'ee-10', slotNumber: 'B1-A14', vehicleNumber: '84나 2114', type: 'IN', timestamp: '2026-09-15 11:02:15' },
  { id: 'ee-9',  slotNumber: 'B1-E04', vehicleNumber: '55가 1234', type: 'IN', timestamp: '2026-09-15 10:55:01' },
  { id: 'ee-8',  slotNumber: 'B1-B06', vehicleNumber: '76나 2126', type: 'IN', timestamp: '2026-09-15 10:48:30' },
  { id: 'ee-7',  slotNumber: 'B1-A14', vehicleNumber: '11조 9988', type: 'OUT', timestamp: '2026-09-15 10:40:12' },
  { id: 'ee-6',  slotNumber: 'B1-A03', vehicleNumber: '34머 5678', type: 'OUT', timestamp: '2026-09-15 10:22:10' },
  { id: 'ee-5',  slotNumber: 'B1-E03', vehicleNumber: '12가 3456', type: 'IN', timestamp: '2026-09-15 10:15:44' },
  { id: 'ee-4',  slotNumber: 'B1-A14', vehicleNumber: '11조 9988', type: 'IN', timestamp: '2026-09-15 09:30:00' },
  { id: 'ee-3',  slotNumber: 'B1-C03', vehicleNumber: '14가 1144', type: 'IN', timestamp: '2026-09-15 09:12:05' },
  { id: 'ee-2',  slotNumber: 'B1-D04', vehicleNumber: '21나 2164', type: 'IN', timestamp: '2026-09-15 08:50:22' },
  { id: 'ee-1',  slotNumber: 'B1-A14', vehicleNumber: '05거 1122', type: 'OUT', timestamp: '2026-09-15 08:10:00' },
];

export default function ParkingMapCanvas() {
  const [currentFloor, setCurrentFloor] = useState<'B1' | 'B2' | 'B3'>('B1');
  const [selectedSlot, setSelectedSlot] = useState<(ParkingSlot & { extendedType?: ExtendedSlotType }) | null>(null);
  const [showPath, setShowPath] = useState<boolean>(true);

  // 동적 주차 구획 State
  const [slotTypeMap, setSlotTypeMap] = useState<Record<string, ExtendedSlotType>>(INITIAL_SLOT_TYPE_MAP);
  const [slotsData, setSlotsData] = useState<ParkingSlot[]>(allParkingSlotsMock);
  const [leftSlotsData, setLeftSlotsData] = useState<LeftVerticalSlot[]>(INITIAL_LEFT_VERTICAL_SLOTS);

  // 칸별 메모 State
  const [slotMemoMap, setSlotMemoMap] = useState<Record<string, string>>(INITIAL_SLOT_MEMO_MAP);
  const [tempMemoText, setTempMemoText] = useState<string>('');

  // 설정 이력 State
  const [logs, setLogs] = useState<SlotLogItem[]>(INITIAL_LOGS);
  const [manualLogText, setManualLogText] = useState<string>('');
  const [logFilter, setLogFilter] = useState<'ALL' | 'SELECTED'>('SELECTED');

  // 입출차 로그 State
  const [entryExitLogs] = useState<EntryExitLogItem[]>(INITIAL_ENTRY_EXIT_LOGS);

  const floorSlots = slotsData.filter((s) => s.floor === currentFloor);

  const SLOT_W = 40;
  const SLOT_H = 75;
  const V_SLOT_W = 75;
  const V_SLOT_H = 40;

  const ROW_Y_MAP: { [row: number]: number } = {
    0: 45, 1: 215, 2: 290, 3: 505,
  };

  const START_X = 175;

  const getFormattedNow = () => {
    const d = new Date();
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const addLog = (slotNum: string, action: string, type: 'AUTO' | 'MANUAL' = 'AUTO') => {
    const newLog: SlotLogItem = {
      id: `log-${Date.now()}`,
      timestamp: getFormattedNow(),
      slotNumber: slotNum,
      type,
      action,
      operator: '최고관리자',
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const handleSlotClick = (_e: any, slotObj: ParkingSlot & { extendedType?: ExtendedSlotType }) => {
    const code = slotObj.slotNumber.includes('-') ? slotObj.slotNumber.split('-')[1] : slotObj.slotNumber;
    setSelectedSlot(slotObj);
    setTempMemoText(slotMemoMap[code] || '');
  };

  const handleChangeSlotType = (code: string, newType: ExtendedSlotType) => {
    const prevType = slotTypeMap[code] || 'NORMAL';
    if (prevType === newType) return;

    setSlotTypeMap((prev) => ({ ...prev, [code]: newType }));
    if (selectedSlot) {
      setSelectedSlot((prev) => (prev ? { ...prev, extendedType: newType } : null));
    }

    addLog(`${currentFloor}-${code}`, `구획 속성을 [${TYPE_LABELS[prevType]}] ➔ [${TYPE_LABELS[newType]}](으)로 변경`);
  };

  const handleChangeSlotStatus = (code: string, newStatus: SlotStatus) => {
    const targetSlot = code.startsWith('E')
      ? leftSlotsData.find((s) => s.code === code)
      : slotsData.find((s) => s.slotNumber.endsWith(code));

    const oldStatus = targetSlot?.status || '사용가능';
    if (oldStatus === newStatus) return;

    if (code.startsWith('E')) {
      setLeftSlotsData((prev) =>
        prev.map((s) => (s.code === code ? { ...s, status: newStatus } : s))
      );
    } else {
      setSlotsData((prev) =>
        prev.map((s) => (s.slotNumber.endsWith(code) ? { ...s, status: newStatus } : s))
      );
    }

    if (selectedSlot) {
      setSelectedSlot((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    addLog(`${currentFloor}-${code}`, `주차 상태를 [${oldStatus}] ➔ [${newStatus}](으)로 수동 변경`);
  };

  const handleSaveMemo = (code: string) => {
    const nextMemo = tempMemoText.trim();
    if (!nextMemo) return;

    const oldMemo = slotMemoMap[code];
    setSlotMemoMap((prev) => ({ ...prev, [code]: nextMemo }));

    if (oldMemo) {
      addLog(`${currentFloor}-${code}`, `메모 수정: "${nextMemo}"`);
    } else {
      addLog(`${currentFloor}-${code}`, `메모 신규 작성: "${nextMemo}"`);
    }
  };

  const handleClearMemo = (code: string) => {
    setSlotMemoMap((prev) => {
      const next = { ...prev };
      delete next[code];
      return next;
    });
    setTempMemoText('');

    addLog(`${currentFloor}-${code}`, `특이사항 메모 삭제 완료`);
  };

  const handleAddManualLog = () => {
    if (!manualLogText.trim() || !selectedSlot) return;

    const fullSlotNum = selectedSlot.slotNumber;
    addLog(fullSlotNum, manualLogText.trim(), 'MANUAL');
    setManualLogText('');
  };

  const handleCloseMenu = () => {
    setSelectedSlot(null);
    setTempMemoText('');
    setManualLogText('');
  };

  const selectedCode = selectedSlot
    ? selectedSlot.slotNumber.includes('-')
      ? selectedSlot.slotNumber.split('-')[1]
      : selectedSlot.slotNumber
    : '';
  const hasSavedMemo = Boolean(selectedCode && slotMemoMap[selectedCode]);

  // 설정 로그 필터링
  const displayedLogs = logs.filter((log) => {
    if (logFilter === 'SELECTED' && selectedSlot) {
      return log.slotNumber === selectedSlot.slotNumber;
    }
    return true;
  });

  // 선택된 주차칸 전용 입출차 로그
  const selectedSlotEntryExitLogs = selectedSlot
    ? entryExitLogs.filter((log) => log.slotNumber === selectedSlot.slotNumber)
    : [];

  return (
    <div className="card border-0 shadow-sm mt-4 p-4 bg-white">
      {/* 상단 컨트롤 헤더 */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <div className="d-flex gap-2 align-items-center">
          <div className="btn-group" role="group">
            {(['B1', 'B2', 'B3'] as const).map((floor) => (
              <button
                key={floor}
                type="button"
                className={`btn btn-sm ${
                  currentFloor === floor ? 'btn-dark fw-bold px-3' : 'btn-outline-secondary px-3'
                }`}
                onClick={() => {
                  setCurrentFloor(floor);
                  handleCloseMenu();
                }}
              >
                지하 {floor.replace('B', '')}층 ({floor})
              </button>
            ))}
          </div>

          <button
            className={`btn btn-sm ${showPath ? 'btn-primary' : 'btn-outline-primary'} fw-bold ms-1`}
            onClick={() => setShowPath(!showPath)}
          >
            {showPath ? '🛣️ 주행 경로 숨기기' : '🛣️ 주행 경로 보기'}
          </button>
        </div>

        {/* 범례 */}
        <div className="d-flex gap-2 small fw-semibold align-items-center flex-wrap bg-light px-3 py-1.5 rounded border">
          <span className="d-flex align-items-center gap-1">
            <span style={{ width: 10, height: 10, backgroundColor: '#f3e8ff', border: '1px solid #a855f7', borderRadius: 2 }}></span>
            동 출입구🏢
          </span>
          <span className="d-flex align-items-center gap-1">
            <span style={{ width: 10, height: 10, backgroundColor: '#0ea5e9', borderRadius: 2 }}></span>
            전기차⚡
          </span>
          <span className="d-flex align-items-center gap-1">
            <span style={{ width: 10, height: 10, backgroundColor: '#6366f1', borderRadius: 2 }}></span>
            장애인♿
          </span>
          <span className="d-flex align-items-center gap-1">
            <span style={{ width: 10, height: 10, backgroundColor: '#64748b', borderRadius: 2 }}></span>
            사용금지🚫
          </span>
          <span className="d-flex align-items-center gap-1">
            <span style={{ width: 8, height: 8, backgroundColor: '#eab308', borderRadius: '50%' }}></span>
            메모📍
          </span>
          <span className="border-start ms-1 ps-2 d-flex align-items-center gap-1">
            <span style={{ width: 10, height: 10, backgroundColor: '#e6f4ea', border: '1px solid #34a853', borderRadius: 2 }}></span>
            사용가능
          </span>
          <span className="d-flex align-items-center gap-1">
            <span style={{ width: 10, height: 10, backgroundColor: '#e8f0fe', border: '1px solid #1a73e8', borderRadius: 2 }}></span>
            사용중
          </span>
        </div>
      </div>

      {/* 메인 도면 영역 + 설정 패널 + 입출차 로그 영역 */}
      <div className="d-flex gap-3 align-items-start">
        {/* 1. 2D 캔버스 영역 */}
        <div className="bg-light p-2 rounded border overflow-auto" style={{ width: 1050, flexShrink: 0 }}>
          <Stage
            width={1040}
            height={625}
            onClick={(e) => {
              if (e.target === e.target.getStage()) {
                handleCloseMenu();
              }
            }}
          >
            <Layer>
              <Rect x={35} y={35} width={935} height={555} fill="#ffffff" stroke="#0f172a" strokeWidth={3} />

              <Group x={970} y={312}>
                <Arc innerRadius={55} outerRadius={115} angle={230} rotation={-115} fill="#f1f5f9" stroke="#0f172a" strokeWidth={3} />
                <Circle radius={55} fill="#0f172a" />
                <Text x={-26} y={-6} text="램프 코어" fill="#ffffff" fontSize={10} fontStyle="bold" />
                <Text x={62} y={-15} text="🚗 회전 램프" fill="#0284c7" fontSize={11} fontStyle="bold" />
              </Group>

              <Group x={40} y={40}>
                <Rect width={115} height={42} fill="#f3e8ff" stroke="#a855f7" strokeWidth={1.5} cornerRadius={4} />
                <Text text="🚪 1동 출입구" x={14} y={8} fontSize={11} fontStyle="bold" fill="#6b21a8" />
                <Text text="(EV / 계단)" x={30} y={24} fontSize={8} fill="#7e22ce" />
              </Group>

              <Group x={850} y={40}>
                <Rect width={115} height={42} fill="#f3e8ff" stroke="#a855f7" strokeWidth={1.5} cornerRadius={4} />
                <Text text="🚪 2동 출입구" x={14} y={8} fontSize={11} fontStyle="bold" fill="#6b21a8" />
                <Text text="(EV / 계단)" x={30} y={24} fontSize={8} fill="#7e22ce" />
              </Group>

              <Group x={40} y={543}>
                <Rect width={115} height={42} fill="#f3e8ff" stroke="#a855f7" strokeWidth={1.5} cornerRadius={4} />
                <Text text="🚪 3동 출입구" x={14} y={8} fontSize={11} fontStyle="bold" fill="#6b21a8" />
                <Text text="(EV / 계단)" x={30} y={24} fontSize={8} fill="#7e22ce" />
              </Group>

              <Group x={850} y={543}>
                <Rect width={115} height={42} fill="#f3e8ff" stroke="#a855f7" strokeWidth={1.5} cornerRadius={4} />
                <Text text="🚪 4동 출입구" x={14} y={8} fontSize={11} fontStyle="bold" fill="#6b21a8" />
                <Text text="(EV / 계단)" x={30} y={24} fontSize={8} fill="#7e22ce" />
              </Group>

              <Line points={[165, 150, 920, 150]} stroke="#cbd5e1" strokeWidth={1.5} dash={[6, 4]} />
              <Line points={[165, 475, 920, 475]} stroke="#cbd5e1" strokeWidth={1.5} dash={[6, 4]} />
              <Line points={[480, 150, 480, 475]} stroke="#f59e0b" strokeWidth={2} dash={[6, 4]} />

              {/* 가로 칸들 */}
              {floorSlots.map((slot) => {
                const code = slot.slotNumber.includes('-') ? slot.slotNumber.split('-')[1] : slot.slotNumber;
                const layout = HORIZONTAL_LAYOUT[code];
                if (!layout) return null;

                const posX = START_X + layout.col * 42;
                const posY = ROW_Y_MAP[layout.row];
                const isSelected = selectedSlot?.id === slot.id;

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
                    onClick={(e) => handleSlotClick(e, { ...slot, extendedType: slotType })}
                    onTap={(e) => handleSlotClick(e, { ...slot, extendedType: slotType })}
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
                      stroke={isSelected ? '#2563eb' : style.stroke}
                      strokeWidth={isSelected ? 3 : 1}
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

                    <Text
                      text={code}
                      x={2}
                      y={slotType !== 'NORMAL' ? 17 : 4}
                      fontSize={9}
                      fontStyle="bold"
                      fill="#1e293b"
                    />

                    {isBlocked ? (
                      <Text text="금지" x={1} y={45} fontSize={8} fill="#94a3b8" align="center" width={SLOT_W - 2} />
                    ) : slot.vehicleNumber ? (
                      <Text
                        text={slot.vehicleNumber.replace(' ', '\n')}
                        x={1}
                        y={40}
                        fontSize={8}
                        fill="#0f172a"
                        fontStyle="bold"
                        align="center"
                        width={SLOT_W - 2}
                      />
                    ) : (
                      <Text
                        text={slot.status}
                        x={1}
                        y={45}
                        fontSize={8}
                        fill="#64748b"
                        align="center"
                        width={SLOT_W - 2}
                      />
                    )}
                  </Group>
                );
              })}

              {/* 세로 칸들 */}
              {leftSlotsData.map((slot, idx) => {
                const posX = 40;
                const posY = 152 + idx * (V_SLOT_H + 2);
                const slotType: ExtendedSlotType = slotTypeMap[slot.code] || 'NORMAL';
                const isBlocked = slotType === 'BLOCKED';
                const hasMemo = Boolean(slotMemoMap[slot.code]);

                const style = isBlocked
                  ? { fill: '#f1f5f9', stroke: '#94a3b8', text: '#64748b' }
                  : STATUS_STYLES[slot.status];

                const isSelected = selectedSlot?.slotNumber.endsWith(slot.code);

                return (
                  <Group
                    key={`v-slot-${slot.code}`}
                    x={posX}
                    y={posY}
                    onClick={(e) =>
                      handleSlotClick(e, {
                        id: 9000 + idx,
                        floor: currentFloor,
                        slotNumber: `${currentFloor}-${slot.code}`,
                        type: 'NORMAL',
                        extendedType: slotType,
                        status: slot.status,
                        vehicleNumber: slot.vehicleNumber,
                      } as unknown as ParkingSlot)
                    }
                    onTap={(e) =>
                      handleSlotClick(e, {
                        id: 9000 + idx,
                        floor: currentFloor,
                        slotNumber: `${currentFloor}-${slot.code}`,
                        type: 'NORMAL',
                        extendedType: slotType,
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
                    <Rect
                      width={V_SLOT_W}
                      height={V_SLOT_H}
                      fill={style.fill}
                      stroke={isSelected ? '#2563eb' : style.stroke}
                      strokeWidth={isSelected ? 3 : 1}
                    />

                    {slotType === 'EV' && (
                      <Group>
                        <Rect x={1} y={1} width={12} height={V_SLOT_H - 2} fill="#0ea5e9" />
                        <Text text="⚡" x={2} y={14} fontSize={9} />
                      </Group>
                    )}

                    {slotType === 'DISABLED' && (
                      <Group>
                        <Rect x={1} y={1} width={12} height={V_SLOT_H - 2} fill="#6366f1" />
                        <Text text="♿" x={2} y={14} fontSize={9} />
                      </Group>
                    )}

                    {slotType === 'BLOCKED' && (
                      <Group>
                        <Rect x={1} y={1} width={12} height={V_SLOT_H - 2} fill="#64748b" />
                        <Text text="🚫" x={2} y={14} fontSize={9} />
                      </Group>
                    )}

                    {hasMemo && (
                      <Group x={V_SLOT_W - 8} y={8}>
                        <Circle radius={4} fill="#eab308" stroke="#ffffff" strokeWidth={1} />
                      </Group>
                    )}

                    <Text
                      text={slot.code}
                      x={slotType !== 'NORMAL' ? 16 : 6}
                      y={14}
                      fontSize={10}
                      fontStyle="bold"
                      fill="#1e293b"
                    />

                    {isBlocked ? (
                      <Text text="사용금지" x={35} y={15} fontSize={8.5} fill="#94a3b8" />
                    ) : slot.vehicleNumber ? (
                      <Text text={slot.vehicleNumber} x={38} y={15} fontSize={8.5} fill="#0f172a" fontStyle="bold" />
                    ) : (
                      <Text text={slot.status} x={40} y={15} fontSize={8.5} fill="#64748b" />
                    )}
                  </Group>
                );
              })}

              <Group x={455} y={365}>
                <Rect width={50} height={18} fill="#ffffff" stroke="#f59e0b" strokeWidth={1} cornerRadius={3} />
                <Text text="🔄 회차" fill="#b45309" fontSize={9} fontStyle="bold" x={6} y={4} />
              </Group>

              {showPath && (
                <Group>
                  <Arrow points={[935, 220, 900, 150, 650, 150]} stroke="#0284c7" fill="#0284c7" strokeWidth={3} pointerLength={8} pointerWidth={8} />
                  <Arrow points={[650, 150, 165, 150]} stroke="#0284c7" fill="#0284c7" strokeWidth={3} pointerLength={8} pointerWidth={8} />
                  <Text x={680} y={128} text="▶   진입 동선 (ONE WAY)" fill="#0284c7" fontSize={11} fontStyle="bold" />

                  <Arrow points={[165, 150, 165, 475]} stroke="#0284c7" fill="#0284c7" strokeWidth={3} pointerLength={8} pointerWidth={8} />

                  <Arrow points={[165, 475, 650, 475]} stroke="#dc2626" fill="#dc2626" strokeWidth={3} pointerLength={8} pointerWidth={8} />
                  <Arrow points={[650, 475, 900, 475, 935, 400]} stroke="#dc2626" fill="#dc2626" strokeWidth={3} pointerLength={8} pointerWidth={8} />
                  <Text x={680} y={485} text="◀   출차 동선 (RAMP OUT)" fill="#dc2626" fontSize={11} fontStyle="bold" />
                </Group>
              )}
            </Layer>
          </Stage>
        </div>

        {/* 2. 상세 설정 패널 (폭: 360px) */}
        <div
          className="card shadow-sm border"
          style={{ width: 360, flexShrink: 0, backgroundColor: '#ffffff', minHeight: 641 }}
        >
          {selectedSlot ? (
            <>
              <div className="card-header bg-light border-bottom d-flex justify-content-between align-items-center py-3 px-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-primary fs-6 px-2.5 py-1.5">{selectedSlot.floor}층</span>
                  <h6 className="mb-0 fw-bold text-dark fs-6">{selectedSlot.slotNumber} 상세 설정</h6>
                </div>
                <button type="button" className="btn-close text-secondary" onClick={handleCloseMenu} aria-label="Close"></button>
              </div>

              <div className="card-body p-3">
                {/* 차량 및 상태 정보 */}
                <div className="bg-light p-2.5 rounded border mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1.5">
                    <span className="text-secondary small">현재 주차 상태</span>
                    <span className={`badge ${selectedSlot.status === '사용중' ? 'bg-primary' : selectedSlot.status === '예약' ? 'bg-warning text-dark' : 'bg-success'}`}>
                      {selectedSlot.status}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-secondary small">점유 차량 번호</span>
                    <span className="fw-bold text-dark">{selectedSlot.vehicleNumber || '없음 (빈 구획)'}</span>
                  </div>
                </div>

                {/* 구획 속성 변경 */}
                <div className="mb-3">
                  <label className="form-label fw-bold text-dark small mb-1.5 d-block">⚙️ 구획 속성 변경</label>
                  <div className="row g-1.5">
                    {(['NORMAL', 'BLOCKED', 'EV', 'DISABLED'] as ExtendedSlotType[]).map((t) => {
                      const currentType = selectedSlot.extendedType || slotTypeMap[selectedCode] || 'NORMAL';
                      const isSelected = currentType === t;
                      return (
                        <div className="col-6" key={t}>
                          <button
                            type="button"
                            className={`btn w-100 py-1.5 btn-sm text-start ${isSelected ? 'btn-primary fw-bold' : 'btn-outline-secondary'}`}
                            style={{ fontSize: '12px' }}
                            onClick={() => handleChangeSlotType(selectedCode, t)}
                          >
                            {TYPE_LABELS[t]}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 상태 수동 변경 */}
                <div className="mb-3">
                  <label className="form-label fw-bold text-dark small mb-1.5 d-block">🚦 주차 상태 수동 설정</label>
                  <div className="btn-group w-100" role="group">
                    {(['사용가능', '사용중', '예약'] as SlotStatus[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        className={`btn btn-sm py-1.5 ${selectedSlot.status === st ? 'btn-dark fw-bold' : 'btn-outline-secondary'}`}
                        style={{ fontSize: '12px' }}
                        onClick={() => handleChangeSlotStatus(selectedCode, st)}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 메모 작성 */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label fw-bold text-dark small mb-0">📝 특이사항 메모</label>
                    {hasSavedMemo && <span className="badge bg-warning text-dark extra-small">📍 메모 있음</span>}
                  </div>
                  <div className="input-group input-group-sm">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="구획 메모 입력"
                      value={tempMemoText}
                      onChange={(e) => setTempMemoText(e.target.value)}
                    />
                    <button type="button" className="btn btn-primary fw-bold" onClick={() => handleSaveMemo(selectedCode)}>저장</button>
                    {hasSavedMemo && <button type="button" className="btn btn-outline-danger" onClick={() => handleClearMemo(selectedCode)}>삭제</button>}
                  </div>
                </div>

                <hr className="my-2.5 text-muted" />

                {/* 히스토리/로그 입력 및 조회 */}
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-1.5">
                    <label className="form-label fw-bold text-dark small mb-0">📋 구획 히스토리 / 로그</label>
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        type="button"
                        className={`btn btn-xs ${logFilter === 'SELECTED' ? 'btn-secondary active' : 'btn-outline-secondary'}`}
                        style={{ fontSize: '11px', padding: '1px 5px' }}
                        onClick={() => setLogFilter('SELECTED')}
                      >
                        선택 구획
                      </button>
                      <button
                        type="button"
                        className={`btn btn-xs ${logFilter === 'ALL' ? 'btn-secondary active' : 'btn-outline-secondary'}`}
                        style={{ fontSize: '11px', padding: '1px 5px' }}
                        onClick={() => setLogFilter('ALL')}
                      >
                        전체
                      </button>
                    </div>
                  </div>

                  <div className="input-group input-group-sm mb-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="직접 특이 이력 입력"
                      value={manualLogText}
                      onChange={(e) => setManualLogText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddManualLog()}
                    />
                    <button type="button" className="btn btn-outline-dark fw-bold" onClick={handleAddManualLog}>+ 기록</button>
                  </div>

                  <div className="border rounded p-2 bg-light overflow-auto" style={{ maxHeight: 150 }}>
                    {displayedLogs.length > 0 ? (
                      displayedLogs.map((log) => (
                        <div key={log.id} className="bg-white p-2 rounded mb-1.5 border text-start" style={{ fontSize: '11px' }}>
                          <div className="d-flex justify-content-between text-muted extra-small mb-0.5">
                            <span className="fw-bold text-dark">[{log.slotNumber}]</span>
                            <span>{log.timestamp}</span>
                          </div>
                          <div className="text-dark fw-medium">{log.action}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted py-3 extra-small">기록된 이력이 없습니다.</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="card-body p-4 text-center text-muted d-flex flex-column justify-content-center align-items-center h-100">
              <div style={{ fontSize: 40 }} className="mb-2 text-secondary opacity-50">👈</div>
              <h6 className="fw-bold text-dark mb-1">구획이 선택되지 않았습니다</h6>
              <p className="small text-secondary mb-3">좌측 도면에서 구획을 클릭하면 상세 속성 변경 및 설정 관리가 가능합니다.</p>
            </div>
          )}
        </div>

        {/* 3. 오른쪽 남는 여백 영역: 입출차 로그 카드 2개 (전체 & 선택칸) */}
        <div className="d-flex flex-column gap-3 flex-grow-1" style={{ minWidth: 320 }}>
          {/* 3-1. 전체 입출차 로그 카드 */}
          <div className="card shadow-sm border" style={{ minHeight: 310 }}>
            <div className="card-header bg-light border-bottom d-flex justify-content-between align-items-center py-2.5 px-3">
              <h6 className="mb-0 fw-bold text-dark fs-6 d-flex align-items-center gap-1.5">
                🚗 전체 입출차 로그
              </h6>
              <span className="badge bg-secondary extra-small">최신순</span>
            </div>
            <div className="card-body p-2 overflow-auto" style={{ maxHeight: 250 }}>
              {entryExitLogs.length > 0 ? (
                entryExitLogs.map((item) => (
                  <div
                    key={item.id}
                    className="d-flex justify-content-between align-items-center p-2 mb-1.5 bg-light rounded border-start border-3"
                    style={{
                      borderLeftColor: item.type === 'IN' ? '#22c55e' : '#ef4444',
                      fontSize: '12px',
                    }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <span className={`badge ${item.type === 'IN' ? 'bg-success' : 'bg-danger'}`}>
                        {item.type === 'IN' ? '입차' : '출차'}
                      </span>
                      <span className="fw-bold text-dark">{item.vehicleNumber}</span>
                      <span className="badge bg-outline-dark border text-dark" style={{ fontSize: '10px' }}>
                        {item.slotNumber}
                      </span>
                    </div>
                    <span className="text-muted extra-small">{item.timestamp.split(' ')[1]}</span>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted py-4 extra-small">입출차 이력이 없습니다.</div>
              )}
            </div>
          </div>

          {/* 3-2. 선택한 주차칸 입출차 로그 카드 */}
          <div className="card shadow-sm border" style={{ minHeight: 315 }}>
            <div className="card-header bg-light border-bottom d-flex justify-content-between align-items-center py-2.5 px-3">
              <h6 className="mb-0 fw-bold text-dark fs-6 d-flex align-items-center gap-1.5">
                🎯 {selectedSlot ? `${selectedSlot.slotNumber} 입출차 이력` : '선택 구획 입출차 이력'}
              </h6>
              {selectedSlot && (
                <span className="badge bg-primary extra-small">{selectedSlot.slotNumber}</span>
              )}
            </div>
            <div className="card-body p-2 overflow-auto" style={{ maxHeight: 255 }}>
              {selectedSlot ? (
                selectedSlotEntryExitLogs.length > 0 ? (
                  selectedSlotEntryExitLogs.map((item) => (
                    <div
                      key={item.id}
                      className="d-flex justify-content-between align-items-center p-2 mb-1.5 bg-light rounded border-start border-3"
                      style={{
                        borderLeftColor: item.type === 'IN' ? '#22c55e' : '#ef4444',
                        fontSize: '12px',
                      }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <span className={`badge ${item.type === 'IN' ? 'bg-success' : 'bg-danger'}`}>
                          {item.type === 'IN' ? '입차' : '출차'}
                        </span>
                        <span className="fw-bold text-dark">{item.vehicleNumber}</span>
                      </div>
                      <span className="text-muted extra-small">{item.timestamp}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted py-4 extra-small">
                    해당 주차칸의 입출차 기록이 없습니다.
                  </div>
                )
              ) : (
                <div className="text-center text-muted py-5 extra-small">
                  좌측 도면에서 칸을 선택하면<br />해당 구획의 입출차 로그가 표시됩니다.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="text-muted small mt-3 text-center">
        * 도면의 구획을 클릭하여 우측 패널에서 구획 속성 및 입출차 히스토리를 한눈에 모니터링할 수 있습니다.
      </div>
    </div>
  );
}
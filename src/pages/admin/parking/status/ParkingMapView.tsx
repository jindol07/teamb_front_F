/**
 * 관리자/사용자 공용 React Konva 도면.
 * Stage(640x480)와 외곽선, 램프, 주행 화살표, 보행자 코어의 기준좌표 유지.
 * slots prop으로 전달되는 구획만 그림: 관리자 UI 클릭→상세패널, 사용자 UI 클릭→예약모달.
 * mode는 안내 문구용이며 권한 통제 수단이 아닙니다. 서버에서 권한을 검증해야 합니다.
 * 구획별 좌표는 Oracle DB에서 받습니다. 변경 시 AI팀 종이도면과 함께 검증하세요.
 */
import React, { useState } from 'react';
import { Stage, Layer, Rect, Text, Group, Arc, Arrow } from 'react-konva';
import { ExtendedParkingSlot, ParkingMapProps } from './parking';
import { PARKING_STAGE_SIZE, PARKING_MAP_BOUNDS } from './parkingLayout';

/** 학습 해설: 논리 도면 크기를 상수 별칭으로 참조합니다. DOM의 실제 반응형 폭과는 별개입니다. */
const STAGE_CONFIG = PARKING_STAGE_SIZE;
const MAP_BOUNDS = PARKING_MAP_BOUNDS;

/** 학습 해설: 엘리베이터·계단 영역이 놓일 좌표 및 크기를 정의합니다. */
const CENTRAL_CORE = { x: 220, y: 195, width: 180, height: 85 };

/** 학습 해설: React.FC<ParkingMapProps>가 Props를 구조분해합니다. mode는 UI 설명이며 권한 확인은 서버 책임입니다. */
export const ParkingMapView: React.FC<ParkingMapProps> = ({
  mode,
  slots,
  currentFloor,
  onFloorChange,
  onSlotClick,
  selectedSlotId,
}) => {
  /** 학습 해설: 동선 표시 여부에 대한 지역 상태입니다. setShowPath가 호출되면 컴포넌트가 다시 렌더링됩니다. */
  const [showPath, setShowPath] = useState<boolean>(true);

  // 현재 선택된 층에 해당하는 구획만 필터링
  /** 학습 해설: filter는 원본 slots를 수정하지 않고 현재 층의 새 배열을 만듭니다. */
  const currentFloorSlots = slots.filter((s) => s.floor === currentFloor);
  const availableFloors = [...new Set(slots.map((s) => s.floor))].sort((a, b) => a - b);

  // 구획 상태 및 전용 구분에 따른 채우기 색상
  /** 학습 해설: 선택 표시를 먼저 판단하기 때문에 클릭한 구획은 실제 점유 색 대신 파란색입니다. */
  const getSlotColor = (slot: ExtendedParkingSlot, isSelected: boolean) => {
    if (isSelected) return '#2563eb'; // 선택 시 파란색
    if (slot.slotType === 'DISABLED' || slot.status === 'DISABLED') return '#64748b';
    if (slot.status === 'UNKNOWN') return '#94a3b8'; // DB 미확인: 사용가능으로 보이면 안 됨 // 사용불가 회색

    switch (slot.status) {
      case 'OCCUPIED': return '#ef4444'; // 사용중 빨간색
      case 'RESERVED': return '#f59e0b'; // 예약됨 주황색
      case 'EMPTY': return '#10b981'; // 사용가능 초록색
      default: return '#94a3b8'; // 그 외는 미확인 회색
    }
  };

  // 전용 구분 표시용 텍스트 배지
  /** 학습 해설: 전용 구획 유형을 사용자가 볼 짧은 라벨로 변환합니다. */
  const getTypeBadge = (type?: string) => {
    switch (type) {
      case 'ELECTRIC': return '⚡전기';
      case 'DISABLED_PERSON': return '♿장애인';
      case 'DISABLED': return '🚫불가';
      case 'UNKNOWN': return '? 미확인';
      default: return '';
    }
  };

  /** 학습 해설: JSX는 React가 화면을 구성할 선언적 트리입니다. HTML처럼 보여도 style은 JS 객체, 이벤트는 함수입니다. */
  return (
    <div style={{ width: '100%', maxWidth: `${STAGE_CONFIG.width}px`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* 층 선택 및 동선 보기 컨트롤러 */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'inline-flex', padding: '3px', backgroundColor: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          {availableFloors.map((floor) => (
            <button
              key={floor}
              onClick={() => onFloorChange?.(floor)}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: currentFloor === floor ? 'bold' : 'normal',
                backgroundColor: currentFloor === floor ? '#ffffff' : 'transparent',
                color: currentFloor === floor ? '#2563eb' : '#475569',
                border: 'none',
         
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: currentFloor === floor ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              지하 {floor}층
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowPath(!showPath)}
          style={{
            padding: '6px 14px',
            fontSize: '12px',
            backgroundColor: '#1e293b',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>🛣</span>
          <span>{showPath ? '동선 숨기기' : '동선 보기'}</span>
        </button>
      </div>

      {/* 2D Konva Canvas 렌더링 영역 */}
      <div style={{ width: '100%', overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '10px', backgroundColor: '#f8fafc' }}>
        <Stage width={STAGE_CONFIG.width} height={STAGE_CONFIG.height}>
          <Layer>
            {/* 외곽선 매핑 */}
            <Rect
              x={MAP_BOUNDS.x}
              y={MAP_BOUNDS.y}
              width={MAP_BOUNDS.width}
              height={MAP_BOUNDS.height}
              stroke="#334155"
              strokeWidth={3}
              fill="#FFFFFF"
              cornerRadius={4}
            />

            {/* 지하 램프 구역 */}
            <Group x={570} y={240}>
              <Arc angle={180} innerRadius={20} outerRadius={40} fill="#94A3B8" stroke="#475569" strokeWidth={1.5} rotation={270} />
              <Text x={-15} y={-22} text="OUT ▲" fontSize={9} fontStyle="bold" fill="#DC2626" />
              <Text x={-12} y={12} text="IN  ▼" fontSize={9} fontStyle="bold" fill="#16A34A" />
              <Text x={-32} y={-4} text="지하램프" fontSize={10} fontStyle="bold" fill="#0F172A" />
            </Group>

            {/* 보행자 코어 구역 */}
            <Group x={CENTRAL_CORE.x} y={CENTRAL_CORE.y}>
              <Rect width={CENTRAL_CORE.width} height={CENTRAL_CORE.height} fill="#F1F5F9" stroke="#CBD5E1" strokeWidth={2} cornerRadius={4} />
              <Text x={15} y={18} text="E/V / Stair" fontSize={11} fontStyle="bold" fill="#334155" />
              <Text x={15} y={48} text="[보행자 전용 코어 구역]" fontSize={10} fill="#64748B" />
            </Group>

            {/* 주차 동선 가이드 */}
            {showPath && (
              <Group>
                <Arrow points={[540, 315, 500, 315]} stroke="#16A34A" fill="#16A34A" strokeWidth={2.5} pointerLength={6} pointerWidth={6} />
                <Arrow points={[500, 315, 160, 315, 160, 150, 500, 150]} stroke="#0284C7" fill="#0284C7" strokeWidth={2.5} pointerLength={6} pointerWidth={6} />
                <Arrow points={[500, 150, 540, 150]} stroke="#DC2626" fill="#DC2626" strokeWidth={2.5} pointerLength={6} pointerWidth={6} />
              </Group>
            )}

            {/* 주차 구획 그리드 목록 */}
            {currentFloorSlots.map((slot) => {
              const isSelected = selectedSlotId === slot.id;
              const slotColor = getSlotColor(slot, isSelected);
              const badgeText = getTypeBadge(slot.slotType);

              return (
                <Group
                  key={slot.id}
                  x={slot.x}
                  y={slot.y}
                  onClick={() => onSlotClick(slot)}
                  onTap={() => onSlotClick(slot)}
                >
                  <Rect
                    width={slot.width}
                    height={slot.height}
                    fill={slotColor}
                    opacity={0.88}
                    stroke={isSelected ? '#1D4ED8' : '#334155'}
                    strokeWidth={isSelected ? 2.5 : 1}
                    cornerRadius={3}
                  />
                  <Text x={5} y={5} text={slot.spaceCode} fontSize={10} fontStyle="bold" fill="#FFFFFF" />
                  <Text
                    x={5}
                    y={19}
                    text={
                      slot.slotType === 'DISABLED' || slot.status === 'DISABLED'
                        ? '🚫 점검'
                        : slot.status === 'OCCUPIED'
                        ? '🚗 주차'
                        : slot.status === 'RESERVED'
                        ? '📅 예약'
                        : slot.status === 'EMPTY'
                        ? '✅ 가능'
                        : '❔ 미확인'
                    }
                    fontSize={9}
                    fill="#FFFFFF"
                  />
                  {badgeText && (
                    <Text x={5} y={32} text={badgeText} fontSize={8} fontStyle="bold" fill="#FEF08A" />
                  )}
                  {slot.vehicleNumber && (
                    <Text x={4} y={slot.height - 13} text={slot.vehicleNumber} fontSize={8} fontStyle="bold" fill="#FEF08A" />
                  )}
                </Group>
              );
            })}
          </Layer>
        </Stage>
      </div>
      {currentFloorSlots.length === 0 && (
        <p role="status" style={{ marginTop: 12, fontSize: 13, color: '#64748b' }}>
          표시할 주차구획이 없습니다. 도면 설정과 DB 구획 정보를 확인하세요.
        </p>
      )}
      <span style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
        {mode === 'user' ? '구획 클릭 시 예약 창을 엽니다.' : '구획 클릭 시 관리 설정 패널을 엽니다.'}
      </span>
    </div>
  );
};
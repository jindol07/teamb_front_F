/**
 * 관리자 전용 주차구획 속성 편집 패널.
 * useEffect가 새로 선택한 slot 값을 편집용 state로 복사.
 * 저장 버튼은 onSave(updatedSlot)을 호출할 뿐 직접 API를 호출하지 않음.
 * 사용불가 DISABLED 선택 시 상태를 DISABLED로 고정.
 * 예약 담당자의 사용자 모달과 무관하므로 이 파일을 예약 UI로 사용하면 안 됨.
 */
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { ExtendedParkingSlot, SlotStatusType, ExtendedSlotType } from './parking';

/** 학습 해설: 부모가 선택 구획, 닫기 함수, 저장 콜백을 전달하기 위한 계약입니다. */
interface SlotDetailPanelProps {
  slot: ExtendedParkingSlot | null;
  onSave: (input: { spaceStatusCode: string; spaceTypeCode: string; memo: string; changeReason: string }) => Promise<void>;
  saving?: boolean;
  onClose: () => void;
}

/** 학습 해설: 폼 편집에 사용할 독립된 로컬 state를 가지므로 저장 전에는 공용 상태를 변경하지 않습니다. */
export const SlotDetailPanel: FC<SlotDetailPanelProps> = ({
  slot,
  onSave,
  onClose,
  saving = false,
}) => {
  /** 학습 해설: 사용자에게 선택된 구획 용도 값을 기억합니다. */
  const [selectedType, setSelectedType] = useState<ExtendedSlotType>('NORMAL');
  /** 학습 해설: 사용자에게 선택된 현재 점유 상태를 기억합니다. */
  const [selectedStatus, setSelectedStatus] = useState<SlotStatusType>('EMPTY');
  /** 학습 해설: textarea에 입력 중인 메모를 제어 컴포넌트 형태로 관리합니다. */
  const [memoInput, setMemoInput] = useState<string>('');
  const [changeReason, setChangeReason] = useState('');

  /** 학습 해설: slot이 바뀌면 이전 구획에서 편집하던 값 대신 새 구획 정보를 폼에 복원합니다. */
  useEffect(() => {
    if (slot) {
      setSelectedType(slot.slotType && slot.slotType !== 'UNKNOWN' ? slot.slotType : 'NORMAL');
      setSelectedStatus(slot.status || 'UNKNOWN');
      setMemoInput(slot.memo || '');
      setChangeReason('');
    }
  }, [slot?.id, slot?.status, slot?.slotType, slot?.memo]);

  /** 학습 해설: 선택 구획이 없으면 패널 JSX를 아예 그리지 않는 조기 반환입니다. */
  if (!slot) return null;

  /** 학습 해설: 기존 구획 객체를 펼친 뒤 현재 폼 값을 덮어쓰기 하여 onSave로 전달합니다. DB 요청은 여기서 수행하지 않습니다. */
  const handleSave = () => {
    if (selectedStatus === 'UNKNOWN' && selectedType !== 'DISABLED') { window.alert('구획 상태를 먼저 선택해 주세요.'); return; }
    if (!changeReason.trim()) { window.alert('변경 사유를 입력해 주세요.'); return; }
    if (!window.confirm(`${slot.spaceCode} 구획의 설정을 DB에 저장하시겠습니까?`)) return;
    void onSave({
      spaceStatusCode: selectedType === 'DISABLED' ? 'DISABLED' : selectedStatus === 'EMPTY' ? 'AVAILABLE' : selectedStatus,
      spaceTypeCode: selectedType,
      memo: memoInput,
      changeReason,
    });
  };

  /** 학습 해설: 버튼 텍스트, 코드값, 활성 배경색을 데이터로 관리하여 중복 JSX를 줄입니다. */
  const statusOptions: { id: SlotStatusType; label: string; activeBg: string }[] = [
    { id: 'EMPTY', label: '✅ 사용가능', activeBg: '#10b981' },
    { id: 'OCCUPIED', label: '🚗 사용중', activeBg: '#ef4444' },
    { id: 'RESERVED', label: '📅 예약됨', activeBg: '#f59e0b' },
  ];

  /** 학습 해설: 주차구획 용도 버튼의 코드와 UI 표현을 분리합니다. */
  const typeOptions: { id: ExtendedSlotType; label: string; activeBg: string }[] = [
    { id: 'NORMAL', label: '일반', activeBg: '#2563eb' },
    { id: 'ELECTRIC', label: '전기차', activeBg: '#2563eb' },
    { id: 'DISABLED_PERSON', label: '장애인', activeBg: '#2563eb' },
    { id: 'DISABLED', label: '🚫 사용불가', activeBg: '#64748b' },
  ];

  return (
    <div style={{
      width: '100%',
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      boxSizing: 'border-box'
    }}>
      {/* Panel Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9', marginBottom: '16px' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#2563eb', backgroundColor: '#eff6ff', padding: '2px 8px', borderRadius: '4px', border: '1px solid #dbeafe' }}>
            지하 {slot.floor}층
          </span>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', margin: '6px 0 0 0' }}>
            📌 {slot.spaceCode} 구획 정보
          </h3>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#94a3b8' }}
        >
          ✕
        </button>
      </div>

      {/* 1. 구획 실시간 상태 (3가지) */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>
          구획 실시간 상태
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {statusOptions.map((item) => {
            const isActive = selectedStatus === item.id && selectedType !== 'DISABLED';
            return (
              <button
                key={item.id}
                type="button"
                disabled={selectedType === 'DISABLED'}
                onClick={() => setSelectedStatus(item.id)}
                style={{
                  padding: '8px 4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  borderRadius: '6px',
                  border: isActive ? `1px solid ${item.activeBg}` : '1px solid #cbd5e1',
                  backgroundColor: isActive ? item.activeBg : '#ffffff',
                  color: isActive ? '#ffffff' : '#334155',
                  opacity: selectedType === 'DISABLED' ? 0.4 : 1,
                  cursor: selectedType === 'DISABLED' ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. 구획 전용 구분 (4가지) */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>
          구획 전용 구분
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {typeOptions.map((item) => {
            const isActive = selectedType === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedType(item.id)}
                style={{
                  padding: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  borderRadius: '6px',
                  border: isActive ? `1px solid ${item.activeBg}` : '1px solid #cbd5e1',
                  backgroundColor: isActive ? item.activeBg : '#ffffff',
                  color: isActive ? '#ffffff' : '#334155',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 메모 입력 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
          구획 메모 <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>(관리자용)</span>
        </label>
        <textarea
          value={memoInput}
          onChange={(e) => setMemoInput(e.target.value)}
          placeholder="점검 사유, 특이사항 등을 입력하세요."
          style={{
            width: '100%',
            height: '70px',
            padding: '8px',
            fontSize: '12px',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            resize: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* 변경 사유: 변경 이력 저장을 위해 필수 */}
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="changeReason" style={{ fontWeight: 'bold', fontSize: 12 }}>변경 사유 (필수)</label>
        <textarea id="changeReason" value={changeReason} onChange={(e) => setChangeReason(e.target.value)}
          maxLength={500} rows={2} placeholder="예: 센서 오인식으로 인한 관리자 수동 보정"
          style={{ width: '100%', boxSizing: 'border-box' }} />
      </div>
      {/* 4. 저장 버튼 */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: '#2563eb',
          color: '#ffffff',
          fontSize: '13px',
          fontWeight: 'bold',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        {saving ? '저장 중...' : '설정 저장하기'}
      </button>
    </div>
  );
};
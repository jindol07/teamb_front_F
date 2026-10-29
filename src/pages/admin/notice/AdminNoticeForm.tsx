import { useState } from 'react';

export interface NoticeFormData {
  category: string;
  title: string;
  content: string;
  isImportant: boolean;
  isPinned: boolean;
  files: File[];
}

interface AdminNoticeFormProps {
  onRegister: (data: NoticeFormData) => Promise<void>;
  onCancel: () => void;
}

export default function AdminNoticeForm({ onRegister, onCancel }: AdminNoticeFormProps) {
  // 등록 폼 입력값
  const [registerCategory, setRegisterCategory] = useState('USAGE_GUIDE');
  const [registerTitle, setRegisterTitle] = useState('');
  const [registerContent, setRegisterContent] = useState('');
  const [registerImportant, setRegisterImportant] = useState(false);
  const [registerPinned, setRegisterPinned] = useState(false);
  const [registerFiles, setRegisterFiles] = useState<File[]>([]);
  /*
   * 첨부파일 선택
   * - 서버 정책에 맞춰 1개만 선택 가능
   * - 새 파일을 선택하면 기존 선택 파일을 교체
   * - 파일 선택을 취소하면 기존 선택 유지
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setRegisterFiles([selectedFile]);
    }
    // 같은 파일을 다시 선택할 수 있도록 초기화
    e.target.value = '';
  };
  // 첨부파일 개별 삭제
  const handleFileDelete = (index: number) => {
    setRegisterFiles((prev) => prev.filter((_, i) => i !== index));
  };
  // API 호출은 부모가 맡고, 폼은 입력 검사와 입력값 전달을 담당합니다.
  const handleRegister = async () => {
    if (registerTitle.trim() === '') {
      alert('제목을 입력해주세요.');
      return;
    }
    if (registerContent.trim() === '') {
      alert('내용을 입력해주세요.');
      return;
    }
    await onRegister({
      category: registerCategory,
      title: registerTitle,
      content: registerContent,
      isImportant: registerImportant,
      isPinned: registerPinned,
      files: registerFiles,
    });
  };
  // 취소·등록 성공 시 부모가 폼을 닫으므로 다시 열면 초기 입력값으로 시작합니다.
  const handleCancel = onCancel;
  return (
    <div className="card p-4 mb-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">공지사항 등록</h4>
        <button
          type="button"
          className="btn-close"
          aria-label="닫기"
          onClick={handleCancel}
        />
      </div>
      {/* 공지 유형 */}
      <div className="mb-3">
        <label className="form-label">공지 유형</label>
        <select
          className="form-select"
          value={registerCategory}
          onChange={(e) => setRegisterCategory(e.target.value)}
        >
          <option value="USAGE_GUIDE">이용안내</option>
          <option value="FACILITY_INSPECTION">시설점검</option>
          <option value="PARKING_FEE">주차요금</option>
          <option value="EMERGENCY_NOTICE">긴급공지</option>
        </select>
      </div>
      {/* 제목 */}
      <div className="mb-3">
        <label className="form-label">제목</label>
        <input
          type="text"
          className="form-control"
          placeholder="공지사항 제목을 입력하세요."
          value={registerTitle}
          onChange={(e) => setRegisterTitle(e.target.value)}
        />
      </div>
      {/* 내용 */}
      <div className="mb-3">
        <label className="form-label">내용</label>
        <textarea
          className="form-control"
          rows={5}
          placeholder="공지사항 내용을 입력하세요."
          value={registerContent}
          onChange={(e) => setRegisterContent(e.target.value)}
        />
      </div>
      {/* 중요 공지 */}
      <div className="form-check mb-2">
        <input
          type="checkbox"
          className="form-check-input"
          id="importantCheck"
          checked={registerImportant}
          onChange={(e) => setRegisterImportant(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="importantCheck">
          중요 공지
        </label>
      </div>
      {/* 상단 고정 */}
      <div className="form-check mb-3">
        <input
          type="checkbox"
          className="form-check-input"
          id="pinnedCheck"
          checked={registerPinned}
          onChange={(e) => setRegisterPinned(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="pinnedCheck">
          상단 고정
        </label>
      </div>
      {/* 첨부파일 */}
      <div className="mb-3">
        <label className="form-label">첨부파일</label>
        <input type="file" className="form-control" onChange={handleFileChange} />
        <div className="form-text">
          첨부파일은 1개만 등록할 수 있습니다. 새 파일을 선택하면 기존 선택 파일이
          교체됩니다.
        </div>
        {/* 선택한 첨부파일 목록 */}
        {registerFiles.length > 0 && (
          <div className="mt-2">
            {registerFiles.map((file, index) => (
              <div
                key={`${file.name}-${file.size}-${index}`}
                className="d-flex align-items-center mb-1"
              >
                <span className="small text-secondary">📎 {file.name}</span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger ms-2"
                  onClick={() => handleFileDelete(index)}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* 등록 / 취소 */}
      <div className="d-flex justify-content-end gap-2">
        <button type="button" className="btn btn-secondary" onClick={handleCancel}>
          취소
        </button>
        <button type="button" className="btn btn-primary" onClick={handleRegister}>
          등록
        </button>
      </div>
    </div>
  );
}

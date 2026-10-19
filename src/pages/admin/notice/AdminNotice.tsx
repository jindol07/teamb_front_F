import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategoryBadge } from './noticeUtils';
import { getAdminNoticeList, registerNotice } from '../../../api/adminNoticeApi';
import { Notice } from '../../../mock/noticeMock';
export default function AdminNotice() {
  // 공지사항 검색 상태
  const [category, setCategory] = useState('전체');
  const [searchKeyword, setSearchKeyword] = useState('');
  // 공지사항 목록
  const [noticeList, setNoticeList] = useState<Notice[]>([]);
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const data = await getAdminNoticeList();
        setNoticeList(data);
      } catch (error) {
        console.error('공지사항 목록 조회 실패:', error);
      }
    };
    void fetchNotices();
  }, []);
  // 등록 화면 표시 여부
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
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
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setRegisterFiles([selectedFile]);
    }
    // 같은 파일을 다시 선택할 수 있도록 초기화
    e.target.value = '';
  };
  // 첨부파일 개별 삭제
  const handleFileDelete = (index: number) => {
    setRegisterFiles((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };
  // 검색 및 카테고리 필터
  const filteredNoticeList = noticeList.filter((notice) => {
    const categoryMatch =
      category === '전체' || notice.category === category;
    const titleMatch = notice.title
      .toLowerCase()
      .includes(searchKeyword.toLowerCase());
    return categoryMatch && titleMatch;
  });
  // 상단 고정 공지 우선 정렬
  const pinnedNoticeList = filteredNoticeList.filter(
    (notice) => notice.isPinned
  );
  const normalNoticeList = filteredNoticeList.filter(
    (notice) => !notice.isPinned
  );
  const sortedNoticeList = [
    ...pinnedNoticeList,
    ...normalNoticeList,
  ];
  // 등록 폼 입력값 초기화
  const resetRegisterForm = () => {
    setRegisterCategory('USAGE_GUIDE');
    setRegisterTitle('');
    setRegisterContent('');
    setRegisterImportant(false);
    setRegisterPinned(false);
    setRegisterFiles([]);
  };
  // 공지사항 등록
  const handleRegister = async () => {
    if (registerTitle.trim() === '') {
      alert('제목을 입력해주세요.');
      return;
    }
    if (registerContent.trim() === '') {
      alert('내용을 입력해주세요.');
      return;
    }
    try {
      await registerNotice({
        noticeTypeCode: registerCategory,
        title: registerTitle,
        content: registerContent,
        importantYn: registerImportant ? 'Y' : 'N',
        pinnedYn: registerPinned ? 'Y' : 'N',
        files: registerFiles,
      });
      const updatedNotices = await getAdminNoticeList();
      setNoticeList(updatedNotices);
      alert('공지사항이 등록되었습니다.');
      resetRegisterForm();
      setIsRegisterOpen(false);
    } catch (error) {
      console.error('공지사항 등록 실패:', error);
      alert('공지사항 등록에 실패했습니다.');
    }
  };
  // 공지사항 등록 취소
  const handleCancel = () => {
    resetRegisterForm();
    setIsRegisterOpen(false);
  };
  return (
    <div className="container py-4">
      {/* =========================
          페이지 제목 / 등록 버튼
         ========================= */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="page-title mb-1">
            공지사항 관리
          </h2>
          <p className="page-description mb-0">
            {isRegisterOpen
              ? '새로운 공지사항을 등록합니다.'
              : '등록된 공지사항을 확인하고 관리합니다.'}
          </p>
        </div>
        {/* 목록 화면에서만 등록 버튼 표시 */}
        {!isRegisterOpen && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsRegisterOpen(true)}
          >
            + 공지사항 등록
          </button>
        )}
      </div>
      {/* =========================
          등록 화면
         ========================= */}
      {isRegisterOpen ? (
        <div className="card p-4 mb-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">
              공지사항 등록
            </h4>
            <button
              type="button"
              className="btn-close"
              aria-label="닫기"
              onClick={handleCancel}
            />
          </div>
          {/* 공지 유형 */}
          <div className="mb-3">
            <label className="form-label">
              공지 유형
            </label>
            <select
              className="form-select"
              value={registerCategory}
              onChange={(e) =>
                setRegisterCategory(e.target.value)
              }
            >
              <option value="USAGE_GUIDE">이용안내</option>
              <option value="FACILITY_INSPECTION">시설점검</option>
              <option value="PARKING_FEE">주차요금</option>
              <option value="EMERGENCY_NOTICE">긴급공지</option>
              <option value="SEASON_PASS">정기권</option>
            </select>
          </div>
          {/* 제목 */}
          <div className="mb-3">
            <label className="form-label">
              제목
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="공지사항 제목을 입력하세요."
              value={registerTitle}
              onChange={(e) =>
                setRegisterTitle(e.target.value)
              }
            />
          </div>
          {/* 내용 */}
          <div className="mb-3">
            <label className="form-label">
              내용
            </label>
            <textarea
              className="form-control"
              rows={5}
              placeholder="공지사항 내용을 입력하세요."
              value={registerContent}
              onChange={(e) =>
                setRegisterContent(e.target.value)
              }
            />
          </div>
          {/* 중요 공지 */}
          <div className="form-check mb-2">
            <input
              type="checkbox"
              className="form-check-input"
              id="importantCheck"
              checked={registerImportant}
              onChange={(e) =>
                setRegisterImportant(e.target.checked)
              }
            />
            <label
              className="form-check-label"
              htmlFor="importantCheck"
            >
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
              onChange={(e) =>
                setRegisterPinned(e.target.checked)
              }
            />
            <label
              className="form-check-label"
              htmlFor="pinnedCheck"
            >
              상단 고정
            </label>
          </div>
          {/* 첨부파일 */}
          <div className="mb-3">
            <label className="form-label">
              첨부파일
            </label>
            <input
              type="file"
              className="form-control"
              onChange={handleFileChange}
            />
            <div className="form-text">
              첨부파일은 1개만 등록할 수 있습니다. 새 파일을 선택하면 기존 선택 파일이 교체됩니다.
            </div>
            {/* 선택한 첨부파일 목록 */}
            {registerFiles.length > 0 && (
              <div className="mt-2">
                {registerFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${file.size}-${index}`}
                    className="d-flex align-items-center mb-1"
                  >
                    <span className="small text-secondary">
                      📎 {file.name}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger ms-2"
                      onClick={() =>
                        handleFileDelete(index)
                      }
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
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancel}
            >
              취소
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRegister}
            >
              등록
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* =========================
              검색 영역
             ========================= */}
          <div className="d-flex gap-2 mb-3">
            <select
              className="form-select"
              style={{ width: '160px' }}
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
            >
              <option value="전체">전체</option>
              <option value="이용안내">이용안내</option>
              <option value="시설점검">시설점검</option>
              <option value="주차요금">주차요금</option>
              <option value="긴급공지">긴급공지</option>
              <option value="정기권">정기권</option>
            </select>
            <input
              type="text"
              className="form-control"
              placeholder="제목을 검색하세요."
              value={searchKeyword}
              onChange={(e) =>
                setSearchKeyword(e.target.value)
              }
            />
          </div>
          {/* =========================
              공지사항 목록
             ========================= */}
          <div className="card p-3">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>번호</th>
                    <th>공지 유형</th>
                    <th>제목</th>
                    <th>작성자</th>
                    <th>작성일</th>
                    <th>조회수</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedNoticeList.map((notice, index) => (
                    <tr key={notice.id}>
                      {/* 번호 */}
                      <td>
                        {sortedNoticeList.length - index}
                      </td>
                      {/* 공지 유형 */}
                      <td>
                        <span
                          className={`badge ${getCategoryBadge(
                            notice.category
                          )}`}
                        >
                          {notice.category}
                        </span>
                      </td>
                      {/* 제목 */}
                      <td>
                        <Link
                          to={`/admin/notice/${notice.id}`}
                          className="text-decoration-none text-dark"
                        >
                          <div className="d-flex align-items-center">
                            {/* 중요 / 고정 표시 영역: 항상 동일한 너비 */}
                            <div
                              className="d-flex align-items-center gap-1 flex-shrink-0"
                              style={{ width: '110px' }}
                            >
                              {notice.isImportant && (
                                <span className="text-danger fw-bold small">
                                  [중요]
                                </span>
                              )}
                              {notice.isPinned && (
                                <span className="badge bg-dark">
                                  고정
                                </span>
                              )}
                            </div>
                            {/* 첨부파일 아이콘 / 제목 영역 */}
                            {/* 첨부파일 아이콘 / 제목 영역 */}
                            <div className="d-flex align-items-center gap-2">
                              {/* 첨부파일 유무와 관계없이 동일한 너비 확보 */}
                              <span
                                className="d-inline-flex align-items-center justify-content-center flex-shrink-0"
                                style={{ width: '20px' }}
                                title={notice.attachments.length > 0 ? '첨부파일 있음' : undefined}
                              >
                                {notice.attachments.length > 0 ? '📎' : null}
                              </span>
                              <span>{notice.title}</span>
                            </div>
                          </div>
                        </Link>
                      </td>
                      {/* 작성자 */}
                      <td>{notice.writer}</td>
                      {/* 작성일 */}
                      <td>{notice.createdAt}</td>
                      {/* 조회수 */}
                      <td>{notice.views}</td>
                    </tr>
                  ))}
                  {/* 검색 결과가 없는 경우 */}
                  {sortedNoticeList.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center text-muted py-4"
                      >
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

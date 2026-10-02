import { useState } from 'react';
import { noticeListMock } from '../../../mock/noticeMock';
import { Link } from 'react-router-dom'; //0929
export default function AdminNotice() {
  const [category, setCategory] = useState('전체');
  /*
    searchKeyword : 사용자가 제목 검색창에 입력한 문자열을 저장
  */
  const [searchKeyword, setSearchKeyword] = useState('');
  /*
    실제 화면에서 사용할 공지사항 목록
    처음에는 noticeListMock 데이터를 사용
  */
  const [noticeList, setNoticeList] = useState(noticeListMock);
  /*
    공지사항 등록창 열림/닫힘 상태
    false : 등록창 숨김
    true : 등록창 표시
  */
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  /*
    등록할 공지 유형
  */
  const [registerCategory, setRegisterCategory] =
    useState('이용안내');
  /*
    등록할 제목
  */
  const [registerTitle, setRegisterTitle] = useState('');
  /*
    등록할 공지 내용
  */
  const [registerContent, setRegisterContent] = useState('');
  /*
    중요 공지 여부
  */
  const [registerImportant, setRegisterImportant] =
    useState(false);
  /*
    상단 고정 여부
  */
  const [registerPinned, setRegisterPinned] =
    useState(false);
  /*
    첨부파일 목록
    File[]을 사용해서
    여러 개의 파일을 저장할 수 있도록 함
  */
  const [registerFiles, setRegisterFiles] =
    useState<File[]>([]);
  /*
    첨부파일 추가
    - Ctrl / Shift로 여러 파일 한 번에 선택 가능
    - 파일 선택 버튼을 여러 번 눌러 추가 가능
    - 같은 파일 중복 선택 방지
    - 중복 파일 선택 시 알림 표시
  */
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = Array.from(
      e.target.files ?? []
    );
    // 중복 파일 찾기
    const duplicateFiles = selectedFiles.filter(
      (selectedFile) =>
        registerFiles.some(
          (file) =>
            file.name === selectedFile.name &&
            file.size === selectedFile.size
        )
    );
    // 중복 파일 알림
    if (duplicateFiles.length > 0) {
      const duplicateFileNames =
        duplicateFiles
          .map((file) => file.name)
          .join(', ');
      alert(
        `이미 선택된 파일입니다.\n${duplicateFileNames}`
      );
    }
    // 중복되지 않은 파일만 가져오기
    const newFiles = selectedFiles.filter(
      (selectedFile) =>
        !registerFiles.some(
          (file) =>
            file.name === selectedFile.name &&
            file.size === selectedFile.size
        )
    );
    // 기존 파일 + 새로운 파일
    setRegisterFiles([
      ...registerFiles,
      ...newFiles
    ]);
    // input 초기화
    e.target.value = '';
  };
  /*
    선택한 첨부파일 삭제
  */
  const handleFileDelete = (index: number) => {
    setRegisterFiles((prev) =>
      prev.filter(
        (_, i) => i !== index
      )
    );
  };
  /*
    filter(): 배열에서 조건에 맞는 데이터만
    새로운 배열로 반환
  */
  const filteredNoticeList =
    noticeList.filter((notice) => {
      const categoryMatch =
        category === '전체' ||
        notice.category === category;
      /*
        "전체"가 선택되어있으면 모든 공지를 허용
        특정 유형 선택시 해당 유형만 허용
      */
      const titleMatch =
        notice.title
          .toLowerCase()
          .includes(
            searchKeyword.toLowerCase()
          );
      /*
        categoryMatch, titleMatch
        모두 만족시 결과에 포함
      */
      return categoryMatch && titleMatch;
    });
  /*
    상단 고정된 공지만 따로 가져옴
  */
  const pinnedNoticeList =
    filteredNoticeList.filter(
      (notice) => notice.isPinned
    );
  /*
    상단 고정이 아닌 일반 공지만 따로 가져옴
  */
  const normalNoticeList =
    filteredNoticeList.filter(
      (notice) => !notice.isPinned
    );
  /*
    상단 고정 공지를 먼저 넣고,
    그 뒤에 일반 공지를 넣어서 하나의 배열로 합침
  */
  const sortedNoticeList = [
    ...pinnedNoticeList,
    ...normalNoticeList
  ];
  /*
    공지사항 등록
  */
  const handleRegister = () => {
    if (registerTitle.trim() === '') {
      alert('제목을 입력해주세요.');
      return;
    }
    if (registerContent.trim() === '') {
      alert('내용을 입력해주세요.');
      return;
    }
    /*
      새 공지사항 객체 생성
      registerFiles에 들어있는 파일들을
      attachments 형태로 변환
    */
    const newNotice = {
      id: Date.now(),
      title: registerTitle,
      writer: '관리자',
      content: registerContent,
      createdAt:
        new Date()
          .toISOString()
          .slice(0, 10),
      views: 0,
      category: registerCategory,
      isPinned: registerPinned,
      isImportant: registerImportant,
      attachments:
        registerFiles.map((file, index) => ({
          id: Date.now() + index,
          name: file.name,
          url: '',
        })),
    };
    /*
      기존 공지사항 앞에
      새 공지사항 추가
    */
    setNoticeList([
      newNotice,
      ...noticeList
    ]);
    /*
      등록창 닫기
    */
    setIsRegisterOpen(false);
    /*
      입력값 초기화
    */
    setRegisterCategory('이용안내');
    setRegisterTitle('');
    setRegisterContent('');
    setRegisterImportant(false);
    setRegisterPinned(false);
    setRegisterFiles([]);
  };
  /*
    공지사항 등록 취소
  */
  const handleCancel = () => {
    setIsRegisterOpen(false);
    setRegisterCategory('이용안내');
    setRegisterTitle('');
    setRegisterContent('');
    setRegisterImportant(false);
    setRegisterPinned(false);
    setRegisterFiles([]);
  };
  /*
    공지 유형별 Bootstrap 배지 색상
  */
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case '이용안내':
        return 'bg-primary';
      case '시설점검':
        return 'bg-warning text-dark';
      case '주차요금':
        return 'bg-success';
      case '긴급공지':
        return 'bg-danger';
      case '정기권':
        return 'bg-info text-dark';
      default:
        return 'bg-secondary';
    }
  };
  return (
    <div>
      {/* =========================
          페이지 제목 / 등록 버튼
         ========================= */}
      <div
        className="
          d-flex
          justify-content-between
          align-items-center
          mb-3
        "
      >
        <div>
          <h2 className="page-title mb-1">
            공지사항 관리
          </h2>
          <p className="page-description mb-0">
            등록된 공지사항을 확인하고 관리합니다.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() =>
            setIsRegisterOpen(true)
          }
        >
          + 공지사항 등록
        </button>
      </div>
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
          <option value="전체">
            전체
          </option>
          <option value="이용안내">
            이용안내
          </option>
          <option value="시설점검">
            시설점검
          </option>
          <option value="주차요금">
            주차요금
          </option>
          <option value="긴급공지">
            긴급공지
          </option>
          <option value="정기권">
            정기권
          </option>
        </select>
        <input
          type="text"
          className="form-control"
          placeholder="제목을 검색하세요."
          value={searchKeyword}
          onChange={(e) =>
            setSearchKeyword(
              e.target.value
            )
          }
        />
      </div>
      {/* =========================
          공지사항 등록창
         ========================= */}
      {isRegisterOpen && (
        <div className="card p-4 mb-3">
          <div
            className="
              d-flex
              justify-content-between
              align-items-center
              mb-3
            "
          >
            <h4 className="mb-0">
              공지사항 등록
            </h4>
            <button
              type="button"
              className="btn-close"
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
                setRegisterCategory(
                  e.target.value
                )
              }
            >
              <option value="이용안내">
                이용안내
              </option>
              <option value="시설점검">
                시설점검
              </option>
              <option value="주차요금">
                주차요금
              </option>
              <option value="긴급공지">
                긴급공지
              </option>
              <option value="정기권">
                정기권
              </option>
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
                setRegisterTitle(
                  e.target.value
                )
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
                setRegisterContent(
                  e.target.value
                )
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
                setRegisterImportant(
                  e.target.checked
                )
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
                setRegisterPinned(
                  e.target.checked
                )
              }
            />
            <label
              className="form-check-label"
              htmlFor="pinnedCheck"
            >
              상단 고정
            </label>
          </div>
          {/* =========================
              첨부파일
              - 여러 파일 동시 선택
              - 파일 추가 선택
              - 개별 파일 삭제
             ========================= */}
          <div className="mb-3">
            <label className="form-label">
              첨부파일
            </label>
            <input
              type="file"
              className="form-control"
              multiple
              onChange={handleFileChange}
            />
            {/* 선택한 파일 목록 */}
            {registerFiles.length > 0 && (
              <div className="mt-2">
                {registerFiles.map(
                  (file, index) => (
                    <div
                      key={`${file.name}-${file.size}-${index}`}
                      className="
                        d-flex
                        align-items-center
                        mb-1
                      "
                    >
                      <span className="small text-secondary">
                        📎 {file.name}
                      </span>
                      <button
                        type="button"
                        className="
                          btn
                          btn-sm
                          btn-outline-danger
                          ms-2
                        "
                        onClick={() =>
                          handleFileDelete(index)
                        }
                      >
                        삭제
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
          {/* 취소 / 등록 */}
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
      )}
      {/* =========================
          공지사항 목록
         ========================= */}
      <div className="card p-3">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>번호</th>
              <th>공지 유형</th>
              <th>제목</th>
              <th>중요</th>
              <th>상단 고정</th>
              <th>첨부파일</th>
              <th>작성자</th>
              <th>작성일</th>
              <th>조회수</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {sortedNoticeList.map(
              (notice, index) => (
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
                    {notice.isPinned && (
                      <span className="me-1">
                      </span>
                    )}
                    {notice.isImportant && (
                      <span className="text-danger fw-bold me-1">
                        [중요]
                      </span>
                    )}
                    <Link
                      to={`/admin/notice/${notice.id}`}
                      className="text-decoration-none text-dark"
                    >
                      {notice.title}
                    </Link>
                  </td>
                  {/* 중요 */}
                  <td>
                    {notice.isImportant ? (
                      <span className="badge bg-danger">
                        중요
                      </span>
                    ) : (
                      <span className="text-muted">
                        -
                      </span>
                    )}
                  </td>
                  {/* 상단 고정 */}
                  <td>
                    {notice.isPinned ? (
                      <span className="badge bg-dark">
                        고정
                      </span>
                    ) : (
                      <span className="text-muted">
                        -
                      </span>
                    )}
                  </td>
                  {/* 첨부파일 */}
                  <td>
                    {notice.attachments.length > 0 ? (
                      <span>
                        📎 {notice.attachments.length}개
                      </span>
                    ) : (
                      <span className="text-muted">
                        없음
                      </span>
                    )}
                  </td>
                  {/* 작성자 */}
                  <td>
                    {notice.writer}
                  </td>
                  {/* 작성일 */}
                  <td>
                    {notice.createdAt}
                  </td>
                  {/* 조회수 */}
                  <td>
                    {notice.views}
                  </td>
                  {/* 관리 */}
                  <td>
                    <button
                      type="button"
                      className="
                        btn
                        btn-sm
                        btn-outline-secondary
                        me-1
                      "
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      className="
                        btn
                        btn-sm
                        btn-outline-danger
                      "
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              )
            )}
            {/* 검색 결과 없음 */}
            {sortedNoticeList.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="
                    text-center
                    text-muted
                    py-4
                  "
                >
                  검색 결과가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
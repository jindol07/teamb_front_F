import { useState } from 'react';
import { noticeListMock } from '../../../mock/noticeMock';
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
  const [registerCategory, setRegisterCategory] = useState('이용안내');
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
  const [registerImportant, setRegisterImportant] = useState(false);
  /*
    상단 고정 여부
  */
  const [registerPinned, setRegisterPinned] = useState(false);
  /*
    첨부파일
    파일이 없으면 null
  */
  const [registerFile, setRegisterFile] = useState<File | null>(null);
  /*
    filter(): 배열에서 조건에 맞는 데이터만 새로운 배열로 반환
  */
  const filteredNoticeList = noticeList.filter((notice) => {
    const categoryMatch =
      category === '전체' || notice.category === category;
    /*
      "전체"가 선택되어있으면 모든 공지를 허용, 특정 유형 선택시 해당 유형만 허용
    */
    const titleMatch =
      notice.title
        .toLowerCase()
        .includes(searchKeyword.toLowerCase());
    return categoryMatch && titleMatch;
    /*
      categoryMatch,titleMatch 모두 만족시 결과에 포함
    */
  });
  /*
    상단 고정된 공지만 따로 가져옴
    notice.isPinned이 true인 공지만 pinnedNoticeList에 저장
  */
  const pinnedNoticeList = filteredNoticeList.filter(
    (notice) => notice.isPinned
  );
  /*
    상단 고정이 아닌 일반 공지만 따로 가져옴
    !notice.isPinned은 isPinned이 false인 경우를 의미
  */
  const normalNoticeList = filteredNoticeList.filter(
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
    공지사항 등록 함수
    등록 버튼을 클릭했을 때 실행
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
    */
    const newNotice = {
      id: Date.now(),
      title: registerTitle,
      writer: '관리자',
      content: registerContent,
      createdAt: new Date().toISOString().slice(0, 10),
      views: 0,
      category: registerCategory,
      isPinned: registerPinned,
      isImportant: registerImportant,
      attachmentName: registerFile ? registerFile.name : null,
      attachmentUrl: null
    };
    /*
      기존 공지사항 앞에 새 공지 추가
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
    setRegisterFile(null);
  };
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
      <div className="d-flex justify-content-between align-items-center mb-3">
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
          onClick={() => setIsRegisterOpen(true)}
        >
          + 공지사항 등록
        </button>
      </div>
      {/* 검색 영역 */}
      <div className="d-flex gap-2 mb-3">
        <select
          className="form-select"
          style={{ width: '160px' }}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
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
          onChange={(e) => setSearchKeyword(e.target.value)}
        />
      </div>
      {/* 공지사항 등록창 */}
      {isRegisterOpen && (
        <div className="card p-4 mb-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">
              공지사항 등록
            </h4>
            <button
              type="button"
              className="btn-close"
              onClick={() => setIsRegisterOpen(false)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">
              공지 유형
            </label>
            <select
              className="form-select"
              value={registerCategory}
              onChange={(e) => setRegisterCategory(e.target.value)}
            >
              <option value="이용안내">이용안내</option>
              <option value="시설점검">시설점검</option>
              <option value="주차요금">주차요금</option>
              <option value="긴급공지">긴급공지</option>
              <option value="정기권">정기권</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">
              제목
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="공지사항 제목을 입력하세요."
              value={registerTitle}
              onChange={(e) => setRegisterTitle(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">
              내용
            </label>
            <textarea
              className="form-control"
              rows={5}
              placeholder="공지사항 내용을 입력하세요."
              value={registerContent}
              onChange={(e) => setRegisterContent(e.target.value)}
            />
          </div>
          <div className="form-check mb-2">
            <input
              type="checkbox"
              className="form-check-input"
              id="importantCheck"
              checked={registerImportant}
              onChange={(e) => setRegisterImportant(e.target.checked)}
            />
            <label
              className="form-check-label"
              htmlFor="importantCheck"
            >
              중요 공지
            </label>
          </div>
          <div className="form-check mb-3">
            <input
              type="checkbox"
              className="form-check-input"
              id="pinnedCheck"
              checked={registerPinned}
              onChange={(e) => setRegisterPinned(e.target.checked)}
            />
            <label
              className="form-check-label"
              htmlFor="pinnedCheck"
            >
              상단 고정
            </label>
          </div>
          <div className="mb-3">
            <label className="form-label">
              첨부파일
            </label>
            <input
              type="file"
              className="form-control"
              onChange={(e) =>
                setRegisterFile(
                  e.target.files?.[0] ?? null
                )
              }
            />
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsRegisterOpen(false)}
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
            {sortedNoticeList.map((notice, index) => (
              <tr key={notice.id}>
                <td>
                  {sortedNoticeList.length - index}
                </td>
                <td>
                  <span
                    className={`badge ${getCategoryBadge(notice.category)}`}
                  >
                    {notice.category}
                  </span>
                </td>
                <td>
                  {notice.isPinned && (
                    <span className="me-1">📌</span>
                  )}
                  {notice.isImportant && (
                    <span className="text-danger fw-bold me-1">
                      [중요]
                    </span>
                  )}
                  {notice.title}
                </td>
                <td>
                  {notice.isImportant ? (
                    <span className="badge bg-danger">
                      중요
                    </span>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td>
                  {notice.isPinned ? (
                    <span className="badge bg-dark">
                      고정
                    </span>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td>
                  {notice.attachmentName && notice.attachmentUrl ? (
                    <a
                      href={notice.attachmentUrl}
                      className="text-decoration-none"
                    >
                      📎 {notice.attachmentName}
                    </a>
                  ) : (
                    <span className="text-muted">
                      없음
                    </span>
                  )}
                </td>
                <td>{notice.writer}</td>
                <td>{notice.createdAt}</td>
                <td>{notice.views}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary me-1"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
            {sortedNoticeList.length === 0 && (
              <tr>
                <td
                  colSpan={10}
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
  );
}
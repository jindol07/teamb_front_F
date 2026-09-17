import { useState } from 'react';
import { noticeListMock } from '../../../mock/noticeMock';
import useAgent from '../../../hooks/useAgent';

/**
 * 사용자 공지사항 페이지 (/user/notice)
 *
 * - PC에서는 Table 형태
 * - 모바일에서는 Card 형태
 * - 공지 유형 필터 기능
 * - 제목 검색 기능
 * - 상단 고정 공지는 먼저 출력
 */
export default function Notice() {
  const { isMobile } = useAgent();

  /**
   * category
   * 현재 선택한 공지 유형을 저장
   * 기본값은 '전체'
   */
  const [category, setCategory] = useState('전체');

  /**
   * searchKeyword
   * 사용자가 제목 검색창에 입력한 검색어를 저장
   */
  const [searchKeyword, setSearchKeyword] = useState('');

  /**
   * 1단계
   * 공지 유형 + 제목을 기준으로 검색
   */
  const filteredNoticeList = noticeListMock.filter((notice) => {
    /**
     * 공지 유형 검색
     *
     * category가 '전체'이면 모든 공지를 허용
     * 그 외에는 선택된 category와 같은 공지만 허용
     */
    const categoryMatch =
      category === '전체' || notice.category === category;

    /**
     * 제목 검색
     *
     * includes()를 사용해서
     * 제목에 검색어가 포함되어 있는지 확인
     */
    const titleMatch = notice.title
      .toLowerCase()
      .includes(searchKeyword.toLowerCase());

    /**
     * 공지 유형과 제목 검색 조건을
     * 둘 다 만족하는 공지만 남김
     */
    return categoryMatch && titleMatch;
  });
  /**
   * 2단계
   * 검색된 공지 중 상단 고정 공지만 따로 가져옴
   *
   * notice.isPinned이 true인 공지만
   * pinnedNoticeList에 저장
   */
  const pinnedNoticeList = filteredNoticeList.filter(
    (notice) => notice.isPinned
  );

  /**
   * 3단계
   * 검색된 공지 중 일반 공지만 따로 가져옴
   *
   * !notice.isPinned은
   * isPinned이 false인 공지를 의미
   */
  const normalNoticeList = filteredNoticeList.filter(
    (notice) => !notice.isPinned
  );

  /**
   * 4단계
   * 상단 고정 공지를 먼저 넣고
   * 일반 공지를 그 뒤에 넣어서 하나의 배열로 합침
   */
  const sortedNoticeList = [
    ...pinnedNoticeList,
    ...normalNoticeList,
  ];

  /**
   * 공지 유형별 Bootstrap 배지 색상
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
    <div className="container py-4">
      {/* ==============================
          페이지 제목
         ============================== */}
      <h2 className="page-title">공지사항</h2>

      <p className="page-description">
        주차관제 서비스의 공지사항을 확인하세요.
      </p>

      {/* ==============================
          검색 영역
         ============================== */}
      <div className="d-flex gap-2 mb-3">
        {/* 공지 유형 선택 */}
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

        {/* 제목 검색 */}
        <input
          type="text"
          className="form-control"
          placeholder="제목을 검색하세요."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />
      </div>

      {isMobile ? (
        /* ==============================
            모바일 화면
            공지사항을 카드 형태로 출력
           ============================== */
        <div className="d-flex flex-column gap-2">
          {sortedNoticeList.map((notice) => (
            <div key={notice.id} className="card p-3">
              {/* 공지 유형 / 중요 / 고정 */}
              <div className="d-flex gap-1 mb-2">
                {/* 공지 유형 */}
                <span
                  className={`badge ${getCategoryBadge(notice.category)}`}
                >
                  {notice.category}
                </span>

                {/* 중요 공지 */}
                {notice.isImportant && (
                  <span className="badge bg-danger">중요</span>
                )}

                {/* 상단 고정 공지 */}
                {notice.isPinned && (
                  <span className="badge bg-dark">고정</span>
                )}
              </div>

              {/* 제목 */}
              <div className="fw-bold mb-2">
                {/* 상단 고정이면 핀 아이콘 표시 */}
                {notice.isPinned && (
                  <span className="me-1">📌</span>
                )}

                {/* 중요 공지이면 [중요] 표시 */}
                {notice.isImportant && (
                  <span className="text-danger me-1">
                    [중요]
                  </span>
                )}

                {notice.title}
              </div>

              {/* 작성자 / 작성일 */}
              <div className="d-flex justify-content-between text-secondary small">
                <span>{notice.writer}</span>
                <span>{notice.createdAt}</span>
              </div>

              {/* 조회수 */}
              <div className="text-secondary small mb-2">
                조회수 {notice.views}
              </div>

              {/* 첨부파일 */}
              {notice.attachmentName && notice.attachmentUrl && (
                <div className="small">
                  <a
                    href={notice.attachmentUrl}
                    className="text-decoration-none"
                  >
                    📎 {notice.attachmentName}
                  </a>
                </div>
              )}
            </div>
          ))}

          {/* 검색 결과가 없을 때 */}
          {sortedNoticeList.length === 0 && (
            <div className="card p-4 text-center text-muted">
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      ) : (
        /* ==============================
            PC 화면
            공지사항을 Table 형태로 출력
           ============================== */
        <table className="table table-hover align-middle">
          <thead>
            <tr>
              <th>번호</th>
              <th>공지 유형</th>
              <th>제목</th>
              <th>첨부파일</th>
              <th>작성자</th>
              <th>작성일</th>
              <th>조회수</th>
            </tr>
          </thead>

          <tbody>
            {sortedNoticeList.map((notice, index) => (
              <tr key={notice.id}>
                {/* 번호 */}
                <td>{sortedNoticeList.length - index}</td>

                {/* 공지 유형 */}
                <td>
                  <span
                    className={`badge ${getCategoryBadge(notice.category)}`}
                  >
                    {notice.category}
                  </span>
                </td>

                {/* 제목 */}
                <td>
                  {/* 상단 고정 표시 */}
                  {notice.isPinned && (
                    <span className="me-1">📌</span>
                  )}

                  {/* 중요 공지 표시 */}
                  {notice.isImportant && (
                    <span className="text-danger fw-bold me-1">
                      [중요]
                    </span>
                  )}

                  {notice.title}
                </td>

                {/* 첨부파일 */}
                <td>
                  {notice.attachmentName && notice.attachmentUrl ? (
                    <a
                      href={notice.attachmentUrl}
                      className="text-decoration-none"
                    >
                      📎 {notice.attachmentName}
                    </a>
                  ) : (
                    <span className="text-muted">없음</span>
                  )}
                </td>

                {/* 작성자 */}
                <td>{notice.writer}</td>

                {/* 작성일 */}
                <td>{notice.createdAt}</td>

                {/* 조회수 */}
                <td>{notice.views}</td>
              </tr>
            ))}

            {/* PC 검색 결과 없음 */}
            {sortedNoticeList.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="text-center text-muted py-4"
                >
                  검색 결과가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

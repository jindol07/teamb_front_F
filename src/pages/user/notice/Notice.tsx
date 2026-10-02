import { useState } from 'react';
import { Link } from 'react-router-dom';
import { noticeListMock } from '../../../mock/noticeMock';
import useAgent from '../../../hooks/useAgent';
export default function Notice() {
  // 모바일 여부 확인
  const { isMobile } = useAgent();
  // 공지 유형 필터
  const [selectedCategory, setSelectedCategory] =
    useState('전체');
  // 검색어
  const [searchKeyword, setSearchKeyword] =
    useState('');
  // 공지 유형 목록
  const categories = [
    '전체',
    '시설점검',
    '이용안내',
    '주차요금',
  ];
  // 공지 유형별 색상
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
  // 공지 유형 + 제목 검색
  const filteredNoticeList =
    noticeListMock.filter((notice) => {
      // 공지 유형 필터
      const categoryMatch =
        selectedCategory === '전체' ||
        notice.category === selectedCategory;
      // 제목 검색
      const titleMatch =
        notice.title
          .toLowerCase()
          .includes(
            searchKeyword.toLowerCase()
          );
      return categoryMatch && titleMatch;
    });
  // 상단 고정 공지를 먼저 표시
  const sortedNoticeList =
    [...filteredNoticeList].sort((a, b) => {
      if (a.isPinned === b.isPinned) {
        return 0;
      }
      return a.isPinned ? -1 : 1;
    });
  return (
    <div className="container py-4">
      {/* 페이지 제목 */}
      <h2 className="page-title">
        공지사항
      </h2>
      {/* 검색 / 필터 */}
      <div className="row g-2 mt-3 mb-4">
        {/* 공지 유형 */}
        <div className="col-md-3">
          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(
                e.target.value
              )
            }
          >
            {categories.map((category) => (
              <option
                key={category}
                value={category}
              >
                {category}
              </option>
            ))}
          </select>
        </div>
        {/* 제목 검색 */}
        <div className="col-md-9">
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
      </div>
      {/* 검색 결과가 없는 경우 */}
      {sortedNoticeList.length === 0 ? (
        <div className="text-center py-5 text-muted">
          검색 결과가 없습니다.
        </div>
      ) : isMobile ? (
        /* 모바일 화면 */
        <div>
          {sortedNoticeList.map((notice) => (
            <div
              key={notice.id}
              className="card mb-3"
            >
              <div className="card-body">
                {/* 공지 유형 */}
                <div className="mb-2">
                  <span
                    className={`badge ${getCategoryBadge(notice.category)} me-2`}
                  >
                    {notice.category}
                  </span>
                  {/* 상단 고정 */}
                  {notice.isPinned && (
                    <span className="badge bg-dark">
                      고정
                    </span>
                  )}
                </div>
                {/* 공지 제목 */}
                <h5 className="card-title">
                  <Link
                    to={`/user/notice/${notice.id}`}
                    className="text-decoration-none text-dark"
                  >
                    {/* 중요 공지 */}
                    {notice.isImportant && (
                      <span className="text-danger me-1">
                        [중요]
                      </span>
                    )}
                    {notice.title}
                  </Link>
                </h5>
                {/* 작성 정보 */}
                <div className="text-muted small">
                  {notice.writer}
                  {' | '}
                  {notice.createdAt}
                  {' | '}
                  조회 {notice.views}
                </div>
                {/* 첨부파일있을 시*/}
                {notice.attachments.length > 0 && (
                  <span className="ms-2" title="첨부파일 있음">
                    📎
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* PC 화면 */
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ width: '80px' }}>
                  번호
                </th>
                <th style={{ width: '120px' }}>
                  유형
                </th>
                <th>
                  제목
                </th>
                <th style={{ width: '120px' }}>
                  작성자
                </th>
                <th style={{ width: '130px' }}>
                  작성일
                </th>
                <th style={{ width: '80px' }}>
                  조회
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedNoticeList.map(
                (notice, index) => (
                  <tr key={notice.id}>
                    {/* 화면 표시 번호 */}
                    <td>
                      {sortedNoticeList.length - index}
                    </td>
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
                      {/* 상단 고정 */}
                      {notice.isPinned && (
                        <span className="me-1">
                        </span>
                      )}
                      <Link
                        to={`/user/notice/${notice.id}`}
                        className="text-decoration-none text-dark"
                      >
                        {/* 중요 공지 */}
                        {notice.isImportant && (
                          <span className="text-danger me-1">
                            [중요]
                          </span>
                        )}
                        {notice.title}
                      </Link>
                      {/* 첨부파일 */}
                      {notice.attachments.length > 0 && (
                        <span
                          className="ms-1"
                          title="첨부파일 있음"
                        >
                          📎
                        </span>
                      )}
                    </td>
                    <td>
                      {notice.writer}
                    </td>
                    <td>
                      {notice.createdAt}
                    </td>
                    <td>
                      {notice.views}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
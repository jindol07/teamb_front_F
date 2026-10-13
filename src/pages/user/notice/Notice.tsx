import { useState } from 'react';
import { noticeListMock } from '../../../mock/noticeMock';
import useAgent from '../../../hooks/useAgent';
import NoticeSearch from './NoticeSearch';
import NoticeTable from './NoticeTable';
import NoticeMobileList from './NoticeMobileList';
export default function Notice() {
  // 모바일 여부 확인
  const { isMobile } = useAgent();
  // 공지 유형 필터
  const [selectedCategory, setSelectedCategory] = useState('전체');
  // 제목 검색어
  const [searchKeyword, setSearchKeyword] = useState('');
  // 공지 유형 및 제목 검색
  const filteredNoticeList = noticeListMock.filter((notice) => {
    const categoryMatch =
      selectedCategory === '전체' ||
      notice.category === selectedCategory;
    const titleMatch = notice.title
      .toLowerCase()
      .includes(searchKeyword.toLowerCase());
    return categoryMatch && titleMatch;
  });
  // 상단 고정 공지를 먼저 표시
  const sortedNoticeList = [...filteredNoticeList].sort((a, b) => {
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
      {/* 검색 및 카테고리 필터 */}
      <NoticeSearch
        selectedCategory={selectedCategory}
        searchKeyword={searchKeyword}
        onCategoryChange={setSelectedCategory}
        onSearchKeywordChange={setSearchKeyword}
      />
      {/* 검색 결과가 없는 경우 */}
      {sortedNoticeList.length === 0 ? (
        <div className="text-center py-5 text-muted">
          검색 결과가 없습니다.
        </div>
      ) : isMobile ? (
        // 모바일 화면
        <NoticeMobileList notices={sortedNoticeList} />
      ) : (
        // PC 화면
        <NoticeTable notices={sortedNoticeList} />
      )}
    </div>
  );
}
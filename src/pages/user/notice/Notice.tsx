import { useEffect, useState } from 'react';
import type { Notice as NoticeType } from '../../../mock/noticeMock';
import { getUserNoticeList } from '../../../api/userNoticeApi';
import useAgent from '../../../hooks/useAgent';
import NoticeSearch from './NoticeSearch';
import NoticeTable from './NoticeTable';
import NoticeMobileList from './NoticeMobileList';
export default function Notice() {
  // 모바일 여부 확인
  const { isMobile } = useAgent();
  // DB 공지사항 목록
  const [noticeList, setNoticeList] = useState<NoticeType[]>([]);
  // 로딩 및 오류 상태
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // 공지 유형 필터
  const [selectedCategory, setSelectedCategory] = useState('전체');
  // 제목 검색어
  const [searchKeyword, setSearchKeyword] = useState('');
  // 페이지 진입 시 공지사항 목록 조회
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const data = await getUserNoticeList();
        setNoticeList(data);
      } catch (err) {
        console.error('사용자 공지사항 조회 실패:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    void fetchNotices();
  }, []);
  // 공지 유형 및 제목 검색
  const filteredNoticeList = noticeList.filter((notice) => {
    const categoryMatch =
      selectedCategory === '전체' ||
      notice.category === selectedCategory;
    const titleMatch = notice.title
      .toLowerCase()
      .includes(searchKeyword.toLowerCase());
    return categoryMatch && titleMatch;
  });
  // 공지사항 우선순위 정렬
  // 1순위: 고정 공지 → 2순위: 중요 공지 → 3순위: 최신 공지
  const sortedNoticeList = [...filteredNoticeList].sort((a, b) => {
    // 1순위: 고정 공지 먼저 표시
    if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
      return a.isPinned ? -1 : 1;
    }
    // 2순위: 중요 공지 먼저 표시
    if (Boolean(a.isImportant) !== Boolean(b.isImportant)) {
      return a.isImportant ? -1 : 1;
    }
    // 3순위: 같은 우선순위 내에서는 최신순 정렬
    return (
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
    );
  });
  return (
    <div className="container py-4">
      <h2 className="page-title">공지사항</h2>
      <NoticeSearch
        selectedCategory={selectedCategory}
        searchKeyword={searchKeyword}
        onCategoryChange={setSelectedCategory}
        onSearchKeywordChange={setSearchKeyword}
      />
      {loading ? (
        <div className="text-center py-5 text-muted">
          공지사항을 불러오는 중입니다.
        </div>
      ) : error ? (
        <div className="text-center py-5 text-danger">
          공지사항을 불러오지 못했습니다.
        </div>
      ) : sortedNoticeList.length === 0 ? (
        <div className="text-center py-5 text-muted">
          검색 결과가 없습니다.
        </div>
      ) : isMobile ? (
        <NoticeMobileList notices={sortedNoticeList} />
      ) : (
        <NoticeTable notices={sortedNoticeList} />
      )}
    </div>
  );
}

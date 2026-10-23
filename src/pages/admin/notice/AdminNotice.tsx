import { useEffect, useState } from 'react';
import { getAdminNoticeList, registerNotice } from '../../../api/adminNoticeApi';
import type { Notice } from '../../../mock/noticeMock';
import AdminNoticeForm from './AdminNoticeForm';
import type { NoticeFormData } from './AdminNoticeForm';
import AdminNoticeSearch from './AdminNoticeSearch';
import AdminNoticeTable from './AdminNoticeTable';
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
  // 검색 및 카테고리 필터
  const filteredNoticeList = noticeList.filter((notice) => {
    const categoryMatch = category === '전체' || notice.category === category;
    const titleMatch = notice.title.toLowerCase().includes(searchKeyword.toLowerCase());
    return categoryMatch && titleMatch;
  });
  // 고정 → 중요 → 일반 공지 순으로, 같은 우선순위에서는 최신 등록일순 정렬
  // 같은 날짜는 서버에서 내려준 등록 시각·공지 번호 내림차순을 유지합니다.
  const sortedNoticeList = [...filteredNoticeList].sort((a, b) => {
    if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
      return a.isPinned ? -1 : 1;
    }
    if (Boolean(a.isImportant) !== Boolean(b.isImportant)) {
      return a.isImportant ? -1 : 1;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  // 공지사항 등록
  const handleRegister = async ({
    category: registerCategory,
    title: registerTitle,
    content: registerContent,
    isImportant: registerImportant,
    isPinned: registerPinned,
    files: registerFiles,
  }: NoticeFormData) => {
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
      setIsRegisterOpen(false);
    } catch (error) {
      console.error('공지사항 등록 실패:', error);
      alert('공지사항 등록에 실패했습니다.');
    }
  };
  // 공지사항 등록 취소
  const handleCancel = () => {
    setIsRegisterOpen(false);
  };
  return (
    <div className="container py-4">
      {/* =========================
          페이지 제목 / 등록 버튼
         ========================= */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="page-title mb-1">공지사항 관리</h2>
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
        <AdminNoticeForm onRegister={handleRegister} onCancel={handleCancel} />
      ) : (
        <>
          {/* =========================
              검색 영역
             ========================= */}
          <AdminNoticeSearch
            category={category}
            searchKeyword={searchKeyword}
            onCategoryChange={setCategory}
            onSearchKeywordChange={setSearchKeyword}
          />
          {/* =========================
              공지사항 목록
             ========================= */}
          <AdminNoticeTable notices={sortedNoticeList} />
        </>
      )}
    </div>
  );
}

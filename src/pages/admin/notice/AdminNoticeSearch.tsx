interface AdminNoticeSearchProps {
  category: string;
  searchKeyword: string;
  onCategoryChange: (category: string) => void;
  onSearchKeywordChange: (keyword: string) => void;
}

export default function AdminNoticeSearch({
  category,
  searchKeyword,
  onCategoryChange,
  onSearchKeywordChange,
}: AdminNoticeSearchProps) {
  return (
    <div className="d-flex gap-2 mb-3">
      <select
        className="form-select"
        style={{ width: '160px' }}
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
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
        onChange={(e) => onSearchKeywordChange(e.target.value)}
      />
    </div>
  );
}

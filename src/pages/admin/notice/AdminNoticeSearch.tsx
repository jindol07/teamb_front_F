interface AdminNoticeSearchProps {
    selectedCategory: string;
    searchKeyword: string;
    onCategoryChange: (category: string) => void;
    onSearchKeywordChange: (keyword: string) => void;
}

export default function AdminNoticeSearch({
    selectedCategory,
    searchKeyword,
    onCategoryChange,
    onSearchKeywordChange,
}: AdminNoticeSearchProps) {
    return (
        <div className="row g-2 mb-3">
            <div className="col-md-3">
                <select
                    className="form-select"
                    value={selectedCategory}
                    onChange={(e) => onCategoryChange(e.target.value)}
                >
                    <option value="전체">전체</option>
                    <option value="이용안내">이용안내</option>
                    <option value="시설점검">시설점검</option>
                    <option value="주차요금">주차요금</option>
                    <option value="긴급공지">긴급공지</option>
                    <option value="정기권">정기권</option>
                </select>
            </div>

            <div className="col-md-9">
                <input
                    type="text"
                    className="form-control"
                    placeholder="공지사항 제목 검색"
                    value={searchKeyword}
                    onChange={(e) => onSearchKeywordChange(e.target.value)}
                />
            </div>
        </div>
    );
}
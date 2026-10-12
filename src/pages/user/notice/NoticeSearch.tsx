interface NoticeSearchProps {
    selectedCategory: string;
    searchKeyword: string;
    onCategoryChange: (category: string) => void;
    onSearchKeywordChange: (keyword: string) => void;
}
export default function NoticeSearch({
    selectedCategory,
    searchKeyword,
    onCategoryChange,
    onSearchKeywordChange
}: NoticeSearchProps) {
    // 기존 사용자 공지 유형 목록 유지
    const categories = [
        '전체',
        '시설점검',
        '이용안내',
        '주차요금'
    ];
    return (
        <div className="row g-2 mt-3 mb-4">
            {/* 공지 유형 */}
            <div className="col-md-3">
                <select
                    className="form-select"
                    value={selectedCategory}
                    onChange={(e) => onCategoryChange(e.target.value)}
                >
                    {categories.map((category) => (
                        <option key={category} value={category}>
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
                    onChange={(e) => onSearchKeywordChange(e.target.value)}
                />
            </div>
        </div>
    );
}
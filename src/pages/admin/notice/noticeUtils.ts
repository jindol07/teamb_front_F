/**
 * 공지사항 카테고리에 따라
 * Bootstrap 배지 색상을 반환하는 함수
 */
export const getCategoryBadge = (category: string): string => {
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
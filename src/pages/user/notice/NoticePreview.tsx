import { useEffect, useState } from 'react';
import type { Notice as NoticeType } from '../../../mock/noticeMock';
import { getUserNoticeList } from '../../../api/userNoticeApi';
/**
 * 사용자 메인 페이지 공지사항 미리보기
 * 고정 공지 → 중요 공지 → 최신 공지 순으로 정렬
 * 가장 우선순위가 높은 공지사항 1개 표시
 */
export default function NoticePreview() {
    const [latestNotice, setLatestNotice] =
        useState<NoticeType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    useEffect(() => {
        const fetchLatestNotice = async () => {
            try {
                const data = await getUserNoticeList();
                const sortedNotices = [...data].sort((a, b) => {
                    // 1순위: 고정 공지
                    if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
                        return a.isPinned ? -1 : 1;
                    }
                    // 2순위: 중요 공지
                    if (Boolean(a.isImportant) !== Boolean(b.isImportant)) {
                        return a.isImportant ? -1 : 1;
                    }
                    // 3순위: 최신 등록일
                    return (
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    );
                });
                setLatestNotice(sortedNotices[0] ?? null);
            } catch (err) {
                console.error('메인 공지사항 조회 실패:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        void fetchLatestNotice();
    }, []);
    if (loading) {
        return <>공지사항을 불러오는 중입니다.</>;
    }
    if (error) {
        return <>공지사항을 불러오지 못했습니다.</>;
    }
    if (!latestNotice) {
        return <>등록된 공지사항이 없습니다.</>;
    }
    return <>최근 공지사항: {latestNotice.title}</>;
}

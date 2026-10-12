import { Link } from 'react-router-dom';
import { noticeListMock } from '../../../mock/noticeMock';
import { getCategoryBadge } from '../../admin/notice/noticeUtils';
type NoticeItem = (typeof noticeListMock)[number];
interface NoticeMobileListProps {
    notices: NoticeItem[];
}
export default function NoticeMobileList({
    notices
}: NoticeMobileListProps) {
    return (
        <div>
            {notices.map((notice) => (
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
                        {/* 첨부파일 */}
                        {notice.attachments.length > 0 && (
                            <span
                                className="ms-2"
                                title="첨부파일 있음"
                            >
                                📎
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
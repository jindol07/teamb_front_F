import { Link } from 'react-router-dom';
import { noticeListMock } from '../../../mock/noticeMock';
import { getCategoryBadge } from './noticeUtils';

type NoticeItem = (typeof noticeListMock)[number];

interface AdminNoticeListProps {
    notices: NoticeItem[];
}

export default function AdminNoticeList({
    notices,
}: AdminNoticeListProps) {
    if (notices.length === 0) {
        return (
            <div className="text-center py-5 text-muted">
                검색 결과가 없습니다.
            </div>
        );
    }

    return (
        <div className="table-responsive">
            <table className="table table-hover align-middle">
                <thead className="table-light">
                    <tr>
                        <th>번호</th>
                        <th>유형</th>
                        <th>제목</th>
                        <th>작성자</th>
                        <th>작성일</th>
                        <th>조회</th>
                        <th>관리</th>
                    </tr>
                </thead>

                <tbody>
                    {notices.map((notice) => (
                        <tr key={notice.id}>
                            <td>{notice.id}</td>

                            <td>
                                <span
                                    className={`badge ${getCategoryBadge(notice.category)}`}
                                >
                                    {notice.category}
                                </span>
                            </td>

                            <td>
                                {notice.isPinned && (
                                    <span className="badge bg-dark me-1">
                                        고정
                                    </span>
                                )}

                                <Link
                                    to={`/admin/notice/${notice.id}`}
                                    className="text-decoration-none"
                                >
                                    {notice.isImportant && (
                                        <span className="text-danger me-1">
                                            [중요]
                                        </span>
                                    )}

                                    {notice.title}
                                </Link>

                                {notice.attachments.length > 0 && (
                                    <span className="ms-1">📎</span>
                                )}
                            </td>

                            <td>{notice.writer}</td>
                            <td>{notice.createdAt}</td>
                            <td>{notice.views}</td>

                            <td>
                                <div className="d-flex gap-1">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary"
                                    >
                                        수정
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger"
                                    >
                                        삭제
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
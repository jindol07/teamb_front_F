import { Link } from 'react-router-dom';
import type { Notice } from '../../../mock/noticeMock';
import { getCategoryBadge } from '../../admin/notice/noticeUtils';
interface NoticeTableProps {
    notices: Notice[];
}
export default function NoticeTable({
    notices
}: NoticeTableProps) {
    return (
        <div className="table-responsive">
            <table className="table table-hover align-middle">
                <thead className="table-light">
                    <tr>
                        <th style={{ width: '60px' }}>
                            번호
                        </th>
                        <th style={{ width: '140px' }}>
                            공지 유형
                        </th>
                        <th>
                            제목
                        </th>
                        <th style={{ width: '100px' }}>
                            작성자
                        </th>
                        <th style={{ width: '130px' }}>
                            작성일
                        </th>
                        <th style={{ width: '80px' }}>
                            조회수
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {notices.map((notice) => (
                        <tr key={notice.id}>
                            {/* 공지사항 번호 */}
                            <td>
                                {notice.id}
                            </td>
                            {/* 공지 유형 */}
                            <td>
                                <span
                                    className={`badge ${getCategoryBadge(notice.category)}`}
                                >
                                    {notice.category}
                                </span>
                            </td>
                            {/* 제목 */}
                            <td>
                                {/* 중요 공지 */}
                                {notice.isImportant && (
                                    <span className="text-danger fw-bold me-1">
                                        [중요]
                                    </span>
                                )}
                                {/* 상단 고정 */}
                                {notice.isPinned && (
                                    <span className="badge bg-dark me-2">
                                        고정
                                    </span>
                                )}
                                {/* 첨부파일 표시 */}
                                {notice.attachments?.length > 0 && (
                                    <span
                                        className="me-2"
                                        title="첨부파일 있음"
                                    >
                                        📎
                                    </span>
                                )}
                                {/* 상세 페이지 이동 */}
                                <Link
                                    to={`/user/notice/${notice.id}`}
                                    className="text-decoration-none text-dark"
                                >
                                    {notice.title}
                                </Link>
                            </td>
                            {/* 작성자 */}
                            <td>
                                {notice.writer}
                            </td>
                            {/* 작성일 */}
                            <td>
                                {notice.createdAt}
                            </td>
                            {/* 조회수 */}
                            <td>
                                {notice.views}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

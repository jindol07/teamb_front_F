import { Link } from 'react-router-dom';
import { noticeListMock } from '../../../mock/noticeMock';
import { getCategoryBadge } from '../../admin/notice/noticeUtils';
type NoticeItem = (typeof noticeListMock)[number];
interface NoticeTableProps {
    notices: NoticeItem[];
}
export default function NoticeTable({
    notices
}: NoticeTableProps) {
    return (
        <div className="table-responsive">
            <table className="table table-hover align-middle">
                <thead className="table-light">
                    <tr>
                        <th style={{ width: '80px' }}>
                            번호
                        </th>
                        <th style={{ width: '120px' }}>
                            유형
                        </th>
                        <th>
                            제목
                        </th>
                        <th style={{ width: '120px' }}>
                            작성자
                        </th>
                        <th style={{ width: '130px' }}>
                            작성일
                        </th>
                        <th style={{ width: '80px' }}>
                            조회
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {notices.map((notice, index) => (
                        <tr key={notice.id}>
                            {/* 화면 표시 번호 */}
                            <td>
                                {notices.length - index}
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
                                {/* 상단 고정 */}
                                {notice.isPinned && (
                                    <span className="me-1"></span>
                                )}
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
                                {/* 첨부파일 */}
                                {notice.attachments.length > 0 && (
                                    <span
                                        className="ms-1"
                                        title="첨부파일 있음"
                                    >
                                        📎
                                    </span>
                                )}
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
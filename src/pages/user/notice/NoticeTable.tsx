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
            <table className="table table-hover align-middle text-center">
                <thead className="table-light">
                    <tr>
                        <th style={{ width: '60px' }}>
                            번호
                        </th>
                        <th className="text-center" style={{ width: '140px' }}>
                            공지 유형
                        </th>
                        <th className="text-center">
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
                                {/* 중요·고정 표시와 클립의 자리를 확보해 각 행의 클립·제목을 정렬합니다. */}
                                <div style={{ display: 'grid', gridTemplateColumns: '90px 20px minmax(0, 1fr)', columnGap: '8px', alignItems: 'center' }}>
                                <div className="d-flex align-items-center gap-1 text-nowrap">
                                {/* 중요 공지 */}
                                {notice.isImportant && (
                                    <span className="text-danger fw-bold">
                                        [중요]
                                    </span>
                                )}
                                {/* 상단 고정 */}
                                {notice.isPinned && (
                                    <span className="badge bg-dark">
                                        고정
                                    </span>
                                )}
                                </div>
                                {/* 첨부파일 표시 */}
                                    <span
                                        className="text-center"
                                        title={notice.attachments.length > 0 ? '첨부파일 있음' : undefined}
                                    >
                                        {notice.attachments.length > 0 ? '📎' : null}
                                    </span>
                                {/* 상세 페이지 이동 */}
                                <Link
                                    to={`/user/notice/${notice.id}`}
                                    className="text-decoration-none text-dark"
                                >
                                    {notice.title}
                                </Link>
                                </div>
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

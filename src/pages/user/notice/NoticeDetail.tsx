import { Link, useParams } from 'react-router-dom';
import { noticeListMock } from '../../../mock/noticeMock';
import { getCategoryBadge } from '../../admin/notice/noticeUtils';
export default function NoticeDetail() {
    /*
     * URL에서 공지사항 ID 가져오기
     * 예: /user/notice/1 → id = "1"
     */
    const { id } = useParams();
    // Mock 데이터에서 해당 공지사항 조회
    const notice = noticeListMock.find(
        (notice) => notice.id === Number(id)
    );
    // 공지사항이 존재하지 않는 경우
    if (!notice) {
        return (
            <div className="container py-4">
                공지사항을 찾을 수 없습니다.
            </div>
        );
    }
    return (
        <div className="container py-4">
            {/* 페이지 제목 */}
            <h2 className="page-title">
                공지사항
            </h2>
            <div className="card mt-3">
                <div className="card-body">
                    {/* 공지 유형 및 상태 */}
                    <div className="mb-2">
                        <span
                            className={`badge ${getCategoryBadge(notice.category)} me-2`}
                        >
                            {notice.category}
                        </span>
                        {/* 상단 고정 */}
                        {notice.isPinned && (
                            <span className="badge bg-dark">
                                상단 고정
                            </span>
                        )}
                    </div>
                    {/* 공지 제목 */}
                    <h4 className="fw-bold">
                        {notice.isImportant && (
                            <span className="text-danger me-1">
                                [중요]
                            </span>
                        )}
                        {notice.title}
                    </h4>
                    {/* 작성 정보 */}
                    <div className="text-muted small border-bottom pb-3">
                        작성자 {notice.writer}
                        {' | '}
                        작성일 {notice.createdAt}
                        {' | '}
                        조회수 {notice.views}
                    </div>
                    {/* 공지 내용 */}
                    <div className="py-4">
                        {notice.content}
                    </div>
                    {/* 첨부파일 */}
                    {notice.attachments.length > 0 && (
                        <div className="border-top pt-3">
                            <strong>첨부파일</strong>
                            <div className="mt-2">
                                {notice.attachments.map((file) => (
                                    <div key={file.id} className="mb-1">
                                        {file.url ? (
                                            <a
                                                href={file.url}
                                                className="text-decoration-none"
                                                download
                                            >
                                                📎 {file.name}
                                            </a>
                                        ) : (
                                            <span className="text-muted">
                                                📎 {file.name}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* 목록으로 이동 */}
            <div className="mt-3">
                <Link
                    to="/user/notice"
                    className="btn btn-outline-secondary"
                >
                    목록으로
                </Link>
            </div>
        </div>
    );
}
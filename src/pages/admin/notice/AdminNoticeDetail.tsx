import { Link, useParams } from 'react-router-dom';
import { noticeListMock } from '../../../mock/noticeMock';
export default function AdminNoticeDetail() {
    const { id } = useParams();
    const notice = noticeListMock.find(
        (notice) =>
            notice.id === Number(id)
    );
    if (!notice) {
        return (
            <div className="container py-4">
                공지사항을 찾을 수 없습니다.
            </div>
        );
    }
    return (
        <div>
            <h2 className="page-title mb-1">
                공지사항 상세
            </h2>
            <p className="page-description mb-4">
                등록된 공지사항의 상세 내용을 확인합니다.
            </p>
            <div className="card">
                <div className="card-body">
                    {/* 공지 유형 */}
                    <div className="mb-2">
                        <span className="badge bg-secondary me-2">
                            {notice.category}
                        </span>
                        {notice.isPinned && (
                            <span className="badge bg-dark me-2">
                                상단 고정
                            </span>
                        )}
                        {notice.isImportant && (
                            <span className="badge bg-danger">
                                중요
                            </span>
                        )}
                    </div>
                    {/* 제목 */}
                    <h4 className="fw-bold">
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
                    {/* 내용 */}
                    <div className="py-4">
                        {notice.content}
                    </div>
                    {/* 첨부파일 */}
                    {notice.attachments.length > 0 && (
                        <div className="border-top pt-3">
                            <strong>
                                첨부파일
                            </strong>
                            <div className="mt-2">
                                {notice.attachments.map(
                                    (file) => (
                                        <div
                                            key={file.id}
                                            className="mb-1"
                                        >
                                            <a
                                                href={file.url}
                                                className="text-decoration-none"
                                            >
                                                📎 {file.name}
                                            </a>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* 하단 버튼 */}
            <div className="d-flex justify-content-between mt-3">
                <Link
                    to="/admin/notice"
                    className="btn btn-outline-secondary"
                >
                    목록으로
                </Link>
                <div className="d-flex gap-2">
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                    >
                        수정
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline-danger"
                    >
                        삭제
                    </button>
                </div>
            </div>
        </div>
    );
}
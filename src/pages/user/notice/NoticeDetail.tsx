import { Link, useParams } from 'react-router-dom';
import { noticeListMock } from '../../../mock/noticeMock';
export default function NoticeDetail() {
    /*
     * URL에 들어있는 공지사항 id를 가져옴
     *
     * 예:
     * /user/notice/1
     *
     * id = "1"
     */
    const { id } = useParams();
    /*
     * noticeListMock에서
     * URL의 id와 같은 공지사항을 찾음
     *
     * useParams()로 가져온 id는 문자열이기 때문에
     * Number(id)를 사용해서 숫자로 변환
     */
    const notice = noticeListMock.find(
        (notice) => notice.id === Number(id)
    );
    /*
     * 해당 id의 공지사항이 존재하지 않는 경우
     */
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
                    {/* 공지 유형 */}
                    <div className="mb-2">
                        <span className="badge bg-secondary">
                            {notice.category}
                        </span>
                    </div>
                    {/* 공지 제목 */}
                    <h4 className="fw-bold">
                        {/* 중요 공지이면 [중요] 표시 */}
                        {notice.isImportant && (
                            <span className="text-danger me-1">
                                [중요]
                            </span>
                        )}
                        {notice.title}
                    </h4>
                    {/* 작성자 / 작성일 / 조회수 */}
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
                            <strong>
                                첨부파일
                            </strong>
                            <div className="mt-2">
                                {notice.attachments.map((file) => (
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
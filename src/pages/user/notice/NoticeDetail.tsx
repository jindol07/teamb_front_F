import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Notice } from '../../../mock/noticeMock';
import {
    getUserNoticeDetail,
    downloadUserNoticeFile,
} from '../../../api/userNoticeApi';
import { getCategoryBadge } from '../../admin/notice/noticeUtils';
export default function NoticeDetail() {
    // URL에서 공지사항 ID 가져오기
    // 예: /user/notice/55 → id = "55"
    const { id } = useParams();
    // DB에서 조회한 공지사항
    const [notice, setNotice] = useState<Notice | null>(null);
    // 로딩 및 오류 상태
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    // 현재 다운로드 중인 첨부파일 ID
    const [downloadingFileId, setDownloadingFileId] =
        useState<number | null>(null);
    // 페이지 진입 시 공지사항 상세 조회
    useEffect(() => {
        const noticeId = Number(id);
        // 잘못된 공지사항 ID 검사
        if (!id || !Number.isInteger(noticeId) || noticeId <= 0) {
            setNotice(null);
            setError(true);
            setLoading(false);
            return;
        }
        let cancelled = false;
        const fetchNoticeDetail = async () => {
            setLoading(true);
            setError(false);
            setNotice(null);
            try {
                const data = await getUserNoticeDetail(noticeId);
                if (!cancelled) {
                    setNotice(data);
                }
            } catch (err) {
                console.error('공지사항 상세 조회 실패:', err);
                if (!cancelled) {
                    setError(true);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };
        void fetchNoticeDetail();
        return () => {
            cancelled = true;
        };
    }, [id]);
    // 첨부파일 다운로드
    const handleDownload = async (
        attachmentId: number,
        fileName: string
    ) => {
        // 공지사항이 없거나 다운로드 중이면 실행하지 않음
        if (!notice || downloadingFileId !== null) {
            return;
        }
        try {
            setDownloadingFileId(attachmentId);
            await downloadUserNoticeFile(
                notice.id,
                attachmentId,
                fileName
            );
        } catch (err) {
            console.error('첨부파일 다운로드 실패:', err);
            alert('첨부파일 다운로드에 실패했습니다.');
        } finally {
            setDownloadingFileId(null);
        }
    };
    // 로딩 중
    if (loading) {
        return (
            <div className="container py-4">
                <h2 className="page-title">
                    공지사항
                </h2>
                <div className="text-center py-5 text-muted">
                    공지사항을 불러오는 중입니다.
                </div>
            </div>
        );
    }
    // 조회 실패 또는 공지사항 없음
    if (error || !notice) {
        return (
            <div className="container py-4">
                <h2 className="page-title">
                    공지사항
                </h2>
                <div className="text-center py-5 text-muted">
                    공지사항을 찾을 수 없거나 불러오지 못했습니다.
                </div>
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
                    <div
                        className="py-4"
                        style={{ whiteSpace: 'pre-wrap' }}
                    >
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
                                        className="mb-2"
                                    >
                                        <button
                                            type="button"
                                            className="btn btn-link text-decoration-none p-0"
                                            disabled={
                                                downloadingFileId !== null
                                            }
                                            onClick={() =>
                                                void handleDownload(
                                                    file.id,
                                                    file.name
                                                )
                                            }
                                        >
                                            📎 {file.name}
                                            <span className="ms-2">
                                                {downloadingFileId === file.id
                                                    ? '다운로드 중...'
                                                    : '다운로드'}
                                            </span>
                                        </button>
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

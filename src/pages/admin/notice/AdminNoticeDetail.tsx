import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Notice } from '../../../mock/noticeMock';
import {
    getAdminNoticeList,
    updateAdminNotice,
    deleteAdminNotice,
    downloadAdminNoticeFile,
} from '../../../api/adminNoticeApi';
const categoryCodeMap: Record<string, string> = {
    이용안내: 'USAGE_GUIDE',
    시설점검: 'FACILITY_INSPECTION',
    주차요금: 'PARKING_FEE',
    긴급공지: 'EMERGENCY_NOTICE',
    정기권: 'SEASON_PASS',
};
const categoryOptions = [
    { value: 'USAGE_GUIDE', label: '이용안내' },
    { value: 'FACILITY_INSPECTION', label: '시설점검' },
    { value: 'PARKING_FEE', label: '주차요금' },
    { value: 'EMERGENCY_NOTICE', label: '긴급공지' },
    { value: 'SEASON_PASS', label: '정기권' },
];
export default function AdminNoticeDetail() {
    const navigate = useNavigate();
    const [isDeleting, setIsDeleting] = useState(false);
    const [downloadingFileId, setDownloadingFileId] = useState<number | null>(null);
    const { id } = useParams();
    const [notice, setNotice] = useState<Notice | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // 수정 관련 상태
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editCategory, setEditCategory] = useState('USAGE_GUIDE');
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editImportant, setEditImportant] = useState(false);
    const [editPinned, setEditPinned] = useState(false);
    // 서버에서 공지사항 불러오기
    useEffect(() => {
        const fetchNotice = async () => {
            try {
                setLoading(true);
                setError('');
                const notices = await getAdminNoticeList();
                const selectedNotice = notices.find(
                    (item) => item.id === Number(id)
                );
                if (selectedNotice) {
                    setNotice(selectedNotice);
                } else {
                    setNotice(null);
                    setError('공지사항을 찾을 수 없습니다.');
                }
            } catch (err) {
                console.error('공지사항 상세 조회 실패:', err);
                setError('공지사항을 불러오지 못했습니다.');
            } finally {
                setLoading(false);
            }
        };
        void fetchNotice();
    }, [id]);
    // 인증된 API 요청으로 첨부파일 다운로드
    const handleDownload = async (attachmentId: number, fileName: string) => {
        if (!notice || downloadingFileId !== null) return;
        try {
            setDownloadingFileId(attachmentId);
            await downloadAdminNoticeFile(notice.id, fileName);
        } catch {
            alert('첨부파일 다운로드에 실패했습니다. 로그인 상태와 서버 연결을 확인해주세요.');
        } finally {
            setDownloadingFileId(null);
        }
    };
    // 수정 버튼 클릭
    const handleEdit = () => {
        if (!notice) return;
        setEditCategory(
            categoryCodeMap[notice.category] ?? notice.category
        );
        setEditTitle(notice.title);
        setEditContent(notice.content);
        setEditImportant(notice.isImportant);
        setEditPinned(notice.isPinned);
        setIsEditing(true);
    };
    // 수정 취소
    const handleCancelEdit = () => {
        setIsEditing(false);
    };
    // 수정 저장
    const handleSaveEdit = async () => {
        if (!notice || isSaving) return;
        if (editTitle.trim() === '') {
            alert('제목을 입력해주세요.');
            return;
        }
        if (editContent.trim() === '') {
            alert('내용을 입력해주세요.');
            return;
        }
        try {
            setIsSaving(true);
            await updateAdminNotice(notice.id, {
                noticeTypeCode: editCategory,
                title: editTitle.trim(),
                content: editContent,
                importantYn: editImportant ? 'Y' : 'N',
                pinnedYn: editPinned ? 'Y' : 'N',
            });
            // 저장 후 DB에서 최신 데이터 다시 조회
            const notices = await getAdminNoticeList();
            const updatedNotice = notices.find(
                (item) => item.id === notice.id
            );
            if (updatedNotice) {
                setNotice(updatedNotice);
            }
            setIsEditing(false);
            alert('공지사항이 수정되었습니다.');
        } catch (err) {
            console.error('공지사항 수정 실패:', err);
            alert('수정 또는 수정 후 조회에 실패했습니다.');
        } finally {
            setIsSaving(false);
        }
    };
    // 공지사항 삭제
    const handleDelete = async () => {
        if (!notice || isDeleting) return;
        const confirmed = window.confirm(
            `"${notice.title}" 공지사항을 삭제하시겠습니까?`
        );
        if (!confirmed) return;
        try {
            setIsDeleting(true);
            await deleteAdminNotice(notice.id);
            alert('공지사항이 삭제되었습니다.');
            // 삭제 성공 후 관리자 공지사항 목록으로 이동
            navigate('/admin/notice');
        } catch (err) {
            console.error('공지사항 삭제 실패:', err);
            alert('공지사항 삭제에 실패했습니다.');
        } finally {
            setIsDeleting(false);
        }
    };
    if (loading) {
        return (
            <div className="container py-4">
                공지사항을 불러오는 중입니다...
            </div>
        );
    }
    if (error || !notice) {
        return (
            <div className="container py-4">
                {error || '공지사항을 찾을 수 없습니다.'}
            </div>
        );
    }
    return (
        <div className="container py-4">
            <h2 className="page-title mb-1">
                {isEditing ? '공지사항 수정' : '공지사항 상세'}
            </h2>
            <p className="page-description mb-4">
                {isEditing
                    ? '공지사항 내용을 수정합니다.'
                    : '등록된 공지사항의 상세 내용을 확인합니다.'}
            </p>
            <div className="card">
                <div className="card-body">
                    {isEditing ? (
                        <>
                            {/* 공지 유형 */}
                            <div className="mb-3">
                                <label className="form-label">공지 유형</label>
                                <select
                                    className="form-select"
                                    value={editCategory}
                                    onChange={(e) => setEditCategory(e.target.value)}
                                >
                                    {!categoryOptions.some(
                                        (option) => option.value === editCategory
                                    ) && (
                                            <option value={editCategory}>
                                                {notice.category}
                                            </option>
                                        )}
                                    {categoryOptions.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {/* 제목 */}
                            <div className="mb-3">
                                <label className="form-label">제목</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                />
                            </div>
                            {/* 내용 */}
                            <div className="mb-3">
                                <label className="form-label">내용</label>
                                <textarea
                                    className="form-control"
                                    rows={7}
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                />
                            </div>
                            {/* 중요 여부 */}
                            <div className="form-check mb-2">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="editImportant"
                                    checked={editImportant}
                                    onChange={(e) =>
                                        setEditImportant(e.target.checked)
                                    }
                                />
                                <label
                                    className="form-check-label"
                                    htmlFor="editImportant"
                                >
                                    중요 공지
                                </label>
                            </div>
                            {/* 상단 고정 여부 */}
                            <div className="form-check mb-3">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="editPinned"
                                    checked={editPinned}
                                    onChange={(e) =>
                                        setEditPinned(e.target.checked)
                                    }
                                />
                                <label
                                    className="form-check-label"
                                    htmlFor="editPinned"
                                >
                                    상단 고정
                                </label>
                            </div>
                        </>
                    ) : (
                        <>
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
                            <div
                                className="py-4"
                                style={{ whiteSpace: 'pre-wrap' }}
                            >
                                {notice.content}
                            </div>
                            {/* 첨부파일 */}
                            {notice.attachments.length > 0 && (
                                <div className="border-top pt-3">
                                    <strong>첨부파일</strong>
                                    <div className="mt-2">
                                        {notice.attachments.map((file) => (
                                            <div key={file.id} className="mb-1">
                                                <button
                                                    type="button"
                                                    className="btn btn-link text-decoration-none p-0"
                                                    disabled={downloadingFileId !== null}
                                                    onClick={() => void handleDownload(file.id, file.name)}
                                                >
                                                    📎 {file.name}
                                                    {downloadingFileId === file.id && ' (다운로드 중...)'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
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
                    {isEditing ? (
                        <>
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={handleCancelEdit}
                                disabled={isSaving}
                            >
                                취소
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleSaveEdit}
                                disabled={isSaving}
                            >
                                {isSaving ? '저장 중...' : '저장'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={handleEdit}
                            >
                                수정
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? '삭제 중...' : '삭제'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

import { adminApi } from './axios';
import type { Notice } from '../mock/noticeMock';
// 공지사항 등록 요청 타입
interface RegisterNoticeData {
    writerAdminId: number;
    noticeTypeCode: string;
    title: string;
    content: string;
    importantYn: string;
    pinnedYn: string;
    files: File[];
}
// 관리자 공지사항 목록 응답 타입
interface AdminNoticeResponse {
    noticeId: number;
    writerAdminId: number;
    noticeTypeCode: string;
    title: string;
    content: string;
    viewCount: number;
    createdAt: string;
    importantYn: string;
    pinnedYn: string;
    getfilelist: unknown[] | null;
}
// DB 유형 코드 → 화면 표시명
const categoryMap: Record<string, string> = {
    USAGE_GUIDE: '이용안내',
    FACILITY_INSPECTION: '시설점검',
    PARKING_FEE: '주차요금',
    EMERGENCY_NOTICE: '긴급공지',
    SEASON_PASS: '정기권',
};
// 서버 응답 → 기존 React Notice 타입 변환
const convertAdminNotice = (
    data: AdminNoticeResponse
): Notice => ({
    id: data.noticeId,
    title: data.title,
    content: data.content,
    writer: '관리자',
    createdAt: data.createdAt?.slice(0, 10) ?? '',
    views: data.viewCount,
    category:
        categoryMap[data.noticeTypeCode] ?? data.noticeTypeCode,
    isPinned: data.pinnedYn === 'Y',
    isImportant: data.importantYn === 'Y',
    attachments: [],
});
// 공지사항 등록 API
export const registerNotice = async (
    data: RegisterNoticeData
) => {
    const formData = new FormData();
    formData.append(
        'writerAdminId',
        String(data.writerAdminId)
    );
    formData.append('noticeTypeCode', data.noticeTypeCode);
    formData.append('title', data.title);
    formData.append('content', data.content);
    formData.append('importantYn', data.importantYn);
    formData.append('pinnedYn', data.pinnedYn);
    data.files.forEach((file) => {
        formData.append('files', file);
    });
    const response = await adminApi.post(
        '/api/notice/add',
        formData
    );
    return response.data;
};
// 관리자 공지사항 목록 조회 API
export const getAdminNoticeList = async (): Promise<Notice[]> => {
    const response = await adminApi.get<AdminNoticeResponse[]>(
        '/api/notice'
    );
    const notices = response.data.map(convertAdminNotice);
    // 각 공지사항의 첨부파일 정보 조회
    const noticesWithAttachments = await Promise.all(
        notices.map(async (notice) => {
            try {
                const attachments = await getAdminNoticeAttachments(
                    notice.id
                );
                return {
                    ...notice,
                    attachments,
                };
            } catch (err) {
                console.error(
                    `${notice.id}번 공지사항 첨부파일 조회 실패:`,
                    err
                );
                return notice;
            }
        })
    );
    return noticesWithAttachments;
};
// 공지사항 수정 요청 데이터 타입
interface UpdateNoticeData {
    noticeTypeCode: string;
    title: string;
    content: string;
    importantYn: string;
    pinnedYn: string;
}
// 관리자 공지사항 수정 API
export const updateAdminNotice = async (
    noticeId: number,
    data: UpdateNoticeData
) => {
    const response = await adminApi.put(
        `/api/notice/${noticeId}`,
        data,
        {
            params: {
                changedByAdminId: 1,
            },
        }
    );
    return response.data;
};
// 관리자 공지사항 삭제 API
export const deleteAdminNotice = async (noticeId: number) => {
    const response = await adminApi.delete(
        `/api/notice/${noticeId}`,
        {
            params: {
                changedByAdminId: 1,
            },
        }
    );
    return response.data;
};
// 관리자 공지사항 첨부파일 응답 타입
interface AdminNoticeAttachment {
    noticeAttachmentId: number;
    originalName: string;
}
// 관리자 공지사항 상세 조회 응답 타입
interface AdminNoticeDetailResponse {
    noticeId: number;
    getfilelist: AdminNoticeAttachment[] | null;
}
// 공지사항 상세 첨부파일 정보 조회
export const getAdminNoticeAttachments = async (
    noticeId: number
) => {
    const response = await adminApi.get<AdminNoticeDetailResponse>(
        `/api/notice/${noticeId}`
    );
    return (response.data.getfilelist ?? []).map((file) => ({
        id: file.noticeAttachmentId,
        name: file.originalName,
        url: `${import.meta.env.VITE_ADMIN_API_URL}/api/notice/${noticeId}/file/download`,
    }));
};

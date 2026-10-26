import { adminApi } from './axios';
import type { Notice } from '../mock/noticeMock';
// 공지사항 등록 요청 타입
interface RegisterNoticeData {
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
    attachmentCount: number;
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
    attachmentCount: data.attachmentCount ?? 0,
});
// 공지사항 등록 API
export const registerNotice = async (
    data: RegisterNoticeData
) => {
    const formData = new FormData();
    // 작성자 ID는 서버에서 인증된 관리자 정보로 결정합니다.
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
    // 목록 응답의 첨부 개수를 사용해 공지별 상세 추가 요청을 생략합니다.
    return response.data.map(convertAdminNotice);
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
    data: UpdateNoticeData,
    file?: File,
    removeAttachment = false
) => {
    // 새 파일이 없으면 기존 JSON 수정 API를 그대로 사용합니다.
    let payload: UpdateNoticeData | FormData = data;
    if (file || removeAttachment) {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => formData.append(key, value));
        if (file) formData.append('files', file);
        if (removeAttachment) formData.append('removeAttachment', 'true');
        payload = formData;
    }
    const response = await adminApi.put(
        `/api/notice/${noticeId}`,
        payload
    );
    return response.data;
};
// 관리자 공지사항 삭제 API
export const deleteAdminNotice = async (noticeId: number) => {
    const response = await adminApi.delete(
        `/api/notice/${noticeId}`
    );
    return response.data;
};
// 관리자 공지사항 첨부파일 다운로드 (현재 서버는 공지당 파일 1개 지원)
// 일반 링크 대신 adminApi로 요청해야 기존 인터셉터가 JWT를 첨부합니다.
export const downloadAdminNoticeFile = async (
    noticeId: number,
    fileName: string
): Promise<void> => {
    const response = await adminApi.get<Blob>(
        `/api/notice/${noticeId}/file/download`,
        { responseType: 'blob' }
    );
    const blobUrl = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    try {
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
    } finally {
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
    }
};

// 관리자 공지사항 첨부파일 응답 타입
interface AdminNoticeAttachment {
    noticeAttachmentId: number;
    originalName: string;
}
// 관리자 공지사항 상세 조회 응답 타입
interface AdminNoticeDetailResponse extends Omit<AdminNoticeResponse, 'getfilelist'> {
    getfilelist: AdminNoticeAttachment[] | null;
}
// 상세 화면은 해당 공지와 첨부파일을 한 번의 요청으로 조회합니다.
export const getAdminNoticeDetail = async (
    noticeId: number
): Promise<Notice> => {
    const response = await adminApi.get<AdminNoticeDetailResponse>(
        `/api/notice/${noticeId}`
    );
    return {
        ...convertAdminNotice(response.data),
        attachments: (response.data.getfilelist ?? []).map((file) => ({
            id: file.noticeAttachmentId,
            name: file.originalName,
            url: `${import.meta.env.VITE_BOOT_API_BASE_URL_A}/api/notice/${noticeId}/file/download`,
        })),
    };
};

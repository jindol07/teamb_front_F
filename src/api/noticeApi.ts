import { api } from './axios';
import type { Notice } from '../mock/noticeMock';
// Spring Boot JPA 응답 타입
interface NoticeAttachmentResponse {
    notice_attachment_id: number;
    original_name: string;
}
interface NoticeResponse {
    num: number;
    title: string;
    content: string;
    writer_admin_id: number;
    created_at: string;
    view_count: number;
    notice_type_code: string;
    pinned_yn: string;
    important_yn: string;
    file_list: NoticeAttachmentResponse[];
}
// 실제 DB에 저장된 공지 유형 코드에 맞게 수정
const categoryMap: Record<string, string> = {
    USAGE_GUIDE: '이용안내',
    FACILITY_INSPECTION: '시설점검',
    PARKING_FEE: '주차요금',
    EMERGENCY_NOTICE: '긴급공지',
};
// JPA 응답을 기존 React Notice 타입으로 변환
export const convertNotice = (data: NoticeResponse): Notice => ({
    id: data.num,
    title: data.title,
    content: data.content,
    writer: '관리자',
    createdAt: data.created_at?.slice(0, 10) ?? '',
    views: data.view_count,
    category: categoryMap[data.notice_type_code] ?? data.notice_type_code,
    isPinned: data.pinned_yn === 'Y',
    isImportant: data.important_yn === 'Y',
    attachments: (data.file_list ?? []).map((file) => ({
        id: file.notice_attachment_id,
        name: file.original_name,
        url: `${api.defaults.baseURL?.replace(/\/$/, '')}/api/notice/${data.num}/file/${file.notice_attachment_id}/download`,
    })),
});
// 공지사항 목록 조회
export const getNoticeList = async (): Promise<Notice[]> => {
    const response = await api.get<NoticeResponse[]>('/api/notice');
    return response.data.map(convertNotice);
};
// 공지사항 상세 조회 (조회수 증가)
export const getNoticeDetail = async (
    noticeId: number
): Promise<Notice> => {
    const response = await api.get<NoticeResponse>(
        `/api/notice/${noticeId}`
    );
    return convertNotice(response.data);
};

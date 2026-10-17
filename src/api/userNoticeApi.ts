import { userApi } from './axios';
import type { Notice } from '../mock/noticeMock';
// 사용자 공지사항 첨부파일 응답 타입
interface UserNoticeAttachment {
    notice_attachment_id: number;
    original_name: string;
    file_path: string | null;
}
// 사용자 공지사항 응답 타입
interface UserNoticeResponse {
    num: number;
    writer_admin_id: number;
    notice_type_code: string;
    title: string;
    content: string;
    view_count: number;
    created_at: string;
    updated_at: string | null;
    important_yn: string;
    pinned_yn: string;
    file_list: UserNoticeAttachment[] | null;
}
// DB 공지 유형 → 화면 표시명
const categoryMap: Record<string, string> = {
    USAGE_GUIDE: '이용안내',
    FACILITY_INSPECTION: '시설점검',
    PARKING_FEE: '주차요금',
    EMERGENCY_NOTICE: '긴급공지',
    SEASON_PASS: '정기권',
};
// 서버 응답 → 기존 React Notice 타입 변환
const convertUserNotice = (
    data: UserNoticeResponse
): Notice => ({
    id: data.num,
    title: data.title,
    content: data.content,
    writer: '관리자',
    createdAt: data.created_at?.slice(0, 10) ?? '',
    views: data.view_count ?? 0,
    category:
        categoryMap[data.notice_type_code] ??
        data.notice_type_code,
    isPinned: data.pinned_yn === 'Y',
    isImportant: data.important_yn === 'Y',
    // 첨부파일 목록
    attachments: (data.file_list ?? []).map((file) => ({
        id: file.notice_attachment_id,
        name: file.original_name,
        url: '',
    })),
});
// 사용자 공지사항 목록 조회
export const getUserNoticeList = async (): Promise<Notice[]> => {
    const response = await userApi.get<UserNoticeResponse[]>(
        '/api/notice'
    );
    return response.data.map(convertUserNotice);
};
// 현재 진행 중인 상세 조회 요청 저장
const pendingNoticeDetails = new Map<number, Promise<Notice>>();

// 사용자 공지사항 상세 조회
export const getUserNoticeDetail = (
    noticeId: number
): Promise<Notice> => {
    // 이미 동일한 공지사항을 조회 중이면 기존 요청 재사용
    const pendingRequest = pendingNoticeDetails.get(noticeId);

    if (pendingRequest) {
        return pendingRequest;
    }

    // 새로운 상세 조회 요청
    const request = userApi
        .get<UserNoticeResponse>(`/api/notice/${noticeId}`)
        .then((response) => convertUserNotice(response.data));

    pendingNoticeDetails.set(noticeId, request);

    // 요청 완료 시 관리 목록에서 제거
    void request.finally(() => {
        if (pendingNoticeDetails.get(noticeId) === request) {
            pendingNoticeDetails.delete(noticeId);
        }
    }).catch(() => {
        // 원래 요청의 오류는 호출한 컴포넌트에서 처리
    });

    return request;
};

/**
 * 사용자 공지사항 첨부파일 다운로드
 */
export const downloadUserNoticeFile = async (
    noticeId: number,
    attachmentId: number,
    fileName: string
): Promise<void> => {
    const response = await userApi.get<Blob>(
        `/api/notice/${noticeId}/file/${attachmentId}/download`,
        {
            responseType: 'blob',
        }
    );
    // 서버에서 받은 파일 데이터를 브라우저 다운로드 URL로 변환
    const blobUrl = window.URL.createObjectURL(response.data);
    // 다운로드 링크 생성
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    // 다운로드 실행
    document.body.appendChild(link);
    link.click();
    // 임시 링크 정리
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
};

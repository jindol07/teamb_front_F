/*
  채팅 메시지 타입
  user      : 사용자
  assistant : 알파카
*/
export interface ChatMessage {
    id: number | string;
    role: 'user' | 'assistant';
    content: string;
    createdAt?: string | null;
}

// 시간대 없는 DB 작성 시각은 기존 서비스 기준인 한국 시간으로 해석합니다.
export function chatMessageDate(value?: string | null): string | null {
    if (!value || !/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/.test(value)) return null;
    const normalized = value.replace(' ', 'T');
    const time = Date.parse(/(?:Z|[+-]\d{2}:\d{2})$/.test(normalized) ? normalized : `${normalized}+09:00`);
    if (!Number.isFinite(time)) return null;
    return new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date(time));
}
/*
  빠른 질문 타입
*/
export interface QuickQuestion {
    id: number;
    text: string;
    question: string;
}

/*
  채팅 메시지 타입
  user      : 사용자
  assistant : 알파카
*/
export interface ChatMessage {
    id: number | string;
    role: 'user' | 'assistant';
    content: string;
}
/*
  빠른 질문 타입
*/
export interface QuickQuestion {
    id: number;
    text: string;
    question: string;
}

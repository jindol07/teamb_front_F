import { useEffect, useRef, useState } from 'react';
import './AlpacaChatbot.css';

type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string };
type ChatResponse = { conversation_id: string; answer: string; type: string; saved: boolean };

// 실제 로그인 후 이 값은 Spring Boot 인증 상태/토큰 공급자로 교체합니다.
// MOCK 모드는 개발 전용입니다. 사용자 ID를 운영 API에 보내지 않습니다.
const API_BASE_URL = import.meta.env.VITE_AI_API_BASE_URL ?? 'http://localhost:8001';
const DATA_MODE = import.meta.env.VITE_INQUIRY_DATA_MODE ?? 'MOCK';
const MOCK_USER_ID = import.meta.env.VITE_MOCK_USER_ID ?? '1';

//FastAPI
//const API_URL = "http://127.0.0.1:8001/api/inquiry/chat";

function getAuthToken(): string | null {
  // TODO: 로그인 인증 구현 시 프로젝트의 인증 Context에서 토큰을 읽도록 교체
  return null;
}

export default function AlpacaChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '안녕하세요! AI 주차 도우미 알파킹입니다. 무엇을 도와드릴까요?',
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const conversationId = useRef<string>(crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, sending]);

  const handleSendMessage = async () => {
    const question = input.trim();
    if (!question || sending) return;
    setInput(''); setError(''); setSending(true);
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: question }]);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/inquiry/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          conversation_id: conversationId.current,
          question,
          ...(DATA_MODE === 'MOCK' ? { mock_user_id: MOCK_USER_ID } : {})
        })
      });
      if (!response.ok) {
        let detail = `요청 실패 (${response.status})`;
        try { const body = await response.json(); if (typeof body.detail === 'string') detail = body.detail; } catch { /* non-JSON error */ }
        throw new Error(detail);
      }
      const data: ChatResponse = await response.json();
      if (!data.saved) throw new Error('상담 저장이 확인되지 않았습니다.');
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: data.answer }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : '문의 처리 중 오류가 발생했습니다.');
      // 실패한 문의를 사용자가 재입력할 수 있게 복원
      setInput(question);
    } finally { setSending(false); }
  };

  return (
    <div className="container py-4">
      <h2 className="page-title">1:1 문의</h2>
      <p className="page-description">AI 주차 도우미 알파카에게 궁금한 내용을 문의해보세요.</p>
      <div className="alpaca-chatbot">
        <div className="alpaca-chat-header">
          <div className="alpaca-chat-profile">
            <div className="alpaca-profile-icon">🦙</div>
            <div><div className="fw-bold">알파카</div><div className="small text-secondary">AI 주차 도우미</div></div>
          </div>
        </div>
        <div className="alpaca-chat-messages" aria-live="polite">
          {messages.map(message => (
            <div key={message.id} className={message.role === 'user' ? 'chat-message user-message' : 'chat-message assistant-message'}>
              {message.role === 'assistant' && <div className="message-profile">🦙</div>}
              <div className="message-bubble">{message.content}</div>
            </div>
          ))}
          {sending && <div className="chat-message assistant-message"><div className="message-profile">🦙</div><div className="message-bubble">답변 생성 중...</div></div>}
          <div ref={messagesEndRef} />
        </div>
        {error && <div role="alert" className="alert alert-danger m-2">{error}</div>}
        <form className="alpaca-chat-input-area" onSubmit={e => { e.preventDefault(); void handleSendMessage(); }}>
          <input type="text" className="form-control" placeholder="질문을 입력하세요." value={input} onChange={e => setInput(e.target.value)} disabled={sending} aria-label="문의 내용" />
          <button type="submit" className="btn btn-primary" disabled={sending || !input.trim()}>전송</button>
        </form>
      </div>
    </div>
  );
}

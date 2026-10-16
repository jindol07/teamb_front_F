
import { useRef, useState } from 'react';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import QuickQuestions from './QuickQuestions';
import ChatInput from './ChatInput';
import type {
    ChatMessage,
    QuickQuestion
} from './chatbotTypes';
import './AlpacaChatbot.css';

// FastAPI 서버 주소
const API_BASE_URL =
    import.meta.env.VITE_AI_API_BASE_URL ??
    'http://localhost:8001';

// 개발용 사용자 ID
const DATA_MODE =
    import.meta.env.VITE_INQUIRY_DATA_MODE ?? 'MOCK';

const MOCK_USER_ID =
    import.meta.env.VITE_MOCK_USER_ID ?? '1';

// FastAPI 응답 형식
interface ChatResponse {
    conversation_id: string;
    answer: string;
    type: string;
    saved: boolean;
}

export default function AlpacaChatbot() {
    const [messages, setMessages] =
        useState<ChatMessage[]>([
            {
                id: 1,
                role: 'assistant',
                content:
                    '안녕하세요! AI 주차 도우미 알파카입니다. 무엇을 도와드릴까요?'
            }
        ]);

    const [input, setInput] = useState('');

    const [voiceError, setVoiceError] =
        useState<string | null>(null);

    // API 통신 상태
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    // 같은 채팅에서 동일한 대화 ID 사용
    const conversationId = useRef<string>(
        crypto.randomUUID()
    );

    const quickQuestions: QuickQuestion[] = [
        { id: 1, text: '주차 이용 안내' },
        { id: 2, text: '주차 예약' }
        //{ id: 3, text: '주차 요금' },
    ];

    // 음성 인식 결과를 입력창에 반영
    const handleTranscriptChange = (text: string) => {
        setInput(text);
    };

    // 실제 FastAPI에 메시지 전송
    const handleSendMessage = async (message?: string) => {
        const question = (message ?? input).trim();

        if (!question || sending) {
            return;
        }

        setSending(true);
        setError('');
        setInput('');

        // 사용자 메시지 표시
        const userMessage: ChatMessage = {
            id: Date.now(),
            role: 'user',
            content: question
        };

        setMessages(prev => [
            ...prev,
            userMessage
        ]);

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/inquiry/chat`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        conversation_id: conversationId.current,
                        question,
                        ...(DATA_MODE === 'MOCK'
                            ? { mock_user_id: MOCK_USER_ID }
                            : {})
                    })
                }
            );

            if (!response.ok) {
                let detail = `요청 실패 (${response.status})`;

                try {
                    const body = await response.json();

                    if (typeof body.detail === 'string') {
                        detail = body.detail;
                    }
                } catch {
                    // JSON 형식이 아닌 오류 응답
                }

                throw new Error(detail);
            }

            const data: ChatResponse = await response.json();

            if (!data.saved) {
                throw new Error(
                    '상담 저장이 확인되지 않았습니다.'
                );
            }

            // 실제 AI 답변 표시
            const assistantMessage: ChatMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: data.answer
            };

            setMessages(prev => [
                ...prev,
                assistantMessage
            ]);

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : '문의 처리 중 오류가 발생했습니다.'
            );

            // 실패한 질문을 다시 입력할 수 있도록 복원
            setInput(question);

        } finally {
            setSending(false);
        }
    };

    return (
        <div className="container py-4">
            <h2 className="page-title">
                1:1 문의
            </h2>

            <p className="page-description">
                AI 주차 도우미 알파카에게
                궁금한 내용을 문의해보세요.
            </p>

            <div className="alpaca-chatbot">
                <ChatHeader />

                <ChatMessages
                    messages={messages}
                />

                {sending && (
                    <div
                        className="small text-secondary px-3 py-2"
                        role="status"
                    >
                        알파카가 답변을 생성하고 있습니다...
                    </div>
                )}

                {error && (
                    <div
                        className="alert alert-danger m-2"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                <QuickQuestions
                    questions={quickQuestions}
                    onQuestionClick={handleSendMessage}
                />

                <ChatInput
                    input={input}
                    onInputChange={setInput}
                    onSendMessage={() => {
                        void handleSendMessage();
                    }}
                    onTranscriptChange={
                        handleTranscriptChange
                    }
                    voiceError={voiceError}
                    onVoiceErrorChange={
                        setVoiceError
                    }
                />
            </div>
        </div>
    );
}

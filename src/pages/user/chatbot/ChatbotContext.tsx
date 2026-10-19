import { v4 as uuidv4 } from 'uuid';
import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState
} from 'react';
import type {
    Dispatch,
    ReactNode,
    SetStateAction
} from 'react';
import type { ChatMessage } from './chatbotTypes';
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
// 공유할 상태와 함수의 타입
interface ChatbotContextValue {
    messages: ChatMessage[];
    input: string;
    setInput: Dispatch<SetStateAction<string>>;
    voiceError: string | null;
    setVoiceError: Dispatch<SetStateAction<string | null>>;
    sending: boolean;
    error: string;
    handleSendMessage: (message?: string) => Promise<void>;
}
// 공통 Context 생성
const ChatbotContext =
    createContext<ChatbotContextValue | null>(null);
// =========================
// 대화 저장 키
// =========================
const CHAT_MESSAGES_KEY = 'alpharking_chat_messages';
const CHAT_CONVERSATION_KEY = 'alpharking_chat_conversation_id';
// 기본 환영 메시지
const initialMessages: ChatMessage[] = [
    {
        id: 1,
        role: 'assistant',
        content:
            '안녕하세요! AI 주차 도우미 알파카입니다. 무엇을 도와드릴까요?'
    }
];
// =========================
// 브라우저에 저장된 대화 불러오기
// =========================
const loadSavedMessages = (): ChatMessage[] => {
    try {
        const saved = localStorage.getItem(CHAT_MESSAGES_KEY);
        if (!saved) {
            return initialMessages;
        }
        const parsed: unknown = JSON.parse(saved);
        if (!Array.isArray(parsed)) {
            return initialMessages;
        }
        const valid = parsed.every(
            item =>
                item !== null &&
                typeof item === 'object' &&
                typeof item.id === 'number' &&
                (item.role === 'assistant' || item.role === 'user') &&
                typeof item.content === 'string'
        );
        return valid && parsed.length > 0
            ? parsed as ChatMessage[]
            : initialMessages;
    } catch {
        return initialMessages;
    }
};
// =========================
// 챗봇 공통 상태 제공
// =========================
export function ChatbotProvider({
    children
}: {
    children: ReactNode;
}) {
    // 전체 화면과 플로팅이 공유하는 메시지
    const [messages, setMessages] =
        useState<ChatMessage[]>(loadSavedMessages);
    const [input, setInput] = useState('');
    const [voiceError, setVoiceError] =
        useState<string | null>(null);
    // API 통신 상태
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    // =========================
    // 대화 ID 생성 및 복원
    // =========================
    // 두 챗봇에서 동일한 대화 ID 사용
    const conversationId = useRef<string | null>(null);
    // 기존 대화 ID가 있다면 재사용
    // 없다면 새로운 UUID 생성
    if (conversationId.current === null) {
        const savedId = localStorage.getItem(
            CHAT_CONVERSATION_KEY
        );
        conversationId.current = savedId || uuidv4();
    }
    // 대화 ID를 브라우저에 저장
    useEffect(() => {
        if (conversationId.current) {
            try {
                localStorage.setItem(
                    CHAT_CONVERSATION_KEY,
                    conversationId.current
                );
            } catch (err) {
                console.error('챗봇 대화 ID 저장 실패:', err);
            }
        }
    }, []);
    // =========================
    // 메시지 변경 시 자동 저장
    // =========================
    useEffect(() => {
        try {
            localStorage.setItem(
                CHAT_MESSAGES_KEY,
                JSON.stringify(messages)
            );
        } catch (err) {
            console.error('챗봇 대화 저장 실패:', err);
        }
    }, [messages]);
    // =========================
    // 공통 메시지 전송 함수
    // =========================
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
            const data: ChatResponse =
                await response.json();
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
            // 실패한 질문 복원
            setInput(question);
        } finally {
            setSending(false);
        }
    };
    return (
        <ChatbotContext.Provider
            value={{
                messages,
                input,
                setInput,
                voiceError,
                setVoiceError,
                sending,
                error,
                handleSendMessage
            }}
        >
            {children}
        </ChatbotContext.Provider>
    );
}
// =========================
// 다른 컴포넌트에서 공통 상태 사용
// =========================
export function useChatbot() {
    const context = useContext(ChatbotContext);
    if (!context) {
        throw new Error(
            'useChatbot은 ChatbotProvider 내부에서 사용해야 합니다.'
        );
    }
    return context;
}

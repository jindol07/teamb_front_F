import {
    createContext,
    useContext,
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
// 챗봇 공통 상태 제공
export function ChatbotProvider({
    children
}: {
    children: ReactNode;
}) {
    // 전체 화면과 플로팅이 공유하는 메시지
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
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    // 두 챗봇에서 동일한 대화 ID 사용
    const conversationId = useRef<string>(
        crypto.randomUUID()
    );
    // 공통 메시지 전송 함수
    const handleSendMessage = async (message?: string) => {
        const question = (message ?? input).trim();
        if (!question || sending) {
            return;
        }
        setSending(true);
        setError('');
        setInput('');
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
// 다른 컴포넌트에서 공통 상태 사용
export function useChatbot() {
    const context = useContext(ChatbotContext);
    if (!context) {
        throw new Error(
            'useChatbot은 ChatbotProvider 내부에서 사용해야 합니다.'
        );
    }
    return context;
}

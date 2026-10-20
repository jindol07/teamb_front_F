import { v4 as uuidv4 } from 'uuid';
import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    useSyncExternalStore
} from 'react';
import type {
    Dispatch,
    ReactNode,
    SetStateAction
} from 'react';
import type { ChatMessage } from './chatbotTypes';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../auth/reducers/store';
import { userApi } from '../../../api/axios';
import { isAxiosError } from 'axios';
// FastAPI 서버 주소
const API_BASE_URL =
    import.meta.env.VITE_AI_API_BASE_URL ??
    'http://localhost:8001';
// API 모드에서는 기존 로그인 JWT로 본인 데이터를 조회합니다.
const DATA_MODE =
    import.meta.env.VITE_INQUIRY_DATA_MODE ?? 'API';
const MOCK_USER_ID =
    import.meta.env.VITE_MOCK_USER_ID ?? '1';
// FastAPI 응답 형식
interface ChatResponse {
    conversation_id: string;
    answer: string;
    type: string;
    saved: boolean;
    storage_notice?: string | null;
}
interface ConversationHistory {
    conversationId: string | null;
    messages: { id: string; senderTypeCode: 'USER' | 'AI'; content: string }[];
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
    storageNotice: string;
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

// 다른 브라우저 탭에서 계정이 바뀌어도 이전 계정의 대화를 계속 표시하지 않습니다.
const subscribeToken = (onChange: () => void) => {
    window.addEventListener('storage', onChange);
    return () => window.removeEventListener('storage', onChange);
};
const readToken = () => localStorage.getItem('token') ?? '';
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
    // 실제 개인 정보는 기존 공통 저장 키에서 복원하지 않습니다.
    if (DATA_MODE !== 'MOCK') return initialMessages;
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
    // 같은 탭의 로그인 변경은 Redux, 다른 탭의 변경은 storage 이벤트로 감지합니다.
    useSelector((state: RootState) => state.auth.token);
    const token = useSyncExternalStore(subscribeToken, readToken, () => '');
    // 계정/토큰이 바뀌면 기존 대화와 진행 중인 응답을 새 세션에서 분리합니다.
    return <ChatbotSession key={token || 'anonymous'}>{children}</ChatbotSession>;
}

function ChatbotSession({ children }: { children: ReactNode }) {
    // 전체 화면과 플로팅이 공유하는 메시지
    const [messages, setMessages] =
        useState<ChatMessage[]>(loadSavedMessages);
    const [input, setInput] = useState('');
    const [voiceError, setVoiceError] =
        useState<string | null>(null);
    // API 통신 상태
    const [sending, setSending] = useState(false);
    const [restoring, setRestoring] = useState(DATA_MODE !== 'MOCK');
    const [error, setError] = useState('');
    const [storageNotice, setStorageNotice] = useState('');
    const retryRequest = useRef<{ question: string; id: string } | null>(null);
    const sendLock = useRef(false);
    const active = useRef(true);
    useEffect(() => {
        active.current = true;
        return () => { active.current = false; };
    }, []);
    // =========================
    // 대화 ID 생성 및 복원
    // =========================
    // 두 챗봇에서 동일한 대화 ID 사용
    const conversationId = useRef<string | null>(null);
    // 기존 대화 ID가 있다면 재사용
    // 없다면 새로운 UUID 생성
    if (DATA_MODE === 'MOCK' && conversationId.current === null) {
        const savedId = localStorage.getItem(
            CHAT_CONVERSATION_KEY
        );
        conversationId.current = savedId || uuidv4();
    }
    // 서버가 인증된 본인의 최근 대화를 조회합니다. 메시지 본문은 브라우저에 저장하지 않습니다.
    useEffect(() => {
        if (DATA_MODE === 'MOCK') return;
        let cancelled = false;
        const requestToken = readToken();
        const restore = async () => {
            try {
                const response = await userApi.get<ConversationHistory>('/api/chatbot/conversations/latest', { timeout: 10000 });
                if (cancelled || readToken() !== requestToken) return;
                conversationId.current = response.data.conversationId;
                const restored = response.data.messages.map((m): ChatMessage => ({
                    id: m.id, role: m.senderTypeCode === 'USER' ? 'user' : 'assistant', content: m.content,
                }));
                setMessages(restored.length ? restored : initialMessages);
                setStorageNotice(response.data.conversationId ? '저장된 최근 대화의 메시지 최대 40개를 불러왔습니다.' : '대화는 계정별로 서버에 저장됩니다.');
            } catch {
                if (!cancelled && readToken() === requestToken) {
                    setStorageNotice('이전 대화를 불러오지 못했습니다. 새 질문은 새 대화로 저장됩니다.');
                }
            } finally {
                if (!cancelled) setRestoring(false);
            }
        };
        void restore();
        return () => { cancelled = true; };
    }, []);
    // 대화 ID를 브라우저에 저장
    useEffect(() => {
        if (DATA_MODE !== 'MOCK') return;
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
        if (DATA_MODE !== 'MOCK') return;
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
        if (!question || sendLock.current || restoring) {
            return;
        }
        sendLock.current = true;
        if (retryRequest.current?.question !== question) {
            retryRequest.current = { question, id: uuidv4() };
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
            const requestToken = localStorage.getItem('token');
            if (DATA_MODE !== 'MOCK' && !requestToken) {
                throw new Error('로그인 후 이용해 주세요.');
            }
            // FastAPI 전체 주소를 지정하고, JWT 첨부는 userApi 인터셉터에 맡깁니다.
            const response = await userApi.post<ChatResponse>(
                `${API_BASE_URL}/api/inquiry/chat`,
                {
                    conversation_id: conversationId.current,
                    request_id: retryRequest.current.id,
                    question,
                    ...(DATA_MODE === 'MOCK'
                        ? { mock_user_id: MOCK_USER_ID }
                        : {})
                }
            );
            if (!active.current || (DATA_MODE !== 'MOCK' && localStorage.getItem('token') !== requestToken)) return;
            const data = response.data;
            if (!data.saved) {
                throw new Error(
                    '상담 저장이 확인되지 않았습니다.'
                );
            }
            if (!active.current || (DATA_MODE !== 'MOCK' && localStorage.getItem('token') !== requestToken)) return;
            conversationId.current = data.conversation_id;
            retryRequest.current = null;
            setStorageNotice(data.storage_notice ?? (data.saved ? '' : '대화가 서버에 저장되지 않았습니다.'));
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
            if (!active.current) return;
            // 실패한 요청은 재시도할 때 다시 표시하며, 같은 요청 UUID를 재사용합니다.
            setMessages(prev => prev.filter(item => item.id !== userMessage.id));
            let detail = err instanceof Error ? err.message : '문의 처리 중 오류가 발생했습니다.';
            if (isAxiosError<unknown>(err)) {
                const body = err.response?.data;
                detail = typeof body === 'object' && body !== null && 'detail' in body && typeof body.detail === 'string'
                    ? body.detail
                    : err.response ? `요청 실패 (${err.response.status})` : 'AI 서버에 연결할 수 없습니다.';
            }
            setError(detail);
            // 실패한 질문 복원
            setInput(question);
        } finally {
            sendLock.current = false;
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
                sending: sending || restoring,
                error,
                storageNotice,
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

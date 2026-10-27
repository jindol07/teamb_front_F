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
    MutableRefObject,
    ReactNode,
    SetStateAction
} from 'react';
import type { ChatMessage } from './chatbotTypes';
import { readLoginSession, isCurrentLoginSession, subscribeLoginSession } from '../../../auth/loginSession';
import { userApi } from '../../../api/axios';
import { isAxiosError } from 'axios';
// FastAPI 서버 주소
const API_BASE_URL =
    import.meta.env.VITE_AI_API_BASE_URL ??
    'http://localhost:8001';
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
    messages: { id: string; senderTypeCode: 'USER' | 'AI'; content: string; createdAt?: string | null }[];
}
// 공유할 상태와 함수의 타입
interface ChatbotContextValue {
    pageScrollPosition: MutableRefObject<{ top: number; followLatest: boolean } | null>;
    floatingScrollPosition: MutableRefObject<{ top: number; followLatest: boolean } | null>;
    restoring: boolean;
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

// 기본 환영 메시지
const initialMessages: ChatMessage[] = [
    {
        id: 1,
        role: 'assistant',
        content:
            '안녕하세요! 주차 도우미 알파킹이에요. 빈자리, 내 예약, 주차 이용 이력이 궁금하면 물어보세요.'
    }
];
// =========================
// 챗봇 공통 상태 제공
// =========================
export function ChatbotProvider({
    children
}: {
    children: ReactNode;
}) {
    // 토큰 갱신은 유지하고, 실제 로그인 변경만 새 대화 상태로 분리합니다.
    const session = useSyncExternalStore(subscribeLoginSession, readLoginSession, () => '');
    return <ChatbotSession key={session || 'anonymous'} session={session}>{children}</ChatbotSession>;
}

function ChatbotSession({ children, session }: { children: ReactNode; session: string }) {
    // 계정별 세션 메모리에만 보관하여 페이지 이동 후 읽던 위치를 복원합니다.
    const pageScrollPosition = useRef<{ top: number; followLatest: boolean } | null>(null);
    const floatingScrollPosition = useRef<{ top: number; followLatest: boolean } | null>(null);
    // 전체 화면과 플로팅이 공유하는 메시지
    const [messages, setMessages] =
        useState<ChatMessage[]>(initialMessages);
    const [input, setInput] = useState('');
    const [voiceError, setVoiceError] =
        useState<string | null>(null);
    // API 통신 상태
    const [sending, setSending] = useState(false);
    const [restoring, setRestoring] = useState(true);
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
    // 서버가 인증된 본인의 최근 대화를 조회합니다. 메시지 본문은 브라우저에 저장하지 않습니다.
    useEffect(() => {
        let cancelled = false;
        if (!session) {
            setStorageNotice('대화 복원을 위해 로그아웃 후 다시 로그인해 주세요.');
            setRestoring(false);
            return;
        }
        const restore = async () => {
            try {
                const response = await userApi.get<ConversationHistory>('/api/chatbot/conversations/latest', { timeout: 10000 });
                if (cancelled || !isCurrentLoginSession(session)) return;
                conversationId.current = response.data.conversationId;
                const restored = response.data.messages.map((m): ChatMessage => ({
                    id: m.id, role: m.senderTypeCode === 'USER' ? 'user' : 'assistant', content: m.content,
                    createdAt: m.createdAt,
                }));
                setMessages(restored.length ? restored : initialMessages);
                setStorageNotice(response.data.conversationId ? '저장된 최근 대화의 메시지 최대 40개를 불러왔습니다.' : '대화는 계정별로 서버에 저장됩니다.');
            } catch {
                if (!cancelled && isCurrentLoginSession(session)) {
                    setStorageNotice('이전 대화를 불러오지 못했습니다. 새 질문은 새 대화로 저장됩니다.');
                }
            } finally {
                if (!cancelled && isCurrentLoginSession(session)) setRestoring(false);
            }
        };
        void restore();
        return () => { cancelled = true; };
    }, [session]);
    // =========================
    // 공통 메시지 전송 함수
    // =========================
    const handleSendMessage = async (message?: string) => {
        const question = (message ?? input).trim();
        if (!isCurrentLoginSession(session)) {
            setError('로그아웃 후 다시 로그인해 주세요.');
            return;
        }
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
            content: question,
            createdAt: new Date().toISOString()
        };
        setMessages(prev => [
            ...prev,
            userMessage
        ]);
        try {
            const requestToken = localStorage.getItem('token');
            if (!requestToken) {
                throw new Error('로그인 후 이용해 주세요.');
            }
            // FastAPI 전체 주소를 지정하고, JWT 첨부는 userApi 인터셉터에 맡깁니다.
            const response = await userApi.post<ChatResponse>(
                `${API_BASE_URL}/api/inquiry/chat`,
                {
                    conversation_id: conversationId.current,
                    request_id: retryRequest.current.id,
                    question
                }
            );
            if (!active.current || !isCurrentLoginSession(session)) return;
            const data = response.data;
            if (!data.saved) {
                throw new Error(
                    '상담 저장이 확인되지 않았습니다.'
                );
            }
            conversationId.current = data.conversation_id;
            retryRequest.current = null;
            setStorageNotice(data.storage_notice ?? '');
            // 실제 AI 답변 표시
            const assistantMessage: ChatMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: data.answer,
                createdAt: new Date().toISOString()
            };
            setMessages(prev => [
                ...prev,
                assistantMessage
            ]);
        } catch (err) {
            if (!active.current || !isCurrentLoginSession(session)) return;
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
            if (active.current && isCurrentLoginSession(session)) {
                sendLock.current = false;
                setSending(false);
            }
        }
    };
    return (
        <ChatbotContext.Provider
            value={{
                pageScrollPosition,
                floatingScrollPosition,
                restoring,
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

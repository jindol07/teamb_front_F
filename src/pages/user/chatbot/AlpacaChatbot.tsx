import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import QuickQuestions from './QuickQuestions';
import ChatInput from './ChatInput';
import type { QuickQuestion } from './chatbotTypes';
import { useChatbot } from './ChatbotContext';
import './AlpacaChatbot.css';
import { useNavigate } from 'react-router-dom';
// 플로팅 챗봇 여부
interface AlpacaChatbotProps {
    floating?: boolean;
    visible?: boolean;
}
export default function AlpacaChatbot({
    floating = false,
    visible = true
}: AlpacaChatbotProps) {
    const navigate = useNavigate();
    // 전체 화면과 플로팅 챗봇이 공유하는 상태
    const {
        messages,
        input,
        setInput,
        voiceError,
        setVoiceError,
        sending,
        error,
        storageNotice,
        handleSendMessage
    } = useChatbot();
    const quickQuestions: QuickQuestion[] = [
        { id: 1, text: '빈자리 확인', question: '지금 빈자리 몇 개야?' },
        { id: 2, text: '내 예약', question: '내 예약 내역 알려줘' },
        { id: 3, text: '주차 이력', question: '내 최근 주차 이용 이력 알려줘' },
        { id: 4, text: '주차 이용 안내', question: '주차장 이용 방법 알려줘' }
    ];
    // 음성 인식 결과를 입력창에 반영
    const handleTranscriptChange = (text: string) => {
        setInput(text);
    };
    return (
        <div
            className={
                floating
                    ? 'p-0'
                    : 'container py-4 alpaca-chatbot-page'
            }
        >
            {/* 일반 페이지에서만 제목 표시 */}
            {!floating && (
                <>
                    <div className="d-flex justify-content-between align-items-center">
                        <h2 className="page-title mb-0">
                            1:1 문의
                        </h2>
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => navigate('/user')}
                            aria-label="1:1 문의 닫기"
                        >
                            ✕ 닫기
                        </button>
                    </div>
                    <p className="page-description mt-3">
                        AI 주차 도우미 알파킹에게
                        궁금한 내용을 문의해보세요.
                    </p>
                </>
            )}
            <div className="alpaca-chatbot">
                <ChatHeader />
                {storageNotice && (
                    <div className="small text-muted px-3 py-2" role="status">
                        {storageNotice}
                    </div>
                )}
                <ChatMessages messages={messages} floating={floating} visible={visible} />
                {sending && (
                    <div
                        className="alpharking-waiting small text-secondary px-3 py-2"
                        role="status"
                    >
                        알파킹이 답변을 준비하고 있어요
                        <span className="alpharking-waiting-dots" aria-hidden="true">
                            <span>●</span><span>●</span><span>●</span>
                        </span>
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
                    onTranscriptChange={handleTranscriptChange}
                    voiceError={voiceError}
                    onVoiceErrorChange={setVoiceError}
                />
            </div>
        </div>
    );
}

import {
    useEffect,
    useRef,
    useState
} from 'react';
import './AlpacaChatbot.css';
/*
  채팅 메시지 타입
  user      : 사용자
  assistant : 알파카
*/
interface ChatMessage {
    id: number;
    role: 'user' | 'assistant';
    content: string;
}
/*
  빠른 질문 타입
*/
interface QuickQuestion {
    id: number;
    text: string;
}
export default function AlpacaChatbot() {
    /*
      전체 채팅 메시지
    */
    const [messages, setMessages] =
        useState<ChatMessage[]>([
            {
                id: 1,
                role: 'assistant',
                content:
                    '안녕하세요! AI 주차 도우미 알파카입니다. 무엇을 도와드릴까요?'
            }
        ]);
    /*
      사용자가 현재 입력하고 있는 내용
    */
    const [input, setInput] =
        useState('');
    /*
      빠른 질문 목록
    */
    const quickQuestions: QuickQuestion[] = [
        {
            id: 1,
            text: '주차 이용 안내'
        },
        {
            id: 2,
            text: '주차 요금'
        },
        {
            id: 3,
            text: '주차 예약'
        },
        {
            id: 4,
            text: '공지사항'
        }
    ];
    /*
      채팅창 가장 아래 위치를 가리키는 ref
      새로운 메시지가 추가되면
      해당 위치로 자동 스크롤하기 위해 사용
    */
    const messagesEndRef =
        useRef<HTMLDivElement>(null);
    /*
      메시지가 변경될 때마다
      채팅창 가장 아래로 이동
    */
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: 'smooth'
        });
    }, [messages]);
    /*
      알파카 임시 답변
      현재는 백엔드 연결 전이므로
      Mock 형태로 답변
      추후 이 부분을 axios API 요청으로
      변경할 예정
    */
    const getMockAnswer = (
        question: string
    ) => {
        if (question.includes('요금')) {
            return '주차 요금에 대해 안내해드릴게요. 현재는 테스트 답변이며 추후 실제 주차 정책 데이터를 기반으로 안내할 예정입니다.';
        }
        if (
            question.includes('예약')
        ) {
            return '주차 예약에 대해 안내해드릴게요. 원하는 날짜와 시간의 주차 예약 정보를 확인할 수 있습니다.';
        }
        if (
            question.includes('공지')
        ) {
            return '공지사항에 대해 안내해드릴게요. 주차장 이용과 관련된 주요 공지사항을 확인할 수 있습니다.';
        }
        if (
            question.includes('이용')
        ) {
            return '주차장 이용 방법에 대해 안내해드릴게요. 현재는 테스트 답변이며 추후 주차 이용 정책과 연동할 예정입니다.';
        }
        return '문의하신 내용을 확인했습니다. 현재는 테스트 단계이며 추후 AI와 주차 관련 데이터를 연결하여 답변할 예정입니다.';
    };
    /*
      메시지 전송
    */
    const handleSendMessage = (
        message?: string
    ) => {
        /*
          빠른 질문을 눌렀다면 message 사용
          직접 입력했다면 input 사용
        */
        const question =
            message ?? input;
        /*
          공백만 입력한 경우
          메시지를 보내지 않음
        */
        if (question.trim() === '') {
            return;
        }
        /*
          사용자 메시지 생성
        */
        const userMessage: ChatMessage = {
            id: Date.now(),
            role: 'user',
            content: question
        };
        /*
          알파카 답변 생성
        */
        const assistantMessage: ChatMessage = {
            id: Date.now() + 1,
            role: 'assistant',
            content: getMockAnswer(question)
        };
        /*
          기존 메시지 뒤에
          사용자 질문 + 알파카 답변 추가
        */
        setMessages((prev) => [
            ...prev,
            userMessage,
            assistantMessage
        ]);
        /*
          입력창 초기화
        */
        setInput('');
    };
    /*
      Enter 키로 메시지 전송
    */
    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>
    ) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };
    return (
        <div className="container py-4">
            {/* 페이지 제목 */}
            <h2 className="page-title">
                1:1 문의
            </h2>
            <p className="page-description">
                AI 주차 도우미 알파카에게
                궁금한 내용을 문의해보세요.
            </p>
            {/* 채팅 전체 영역 */}
            <div className="alpaca-chatbot">
                {/* 챗봇 상단 */}
                <div className="alpaca-chat-header">
                    <div className="alpaca-chat-profile">
                        <div className="alpaca-profile-icon">
                            🦙
                        </div>
                        <div>
                            <div className="fw-bold">
                                알파카
                            </div>
                            <div className="small text-secondary">
                                AI 주차 도우미
                            </div>
                        </div>
                    </div>
                </div>
                {/* 메시지 영역 */}
                <div className="alpaca-chat-messages">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={
                                message.role === 'user'
                                    ? 'chat-message user-message'
                                    : 'chat-message assistant-message'
                            }
                        >
                            {/* 알파카 메시지일 경우 */}
                            {message.role ===
                                'assistant' && (
                                    <div className="message-profile">
                                        🦙
                                    </div>
                                )}
                            <div className="message-bubble">
                                {message.content}
                            </div>
                        </div>
                    ))}
                    {/* 자동 스크롤 위치 */}
                    <div ref={messagesEndRef} />
                </div>
                {/* 빠른 질문 */}
                <div className="quick-question-area">
                    {quickQuestions.map(
                        (question) => (
                            <button
                                key={question.id}
                                type="button"
                                className="quick-question-button"
                                onClick={() =>
                                    handleSendMessage(
                                        question.text
                                    )
                                }
                            >
                                {question.text}
                            </button>
                        )
                    )}
                </div>
                {/* 메시지 입력 */}
                <div className="alpaca-chat-input-area">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="질문을 입력하세요."
                        value={input}
                        onChange={(e) =>
                            setInput(e.target.value)
                        }
                        onKeyDown={handleKeyDown}
                    />
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() =>
                            handleSendMessage()
                        }
                    >
                        전송
                    </button>
                </div>
            </div>
        </div>
    );
}
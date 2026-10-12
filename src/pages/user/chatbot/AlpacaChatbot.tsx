import { useState } from 'react';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import QuickQuestions from './QuickQuestions';
import ChatInput from './ChatInput';
import { getMockAnswer } from './chatbotMock';
import type {
    ChatMessage,
    QuickQuestion
} from './chatbotTypes';
import './AlpacaChatbot.css';
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
      음성 인식 오류 메시지
    */
    const [voiceError, setVoiceError] =
        useState<string | null>(null);
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
        }
    ];
    /*
      음성 인식 결과 처리
      VoiceRecorder에서 전달받은 텍스트를
      채팅 입력창에 표시
    */
    const handleTranscriptChange = (
        text: string
    ) => {
        setInput(text);
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
                <ChatHeader />
                {/* 메시지 영역 */}
                <ChatMessages
                    messages={messages}
                />
                {/* 빠른 질문 */}
                <QuickQuestions
                    questions={quickQuestions}
                    onQuestionClick={handleSendMessage}
                />
                {/* 메시지 입력 및 음성 인식 */}
                <ChatInput
                    input={input}
                    onInputChange={setInput}
                    onSendMessage={() =>
                        handleSendMessage()
                    }
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
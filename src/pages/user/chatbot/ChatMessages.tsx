import { useEffect, useRef } from 'react';
import type { ChatMessage } from './chatbotTypes';
/*
  채팅 메시지 Props
*/
interface ChatMessagesProps {
    messages: ChatMessage[];
}
export default function ChatMessages({
    messages
}: ChatMessagesProps) {
    /*
      채팅창 가장 아래 위치를 가리키는 ref
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
    return (
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
                    {message.role === 'assistant' && (
                        <div className="message-profile">
                            <img
                                src="/image/alpha1.png"
                                alt="알파카"
                            />
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
    );
}
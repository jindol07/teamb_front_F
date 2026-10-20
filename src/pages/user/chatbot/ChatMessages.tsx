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
      채팅 메시지 영역을 가리키는 ref
    */
    const messagesRef = useRef<HTMLDivElement>(null);
    /*
      사용자가 하단 근처에 있는지 확인
    */
    const shouldAutoScroll = useRef(true);
    /*
      사용자가 직접 스크롤했을 때 위치 확인
    */
    const handleScroll = () => {
        const element = messagesRef.current;
        if (!element) return;
        const distanceFromBottom =
            element.scrollHeight -
            element.scrollTop -
            element.clientHeight;
        // 하단에서 80px 이내라면 자동 스크롤 허용
        shouldAutoScroll.current =
            distanceFromBottom < 80;
    };
    /*
      메시지가 변경되면 필요한 경우에만
      채팅 영역 내부를 아래로 스크롤
    */
    useEffect(() => {
        const element = messagesRef.current;
        if (!element || !shouldAutoScroll.current) {
            return;
        }
        element.scrollTo({
            top: element.scrollHeight,
            behavior: 'smooth'
        });
    }, [messages]);
    return (
        <div
            ref={messagesRef}
            className="alpaca-chat-messages"
            onScroll={handleScroll}
        >
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
                                src="/images/alpha1.png"
                                alt="알파카"
                            />
                        </div>
                    )}
                    <div className="message-bubble">
                        {message.content}
                    </div>
                </div>
            ))}
        </div>
    );
}

import { Fragment, useLayoutEffect, useRef } from 'react';
import { useChatbot } from './ChatbotContext';
import type { ChatMessage } from './chatbotTypes';
import { chatMessageDate } from './chatbotTypes';

const messageTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', hour: 'numeric', minute: '2-digit', hour12: true
});

function messageTime(value?: string | null): string | null {
    if (!value || !chatMessageDate(value)) return null;
    const normalized = value.replace(' ', 'T');
    return messageTimeFormatter.format(new Date(
        /(?:Z|[+-]\d{2}:\d{2})$/.test(normalized) ? normalized : `${normalized}+09:00`
    ));
}
/*
  채팅 메시지 Props
*/
interface ChatMessagesProps {
    messages: ChatMessage[];
    floating?: boolean;
    visible?: boolean;
}
export default function ChatMessages({
    messages,
    floating = false,
    visible = true
}: ChatMessagesProps) {
    const { pageScrollPosition, floatingScrollPosition, restoring } = useChatbot();
    const scrollPosition = floating ? floatingScrollPosition : pageScrollPosition;
    const initialized = useRef(false);
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
        if (!element || !visible) return;
        const distanceFromBottom =
            element.scrollHeight -
            element.scrollTop -
            element.clientHeight;
        // 하단에서 80px 이내라면 자동 스크롤 허용
        shouldAutoScroll.current =
            distanceFromBottom < 80;
        if (initialized.current) {
            scrollPosition.current = {
                top: element.scrollTop,
                followLatest: shouldAutoScroll.current
            };
        }
    };
    /*
      메시지가 변경되면 필요한 경우에만
      채팅 영역 내부를 아래로 스크롤
    */
    useLayoutEffect(() => {
        const element = messagesRef.current;
        if (!visible) {
            initialized.current = false;
            return;
        }
        if (!element || restoring) return;
        if (!initialized.current) {
            const saved = scrollPosition.current;
            shouldAutoScroll.current = saved?.followLatest ?? true;
            // 화면이 그려지기 전에 복원해 위에서 아래로 이동하는 애니메이션을 방지합니다.
            element.scrollTop = saved ? saved.top : element.scrollHeight;
            initialized.current = true;
            scrollPosition.current = {
                top: element.scrollTop,
                followLatest: shouldAutoScroll.current
            };
            return;
        }
        if (!element || !shouldAutoScroll.current) {
            return;
        }
        element.scrollTo({
            top: element.scrollHeight,
            behavior: 'smooth'
        });
    }, [messages, visible, restoring, scrollPosition]);
    return (
        <div className={floating ? 'floating-message-container' : 'chat-message-container'}>
        <div
            ref={messagesRef}
            className="alpaca-chat-messages"
            onScroll={handleScroll}
        >
            {messages.map((message, index) => {
                const date = chatMessageDate(message.createdAt);
                const time = messageTime(message.createdAt);
                const previousDate = index > 0 ? chatMessageDate(messages[index - 1].createdAt) : null;
                return (
                <Fragment key={message.id}>
                {date && date !== previousDate && (
                    <div className="chat-date-separator" role="separator" aria-label={`${date} 대화`}>
                        <time dateTime={date}>{date}</time>
                    </div>
                )}
                <div
                    className={(
                        message.role === 'user'
                            ? 'chat-message user-message'
                            : 'chat-message assistant-message'
                    ) + (time ? ' has-time' : '')}
                >
                    {/* 알파카 메시지일 경우 */}
                    {message.role === 'assistant' && (
                        <div className="message-profile">
                            <img
                                src="/images/alpha1.png"
                                alt="알파킹"
                            />
                        </div>
                    )}
                    <div className="message-bubble">
                        {message.content}
                        {time && <time className="message-time">{time}</time>}
                    </div>
                </div>
                </Fragment>
                );
            })}
        </div>
            <button
                type="button"
                className="chat-scroll-bottom"
                aria-label="최신 메시지로 내려가기"
                title="맨 아래로"
                onClick={() => {
                    const element = messagesRef.current;
                    if (!element) return;
                    shouldAutoScroll.current = true;
                    element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
                }}
            >
                ↓
            </button>
        </div>
    );
}

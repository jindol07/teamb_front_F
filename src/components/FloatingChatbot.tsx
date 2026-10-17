
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LuBot, LuX } from 'react-icons/lu';
import AlpacaChatbot from '../pages/user/chatbot/AlpacaChatbot';
import './FloatingChatbot.css';

/**
 * 사용자 페이지 공통 플로팅 챗봇
 * 기존 AlpacaChatbot 기능을 재사용합니다.
 */
export default function FloatingChatbot() {
    // 챗봇 열림 / 닫힘 상태
    const [isOpen, setIsOpen] = useState(false);

    // 현재 페이지 주소 확인
    const location = useLocation();

    // 기존 전체 화면 챗봇 페이지인지 확인
    const isChatbotPage = location.pathname === '/user/chatbot';

    return (
        <div
            style={{
                // 전체 화면 챗봇 페이지에서는 숨김
                display: isChatbotPage ? 'none' : 'block',
                position: 'fixed',
                right: '24px',
                bottom: '24px',
                zIndex: 1050,
            }}
        >
            {/* 챗봇 창 */}
            <div
                id="floating-alpaca-chat"
                style={{
                    display: isOpen ? 'block' : 'none',
                    width: '380px',
                    maxWidth: 'calc(100vw - 32px)',
                    height: '540px',
                    maxHeight: 'calc(100dvh - 110px)',
                    overflow: 'hidden',
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
                    marginBottom: '12px',
                }}
            >
                <AlpacaChatbot floating />
            </div>

            {/* 챗봇 열기 / 닫기 버튼 */}
            <button
                type="button"
                onClick={() => setIsOpen(prev => !prev)}
                aria-label={isOpen ? '챗봇 닫기' : '챗봇 열기'}
                aria-expanded={isOpen}
                aria-controls="floating-alpaca-chat"
                className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center ms-auto"
                style={{
                    width: '60px',
                    height: '60px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                }}
            >
                {isOpen ? <LuX size={26} /> : <LuBot size={28} />}
            </button>
        </div>
    );
}

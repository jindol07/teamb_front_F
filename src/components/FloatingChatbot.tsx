
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LuX } from 'react-icons/lu';
import AlpharkingCharacter from './AlpharkingCharacter';
import AlpacaChatbot from '../pages/user/chatbot/AlpacaChatbot';
import './FloatingChatbot.css';
import { useAlpharkingRoaming } from './useAlpharkingRoaming';

type MascotPosition = { x: number; y: number };
const readPreference = (key: string) => {
    try { return localStorage.getItem(key); } catch { return null; }
};
const keepOnScreen = (position: MascotPosition): MascotPosition => ({
    x: Math.max(8, Math.min(position.x, window.innerWidth - 136)),
    y: Math.max(40, Math.min(position.y, window.innerHeight - 164))
});

/**
 * 사용자 페이지 공통 플로팅 챗봇
 * 기존 AlpacaChatbot 기능을 재사용합니다.
 */
export default function FloatingChatbot() {
    // 챗봇 열림 / 닫힘 상태
    const [isOpen, setIsOpen] = useState(false);
    const [quiet, setQuiet] = useState(() => readPreference('alpharking_quiet') === 'on');
    const [hidden, setHidden] = useState(() => readPreference('alpharking_hidden') === 'on');
    const [position, setPosition] = useState<MascotPosition | null>(() => {
        try {
            const saved: unknown = JSON.parse(readPreference('alpharking_position') ?? 'null');
            if (typeof saved === 'object' && saved !== null && 'x' in saved && 'y' in saved
                && typeof saved.x === 'number' && typeof saved.y === 'number'
                && Number.isFinite(saved.x) && Number.isFinite(saved.y)) return keepOnScreen({ x: saved.x, y: saved.y });
        } catch { /* 잘못된 저장 값은 초기 위치로 되돌립니다. */ }
        return null;
    });
    const [idleAction, setIdleAction] = useState<'none' | 'tilt' | 'sleep'>('none');
    const lastInteraction = useRef(Date.now());
    const drag = useRef<{ x: number; y: number; origin: MascotPosition; moved: boolean } | null>(null);
    const suppressClick = useRef(false);
    useEffect(() => {
        try {
            localStorage.setItem('alpharking_quiet', quiet ? 'on' : 'off');
            localStorage.setItem('alpharking_hidden', hidden ? 'on' : 'off');
            localStorage.setItem('alpharking_position', JSON.stringify(position));
        } catch { /* 저장이 제한되어도 현재 화면에서는 사용할 수 있습니다. */ }
    }, [quiet, hidden, position]);
    useEffect(() => {
        const resize = () => setPosition((previous) => previous ? keepOnScreen(previous) : null);
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);
    useEffect(() => {
        if (quiet || hidden || isOpen) { setIdleAction('none'); return; }
        const wake = () => { lastInteraction.current = Date.now(); setIdleAction('none'); };
        window.addEventListener('pointerdown', wake, { passive: true });
        window.addEventListener('keydown', wake);
        const timer = window.setInterval(() => {
            const elapsed = Date.now() - lastInteraction.current;
            setIdleAction(elapsed >= 30000 ? 'sleep' : elapsed >= 12000 && elapsed % 16000 < 3500 ? 'tilt' : 'none');
        }, 1000);
        return () => {
            window.clearInterval(timer);
            window.removeEventListener('pointerdown', wake);
            window.removeEventListener('keydown', wake);
        };
    }, [quiet, hidden, isOpen]);
    const launcherRef = useRef<HTMLButtonElement>(null);
    const roamingRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) return;
        let pointer: { x: number; y: number } | null = null;
        const updateHitTarget = () => {
            const launcher = launcherRef.current;
            if (!launcher || !pointer || drag.current?.moved) return;
            const bounds = launcher.getBoundingClientRect();
            const inside = pointer.x >= bounds.left && pointer.x <= bounds.right
                && pointer.y >= bounds.top && pointer.y <= bounds.bottom;
            // 캐릭터 아래의 원래 버튼·링크를 우선합니다. 채팅창 자체는 제외합니다.
            const overPageControl = inside && document.elementsFromPoint(pointer.x, pointer.y)
                .some((element) => {
                    if (launcher.contains(element) || element.closest('#floating-alpaca-chat')) return false;
                    // Konva 주차면은 DOM 버튼이 아닌 canvas 내부 도형입니다.
                    const control = element.closest(
                        'button, a[href], input, select, textarea, [role="button"], [onclick], canvas, .parking-map-viewport'
                    );
                    return control !== null || window.getComputedStyle(element).cursor === 'pointer';
                });
            launcher.style.pointerEvents = overPageControl ? 'none' : '';
        };
        const trackPointer = (event: PointerEvent) => {
            pointer = { x: event.clientX, y: event.clientY };
            updateHitTarget();
        };
        window.addEventListener('pointermove', trackPointer, { passive: true });
        // 마우스가 멈춰 있어도 이동 중인 캐릭터와의 겹침을 확인합니다.
        const timer = window.setInterval(updateHitTarget, 80);
        return () => {
            window.removeEventListener('pointermove', trackPointer);
            window.clearInterval(timer);
            if (launcherRef.current) launcherRef.current.style.pointerEvents = '';
        };
    }, [isOpen]);

    // 현재 페이지 주소 확인
    const location = useLocation();

    // 기존 전체 화면 챗봇 페이지인지 확인
    const isChatbotPage = location.pathname === '/user/chatbot';
    const modalOpen = useAlpharkingRoaming(roamingRef, {
        open: isOpen,
        hidden: hidden || isChatbotPage,
        quiet,
        sleeping: idleAction === 'sleep',
        position,
        page: location.pathname
    });

    return (
        <div
            data-alpharking-root
            style={{
                // 전체 화면 챗봇 페이지에서는 숨김
                display: isChatbotPage || modalOpen ? 'none' : 'block',
                position: 'fixed',
                right: '24px',
                bottom: '24px',
                zIndex: 1050,
                pointerEvents: 'none',
            }}
        >
            {/* 챗봇 창 */}
            <div
                id="floating-alpaca-chat"
                style={{
                    display: isOpen ? 'block' : 'none',
                    pointerEvents: 'auto',
                    width: '380px',
                    maxWidth: 'calc(100vw - 32px)',
                    height: '540px',
                    maxHeight: 'calc(100dvh - 200px)',
                    overflow: 'hidden',
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
                    marginBottom: '12px',
                }}
            >
                <AlpacaChatbot floating visible={isOpen && !isChatbotPage} />
            </div>

            {/* 챗봇 열기 / 닫기 버튼 */}
            {hidden && (
                <button type="button" className="alpharking-restore" onClick={() => setHidden(false)}>
                    알파킹 보기
                </button>
            )}
            <div
                ref={roamingRef}
                className={`alpharking-launcher${isOpen ? ' is-open' : ''}${quiet ? ' is-still is-quiet' : ''}${idleAction !== 'none' && !isOpen ? ` is-${idleAction}` : ''}`}
                style={{
                    display: hidden ? 'none' : undefined
                }}
            >
            <button
                ref={launcherRef}
                type="button"
                onClick={() => {
                    if (suppressClick.current) { suppressClick.current = false; return; }
                    setIsOpen(prev => !prev);
                }}
                onPointerDown={(event) => {
                    if (isOpen || event.button !== 0) return;
                    const bounds = event.currentTarget.getBoundingClientRect();
                    suppressClick.current = false;
                    drag.current = { x: event.clientX, y: event.clientY, origin: { x: bounds.left, y: bounds.top }, moved: false };
                    event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                    const current = drag.current;
                    if (!current) return;
                    const dx = event.clientX - current.x;
                    const dy = event.clientY - current.y;
                    if (!current.moved && Math.hypot(dx, dy) < 6) return;
                    current.moved = true;
                    suppressClick.current = true;
                    setQuiet(true);
                    setIdleAction('none');
                    setPosition(keepOnScreen({ x: current.origin.x + dx, y: current.origin.y + dy }));
                }}
                onPointerUp={(event) => {
                    drag.current = null;
                    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
                }}
                onPointerCancel={() => { drag.current = null; suppressClick.current = true; }}
                aria-label={isOpen ? '알파킹 채팅 닫기' : '알파킹에게 질문하기'}
                aria-expanded={isOpen}
                aria-controls="floating-alpaca-chat"
                className="alpharking-open-button"
                title={isOpen ? '채팅 닫기' : '클릭하면 채팅, 끌어서 위치 이동'}
            >
                {isOpen ? <LuX size={26} /> : (
                    <>
                        <span className="alpharking-greeting" aria-hidden="true">무엇이 궁금하세요?</span>
                        <AlpharkingCharacter />
                        {idleAction === 'sleep' && !quiet && <span className="alpharking-sleep-mark" aria-hidden="true">Zzz</span>}
                    </>
                )}
            </button>
            {!isOpen && (
                <div
                    className="alpharking-motion-toggle"
                >
                    <span>알파킹</span>
                    <button type="button" aria-label="조용한 모드" aria-pressed={quiet}
                        title={quiet ? '조용한 모드 끄고 이동하기' : '조용한 모드 켜고 오른쪽 아래에 고정'} onClick={() => {
                            lastInteraction.current = Date.now();
                            setIdleAction('none');
                            if (!quiet) setPosition(null);
                            setQuiet((previous) => !previous);
                        }}>☾</button>
                    <button type="button" aria-label="알파킹 숨기기" title="알파킹 숨기기" onClick={() => { setIsOpen(false); setHidden(true); }}>×</button>
                </div>
            )}
            </div>
        </div>
    );
}

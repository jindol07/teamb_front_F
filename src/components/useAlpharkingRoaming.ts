import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useCompactChatbot } from './useCompactChatbot';

type Point = { x: number; y: number };
const clamp = (point: Point): Point => ({
    x: Math.max(8, Math.min(point.x, window.innerWidth - 136)),
    y: Math.max(40, Math.min(point.y, window.innerHeight - 164))
});

/** 좌표만 DOM에 갱신해 매 프레임 React 전체가 다시 그려지는 것을 피합니다. */
export function useAlpharkingRoaming(
    ref: RefObject<HTMLDivElement>,
    options: { open: boolean; hidden: boolean; quiet: boolean; sleeping: boolean; position: Point | null; page: string }
) {
    const compact = useCompactChatbot();
    const [modalOpen, setModalOpen] = useState(false);
    const lastPosition = useRef<Point | null>(null);
    useEffect(() => {
        const check = () => setModalOpen(Array.from(document.querySelectorAll('[aria-modal="true"], .modal.show'))
            .some((element) => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden'));
        check();
        const timer = window.setInterval(check, 200);
        return () => window.clearInterval(timer);
    }, []);

    const { open, hidden, quiet, sleeping, position, page } = options;
    useEffect(() => {
        const element = ref.current;
        if (!element) return;
        element.dataset.motion = 'idle';
        for (const property of ['position', 'left', 'top']) element.style.removeProperty(property);
        if (open || hidden || modalOpen) return;
        // 모바일 위치는 CSS의 오른쪽 아래 배치에 맡기고 저장된 PC 위치를 적용하지 않습니다.
        if (compact) return;
        const home = { x: innerWidth - 152, y: innerHeight - 156 };
        // 조용한 모드는 기본 위치로 복귀하고, 이후 직접 드래그한 위치만 별도로 사용합니다.
        const initial = quiet ? clamp(position ?? home) : clamp(lastPosition.current ?? home);
        let current = initial;
        const draw = () => {
            lastPosition.current = current;
            element.style.position = 'fixed';
            element.style.left = `${current.x}px`;
            element.style.top = `${current.y}px`;
        };
        draw();
        const stationary = window.matchMedia('(max-width: 768px), (hover: none), (prefers-reduced-motion: reduce)');
        let pointer: Point | null = null;
        const track = (event: PointerEvent) => { pointer = { x: event.clientX, y: event.clientY }; };
        window.addEventListener('pointermove', track, { passive: true });
        let goal: Point | null = null;
        let waitUntil = performance.now() + 2000;
        let previous = performance.now();
        let frame = 0;
        const pickGoal = (): Point | null => {
            const obstacles = Array.from(document.querySelectorAll(
                'button, a[href], input, select, textarea, [role="button"], canvas, .parking-map-viewport'
            )).filter((control) => !control.closest('[data-alpharking-root]') && control.getClientRects().length > 0)
                .map((control) => control.getBoundingClientRect());
            for (let attempt = 0; attempt < 24; attempt++) {
                const point = clamp({ x: Math.random() * (innerWidth - 144), y: 40 + Math.random() * (innerHeight - 204) });
                // 먼저 가장자리 후보를 살펴보고, 남은 시도에서는 중앙의 빈 곳도 찾습니다.
                if (attempt < 18) {
                    const edge = Math.floor(Math.random() * 4);
                    if (edge === 0) point.x = 8;
                    if (edge === 1) point.x = Math.max(8, innerWidth - 136);
                    if (edge === 2) point.y = 40;
                    if (edge === 3) point.y = Math.max(40, innerHeight - 164);
                }
                if (Math.hypot(point.x - current.x, point.y - current.y) < 90) continue;
                if (!obstacles.some((rect) => point.x < rect.right + 8 && point.x + 128 > rect.left - 8
                    && point.y < rect.bottom + 8 && point.y + 154 > rect.top - 8)) return point;
            }
            return null;
        };
        const tick = (now: number) => {
            const delta = Math.min(now - previous, 50) / 1000;
            previous = now;
            current = clamp(current);
            const nearby = pointer && pointer.x >= current.x - 35 && pointer.x <= current.x + 163
                && pointer.y >= current.y - 35 && pointer.y <= current.y + 175;
            if (quiet || sleeping || stationary.matches || nearby || element.matches(':focus-within')
                || element.querySelector('.alpharking-announcement')) {
                element.dataset.motion = 'idle';
            } else {
                if (!goal && now >= waitUntil) goal = pickGoal();
                if (goal) {
                    goal = clamp(goal);
                    const dx = goal.x - current.x;
                    const dy = goal.y - current.y;
                    const distance = Math.hypot(dx, dy);
                    const step = 55 * delta;
                    if (distance <= step) {
                        current = goal;
                        goal = null;
                        waitUntil = now + 2500 + Math.random() * 2500;
                        element.dataset.motion = 'idle';
                    } else {
                        element.dataset.motion = dx < 0 ? 'left' : 'right';
                        current = { x: current.x + dx / distance * step, y: current.y + dy / distance * step };
                    }
                } else {
                    element.dataset.motion = 'idle';
                    if (now >= waitUntil) waitUntil = now + 2000;
                }
            }
            draw();
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('pointermove', track);
        };
    }, [ref, open, hidden, quiet, sleeping, position, page, modalOpen, compact]);
    return modalOpen;
}

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../auth/reducers/store';
import { userApi } from '../api/axios';
import { reservationNotice } from './alpharkingReservationNotice';

const readToken = () => localStorage.getItem('token') ?? '';
const subscribe = (callback: () => void) => {
    window.addEventListener('storage', callback);
    return () => window.removeEventListener('storage', callback);
};
const tips = [
    '빈자리가 궁금하면 저에게 물어보세요!',
    '주차 이용 방법은 챗봇의 빠른 질문에서 확인할 수 있어요.',
    '새로운 공지사항이 있는지 확인해 보세요.'
];
type Announcement = { token: string; text: string; reservation: boolean; expires: number };

export function useAlpharkingAnnouncements(enabled: boolean) {
    useSelector((state: RootState) => state.auth.token);
    const token = useSyncExternalStore(subscribe, readToken, () => '');
    const [notice, setNotice] = useState<Announcement | null>(null);
    const personal = useRef<{ token: string; text: string | null; ready: boolean }>({ token: '', text: null, ready: false });
    const shown = useRef(false);
    const lastShown = useRef(0);
    const tipIndex = useRef(0);
    const greeted = useRef(false);

    useEffect(() => {
        const controller = new AbortController();
        let active = true;
        shown.current = false;
        greeted.current = false;
        lastShown.current = Date.now();
        personal.current = { token, text: null, ready: !token };
        setNotice(null);
        if (token) {
            // 로그인한 본인의 전체 예약 API를 사용하며 최근 50건 제한에 의한 누락을 피합니다.
            void userApi.get<unknown>(' ', { signal: controller.signal, timeout: 10000 })
                .then(({ data }) => {
                    if (active && readToken() === token) personal.current = { token, text: reservationNotice(data), ready: true };
                }).catch(() => {
                    // 실패를 '예약 없음'으로 단정하지 않고 개인 안내만 생략합니다.
                    if (active) personal.current = { token, text: null, ready: true };
                });
        }
        return () => { active = false; controller.abort(); };
    }, [token]);

    useEffect(() => {
        if (!enabled) { setNotice(null); return; }
        const timer = window.setInterval(() => {
            const now = Date.now();
            setNotice((previous) => previous && previous.expires > now ? previous : null);
            const pending = personal.current;
            if (!pending.ready || pending.token !== token || document.visibilityState !== 'visible') return;
            if (!shown.current && pending.text && now - lastShown.current >= 5000) {
                shown.current = true;
                greeted.current = true;
                lastShown.current = now;
                setNotice({ token, text: pending.text, reservation: true, expires: now + 7000 });
            } else if (now - lastShown.current >= (greeted.current ? 90000 : 6000)) {
                greeted.current = true;
                lastShown.current = now;
                setNotice({ token, text: tips[tipIndex.current++ % tips.length], reservation: false, expires: now + 7000 });
            }
        }, 1000);
        return () => window.clearInterval(timer);
    }, [enabled, token]);

    return {
        announcement: enabled && notice?.token === token ? notice : null,
        dismiss: () => setNotice(null)
    };
}

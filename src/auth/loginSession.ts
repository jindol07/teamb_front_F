import { v4 as uuidv4 } from 'uuid';

const LOGIN_SESSION_KEY = 'alpharking_login_session';

// 로그인마다 생성하며, JWT 재발급 시에는 기존 구분값을 유지합니다.
export function startLoginSession(): void {
    localStorage.setItem(LOGIN_SESSION_KEY, uuidv4());
}

export function clearLoginSession(): void {
    localStorage.removeItem(LOGIN_SESSION_KEY);
}

export function readLoginSession(): string {
    return localStorage.getItem('token')
        ? localStorage.getItem(LOGIN_SESSION_KEY) ?? ''
        : '';
}

export function isCurrentLoginSession(session: string): boolean {
    return session !== '' && readLoginSession() === session;
}

export function subscribeLoginSession(notify: () => void): () => void {
    window.addEventListener('storage', notify);
    window.addEventListener('parking-auth-changed', notify);
    return () => {
        window.removeEventListener('storage', notify);
        window.removeEventListener('parking-auth-changed', notify);
    };
}

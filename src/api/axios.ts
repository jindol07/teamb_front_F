import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { clearLoginSession } from '../auth/loginSession';

export type AuthScope = 'user' | 'admin';

const USER_API_BASE_URL = (
    import.meta.env.VITE_BOOT_API_BASE_URL_U /*|| 'http://localhost/alpharking'*/
).replace(/\/+$/, '');

const ADMIN_API_BASE_URL = (
    import.meta.env.VITE_BOOT_API_BASE_URL_A || 'http://localhost:81/alpharking/admin'
).replace(/\/+$/, '');

// 사용자 백엔드 (80번 포트)
export const userApi = axios.create({
    baseURL: USER_API_BASE_URL,
});

// 관리자 백엔드 (81번 포트)
export const adminApi = axios.create({
    baseURL: ADMIN_API_BASE_URL,
});

// 기존 공지 API(api)에서 사용하는 사용자 백엔드 인스턴스 (하위 호환)
export const api = userApi;

// =========================
// 토큰 저장소 / 공통 인증
// =========================

export const ACCESS_TOKEN_KEY = 'token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const AUTH_SCOPE_KEY = 'auth_scope';

export function getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function getTokenRole(token: string): string | null {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    try {
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(
            base64.length + ((4 - (base64.length % 4)) % 4),
            '=',
        );
        const payload = JSON.parse(window.atob(padded)) as { role?: unknown };
        return typeof payload.role === 'string' ? payload.role : null;
    } catch {
        return null;
    }
}

/** 현재 저장된 세션이 사용자용인지 관리자용인지 반환한다. */
export function getAuthScope(): AuthScope | null {
    const stored = localStorage.getItem(AUTH_SCOPE_KEY);
    if (stored === 'user' || stored === 'admin') return stored;

    const token = getAccessToken();
    if (!token) return null;

    const role = getTokenRole(token);
    if (role === 'ADMIN') return 'admin';
    if (role === 'OFFICE') return 'user';
    return null;
}

export function notifyAuthChanged(): void {
    window.dispatchEvent(new Event('parking-auth-changed'));
}

/** 로그인/refresh 성공 시 토큰과 세션 종류를 함께 저장한다. */
export function saveTokens(
    accessToken: string,
    refreshToken?: string | null,
    scope: AuthScope = 'user',
): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

    if (typeof refreshToken === 'string' && refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    localStorage.setItem(AUTH_SCOPE_KEY, scope);
    notifyAuthChanged();
}

/** 로그아웃/refresh 실패 시 세션을 완전히 제거한다. */
export function clearSession(): void {
    clearLoginSession();
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_SCOPE_KEY);
    localStorage.removeItem('username');
    notifyAuthChanged();
}

let redirectingToLogin = false;

/** refresh 토큰까지 무효면 현재 화면에 맞는 로그인 페이지로 보낸다. */
export function redirectToLogin(): void {
    if (redirectingToLogin) return;
    redirectingToLogin = true;

    const { pathname, search } = window.location;
    const isAdmin = pathname.startsWith('/admin');
    const loginPath = isAdmin ? '/admin/login' : '/user/login';
    const normalizedPath = pathname.replace(/\/+$/, '') || '/';

    // refresh할 수 없는 세션이므로 access 토큰을 반드시 제거한다.
    // 토큰을 남겨두면 로그인 페이지가 즉시 보호 페이지로 되돌려
    // 401 -> 로그인 -> 401 무한 새로고침이 발생한다.
    clearSession();

    if (normalizedPath === loginPath) {
        redirectingToLogin = false;
        return;
    }

    const redirect = encodeURIComponent(`${pathname}${search}`);
    window.location.assign(`${loginPath}?redirect=${redirect}`);
}

type RefreshResponse = {
    access_token?: string;
    refresh_token?: string;
};

async function requestNewAccessToken(scope: AuthScope): Promise<string | null> {
    if (getAuthScope() !== scope) return null;

    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    const baseUrl = scope === 'admin' ? ADMIN_API_BASE_URL : USER_API_BASE_URL;

    try {
        const response = await axios.post<RefreshResponse>(
            `${baseUrl}/api/auth/refresh`,
            { refresh_token: refreshToken },
            { headers: { 'Content-Type': 'application/json' } },
        );

        const accessToken = response.data?.access_token;
        const nextRefreshToken = response.data?.refresh_token;

        if (typeof accessToken !== 'string' || !accessToken) {
            throw new Error('refresh 응답에 access_token이 없습니다.');
        }

        // refresh 중 로그아웃/재로그인/scope 변경이 있었으면 결과를 버린다.
        if (getAuthScope() !== scope || getRefreshToken() !== refreshToken) {
            return null;
        }

        saveTokens(accessToken, nextRefreshToken, scope);
        return accessToken;
    } catch (error) {
        // 네트워크 오류/5xx는 세션을 지우지 않는다. 다음 요청에서 다시 시도할 수 있다.
        if (axios.isAxiosError(error) && error.response) {
            const status = error.response.status;
            const sessionChanged =
                getAuthScope() !== scope || getRefreshToken() !== refreshToken;

            // 다른 탭이 먼저 rotation했거나 로그아웃한 경우에는
            // 이 요청의 실패로 현재 세션을 지우지 않는다.
            if (!sessionChanged && (status === 400 || status === 401 || status === 403)) {
                clearSession();
            }
        }
        return null;
    }
}

const refreshPromises: Record<AuthScope, Promise<string | null> | null> = {
    user: null,
    admin: null,
};

/** 동시에 여러 요청이 401을 받아도 scope별 refresh는 1회만 수행한다. */
function refreshForScope(scope: AuthScope): Promise<string | null> {
    if (getAuthScope() !== scope) return Promise.resolve(null);

    if (!refreshPromises[scope]) {
        refreshPromises[scope] = requestNewAccessToken(scope).finally(() => {
            refreshPromises[scope] = null;
        });
    }

    return refreshPromises[scope]!;
}

/** 사용자(U) access 토큰 재발급. */
export function refreshAccessToken(): Promise<string | null> {
    return refreshForScope('user');
}

/** 관리자(A) access 토큰 재발급. */
export function refreshAdminAccessToken(): Promise<string | null> {
    return refreshForScope('admin');
}

/**
 * native fetch용 사용자 공통 래퍼.
 * 기존 fetch 코드의 옵션(AbortSignal, FormData, credentials)을 그대로 유지한다.
 */

/**
 * native fetch용 사용자 공통 래퍼.
 * 1. 요청 전 토큰 만료 임박 여부 확인
 * 2. 필요하면 사전 갱신
 * 3. 401 발생 시 다른 요청의 갱신 여부 확인
 * 4. 필요하면 갱신 후 원 요청을 1회 재시도
 */
export async function authFetch(
    input: RequestInfo | URL,
    init: RequestInit = {},
): Promise<Response> {
    const fetchWithToken = (accessToken: string | null): Promise<Response> => {
        const headers = new Headers(
            input instanceof Request ? input.headers : undefined
        );

        new Headers(init.headers).forEach((value, key) => {
            headers.set(key, value);
        });

        if (accessToken) {
            headers.set('Authorization', `Bearer ${accessToken}`);
        } else {
            headers.delete('Authorization');
        }

        return fetch(input, { ...init, headers });
    };

    const requestUrl =
        input instanceof Request ? input.url : String(input);

    let accessTokenUsed = getAccessToken();

    // 1. 사용자 세션이고 토큰 만료가 임박했다면 요청 전에 갱신
    if (
        getAuthScope() === 'user' &&
        accessTokenUsed &&
        getRefreshToken() &&
        !isAuthEndpoint(requestUrl) &&
        isTokenExpiringSoon(accessTokenUsed)
    ) {
        const refreshedToken = await refreshAccessToken();

        if (refreshedToken) {
            accessTokenUsed = refreshedToken;
        }
    }

    // 2. 현재 토큰으로 요청
    const response = await fetchWithToken(accessTokenUsed);

    if (response.status !== 401) {
        return response;
    }

    // 3. 관리자 세션은 사용자 refresh로 갱신하지 않음
    if (getAuthScope() !== 'user' || isAuthEndpoint(requestUrl)) {
        return response;
    }

    // 4. 다른 요청이 이미 토큰을 갱신했는지 확인
    const currentToken = getAccessToken();

    let newAccessToken: string | null = null;

    if (currentToken && currentToken !== accessTokenUsed) {
        // 기존 요청의 401이 늦게 도착한 경우
        // 이미 저장된 새 토큰으로 재시도
        newAccessToken = currentToken;
    } else {
        // 다른 요청이 갱신하지 않았다면 직접 갱신
        if (!getRefreshToken()) {
            redirectToLogin();
            return response;
        }

        newAccessToken = await refreshAccessToken();
    }

    if (!newAccessToken) {
        if (!getRefreshToken()) {
            redirectToLogin();
        }

        return response;
    }

    // 5. 새 토큰으로 딱 한 번 재시도
    // 재시도에서도 401이면 그대로 반환하여 무한 반복 방지
    return fetchWithToken(newAccessToken);
}


// =========================
// JWT 인증 토큰 자동 추가
// =========================

const AUTH_ENDPOINTS = [
    '/api/auth/login',
    '/api/auth/refresh',
    '/api/auth/logout',
];

function isAuthEndpoint(url?: string): boolean {
    if (!url) return false;
    return AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

// 사용자 API 요청 시 JWT 첨부
userApi.interceptors.request.use(
    async (config) => {
        let token = localStorage.getItem('token');
        const refreshToken = getRefreshToken();

        // 인증 관련 API는 사전 갱신 대상에서 제외
        if (
            getAuthScope() === 'user' &&
            token &&
            refreshToken &&
            !isAuthEndpoint(config.url) &&
            isTokenExpiringSoon(token)
        ) {
            const newAccessToken = await refreshAccessToken();

            if (newAccessToken) {
                token = newAccessToken;
            }
        }

        if (token) {
            config.headers.set('Authorization', `Bearer ${token}`);
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// // 관리자 API 요청 시 JWT 첨부
// adminApi.interceptors.request.use((config) => {
//     const token = getAccessToken();

//     if (token) {
//         config.headers.set('Authorization', `Bearer ${token}`);
//     }

//     return config;
// });

adminApi.interceptors.request.use(
    async (config) => {
        let token = localStorage.getItem('token');
        const refreshToken = getRefreshToken();

        // 인증 관련 API는 사전 갱신 대상에서 제외
        if (
            getAuthScope() === 'user' &&
            token &&
            refreshToken &&
            !isAuthEndpoint(config.url) &&
            isTokenExpiringSoon(token)
        ) {
            const newAccessToken = await refreshAccessToken();

            if (newAccessToken) {
                token = newAccessToken;
            }
        }

        if (token) {
            config.headers.set('Authorization', `Bearer ${token}`);
        }

        return config;
    },
    (error) => Promise.reject(error)
);



type RetryableRequestConfig = InternalAxiosRequestConfig & {
    _retry?: boolean;
};

// 사용자 API 401 → 사용자 refresh → 원 요청 1회 재시도
userApi.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const config = error.config as RetryableRequestConfig | undefined;

        if (!config || error.response?.status !== 401) {
            return Promise.reject(error);
        }

        if (config._retry || isAuthEndpoint(config.url)) {
            return Promise.reject(error);
        }

        // 관리자 토큰을 사용자 refresh로 갱신하지 않는다.
        if (getAuthScope() === 'admin') {
            return Promise.reject(error);
        }

        config._retry = true;
        const newAccessToken = await refreshAccessToken();

        if (!newAccessToken) {
            if (!getRefreshToken()) {
                redirectToLogin();
            }
            return Promise.reject(error);
        }

        // request interceptor가 localStorage의 새 토큰을 다시 첨부한다.
        return userApi.request(config);
    },
);

// 관리자 API 401 → 관리자 refresh → 원 요청 1회 재시도
adminApi.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const config = error.config as RetryableRequestConfig | undefined;

        if (!config || error.response?.status !== 401) {
            return Promise.reject(error);
        }

        if (config._retry || isAuthEndpoint(config.url)) {
            return Promise.reject(error);
        }

        // 사용자 토큰을 관리자 refresh로 갱신하지 않는다.
        if (getAuthScope() !== 'admin') {
            return Promise.reject(error);
        }

        config._retry = true;

        const newAccessToken = await refreshAdminAccessToken();

        if (!newAccessToken) {
            if (!getRefreshToken()) {
                redirectToLogin();
            }
            return Promise.reject(error);
        }

        return adminApi.request(config);
    },
);


/**
 * 액세스 토큰의 만료가 임박했는지 확인
 * 만료까지 30초 이하이면 true 반환
 */
const isTokenExpiringSoon = (token: string): boolean => {
    try {
        const payload = token.split('.')[1];

        if (!payload) {
            return true;
        }

        const base64 = payload
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const decoded = JSON.parse(
            atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
        );

        if (typeof decoded.exp !== 'number') {
            return true;
        }

        return decoded.exp * 1000 - Date.now() <= 30_000;
    } catch {
        return true;
    }
};
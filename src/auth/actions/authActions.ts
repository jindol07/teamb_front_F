//login/actions/authActions.ts
import axios from 'axios';
import { loginSuccess, loginFailure, logout } from '../reducers/authReducer';
import { AppDispatch } from "../reducers/store";
import { adminApi, clearSession, getRefreshToken, saveTokens, userApi } from '../../api/axios';
import { startLoginSession } from '../loginSession';

// ADMIN ---
export const adminLogin = (username: string, password: string) =>
    async (dispatch: AppDispatch): Promise<boolean> => {

        try {
            const response = await axios.post(
                import.meta.env.VITE_BOOT_API_BASE_URL_A + '/api/auth/login',
                { username, password }
            );

            const token = response.data.access_token;
            const refreshToken = response.data.refresh_token;

            if (typeof token !== 'string' || !token) {
                dispatch(loginFailure('JWT 토큰이 없습니다.'));
                return false;
            }

            if (typeof refreshToken !== 'string' || !refreshToken) {
                dispatch(loginFailure('리프레시 토큰이 없습니다.'));
                return false;
            }

            localStorage.setItem('username', username);
            // 관리자 세션임을 명시해 사용자 refresh와 섞이지 않게 한다.
            startLoginSession();
            saveTokens(token, refreshToken, 'admin');

            dispatch(loginSuccess({ username, token }));

            return true;

        } catch (error) {
            if (axios.isAxiosError(error)) {
                dispatch(loginFailure('로그인에 실패했습니다.'));
            } else {
                dispatch(loginFailure('알 수 없는 오류가 발생했습니다.'));
            }

            return false;
        }
    };
export const adminLogoutAction = () => async (dispatch: AppDispatch) => {
    const refreshToken = getRefreshToken();

    // 로그인 페이지로 이동하기 전에 로컬 세션을 먼저 제거한다.
    // 토큰이 남아 있으면 로그인 화면이 즉시 관리자 페이지로 되돌린다.
    clearSession();
    dispatch(logout());

    try {
        // refresh 토큰이 있을 때만 관리자 서버에 폐기를 요청한다.
        if (refreshToken) {
            await axios.post(
                import.meta.env.VITE_BOOT_API_BASE_URL_A + '/api/auth/logout',
                { refresh_token: refreshToken }
            );
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
};

export const getAdmin = async (/*dispatch: AppDispatch*/) => {
    try {
        const token = localStorage.getItem('token');

        if (typeof token !== 'string' || !token) {
            return null;
        }

        // adminApi를 사용해야 401 refresh interceptor가 동작한다.
        const response = await adminApi.get('/api/auth/admin');
        return response;

    } catch (error) {
        if (axios.isAxiosError(error)) {
            // 401 refresh/로그인 이동은 adminApi interceptor가 처리한다.
        }

        return null;
    }
};


// USER ---
export const login = (username: string, password: string) =>
    async (dispatch: AppDispatch): Promise<boolean> => {

        try {
            const response = await axios.post(
                import.meta.env.VITE_BOOT_API_BASE_URL_U + '/api/auth/login',
                { username, password }
            );

            const token = response.data.access_token;
            const refreshToken = response.data.refresh_token;

            if (typeof token !== 'string' || !token) {
                dispatch(loginFailure('JWT 토큰이 없습니다.'));
                return false;
            }

            if (typeof refreshToken !== 'string' || !refreshToken) {
                dispatch(loginFailure('리프레시 토큰이 없습니다.'));
                return false;
            }

            localStorage.setItem('username', username);
            // access/refresh 토큰을 함께 저장하고 웹소켓에 변경을 알린다.
            startLoginSession();
            saveTokens(token, refreshToken, 'user');

            dispatch(loginSuccess({ username, token }));

            return true;

        } catch (error) {
            if (axios.isAxiosError(error)) {
                dispatch(loginFailure('로그인에 실패했습니다.'));
            } else {
                dispatch(loginFailure('알 수 없는 오류가 발생했습니다.'));
            }

            return false;
        }
    };
export const logoutAction = () => async (dispatch: AppDispatch) => {
    const refreshToken = getRefreshToken();

    // 로그인 페이지로 이동하기 전에 로컬 세션을 먼저 제거한다.
    clearSession();
    dispatch(logout());

    try {
        // refresh 토큰이 있을 때만 서버 폐기 요청을 보낸다.
        if (refreshToken) {
            await axios.post(
                import.meta.env.VITE_BOOT_API_BASE_URL_U + '/api/auth/logout',
                { refresh_token: refreshToken }
            );
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
};

export const getOffice = async (/*dispatch: AppDispatch*/) => {
    try {
        const token = localStorage.getItem('token');

        if (typeof token !== 'string' || !token) {
            return null;
        }

        // raw axios 대신 userApi를 사용해야 401 refresh interceptor가 동작한다.
        const response = await userApi.get('/api/auth/office');
        return response;

    } catch (error) {
        if (axios.isAxiosError(error)) {
            // 401 refresh/로그인 이동은 axios interceptor가 처리한다.
        }

        return null;
    }
};

export type signupData = {
    username: string,
	password: string,
	password_confirm: string,
	email: string,
	email_code: string,
	phone: string,
	company_id: number,
    floor_no: number,
	office_number: string,
	verification_code: string,
	vehicle_list: Vehicle[],

    company_company_name: string,
    company_business_number: string,
    company_company_addr: string,
}
export interface Vehicle {
    vehicle_number: string,
    owner_name: string,
    vehicle_type_code: string,
}

export const officeSignup = async (signupData: signupData) => {
    try {
        const response = await axios.post(
            import.meta.env.VITE_BOOT_API_BASE_URL_U + '/api/auth/signup',
            signupData
        );
        return response;

    } catch (error) {
        console.log(error);
        return null;
    }
};

export const checkUsername = async (username: string) => {
    try {
        const response = await axios.get(
            import.meta.env.VITE_BOOT_API_BASE_URL_U + '/api/auth/check-username?username=' + username,
        );

        return response.data;

    } catch (error) {
        console.log(error);
        return null;
    }
};

// email
export interface EmailVerificationResponse {
    success: boolean;
    reason: string;
}

const getEmailVerificationError = (
    error: unknown,
    fallbackReason: string
): EmailVerificationResponse => {
    if (
        axios.isAxiosError<EmailVerificationResponse>(error) &&
        error.response?.data
    ) {
        return error.response.data;
    }

    return { success: false, reason: fallbackReason };
};

export const sendEmailVerificationCode = async (
    email: string
): Promise<EmailVerificationResponse> => {
    try {
        const response = await axios.post<EmailVerificationResponse>(
            import.meta.env.VITE_BOOT_API_BASE_URL_U + '/api/auth/email/send',
            { email: email.trim() }
        );

        return response.data;
    } catch (error) {
        return getEmailVerificationError(error, 'send_failed');
    }
};

export const verifyEmailVerificationCode = async (
    email: string,
    code: string
): Promise<EmailVerificationResponse> => {
    try {
        const response = await axios.post<EmailVerificationResponse>(
            import.meta.env.VITE_BOOT_API_BASE_URL_U + '/api/auth/email/verify',
            { email: email.trim(), code: code.trim() }
        );

        return response.data;
    } catch (error) {
        return getEmailVerificationError(error, 'verify_failed');
    }
};

// ---------------------------------------------------------------------------
// 네이버 로그인 (회원가입 없이 기존 회원만 로그인)
// ---------------------------------------------------------------------------
export type NaverLoginResult =
    | { ok: true; accessToken: string; refreshToken: string }
    | { ok: false; message: string };

/**
 * 네이버 인증 페이지로 이동한다.
 * authorize URL과 state는 서버가 만들어(인가 코드 노출 방지),
 * 브라우저는 그 주소로 이동만 한다.
 */
export const startNaverLogin = async (): Promise<{ ok: true } | { ok: false; message: string }> => {
    try {
        const response = await axios.get(
            import.meta.env.VITE_BOOT_API_BASE_URL_U + '/api/auth/naver/authorize'
        );

        const authorizeUrl = response.data?.authorize_url;
        if (typeof authorizeUrl !== 'string' || !authorizeUrl) {
            return { ok: false, message: '네이버 로그인 주소를 가져오지 못했습니다.' };
        }

        window.location.assign(authorizeUrl);
        return { ok: true };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const data = error.response?.data as { message?: string } | undefined;
            if (data && typeof data.message === 'string' && data.message) {
                return { ok: false, message: data.message };
            }
        }
        return {
            ok: false,
            message: '네이버 로그인을 시작하지 못했습니다. 잠시 후 다시 시도해주세요.',
        };
    }
};

/** 콜백으로 받은 code/state를 서버에 넘겨 우리 서비스 토큰을 발급받는다. */
export const naverLogin = async (code: string, state: string): Promise<NaverLoginResult> => {
    try {
        const response = await axios.post(
            import.meta.env.VITE_BOOT_API_BASE_URL_U + '/api/auth/naver/login',
            { code, state }
        );

        const accessToken = response.data?.access_token;
        const refreshToken = response.data?.refresh_token;

        if (typeof accessToken !== 'string' || !accessToken) {
            return { ok: false, message: '로그인 토큰을 받지 못했습니다.' };
        }
        if (typeof refreshToken !== 'string' || !refreshToken) {
            return { ok: false, message: '로그인 토큰을 받지 못했습니다.' };
        }

        return { ok: true, accessToken, refreshToken };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const data = error.response?.data as { message?: string } | undefined;
            if (data && typeof data.message === 'string' && data.message) {
                return { ok: false, message: data.message };
            }
        }
        return { ok: false, message: '네이버 로그인에 실패했습니다.' };
    }
};

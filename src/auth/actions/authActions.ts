//login/actions/authActions.ts
import axios from 'axios';
import { loginSuccess, loginFailure, logout } from '../reducers/authReducer';
import { AppDispatch } from "../reducers/store";

// ADMIN ---
export const adminLogin = (username: string, password: string) =>
    async (dispatch: AppDispatch): Promise<boolean> => {

        try {
            const response = await axios.post(
                import.meta.env.VITE_BOOT_API_BASE_URL_A + '/api/auth/login',
                { username, password }
            );

            console.log(response);

            const token = response.data.accessToken;

            if (typeof token !== 'string' || !token) {
                dispatch(loginFailure('JWT 토큰이 없습니다.'));
                return false;
            }
            console.log(token);

            localStorage.setItem('token', token);
            localStorage.setItem('username', username);
            // 주차 웹소켓에 토큰 변경을 알린다. 토큰 값은 이벤트에 담지 않는다.
            window.dispatchEvent(new Event('parking-auth-changed'));

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
    // 로컬 스토리지에서 토큰 제거
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    // 주차 웹소켓에 토큰 변경을 알린다. 토큰 값은 이벤트에 담지 않는다.
    window.dispatchEvent(new Event('parking-auth-changed'));
    
    try {
        //백앤드로 로그 아웃 요청
        await axios.get(import.meta.env.VITE_BOOT_API_BASE_URL_A + '/api/auth/logout');

        // Redux 상태 업데이트
        dispatch(logout());
    } catch (error) {
        console.error('Logout error:', error);
    }
};

export const getAdmin = async (/*dispatch: AppDispatch*/) => {
    try {
        const token = localStorage.getItem('token');

        const response = await axios.get(
            import.meta.env.VITE_BOOT_API_BASE_URL_A + '/api/auth/admin',
             {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );


        if (typeof token !== 'string' || !token) {
            // dispatch(loginFailure('JWT 토큰이 없습니다.'));
            return null;
        }

        // dispatch(loginSuccess({ username, token }));

        return response;

    } catch (error) {
        if (axios.isAxiosError(error)) {
            // dispatch(loginFailure('로그인에 실패했습니다.'));
        } else {
            // dispatch(loginFailure('알 수 없는 오류가 발생했습니다.'));
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
            console.log(response);

            if (typeof token !== 'string' || !token) {
                dispatch(loginFailure('JWT 토큰이 없습니다.'));
                return false;
            }
            console.log(token);

            localStorage.setItem('token', token);
            localStorage.setItem('username', username);
            // 주차 웹소켓에 토큰 변경을 알린다. 토큰 값은 이벤트에 담지 않는다.
            window.dispatchEvent(new Event('parking-auth-changed'));

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
    // 로컬 스토리지에서 토큰 제거
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    // 주차 웹소켓에 토큰 변경을 알린다. 토큰 값은 이벤트에 담지 않는다.
    window.dispatchEvent(new Event('parking-auth-changed'));

    try {
        //백앤드로 로그 아웃 요청
        await axios.get(import.meta.env.VITE_BOOT_API_BASE_URL_U + '/api/auth/logout');
        // Redux 상태 업데이트
        dispatch(logout());
    } catch (error) {
        console.error('Logout error:', error);
    }
};

export const getOffice = async (/*dispatch: AppDispatch*/) => {
    try {
        const token = localStorage.getItem('token');

        const response = await axios.get(
            import.meta.env.VITE_BOOT_API_BASE_URL_U + '/api/auth/office',
             {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );


        if (typeof token !== 'string' || !token) {
            // dispatch(loginFailure('JWT 토큰이 없습니다.'));
            return null;
        }

        // dispatch(loginSuccess({ username, token }));

        return response;

    } catch (error) {
        if (axios.isAxiosError(error)) {
            // dispatch(loginFailure('로그인에 실패했습니다.'));
        } else {
            // dispatch(loginFailure('알 수 없는 오류가 발생했습니다.'));
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
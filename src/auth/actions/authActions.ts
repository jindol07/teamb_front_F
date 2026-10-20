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
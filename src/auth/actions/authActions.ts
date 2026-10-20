//login/actions/authActions.ts
import axios from 'axios';
import { loginSuccess, loginFailure, logout } from '../reducers/authReducer';
import { AppDispatch } from "../reducers/store";

// ADMIN ---
export const adminLogin = (username: string, password: string) =>
    async (dispatch: AppDispatch): Promise<boolean> => {

        try {
            const response = await axios.post(
                'http://localhost:81/alpharking/admin/api/auth/login',
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
    
    try {
        //백앤드로 로그 아웃 요청
        await axios.get('http://localhost:81/alpharking/admin/api/auth/logout');

        // Redux 상태 업데이트
        dispatch(logout());
    } catch (error) {
        console.error('Logout error:', error);
    }
};


// USER ---
export const login = (username: string, password: string) =>
    async (dispatch: AppDispatch): Promise<boolean> => {

        try {
            const response = await axios.post(
                'http://localhost:80/alpharking/api/auth/login',
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

    try {
        //백앤드로 로그 아웃 요청
        await axios.get('http://localhost:80/alpharking/api/auth/logout');
        // Redux 상태 업데이트
        dispatch(logout());
    } catch (error) {
        console.error('Logout error:', error);
    }
};











const fakeApiLogin = (username: string, password: string): Promise<{ data: { token: string } }> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (username === 'test' && password === '11') {
                resolve({ data: { token: 'fake-jwt-token2' } });
            } else {
                reject(new Error('Invalid credentials'));
            }
        }, 1000);
    });
};

import axios from 'axios';

// 사용자 백엔드 (80번 포트)
export const userApi = axios.create({
    baseURL: import.meta.env.VITE_BOOT_API_BASE_URL_U,
});

// 관리자 백엔드 (81번 포트)
export const adminApi = axios.create({
    baseURL: import.meta.env.VITE_BOOT_API_BASE_URL_A,
});

userApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');

    console.log('accessToken:', localStorage.getItem('token'));
    console.log('localStorage 전체:', Object.keys(localStorage));

    console.log('[Axios] 요청 URL:', config.baseURL, config.url);
    console.log('[Axios] 토큰 존재 여부:', !!token);

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});
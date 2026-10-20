
import axios from 'axios';

// 사용자 백엔드 (80번 포트)
export const userApi = axios.create({
    baseURL: import.meta.env.VITE_BOOT_API_BASE_URL_U,
});

// 관리자 백엔드 (81번 포트)
export const adminApi = axios.create({
    baseURL: import.meta.env.VITE_BOOT_API_BASE_URL_A,
});

// =========================
// JWT 인증 토큰 자동 추가
// =========================

// 사용자 API 요청 시 JWT 첨부
userApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');

    if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
    }

    return config;
});

// 관리자 API 요청 시 JWT 첨부
adminApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');

    if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
    }

    return config;
});

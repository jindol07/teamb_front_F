
import axios from 'axios';

// 사용자 백엔드 (80번 포트)
export const api = axios.create({
    baseURL: import.meta.env.VITE_BOOT_API_BASE_URL_U,
});

// 관리자 백엔드 (81번 포트)
export const adminApi = axios.create({
    baseURL: import.meta.env.VITE_BOOT_API_BASE_URL_A,
});

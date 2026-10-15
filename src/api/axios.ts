import axios from 'axios';
// 사용자 서버 (JPA)
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});
// 관리자 서버 (MyBatis)
export const adminApi = axios.create({
    baseURL: import.meta.env.VITE_ADMIN_API_URL,
});

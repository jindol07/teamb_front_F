import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Vite 공식 문서: https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0', //localhost, 127.0.0.1, 사설ip 허용
        port: 3000,
        open: true,
    },
});

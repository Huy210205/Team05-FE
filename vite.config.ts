import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'exceljs-vendor': ['exceljs'],
                },
            },
        },
    },
    server: {
        port: 5173,
        strictPort: true, // Không tự động tìm port khác nếu 5173 bị chiếm
        proxy: {
            '/api': 'http://localhost:7000',
        },
    },
    // Cấu hình để hỗ trợ SPA routing - tất cả routes sẽ fallback về index.html
    preview: {
        port: 5173,
    },
});

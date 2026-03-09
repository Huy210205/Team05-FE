// src/shared/api/http.ts
import axios, { AxiosError } from 'axios';
import { ensureValidToken, keycloak } from '../../keycloak';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000', // fallback nếu không có env
    timeout: 120000, // 120 seconds for AI chat (Cohere + Qdrant + RAG can be slow)
});

// Cooldown để tránh spam toast (5 giây)
let lastNetworkErrorToastTime = 0;
const TOAST_COOLDOWN_MS = 5000;

// Track nếu modal đã được hiển thị để tránh spam modal
let backendErrorModalShown = false;

// Helper để kiểm tra lỗi mạng
function isNetworkError(error: AxiosError): boolean {
    return (
        error.code === 'ERR_NETWORK' ||
        error.code === 'ERR_FAILED' ||
        error.code === 'ECONNABORTED' ||
        error.message?.includes('timeout') ||
        error.message?.includes('Network Error')
    );
}

// Helper để hiển thị toast cảnh báo với cooldown
function showNetworkErrorToast() {
    const now = Date.now();
    if (now - lastNetworkErrorToastTime < TOAST_COOLDOWN_MS) {
        return; // Skip toast nếu chưa đủ cooldown
    }
    lastNetworkErrorToastTime = now;

    // Dispatch custom event để toast provider có thể hiển thị
    const event = new CustomEvent('backend-network-error', {
        detail: {
            message: 'Không thể kết nối đến máy chủ',
            description: 'Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.',
        },
    });
    window.dispatchEvent(event);
}

// Helper để hiển thị modal backend error
function showBackendErrorModal() {
    const event = new CustomEvent('backend-unavailable', {});
    window.dispatchEvent(event);
}

// ========== REQUEST INTERCEPTOR ==========
api.interceptors.request.use(async (config) => {
    const token = await ensureValidToken(30);
    
    if (token) {
        if (!config.headers) {
            config.headers = {} as any;
        }
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// ========== RESPONSE INTERCEPTOR ==========
api.interceptors.response.use(
    (res) => res,
    async (err: AxiosError<any>) => {
        const status = err.response?.status;

        // Xử lý lỗi mạng
        if (isNetworkError(err)) {
            // Hiển thị toast cảnh báo (với cooldown)
            showNetworkErrorToast();
            
            // Hiển thị modal nếu backend không khả dụng (chỉ lần đầu tiên)
            if (!backendErrorModalShown) {
                backendErrorModalShown = true;
                showBackendErrorModal();
            }
            
            return Promise.reject(err);
        }

        if (status === 401) {
            try {
                await keycloak.login();
            } catch (loginError) {
            }
        }

        // Format error message from backend
        if (err.response?.data) {
            const backendMessage = err.response.data.message || err.response.data.error;
            if (backendMessage) {
                err.message = backendMessage;
            }
        }

        return Promise.reject(err);
    },
);

export default api;

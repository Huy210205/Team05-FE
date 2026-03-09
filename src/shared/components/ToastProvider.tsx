import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type Toast = {
    id: string;
    title?: string;
    description?: string;
    variant?: 'success' | 'error' | 'info';
    durationMs?: number;
};

type ToastContextValue = {
    show: (toast: Omit<Toast, 'id'>) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    // Track recently shown toasts to prevent duplicate spam within a short window
    const recentMapRef = React.useRef<Map<string, number>>(new Map());

    const show = useCallback((t: Omit<Toast, 'id'>) => {
        const key = `${t.variant ?? 'info'}|${t.title ?? ''}|${t.description ?? ''}`;
        const now = Date.now();
        const lastShown = recentMapRef.current.get(key) ?? 0;
        // Ignore duplicates within 3 seconds
        if (now - lastShown < 3000) {
            return;
        }
        recentMapRef.current.set(key, now);

        const id = String(now + Math.random());
        const toast: Toast = { id, durationMs: 3000, variant: 'info', ...t };
        setToasts((prev) => [...prev, toast]);
        const timeout = setTimeout(() => {
            setToasts((prev) => prev.filter((x) => x.id !== id));
        }, toast.durationMs);
        return () => clearTimeout(timeout);
    }, []);

    // Lắng nghe event từ http interceptor để hiển thị toast lỗi mạng
    React.useEffect(() => {
        const handleNetworkError = (event: CustomEvent) => {
            show({
                title: event.detail?.message || 'Không thể kết nối đến máy chủ',
                description: event.detail?.description || 'Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.',
                variant: 'error',
                durationMs: 5000,
            });
        };

        window.addEventListener('backend-network-error', handleNetworkError as EventListener);

        return () => {
            window.removeEventListener('backend-network-error', handleNetworkError as EventListener);
        };
    }, [show]);

    const value = useMemo(() => ({ show }), [show]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="fixed bottom-4 right-4 z-[60] space-y-2">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`min-w-[260px] max-w-sm rounded-lg border bg-white shadow-lg overflow-hidden ${
                            t.variant === 'success'
                                ? 'border-emerald-200'
                                : t.variant === 'error'
                                  ? 'border-rose-200'
                                  : 'border-gray-200'
                        }`}
                    >
                        <div className="px-3 py-2">
                            {t.title && <div className="text-sm font-medium">{t.title}</div>}
                            {t.description && <div className="text-xs text-gray-600">{t.description}</div>}
                        </div>
                        <div
                            className={`h-1 w-full ${
                                t.variant === 'success'
                                    ? 'bg-emerald-500'
                                    : t.variant === 'error'
                                      ? 'bg-rose-500'
                                      : 'bg-gray-900'
                            }`}
                            style={{ width: '100%' }}
                        />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToastInternal() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('ToastProvider missing');
    return ctx;
}

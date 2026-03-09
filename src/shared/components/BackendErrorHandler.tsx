import { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, LogIn } from 'lucide-react';
import { keycloak } from '../../keycloak';

export default function BackendErrorHandler() {
    const [isBackendUnavailable, setIsBackendUnavailable] = useState(false);

    useEffect(() => {
        const handleBackendUnavailable = () => {
            setIsBackendUnavailable(true);
        };

        window.addEventListener('backend-unavailable', handleBackendUnavailable);

        return () => {
            window.removeEventListener('backend-unavailable', handleBackendUnavailable);
        };
    }, []);

    const handleClose = () => {
        setIsBackendUnavailable(false);
    };

    const handleReload = () => {
        window.location.reload();
    };

    const handleGoToLogin = async () => {
        handleClose();
        try {
            await keycloak.login();
        } catch (error) {
            // Fallback: reload page if login fails
            window.location.reload();
        }
    };

    if (!isBackendUnavailable) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-red-200 max-w-md w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                            <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">Không thể kết nối đến máy chủ</h3>
                                <p className="text-sm text-gray-600 mt-2 whitespace-pre-line leading-relaxed">
                                    Hệ thống không thể kết nối đến máy chủ backend. Vui lòng kiểm tra kết nối mạng hoặc liên hệ quản trị viên.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 p-6 bg-gray-50/50">
                    <button
                        onClick={handleGoToLogin}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
                    >
                        <LogIn size={16} />
                        Về trang đăng nhập
                    </button>
                    <button
                        onClick={handleReload}
                        className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors inline-flex items-center gap-2"
                    >
                        <RefreshCw size={16} />
                        Tải lại trang
                    </button>
                </div>
            </div>
        </div>
    );
}


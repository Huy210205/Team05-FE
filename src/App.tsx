import { BrowserRouter } from 'react-router-dom';
import AppLayout from './app/layout/AppLayout';
import StudentLayout from './app/layout/StudentLayout';
import AppRoutes from './app/routes/AppRoutes';
import { ToastProvider } from './shared/components/ToastProvider';
import { PermissionProvider } from './shared/components/PermissionProvider';
import BackendErrorHandler from './shared/components/BackendErrorHandler';
import { useUserProfile } from './stores/userProfile';
import { useLocation } from 'react-router-dom';
import { appRoutes } from './app/routes/routeConfig';
import { useEffect, useState } from 'react';

function AppContent() {
    const { me, loading, error } = useUserProfile();
    const location = useLocation();
    const [isSlowLoading, setIsSlowLoading] = useState(false);

    useEffect(() => {
        if (!loading) {
            setIsSlowLoading(false);
            return;
        }

        const timer = window.setTimeout(() => {
            setIsSlowLoading(true);
        }, 10000);

        return () => window.clearTimeout(timer);
    }, [loading]);

    // Debug: Log user profile
    // Kiểm tra nếu user là học sinh
    const isStudent = me?.roles?.some((role) => role.code === 'STUDENT') ?? false;
    // Check if current route should render without layout
    const currentRoute = appRoutes.find((r) => {
        if (r.path.includes(':')) {
            // Handle dynamic routes
            const pattern = r.path.replace(/:[^/]+/g, '[^/]+');
            const regex = new RegExp(`^${pattern}$`);
            return regex.test(location.pathname);
        }
        return r.path === location.pathname;
    });

    const shouldSkipLayout = currentRoute?.noLayout ?? false;

    // Show loading state only during re-fetches (not initial load since main.tsx waits)
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center px-4">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                    <p className="mt-3 text-sm text-gray-600">Dang tai du lieu nguoi dung...</p>
                    {isSlowLoading && (
                        <div className="mt-3 text-xs text-amber-700">
                            Tai lau bat thuong. Thu F5 hoac kiem tra Network/Console trong DevTools.
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Show error if profile fetch failed
    if (error || !me) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Không thể tải thông tin người dùng</p>
                    <p className="text-gray-600 text-sm">{error || 'Profile not loaded'}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    // Render without layout for specific routes
    if (shouldSkipLayout) {
        return <AppRoutes />;
    }

    // Sử dụng layout khác nhau dựa trên role
    const Layout = isStudent ? StudentLayout : AppLayout;

    return (
        <Layout>
            <AppRoutes />
        </Layout>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <PermissionProvider>
                <ToastProvider>
                    <AppContent />
                    <BackendErrorHandler />
                </ToastProvider>
            </PermissionProvider>
        </BrowserRouter>
    );
}

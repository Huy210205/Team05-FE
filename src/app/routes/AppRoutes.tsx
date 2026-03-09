import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import ProtectedRoute from './ProtectedRoute';
import { useUserProfile } from '../../stores/userProfile';
import { appRoutes } from './routeConfig';

export default function AppRoutes() {
    const { me } = useUserProfile();
    const isStudent = me?.roles?.some((role) => role.code === 'STUDENT') ?? false;

    return (
        <Suspense
            fallback={
                <div className="flex h-screen items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                </div>
            }
        >
            <Routes>
                {appRoutes.map((r) => {
                    // Special handling for root redirect if student
                    if (r.path === '/' && r.redirectIfStudent && isStudent) {
                        return <Route key={r.path} path={r.path} element={<Navigate to="/my-classes" replace />} />;
                    }

                    const element = r.allowedRoles ? (
                        <ProtectedRoute allowedRoles={r.allowedRoles}>
                            <r.component />
                        </ProtectedRoute>
                    ) : (
                        <r.component />
                    );

                    return <Route key={r.path} path={r.path} element={element} />;
                })}
                {/* Fallback not found */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
}

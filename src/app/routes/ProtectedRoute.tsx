import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserProfile } from '@/stores/userProfile';

type ProtectedRouteProps = {
    children: React.ReactNode;
    allowedRoles?: string[];
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { me, loading } = useUserProfile();

    // Show loading state while fetching user profile
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    // Check if user has required role

    if (allowedRoles && allowedRoles.length > 0) {
        const hasAccess = me?.roles?.some((role) => allowedRoles.includes(role.code)) ?? false;
        if (!hasAccess) {
            // Redirect to home if user doesn't have access
            return <Navigate to="/" replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;

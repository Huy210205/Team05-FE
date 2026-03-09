import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    BookOpen,
    Bell,
    Settings,
    LogOut,
    Search,
    Menu,
    X,
    MailOpen,
    User,
    History,
    Lightbulb,
    Award,
    CreditCard,
    UserCog,
    TrendingUp,
    Calendar,
    Trophy,
} from 'lucide-react';
import { keycloak } from '../../keycloak';
import { useUserProfile } from '../../stores/userProfile';
import { getMyClasses, type ClassDto } from '@/shared/api/classes';
import { notificationsApi } from '@/shared/api/notifications';
import type { NotificationItem } from '@/shared/api/notifications';
import { studentWarningsApi, type MyWarning } from '@/shared/api/student-warnings';
import AIAssistant from '@/components/AIAssistant/AIAssistant';

type StudentLayoutProps = {
    children: React.ReactNode;
};

export default function StudentLayout({ children }: StudentLayoutProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [userAvatar, setUserAvatar] = useState<string | null>(null);
    const [classes, setClasses] = useState<ClassDto[]>([]);
    const [loadingClasses, setLoadingClasses] = useState(false);
    const { me, loading } = useUserProfile();
    const navigate = useNavigate();

    // Notification states
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [myWarnings, setMyWarnings] = useState<MyWarning[]>([]);
    const [activeTab, setActiveTab] = useState<'warnings' | 'all'>('warnings');
    const [hiddenNotificationIds, setHiddenNotificationIds] = useState<number[]>(() => {
        const saved = localStorage.getItem('hiddenNotifications');
        return saved ? JSON.parse(saved) : [];
    });
    const notifRef = useRef<HTMLDivElement | null>(null);

    // Load user avatar
    useEffect(() => {
        const savedAvatar = localStorage.getItem('userAvatar');
        if (savedAvatar) {
            setUserAvatar(savedAvatar);
        }
    }, []);

    // Load classes for sidebar
    useEffect(() => {
        if (me?.userId) {
            loadClasses();
        }
    }, [me?.userId]);

    // Fetch notifications
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const data = await notificationsApi.getMyNotifications();
                setNotifications(data);
            } catch (error) {
                setNotifications([]);
            }
        };
        fetchNotifications();
    }, []);

    // Fetch my warnings (absences > 2 or failures > 2)
    useEffect(() => {
        const fetchWarnings = async () => {
            try {
                const data = await studentWarningsApi.getMyWarnings();
                setMyWarnings(data);
            } catch (error) {
                setMyWarnings([]);
            }
        };
        fetchWarnings();
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setShowNotifications(false);
            }
        }
        if (showNotifications) {
            document.addEventListener('mousedown', onDocClick);
        }
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [showNotifications]);

    const loadClasses = async () => {
        try {
            setLoadingClasses(true);
            const response = await getMyClasses();
            setClasses(response.data);
        } catch (error) {
        } finally {
            setLoadingClasses(false);
        }
    };

    const handleLogout = () => {
        keycloak.logout({ redirectUri: window.location.origin });
    };

    const getUserInitials = () => {
        if (!me?.fullName) return '?';
        const names = me.fullName.split(' ');
        return names.length >= 2
            ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
            : names[0][0].toUpperCase();
    };

    const navigationItems = [
        { name: 'Hồ sơ cá nhân', path: '/profile', icon: User },
        { name: 'Lớp học của tôi', path: '/my-classes', icon: BookOpen },
        { name: 'Lịch sử học tập', path: '/learning-history', icon: History },
        { name: 'Gợi ý lớp học', path: '/recommended', icon: Lightbulb },
        { name: 'Chứng chỉ', path: '/certificates', icon: Award },
        { name: 'Thanh toán', path: '/payments', icon: CreditCard },
        { name: 'Cài đặt tài khoản', path: '/account-settings', icon: UserCog },
    ];

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-50 to-cyan-50 shadow-sm backdrop-blur-sm bg-opacity-95">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="mr-4 rounded-lg p-2 hover:bg-gray-100 lg:hidden"
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>

                        {/* Logo and Brand - Centered */}
                        <div className="flex-1 flex justify-center">
                            <button
                                onClick={() => navigate('/my-classes')}
                                className="group flex items-center space-x-3 rounded-md px-3 py-1.5 transition-colors hover:bg-white/50"
                                aria-label="Trang chủ Education Management"
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md transition-all group-hover:shadow-xl group-hover:from-purple-600 group-hover:to-pink-500 group-hover:scale-110">
                                    <span className="text-xl font-bold">EM</span>
                                </div>
                                <div className="text-left">
                                    <div className="text-lg font-bold tracking-tight text-gray-900 group-hover:text-blue-600 transition-colors">
                                        Education Management
                                    </div>
                                    <div className="text-xs text-gray-500 group-hover:text-blue-500 transition-colors">
                                        Student Portal
                                    </div>
                                </div>
                            </button>
                        </div>

                        {/* Right Side Actions */}
                        <div className="flex items-center space-x-3">
                            {/* Notifications */}
                            <div className="relative" ref={notifRef}>
                                <button
                                    className="relative rounded-full p-2 hover:bg-gray-100"
                                    aria-label="Thông báo"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowNotifications((s) => !s);
                                    }}
                                >
                                    <Bell className="h-6 w-6 text-gray-600" />
                                    {(notifications &&
                                        notifications.filter((n) => !hiddenNotificationIds.includes(n.id) && !n.isRead)
                                            .length > 0) ||
                                    (myWarnings && myWarnings.length > 0) ? (
                                        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-blue-500"></span>
                                    ) : null}
                                    {(notifications &&
                                        notifications.filter((n) => !hiddenNotificationIds.includes(n.id) && !n.isRead)
                                            .length > 0) ||
                                    (myWarnings && myWarnings.length > 0) ? (
                                        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 grid place-items-center text-[10px] font-semibold bg-red-600 text-white rounded-full shadow">
                                            {notifications.filter(
                                                (n) => !hiddenNotificationIds.includes(n.id) && !n.isRead,
                                            ).length + (myWarnings?.length || 0)}
                                        </span>
                                    ) : null}
                                </button>

                                {/* Notification Dropdown */}
                                {showNotifications && (
                                    <div
                                        className="absolute right-0 mt-2 w-[420px] max-w-[90vw] bg-white border border-gray-200 rounded-2xl shadow-2xl z-[100] overflow-hidden"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* Header */}
                                        <div className="px-5 py-4 border-b border-gray-100">
                                            <h3 className="text-lg font-semibold text-gray-900">Thông báo</h3>
                                        </div>

                                        {/* Tabs */}
                                        <div className="flex items-center border-b border-gray-100 bg-white">
                                            <button
                                                onClick={() => setActiveTab('warnings')}
                                                className={`flex-1 px-4 py-3 font-medium text-sm transition-all ${
                                                    activeTab === 'warnings'
                                                        ? 'text-red-600 border-b-2 border-red-500 bg-red-50'
                                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                                }`}
                                            >
                                                Cảnh báo ({myWarnings?.length || 0})
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('all')}
                                                className={`flex-1 px-4 py-3 font-medium text-sm transition-all flex items-center justify-center gap-2 relative ${
                                                    activeTab === 'all'
                                                        ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50'
                                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                                }`}
                                            >
                                                <span>
                                                    Hoạt động (
                                                    {notifications?.filter(
                                                        (n) => !hiddenNotificationIds.includes(n.id) && !n.isRead,
                                                    ).length || 0}
                                                    )
                                                </span>
                                                {activeTab === 'all' &&
                                                    notifications &&
                                                    notifications.filter(
                                                        (n) => !hiddenNotificationIds.includes(n.id) && !n.isRead,
                                                    ).length > 0 && (
                                                        <div title="Đánh dấu tất cả đã đọc">
                                                            <MailOpen
                                                                size={16}
                                                                className="text-blue-500 hover:text-blue-700 cursor-pointer ml-1"
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    try {
                                                                        await notificationsApi.markAllAsRead();
                                                                        const updated =
                                                                            await notificationsApi.getMyNotifications();
                                                                        setNotifications(updated);
                                                                    } catch (error) {
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                            </button>
                                        </div>

                                        <div className="max-h-96 overflow-auto">
                                            {activeTab === 'warnings' && (
                                                <div>
                                                    {(!myWarnings || myWarnings.length === 0) && (
                                                        <div className="px-6 py-12 text-center text-gray-500">
                                                            <p className="text-sm">Không có cảnh báo nào</p>
                                                        </div>
                                                    )}
                                                    {myWarnings?.map((warning) => (
                                                        <div
                                                            key={warning.classId}
                                                            className="relative w-full text-left px-5 py-4 border-b border-gray-100 bg-red-50 hover:bg-red-100 transition-all"
                                                        >
                                                            <div className="space-y-2">
                                                                <h4 className="text-sm font-semibold text-gray-900">
                                                                    {warning.className}
                                                                </h4>
                                                                <p className="text-xs text-gray-600">
                                                                    {warning.programName}
                                                                </p>
                                                                <div className="flex flex-wrap gap-2 pt-1">
                                                                    {warning.hasAbsenceWarning && (
                                                                        <span className="inline-block px-2 py-1 bg-amber-100 rounded text-xs font-medium text-amber-800">
                                                                            Vắng {warning.absentCount} buổi
                                                                        </span>
                                                                    )}
                                                                    {warning.hasFailWarning && (
                                                                        <span className="inline-block px-2 py-1 bg-red-100 rounded text-xs font-medium text-red-800">
                                                                            Trượt {warning.failCount} bài
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {activeTab === 'all' && (
                                                <div className="bg-gray-50">
                                                    {(!notifications || notifications.length === 0) && (
                                                        <div className="px-6 py-12 text-center text-gray-500">
                                                            <span className="text-4xl">📢</span>
                                                            <p className="text-sm mt-3">Không có thông báo nào</p>
                                                        </div>
                                                    )}
                                                    {notifications
                                                        ?.filter((n) => !hiddenNotificationIds.includes(n.id))
                                                        .slice(0, 6)
                                                        .map((n) => (
                                                            <div
                                                                key={n.id}
                                                                className={`relative w-full text-left px-5 py-4 border-b border-gray-100 hover:bg-white transition-all group ${
                                                                    !n.isRead ? 'bg-blue-50' : 'bg-white'
                                                                }`}
                                                            >
                                                                <button
                                                                    onClick={async () => {
                                                                        try {
                                                                            if (!n.isRead) {
                                                                                await notificationsApi.markAsRead(n.id);
                                                                                const updated =
                                                                                    await notificationsApi.getMyNotifications();
                                                                                setNotifications(updated);
                                                                            }
                                                                        } catch (error) {
                                                                        }
                                                                    }}
                                                                    className="w-full"
                                                                >
                                                                    <div className="flex items-start gap-3">
                                                                        <div
                                                                            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                                                                n.severity === 'high'
                                                                                    ? 'bg-red-100'
                                                                                    : n.severity === 'medium'
                                                                                      ? 'bg-amber-100'
                                                                                      : 'bg-blue-100'
                                                                            }`}
                                                                        >
                                                                            <span
                                                                                className={`text-lg ${
                                                                                    n.severity === 'high'
                                                                                        ? 'text-red-600'
                                                                                        : n.severity === 'medium'
                                                                                          ? 'text-amber-600'
                                                                                          : 'text-blue-600'
                                                                                }`}
                                                                            >
                                                                                {n.type === 'GRADE_UPDATED'
                                                                                    ? '📊'
                                                                                    : n.type === 'ENROLLED_NEW_CLASS'
                                                                                      ? '🎓'
                                                                                      : n.type === 'CLASS_UPDATED'
                                                                                        ? '📅'
                                                                                        : n.type ===
                                                                                            'ATTENDANCE_RECORDED'
                                                                                          ? '✅'
                                                                                          : n.type ===
                                                                                              'ATTENDANCE_UPDATED'
                                                                                            ? '🔄'
                                                                                            : n.type ===
                                                                                                'ATTENDANCE_WARNING'
                                                                                              ? '⚠️'
                                                                                              : n.type ===
                                                                                                  'GRADE_WARNING'
                                                                                                ? '❌'
                                                                                                : '📢'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex-1 min-w-0 pr-6">
                                                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                                                <span
                                                                                    className={`text-sm font-semibold ${!n.isRead ? 'text-gray-900' : 'text-gray-600'}`}
                                                                                >
                                                                                    {n.title}
                                                                                </span>
                                                                                {!n.isRead && (
                                                                                    <span className="flex-shrink-0 h-2 w-2 bg-blue-600 rounded-full"></span>
                                                                                )}
                                                                            </div>
                                                                            <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                                                                {n.message}
                                                                            </p>
                                                                            <span className="text-xs text-gray-400">
                                                                                {(() => {
                                                                                    const date = new Date(n.createdAt);
                                                                                    const now = new Date();
                                                                                    const diffMs =
                                                                                        now.getTime() - date.getTime();
                                                                                    const diffMins = Math.floor(
                                                                                        diffMs / 60000,
                                                                                    );
                                                                                    const diffHours = Math.floor(
                                                                                        diffMs / 3600000,
                                                                                    );

                                                                                    if (diffMins < 1) return 'Vừa xong';
                                                                                    if (diffMins < 60)
                                                                                        return `${diffMins} phút trước`;
                                                                                    if (diffHours < 24)
                                                                                        return `${diffHours} giờ trước`;
                                                                                    return date.toLocaleDateString(
                                                                                        'vi-VN',
                                                                                    );
                                                                                })()}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </button>

                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const updated = [
                                                                            ...hiddenNotificationIds,
                                                                            n.id,
                                                                        ];
                                                                        setHiddenNotificationIds(updated);
                                                                        localStorage.setItem(
                                                                            'hiddenNotifications',
                                                                            JSON.stringify(updated),
                                                                        );
                                                                    }}
                                                                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded-full"
                                                                    title="Ẩn khỏi danh sách"
                                                                >
                                                                    <svg
                                                                        className="w-4 h-4 text-gray-500"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={2}
                                                                            d="M6 18L18 6M6 6l12 12"
                                                                        />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* User Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center space-x-3 rounded-full p-1 hover:bg-gray-100"
                                >
                                    {userAvatar ? (
                                        <img
                                            src={userAvatar}
                                            alt="Avatar"
                                            className="h-8 w-8 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-sm font-semibold text-white">
                                            {getUserInitials()}
                                        </div>
                                    )}
                                    <span className="hidden text-sm font-medium text-gray-700 lg:block">
                                        {me?.fullName}
                                    </span>
                                </button>

                                {/* Dropdown Menu */}
                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white py-2 shadow-lg ring-1 ring-black/5">
                                        <NavLink
                                            to="/settings"
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            <Settings className="mr-3 h-4 w-4" />
                                            Cài đặt
                                        </NavLink>
                                        <hr className="my-1 border-gray-100" />
                                        <button
                                            onClick={handleLogout}
                                            className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            <LogOut className="mr-3 h-4 w-4" />
                                            Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="border-t border-blue-100 bg-white/95 backdrop-blur-sm lg:hidden">
                        <nav className="space-y-1 px-4 py-4">
                            {navigationItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={({ isActive }) =>
                                        `flex items-center rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                                            isActive ? 'bg-gray-200 text-gray-900' : 'text-gray-700 hover:bg-gray-100'
                                        }`
                                    }
                                >
                                    <item.icon className="mr-3 h-5 w-5" />
                                    {item.name}
                                </NavLink>
                            ))}
                        </nav>
                    </div>
                )}
            </header>

            {/* Main Content Area */}
            <div className="mx-auto max-w-[1600px] px-4">
                <div className="flex">
                    {/* Left Sidebar - Desktop Only - Increased width */}
                    <aside className="hidden w-80 shrink-0 border-r border-blue-100 bg-white/50 backdrop-blur-sm lg:block">
                        <nav className="sticky top-20 space-y-8 p-8">
                            {/* User Profile Section */}
                            <div className="space-y-5">
                                <div className="flex items-center gap-4">
                                    {userAvatar ? (
                                        <img
                                            src={userAvatar}
                                            alt="Avatar"
                                            className="h-16 w-16 rounded-full object-cover ring-2 ring-blue-200"
                                        />
                                    ) : (
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-xl font-bold text-white ring-2 ring-blue-200 shadow-md">
                                            {getUserInitials()}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-base font-bold text-gray-900 truncate">
                                            {me?.fullName || 'Student'}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-0.5">Học viên</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/settings')}
                                    className="w-full rounded-lg border border-purple-200 bg-purple-50 px-5 py-2.5 text-sm font-medium text-purple-700 transition hover:bg-purple-100"
                                >
                                    Chỉnh sửa hồ sơ
                                </button>
                            </div>

                            {/* Navigation Links */}
                            <div>
                                <h4 className="mb-4 px-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                                    Học tập
                                </h4>
                                <div className="space-y-2">
                                    <NavLink
                                        to="/my-classes"
                                        className={({ isActive }) =>
                                            `flex items-center rounded-xl px-4 py-3 text-base font-semibold transition-all ${
                                                isActive
                                                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                                                    : 'text-gray-700 hover:bg-gray-50'
                                            }`
                                        }
                                    >
                                        <BookOpen className="mr-4 h-6 w-6" />
                                        Lớp học của tôi
                                    </NavLink>
                                    <NavLink
                                        to="/my-grades"
                                        className={({ isActive }) =>
                                            `flex items-center rounded-xl px-4 py-3 text-base font-semibold transition-all ${
                                                isActive
                                                    ? 'bg-purple-50 text-purple-700 shadow-sm'
                                                    : 'text-gray-700 hover:bg-gray-50'
                                            }`
                                        }
                                    >
                                        <Trophy className="mr-4 h-6 w-6" />
                                        Điểm của tôi
                                    </NavLink>
                                    <NavLink
                                        to="/my-attendance"
                                        className={({ isActive }) =>
                                            `flex items-center rounded-xl px-4 py-3 text-base font-medium transition ${
                                                isActive
                                                    ? 'bg-green-50 text-green-700 shadow-sm'
                                                    : 'text-gray-700 hover:bg-gray-50'
                                            }`
                                        }
                                    >
                                        <Calendar className="mr-4 h-6 w-6" />
                                        Điểm danh của tôi
                                    </NavLink>
                                </div>
                            </div>
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="min-h-[calc(100vh-4rem)] flex-1 px-6 py-8 sm:px-8 lg:px-12 relative">
                        {/* Decorative Elements */}
                        <div className="absolute top-10 right-10 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute bottom-20 left-10 w-48 h-48 bg-cyan-200/20 rounded-full blur-3xl pointer-events-none"></div>

                        {/* Content */}
                        <div className="relative z-10">{children}</div>
                    </main>
                </div>
            </div>

            {/* AI Assistant - Floating on all student pages */}
            <AIAssistant className="bottom-6 right-6" />
        </div>
    );
}

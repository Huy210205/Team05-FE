import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, AlertTriangle, Mail, MailOpen, Bot } from 'lucide-react';
import { useUserProfile } from '@/stores/userProfile';
import CenterSwitcher from './CenterSwitcher';
import { useCenterSelection } from '@/stores/centerSelection';
import { studentWarningsApi } from '@/shared/api/student-warnings';
import type { StudentWarning } from '@/shared/api/student-warnings';
import { notificationsApi } from '@/shared/api/notifications';
import type { NotificationItem } from '@/shared/api/notifications';

interface TopNavBarProps {
    sidebarCollapsed: boolean;
    onToggleSidebar: () => void;
}

export default function TopNavBar({ sidebarCollapsed, onToggleSidebar }: TopNavBarProps) {
    const { me } = useUserProfile();
    const location = useLocation();
    const navigate = useNavigate();
    const selectedCenterId = useCenterSelection((s) => s.selectedCenterId);
    const [showNotifications, setShowNotifications] = useState(false);
    const [warningCount, setWarningCount] = useState(0);
    const [warnings, setWarnings] = useState<StudentWarning[]>([]);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [activeTab, setActiveTab] = useState<'warnings' | 'all'>('warnings');
    const [loading, setLoading] = useState(false);
    const [userAvatar, setUserAvatar] = useState<string | null>(null);
    const notifRef = useRef<HTMLDivElement | null>(null);
    const [hiddenNotificationIds, setHiddenNotificationIds] = useState<number[]>(() => {
        const saved = localStorage.getItem('hiddenNotifications');
        return saved ? JSON.parse(saved) : [];
    });

    // Check if user is admin/teacher or student
    const isAdminOrTeacher = me?.roles?.some((r) => ['SUPER_ADMIN', 'CENTER_MANAGER', 'LECTURER'].includes(r.code));

    // Fetch student warnings from API (only for admin/teacher)
    useEffect(() => {
        if (!isAdminOrTeacher) return;

        const fetchWarnings = async () => {
            setLoading(true);
            try {
                const response = await studentWarningsApi.getStudentWarnings(selectedCenterId);
                setWarnings(response.warnings);
                setWarningCount(response.totalCount);
            } catch (error) {
                setWarnings([]);
                setWarningCount(0);
            } finally {
                setLoading(false);
            }
        };

        fetchWarnings();
    }, [selectedCenterId, isAdminOrTeacher]);

    // Fetch notifications from backend
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const data = await notificationsApi.getMyNotifications();
                setNotifications(data);

                // For students: count high-severity notifications as warnings
                if (!isAdminOrTeacher) {
                    const highSeverityCount = data.filter((n) => n.severity === 'high' && !n.isRead).length;
                    setWarningCount(highSeverityCount);
                }
            } catch (error) {
                setNotifications([]);
            }
        };
        fetchNotifications();
    }, [selectedCenterId, isAdminOrTeacher]);

    // Load user avatar from localStorage
    useEffect(() => {
        const savedAvatar = localStorage.getItem('userAvatar');
        if (savedAvatar) {
            setUserAvatar(savedAvatar);
        }
    }, []);

    // Listen for avatar changes
    useEffect(() => {
        const handleStorageChange = () => {
            const savedAvatar = localStorage.getItem('userAvatar');
            setUserAvatar(savedAvatar);
        };

        const handleAvatarUpdate = (event: CustomEvent) => {
            setUserAvatar(event.detail.avatar);
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('avatarUpdated', handleAvatarUpdate as EventListener);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
        };
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

    // Hiển thị CenterSwitcher trên trang tổng quan (path '/') cho các role có quyền xem số liệu theo trung tâm
    const canSelectCenter = me?.roles?.some((r) => ['CENTER_MANAGER', 'SUPER_ADMIN'].includes(r.code));
    const showCenterSwitcher = canSelectCenter && location.pathname === '/';

    return (
        <div className="sticky top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm flex items-center">
            {/* Left Section - Logo area aligned with sidebar width */}
            <div
                className={`${sidebarCollapsed ? 'w-16' : 'w-64'} hidden md:flex items-center justify-start px-4 transition-all duration-300`}
            >
                <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-full bg-blue-600 grid place-items-center text-white font-bold text-sm shadow-md">
                        E
                    </div>
                    {!sidebarCollapsed && <span className="text-base font-semibold text-gray-900">EduManage</span>}
                </div>
            </div>
            {/* Divider that lines up with the sidebar edge */}
            <div className="hidden md:block h-12 w-px bg-gray-200" />

            {/* Right Section - Rest of the navbar */}
            <div className="flex-1 flex items-center justify-between px-4 sm:px-6 py-3 gap-4">
                {/* Left controls in navbar */}
                <div className="flex items-center gap-1 sm:gap-2">
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label="Toggle menu"
                    >
                        <Menu size={20} className="text-gray-700" />
                    </button>
                </div>

                {/* Center: Empty spacer */}
                <div className="flex-1" />

                {/* Right: Notifications + Settings + Avatar */}
                <div className="flex items-center gap-3">
                    {/* Center Switcher - chỉ hiển thị cho CENTER_MANAGER/SUPER_ADMIN */}
                    {showCenterSwitcher && <CenterSwitcher />}

                    {/* Language Selector */}
                    <button className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <span className="text-sm font-medium text-gray-700">VN</span>
                    </button>

                    {/* AI Assistant Button */}
                    <button
                        onClick={() => {
                            // Dispatch custom event to open AI Assistant
                            window.dispatchEvent(new CustomEvent('openAIAssistant'));
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-200 shadow-sm hover:shadow-md"
                        title="Trợ lý ảo"
                    >
                        <Bot size={18} />
                        <span className="hidden lg:inline text-sm font-medium">Trợ lý ảo</span>
                    </button>

                    {/* Notifications dropdown with tabs */}
                    <div className="relative" ref={notifRef}>
                        <button
                            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowNotifications((s) => !s);
                            }}
                            aria-haspopup="menu"
                            aria-expanded={showNotifications}
                        >
                            <Bell size={20} className="text-gray-700" />
                            {(warningCount > 0 ||
                                (notifications &&
                                    notifications.filter((n) => !hiddenNotificationIds.includes(n.id) && !n.isRead)
                                        .length > 0)) && (
                                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 grid place-items-center text-[10px] font-semibold bg-red-600 text-white rounded-full shadow">
                                    {warningCount +
                                        (notifications?.filter(
                                            (n) => !hiddenNotificationIds.includes(n.id) && !n.isRead,
                                        ).length || 0)}
                                </span>
                            )}
                        </button>
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
                                        Cảnh báo ({warningCount})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('all')}
                                        className={`flex-1 px-4 py-3 font-medium text-sm transition-all flex items-center justify-center gap-2 relative ${
                                            activeTab === 'all'
                                                ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50'
                                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                        }`}
                                    >
                                        <span>Hoạt động ({notifications?.filter(n => !hiddenNotificationIds.includes(n.id) && !n.isRead).length || 0})</span>
                                        {activeTab === 'all' && notifications && notifications.filter(n => !hiddenNotificationIds.includes(n.id) && !n.isRead).length > 0 && (
                                            <div title="Đánh dấu tất cả đã đọc">
                                                <MailOpen 
                                                    size={16} 
                                                    className="text-blue-500 hover:text-blue-700 cursor-pointer ml-1"
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        try {
                                                            await notificationsApi.markAllAsRead();
                                                            const updated = await notificationsApi.getMyNotifications();
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
                                            {isAdminOrTeacher ? (
                                                <>
                                                    {warnings.length === 0 && (
                                                        <div className="px-6 py-12 text-center text-gray-500">
                                                            <p className="text-sm">Chưa có cảnh báo nào</p>
                                                        </div>
                                                    )}
                                                    {warnings.slice(0, 5).map((w) => (
                                                        <button
                                                            key={w.studentId}
                                                            onClick={() => {
                                                                setShowNotifications(false);
                                                                navigate(`/students/${w.studentId}`);
                                                            }}
                                                            className="w-full text-left px-5 py-4 border-b border-gray-100 bg-red-50 hover:bg-red-100 transition-all"
                                                        >
                                                            <div className="space-y-2">
                                                                <div>
                                                                    <h4 className="text-sm font-semibold text-gray-900">
                                                                        {w.name}
                                                                    </h4>
                                                                    <p className="text-xs text-gray-600">
                                                                        #{w.code} • {w.program} • {w.classCode}
                                                                    </p>
                                                                </div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    <span
                                                                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                                                            w.reason?.includes('vắng')
                                                                                ? 'bg-amber-100 text-amber-800'
                                                                                : 'bg-red-100 text-red-800'
                                                                        }`}
                                                                    >
                                                                        {w.reason}
                                                                    </span>
                                                                </div>
                                                                {w.detail && (
                                                                    <p className="text-xs text-gray-600">{w.detail}</p>
                                                                )}
                                                            </div>
                                                        </button>
                                                    ))}
                                                    {warnings.length > 0 && (
                                                        <div className="px-4 py-2 border-t border-gray-200">
                                                            <button
                                                                onClick={() => {
                                                                    setShowNotifications(false);
                                                                    navigate('/students');
                                                                }}
                                                                className="w-full text-sm font-semibold text-blue-700 hover:text-blue-800 py-2"
                                                            >
                                                                Xem tất cả học sinh cảnh báo
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <div className="px-4 py-2 text-xs font-medium text-gray-500">
                                                        Cảnh báo của bạn
                                                    </div>
                                                    {(!notifications ||
                                                        notifications.filter((n) => n.severity === 'high').length ===
                                                            0) && (
                                                        <div className="px-4 py-6 text-sm text-gray-500">
                                                            Không có cảnh báo nào
                                                        </div>
                                                    )}
                                                    {notifications?.filter(n => n.severity === 'high').slice(0, 6).map((n) => (
                                                        <div
                                                            key={n.id}
                                                            className={`relative w-full text-left px-5 py-4 border-b border-gray-100 hover:bg-white transition-all ${
                                                                !n.isRead ? 'bg-red-50' : 'bg-white'
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
                                                                            const highSeverityCount =
                                                                                updated.filter(
                                                                                    (x) =>
                                                                                        x.severity === 'high' &&
                                                                                        !x.isRead,
                                                                                ).length;
                                                                            setWarningCount(highSeverityCount);
                                                                        }
                                                                    } catch (error) {
                                                                        console.error(
                                                                            'Failed to mark notification as read:',
                                                                            error,
                                                                        );
                                                                    }
                                                                }}
                                                                className="w-full"
                                                            >
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-red-100">
                                                                            <span className="text-lg text-red-600">
                                                                                {n.type === 'ATTENDANCE_WARNING'
                                                                                    ? '⚠️'
                                                                                    : n.type === 'GRADE_WARNING'
                                                                                      ? '❌'
                                                                                      : '⚠️'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                                                <span
                                                                                    className={`text-sm font-semibold ${!n.isRead ? 'text-gray-900' : 'text-gray-600'}`}
                                                                                >
                                                                                    {n.title}
                                                                                </span>
                                                                                {!n.isRead && (
                                                                                    <span className="flex-shrink-0 h-2 w-2 bg-red-600 rounded-full"></span>
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
                                                        </div>
                                                    ))}
                                                </>
                                            )}
                                        </div>
                                    )}
                                    {activeTab === 'all' && (
                                        <div className="bg-gray-50">
                                            {(!notifications || notifications.length === 0) && (
                                                <div className="px-6 py-12 text-center text-gray-500">
                                                    <Mail size={48} className="mx-auto mb-3 text-gray-300" />
                                                    <p className="text-sm">Không có thông báo nào</p>
                                                </div>
                                            )}
                                            {notifications?.filter(n => !hiddenNotificationIds.includes(n.id)).slice(0, 6).map((n) => (
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
                                                                console.error(
                                                                    'Failed to mark notification as read:',
                                                                    error,
                                                                );
                                                            }
                                                        }}
                                                        className="w-full"
                                                    >
                                                            <div className="flex items-start gap-3">
                                                                {/* Avatar/Icon */}
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
                                                                                : n.type === 'CLASS_CREATED'
                                                                                  ? '🏫'
                                                                                  : n.type === 'CENTER_CREATED'
                                                                                    ? '🏢'
                                                                                    : n.type === 'LECTURER_GRADED'
                                                                                      ? '📝'
                                                                                      : n.type === 'ATTENDANCE_RECORDED'
                                                                                        ? '✅'
                                                                                        : n.type ===
                                                                                            'ATTENDANCE_UPDATED'
                                                                                          ? '🔄'
                                                                                          : n.type ===
                                                                                              'ATTENDANCE_WARNING'
                                                                                            ? '⚠️'
                                                                                            : n.type === 'GRADE_WARNING'
                                                                                              ? '❌'
                                                                                              : n.type ===
                                                                                                  'SYSTEM_ANNOUNCEMENT'
                                                                                                ? '📣'
                                                                                                : '📢'}
                                                                    </span>
                                                                </div>

                                                                {/* Content */}
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
                                                                            const diffMins = Math.floor(diffMs / 60000);
                                                                            const diffHours = Math.floor(
                                                                                diffMs / 3600000,
                                                                            );

                                                                            if (diffMins < 1) return 'Vừa xong';
                                                                            if (diffMins < 60)
                                                                                return `${diffMins} phút trước`;
                                                                            if (diffHours < 24)
                                                                                return `${diffHours} giờ trước`;
                                                                            return date.toLocaleDateString('vi-VN');
                                                                        })()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </button>

                                                        {/* X button to hide notification from dropdown */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const updated = [...hiddenNotificationIds, n.id];
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
                                            {notifications && notifications.length > 0 && (
                                                <div className="bg-white border-t border-gray-100 p-4">
                                                    <button
                                                        onClick={() => {
                                                            setShowNotifications(false);
                                                            navigate('/activity-log');
                                                        }}
                                                        className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all shadow-md hover:shadow-lg"
                                                    >
                                                        Xem tất cả hoạt động
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Avatar - Click to go to Settings */}
                    <button
                        onClick={() => navigate('/settings')}
                        className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        {userAvatar ? (
                            <img
                                src={userAvatar}
                                alt="Avatar"
                                className="h-9 w-9 rounded-full object-cover shadow-md"
                            />
                        ) : (
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 grid place-items-center text-white font-semibold text-sm shadow-md">
                                {me?.fullName
                                    ?.split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2) || 'U'}
                            </div>
                        )}
                        <div className="hidden lg:block text-left">
                            <div className="text-sm font-semibold text-gray-900">{me?.fullName || 'User'}</div>
                            <div className="text-xs text-gray-500">{me?.roles?.[0]?.code || 'Quản lý Trung tâm'}</div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}

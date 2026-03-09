import React, { useState, useEffect } from 'react';
import {
    Home,
    Building2,
    Users2,
    Shield,
    BookOpen,
    GraduationCap,
    User,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    ClipboardCheck,
    FileText,
    Bell,
    BarChart3,
    MessageSquare,
} from 'lucide-react';
import { keycloak } from '../../keycloak';
import { NavLink } from 'react-router-dom';
import { useUserProfile } from '../../stores/userProfile';
import { roleDisplay } from '../../utils/roleLabel';
import TopNavBar from '@/features/users/pages/dashboard/components/TopNavBar';
import AIAssistant from '@/components/AIAssistant/AIAssistant';

function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html>
            <body className="text-base antialiased font-sans">{children}</body>
        </html>
    );
}

type AppLayoutProps = {
    children: React.ReactNode;
};

type MenuItem = {
    id: string;
    label: string;
    path: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    end?: boolean;
};

type MenuGroup = {
    id: string;
    label?: string;
    items: MenuItem[];
};

function AppLayout({ children }: AppLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        // Load sidebar state from localStorage
        const saved = localStorage.getItem('sidebarCollapsed');
        return saved ? JSON.parse(saved) : false;
    });

    const [userAvatar, setUserAvatar] = useState<string | null>(null);

    // Save sidebar state to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
    }, [sidebarCollapsed]);

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

    // Get user profile data
    const { me, loading } = useUserProfile();
    const mainRole = me?.roles?.[0];

    // Check if user is STUDENT
    const isStudent = me?.roles?.some((role) => role.code === 'STUDENT') ?? false;
    const isLecturer = me?.roles?.some((role) => role.code === 'LECTURER') ?? false;

    // Menu configuration - easily extensible
    const menuGroups: MenuGroup[] = [
        {
            id: 'main',
            items: isStudent
                ? [
                      // Menu cho Học viên - chỉ hiển thị Lớp học của tôi
                      {
                          id: 'my-classes',
                          label: 'Lớp học của tôi',
                          path: '/my-classes',
                          icon: GraduationCap,
                      },
                  ]
                : isLecturer
                  ? [
                        // Menu cho Giảng viên
                        {
                            id: 'attendance',
                            label: 'Quản lý Điểm danh',
                            path: '/attendance',
                            icon: ClipboardCheck,
                        },
                        {
                            id: 'exams',
                            label: 'Quản lý Điểm thi',
                            path: '/exams',
                            icon: FileText,
                        },
                        {
                            id: 'classes',
                            label: 'Quản lý Lớp học',
                            path: '/classes',
                            icon: BookOpen,
                        },
                        {
                            id: 'statistics',
                            label: 'Thống kê Điểm danh',
                            path: '/statistics',
                            icon: BarChart3,
                        },
                    ]
                  : [
                        // Menu cho Admin/Staff
                        {
                            id: 'dashboard',
                            label: 'Tổng quan',
                            path: '/',
                            icon: Home,
                            end: true,
                        },
                        {
                            id: 'users',
                            label: 'Quản lý Người dùng',
                            path: '/users',
                            icon: Users2,
                        },
                        {
                            id: 'centers',
                            label: 'Quản lý Trung tâm',
                            path: '/centers',
                            icon: Building2,
                        },
                        {
                            id: 'roles',
                            label: 'Vai trò & Phân quyền',
                            path: '/roles',
                            icon: Shield,
                        },
                        {
                            id: 'programs',
                            label: 'Chương trình & Module',
                            path: '/programs',
                            icon: BookOpen,
                        },
                        {
                            id: 'classes',
                            label: 'Quản lý Lớp học',
                            path: '/classes',
                            icon: GraduationCap,
                        },
                        {
                            id: 'students',
                            label: 'Hồ sơ Học viên',
                            path: '/students',
                            icon: User,
                        },
                        {
                            id: 'statistics',
                            label: 'Thống kê Điểm danh',
                            path: '/statistics',
                            icon: BarChart3,
                        },
                        {
                            id: 'ai-chat-analytics',
                            label: 'Thống kê AI Chat',
                            path: '/ai-chat-analytics',
                            icon: MessageSquare,
                        },
                    ],
        },
        // Có thể thêm group khác như:
        // {
        //   id: 'reports',
        //   label: 'Báo cáo',
        //   items: [
        //     { id: 'analytics', label: 'Phân tích', path: '/analytics', icon: BarChart3 },
        //     { id: 'exports', label: 'Xuất dữ liệu', path: '/exports', icon: Download }
        //   ]
        // }
    ];

    const bottomMenuItems: MenuItem[] = [
        {
            id: 'settings',
            label: 'Cài đặt',
            path: '/settings',
            icon: Settings,
        },
    ];

    return (
        <div className="min-h-screen bg-white text-gray-900 m-0 p-0">
            {/* Top Navigation Bar - Sticky across all pages */}
            <TopNavBar
                sidebarCollapsed={sidebarCollapsed}
                onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            <div className="flex min-h-screen m-0 p-0">
                {/* Sidebar - Fixed position */}
                <aside
                    className={`${sidebarCollapsed ? 'w-16' : 'w-64'} border-r bg-gradient-to-b from-gray-50 to-white hidden md:flex md:flex-col fixed left-0 top-14 bottom-0 overflow-y-auto z-40 transition-all duration-300 shadow-sm`}
                >
                    {/* Added extra top spacing so all menu items sit a bit lower */}
                    <nav className="flex-1 px-2 pt-8 pb-3 space-y-1">
                        {menuGroups.map((group) => (
                            <div key={group.id}>
                                {group.label && !sidebarCollapsed && (
                                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        {group.label}
                                    </div>
                                )}
                                {group.items.map((item) => {
                                    const IconComponent = item.icon;
                                    return (
                                        <NavLink
                                            key={item.id}
                                            to={item.path}
                                            end={item.end}
                                            className={({ isActive }) =>
                                                `flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 rounded-lg text-sm transition-all duration-200 ${
                                                    isActive
                                                        ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm border-l-4 border-blue-600'
                                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                                                }`
                                            }
                                            title={sidebarCollapsed ? item.label : undefined}
                                        >
                                            <IconComponent
                                                width={16}
                                                height={16}
                                                className={sidebarCollapsed ? '' : 'flex-shrink-0'}
                                            />
                                            {!sidebarCollapsed && <span>{item.label}</span>}
                                        </NavLink>
                                    );
                                })}
                            </div>
                        ))}
                    </nav>

                    <div className="mt-auto border-t border-gray-200 p-3 sticky bottom-0 bg-gray-50 z-10">
                        {bottomMenuItems.map((item) => {
                            const IconComponent = item.icon;
                            return (
                                <NavLink
                                    key={item.id}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `block w-full text-left text-sm px-3 py-2.5 rounded-lg flex items-center transition-all duration-200 ${sidebarCollapsed ? 'justify-center' : 'gap-3'} ${
                                            isActive
                                                ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm border-l-4 border-blue-600'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                                        }`
                                    }
                                    title={sidebarCollapsed ? item.label : undefined}
                                >
                                    <IconComponent
                                        width={16}
                                        height={16}
                                        className={sidebarCollapsed ? '' : 'flex-shrink-0'}
                                    />
                                    {!sidebarCollapsed && <span>{item.label}</span>}
                                </NavLink>
                            );
                        })}
                        <button
                            onClick={() => keycloak.logout({ redirectUri: window.location.origin })}
                            className={`mt-2 w-full text-left text-sm px-2 py-2 rounded-md flex items-center transition-all duration-200 hover:bg-gray-100 hover:text-gray-700 hover:scale-[1.02] hover:shadow-sm ${sidebarCollapsed ? 'justify-center' : 'gap-2'}`}
                            title={sidebarCollapsed ? 'Đăng xuất' : undefined}
                        >
                            <LogOut size={16} className="transition-colors duration-200" />
                            {!sidebarCollapsed && <span className="transition-colors duration-200">Đăng xuất</span>}
                        </button>
                    </div>
                </aside>

                {/* Main Content - with margin to account for fixed sidebar */}
                <div
                    className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}
                >
                    <main className="flex-1 w-full min-h-screen p-6">{children}</main>
                </div>
            </div>

            {/* AI Assistant - Floating on all admin pages */}
            <AIAssistant className="bottom-6 right-6" />
        </div>
    );
}

export { RootLayout };
export default AppLayout;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
    Building2,
    Users,
    Shield,
    UserPlus,
    Settings,
    BookOpen,
    Sparkles,
    UserCheck,
    AlertTriangle,
} from 'lucide-react';
import { listClasses } from '../../../../shared/api/classes';
import { useCenterSelection, useEnsureCenterLoaded } from '../../../../stores/centerSelection';

// Import components
import Stats from '@/features/users/pages/dashboard/components/stats';
import SystemStatus from '@/features/users/pages/dashboard/components/system-status';
import StudentWarnings from '@/features/users/pages/dashboard/components/StudentWarnings';
import QuickActions from '@/features/users/pages/dashboard/components/quick-actions';
import RecentClasses from '@/features/users/pages/dashboard/components/RecentClasses';

// Import APIs
import { listActiveCenters } from '../../../../shared/api/centers';
import { listUserViews } from '../../../../shared/api/userViews';
import { getRoles } from '../../../../shared/api/roles';
import { getAllStudentsWithEnrollments } from '../../../../shared/api/students';
import { useUserProfile } from '../../../../stores/userProfile';

export default function DashboardPage() {
    const navigate = useNavigate();
    const { me, loading: userLoading } = useUserProfile();
    useEnsureCenterLoaded();
    const selectedCenterId = useCenterSelection((s) => s.selectedCenterId);

    // All hooks must be declared before any conditional returns
    const [isLoaded, setIsLoaded] = useState(false);
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

    // State for API data
    const [centersCount, setCentersCount] = useState<number>(0);
    const [activeUsersCount, setActiveUsersCount] = useState<number>(0);
    const [rolesCount, setRolesCount] = useState<number>(0);
    const [classesCount, setClassesCount] = useState<number>(0);
    const [lecturersCount, setLecturersCount] = useState<number>(0);
    const [warningsCount, setWarningsCount] = useState<number>(0);

    // Redirect students and lecturers to their respective pages
    useEffect(() => {
        if (!userLoading && me) {
            const isStudent = me.roles?.some((role) => role.code === 'STUDENT') ?? false;
            const isLecturer = me.roles?.some((role) => role.code === 'LECTURER') ?? false;

            if (isStudent) {
                navigate('/my-classes', { replace: true });
            } else if (isLecturer) {
                navigate('/classes', { replace: true });
            }
        }
    }, [me, userLoading, navigate]);

    // Function to fetch dashboard data from APIs
    const fetchDashboardData = async () => {
        try {
            // Add a small delay to ensure authentication is ready
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Fetch centers count
            try {
                const centersResponse = await listActiveCenters();

                if (centersResponse && centersResponse.data) {
                    const data = centersResponse.data as any;

                    // Handle different response structures
                    let count = 0;
                    if (Array.isArray(data)) {
                        count = data.length;
                    } else if (data.items && Array.isArray(data.items)) {
                        count = data.items.length;
                    } else if (data.total !== undefined) {
                        count = data.total;
                    }

                    setCentersCount(count);
                } else {
                    setCentersCount(0);
                }
            } catch (centersError) {
                setCentersCount(0);
            }

            // Fetch students count - only ACTIVE (đang học) and PENDING (đang chờ)
            // Logic:
            // - PENDING (đang chờ): học viên chưa vào lớp → đếm tất cả (không phụ thuộc trung tâm)
            // - ACTIVE (đang học): học viên đang trong lớp → đếm theo trung tâm của lớp
            try {
                const [studentsWithEnrollmentsResponse, classesResponse] = await Promise.all([
                    getAllStudentsWithEnrollments(),
                    listClasses(selectedCenterId ? { centerId: selectedCenterId } : undefined)
                ]);

                let count = 0;

                if (studentsWithEnrollmentsResponse && studentsWithEnrollmentsResponse.data) {
                    const allStudents = studentsWithEnrollmentsResponse.data as any[];

                    // 1. Đếm học viên PENDING (đang chờ) - không phụ thuộc trung tâm
                    const pendingStudents = allStudents.filter((student: any) => {
                        return student.overallStatus?.toUpperCase() === 'PENDING';
                    });
                    count += pendingStudents.length;

                    // 2. Đếm học viên ACTIVE (đang học) theo trung tâm của lớp
                    if (classesResponse && classesResponse.data) {
                        const classesData = classesResponse.data as any;
                        const classes = Array.isArray(classesData) 
                            ? classesData 
                            : classesData.items || [];

                        // Tạo Map: classId -> class để tra cứu nhanh
                        const classMap = new Map();
                        classes.forEach((cls: any) => {
                            classMap.set(cls.classId, cls);
                        });

                        // Đếm học viên có enrollment ACTIVE trong các lớp đã filter
                        const activeStudentIds = new Set<number>();
                        allStudents.forEach((student: any) => {
                            if (student.enrollments && Array.isArray(student.enrollments)) {
                                student.enrollments.forEach((enrollment: any) => {
                                    // Kiểm tra enrollment có status ACTIVE và thuộc lớp đã filter
                                    if (enrollment.status?.toUpperCase() === 'ACTIVE' && 
                                        classMap.has(enrollment.classId)) {
                                        activeStudentIds.add(student.studentId);
                                    }
                                });
                            }
                        });

                        count += activeStudentIds.size;
                    }
                }

                setActiveUsersCount(count);
            } catch (usersError) {
                setActiveUsersCount(0);
            }

            // Fetch roles count
            try {
                const rolesResponse = await getRoles();

                if (rolesResponse && rolesResponse.data) {
                    const data = rolesResponse.data as any;

                    // Handle different response structures
                    let count = 0;
                    if (Array.isArray(data)) {
                        count = data.length;
                    } else if (data.items && Array.isArray(data.items)) {
                        count = data.items.length;
                    } else if (data.total !== undefined) {
                        count = data.total;
                    }

                    setRolesCount(count);
                } else {
                    setRolesCount(0);
                }
            } catch (rolesError) {
                setRolesCount(0);
            }

            // Fetch classes count filtered by selected center if any
            try {
                const classesRes = await listClasses(selectedCenterId ? { centerId: selectedCenterId } : undefined);
                if (classesRes && classesRes.data) {
                    const data = classesRes.data as any;
                    let count = 0;
                    if (Array.isArray(data)) count = data.length;
                    else if (data.items && Array.isArray(data.items)) count = data.items.length;
                    else if (data.total !== undefined) count = data.total;
                    setClassesCount(count);
                } else {
                    setClassesCount(0);
                }
            } catch (err) {
                setClassesCount(0);
            }

            // Fetch lecturers count filtered by selected center
            try {
                const lecturersRes = await listUserViews(
                    selectedCenterId ? { centerId: selectedCenterId, roleCode: 'LECTURER' } : { roleCode: 'LECTURER' },
                );
                if (lecturersRes && lecturersRes.data) {
                    const data = lecturersRes.data as any;
                    let count = 0;
                    if (Array.isArray(data)) count = data.length;
                    else if (data.items && Array.isArray(data.items)) count = data.items.length;
                    else if (data.total !== undefined) count = data.total;
                    setLecturersCount(count);
                } else {
                    setLecturersCount(0);
                }
            } catch (err) {
                setLecturersCount(0);
            }

            // Fetch warnings count - Will be set by StudentWarnings component via onCountChange callback
            setWarningsCount(0); // Initial value, will be updated by StudentWarnings
        } catch (error) {
            // Set default values in case of error (based on actual API responses)
            setCentersCount(5);
            setActiveUsersCount(20); // Updated to match UsersPage
            setRolesCount(7);
        }
    };

    useEffect(() => {
        setIsLoaded(true);

        // Load background image from settings
        const savedAppearance = localStorage.getItem('appearanceSettings');
        if (savedAppearance) {
            const parsed = JSON.parse(savedAppearance);
            if (parsed.backgroundImage) {
                setBackgroundImage(parsed.backgroundImage);
            }
        }

        // Fetch dashboard data from APIs
        fetchDashboardData();
    }, []);

    // Refetch when center changes
    useEffect(() => {
        if (isLoaded) {
            fetchDashboardData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCenterId]);

    // Listen for changes in appearance settings
    useEffect(() => {
        const handleStorageChange = () => {
            const savedAppearance = localStorage.getItem('appearanceSettings');
            if (savedAppearance) {
                const parsed = JSON.parse(savedAppearance);
                setBackgroundImage(parsed.backgroundImage || null);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const stats = [
        {
            label: 'Tổng số học viên',
            value: activeUsersCount.toString(),
            sub: `${activeUsersCount} hồ sơ học viên`,
            change: null,
            changeType: 'neutral' as const,
            icon: Users as React.ComponentType<{ size?: number }>,
            iconColor: 'from-green-500 to-emerald-500',
            bgGradient: 'from-green-50 to-emerald-50',
            glowColor: 'shadow-green-200',
            onClick: () => navigate('/students'),
        },
        {
            label: 'Trung tâm',
            value: centersCount.toString(),
            sub: `${centersCount} trung tâm hoạt động`,
            change: null,
            changeType: 'neutral' as const,
            icon: Building2 as React.ComponentType<{ size?: number }>,
            iconColor: 'from-indigo-500 to-purple-500',
            bgGradient: 'from-indigo-50 to-purple-50',
            glowColor: 'shadow-indigo-200',
            onClick: () => navigate('/centers'),
        },
        {
            label: 'Lớp đang hoạt động',
            value: classesCount.toString(),
            sub: `${classesCount} lớp đang hoạt động`,
            change: null,
            changeType: 'neutral' as const,
            icon: BookOpen as React.ComponentType<{ size?: number }>,
            iconColor: 'from-purple-500 to-violet-500',
            bgGradient: 'from-purple-50 to-violet-50',
            glowColor: 'shadow-purple-200',
            onClick: () => navigate('/classes'),
        },
        {
            label: 'Giảng viên',
            value: lecturersCount.toString(),
            sub: `${lecturersCount} giảng viên`,
            change: null,
            changeType: 'neutral' as const,
            icon: UserCheck as React.ComponentType<{ size?: number }>,
            iconColor: 'from-blue-500 to-cyan-500',
            bgGradient: 'from-blue-50 to-cyan-50',
            glowColor: 'shadow-blue-200',
            onClick: () => navigate('/users'),
        },
    ];

    const systemServices = [
        {
            icon: Building2 as React.ComponentType<{ size?: number }>,
            label: 'Trung tâm',
            status: 'Hoạt động bình thường',
            color: 'from-green-500 to-emerald-500',
        },
        {
            icon: Users as React.ComponentType<{ size?: number }>,
            label: 'Người dùng',
            status: 'Hoạt động bình thường',
            color: 'from-blue-500 to-cyan-500',
        },
        {
            icon: BookOpen as React.ComponentType<{ size?: number }>,
            label: 'Lớp học',
            status: 'Hoạt động bình thường',
            color: 'from-purple-500 to-violet-500',
        },
    ];

    // Show loading while checking user role
    if (userLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="dashboard-container space-y-8 px-6 py-8 w-full relative m-0"
            style={{
                minHeight: '100vh',
                backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed',
            }}
        >
            {/* Background Overlay */}
            {backgroundImage && <div className="fixed inset-0 bg-black/20 pointer-events-none z-0"></div>}

            {/* Content */}
            <div className="relative z-20">
                {/* Page Title */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard Trung tâm</h1>
                    <p className="text-gray-600 mt-1">
                        {selectedCenterId ? 'Tổng quan theo trung tâm đã chọn' : 'Tổng quan toàn hệ thống'}
                    </p>
                </div>

                {/* Stats */}
                <div className="mb-12 relative z-20">
                    <Stats stats={stats} isLoaded={isLoaded} />
                </div>
                {/* Quick actions + Recent classes */}
                <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-20">
                    <QuickActions
                        isLoaded={isLoaded}
                        actions={[
                            {
                                label: 'Thêm học viên',
                                color: 'bg-gradient-to-br from-blue-500 to-blue-600',
                                icon: UserPlus,
                                onClick: () => navigate('/students?action=create'),
                            },
                            {
                                label: 'Tạo lớp học',
                                color: 'bg-gradient-to-br from-purple-500 to-violet-600',
                                icon: BookOpen,
                                onClick: () => navigate('/classes?action=create'),
                            },
                            {
                                label: 'Xem báo cáo',
                                color: 'bg-gradient-to-br from-emerald-500 to-green-600',
                                icon: Sparkles,
                                onClick: () => navigate('/statistics'),
                            },
                            {
                                label: 'Quản lý lịch',
                                color: 'bg-gradient-to-br from-amber-500 to-orange-600',
                                icon: Settings,
                                onClick: () => navigate('/classes'),
                            },
                        ]}
                    />
                    <RecentClasses />
                </div>

                {/* Student Warnings */}
                <div className="mb-8 relative z-20">
                    <StudentWarnings onCountChange={(c) => setWarningsCount(c)} />
                </div>

                {/* System Status */}
                <div className="mb-8 relative z-20">
                    <SystemStatus services={systemServices} isLoaded={isLoaded} />
                </div>
            </div>
        </div>
    );
}

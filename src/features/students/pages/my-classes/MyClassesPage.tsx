import { useState, useEffect } from 'react';
import {
    Search,
    Eye,
    ArrowLeft,
    BookOpen,
    Users,
    Calendar,
    Loader2,
    CheckCircle,
    ArrowRight,
    ArrowUpDown,
    PlayCircle,
    Award,
    Flame,
    Target,
    Clock,
    Star,
    Lightbulb,
    GraduationCap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/stores/userProfile';
import { getMyClasses, type ClassDto } from '@/shared/api/classes';
import { getModulesByProgram, type ModuleResponse } from '@/shared/api/modules';
import { useToast } from '@/shared/hooks/useToast';
import { useProgressStore } from '../../hooks/useProgressStore';

// Types
type ClassStatus = 'Đang học' | 'Hoàn thành' | 'Sắp học';

// Module with resource info
type ModuleWithStatus = ModuleResponse & {
    status?: 'Hoàn thành' | 'Đang học' | 'Chưa học';
};

// Helper: Map StudyTime enum to time range
const getStudyTimeRange = (studyTime?: string): string => {
    const timeMap: Record<string, string> = {
        MORNING: '08:00 - 11:00',
        AFTERNOON: '14:00 - 17:00',
        EVENING: '18:00 - 21:00',
    };
    return studyTime ? timeMap[studyTime] || studyTime : '';
};

// Helper: Map StudyDay enum to Vietnamese
const getStudyDayLabel = (day: string): string => {
    const dayMap: Record<string, string> = {
        MONDAY: 'Thứ 2',
        TUESDAY: 'Thứ 3',
        WEDNESDAY: 'Thứ 4',
        THURSDAY: 'Thứ 5',
        FRIDAY: 'Thứ 6',
        SATURDAY: 'Thứ 7',
        SUNDAY: 'CN',
    };
    return dayMap[day] || day;
};

export default function MyClassesPage() {
    const toast = useToast();
    const navigate = useNavigate();
    const { me, loading: profileLoading } = useUserProfile();
    const { getLessonStatus, progress } = useProgressStore();

    const [view, setView] = useState<'list' | 'detail'>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('Tất cả');
    const [selectedClass, setSelectedClass] = useState<ClassDto | null>(null);

    // Data states
    const [classes, setClasses] = useState<ClassDto[]>([]);
    const [modules, setModules] = useState<ModuleWithStatus[]>([]);
    const [loading, setLoading] = useState(false);

    // Document viewer
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewFileName, setPreviewFileName] = useState<string>('');

    // Continue learning state
    const [continueLesson, setContinueLesson] = useState<{
        classId: number;
        className: string;
        moduleId: number;
        moduleName: string;
        lessonId: string;
        lessonTitle: string;
    } | null>(null);

    // Load classes when user profile is ready
    useEffect(() => {
        if (me?.userId) {
            loadClasses();
        }
    }, [me?.userId]);

    // Load classes for student
    const loadClasses = async () => {
        try {
            setLoading(true);
            const response = await getMyClasses();
            setClasses(response.data);

            // Find the most recent in-progress lesson
            await findContinueLesson(response.data);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Không thể tải danh sách lớp học');
        } finally {
            setLoading(false);
        }
    };

    // Find most recent in-progress lesson across all classes
    const findContinueLesson = async (classList: ClassDto[]) => {
        // Mock lesson generator (should match ClassModulesPage)
        const generateMockLessons = (moduleId: number, count: number) => {
            return Array.from({ length: count }).map((_, i) => ({
                id: `M${moduleId}-L${i + 1}`,
                title: `Bài học ${i + 1}`,
            }));
        };

        for (const cls of classList) {
            if (!cls.programId) continue;

            try {
                const modulesRes = await getModulesByProgram({ programId: cls.programId });

                for (const module of modulesRes.data) {
                    const lessonCount = module.credits ? Math.min(10, module.credits * 2) : 6;
                    const lessons = generateMockLessons(module.moduleId, lessonCount);

                    for (const lesson of lessons) {
                        const status = getLessonStatus(cls.classId.toString(), module.moduleId.toString(), lesson.id);
                        if (status === 'in-progress') {
                            setContinueLesson({
                                classId: cls.classId,
                                className: cls.name,
                                moduleId: module.moduleId,
                                moduleName: module.name,
                                lessonId: lesson.id,
                                lessonTitle: lesson.title,
                            });
                            return; // Found! Stop searching
                        }
                    }
                }
            } catch (e) {
                // Skip this class if error
                continue;
            }
        }
    };

    // Load modules for selected class
    const loadModules = async (programId: number) => {
        try {
            setLoading(true);
            const response = await getModulesByProgram({ programId });

            // Map modules with status
            const modulesData = response.data.map((module, index) => ({
                ...module,
                // Giả sử module đầu tiên là đang học, các module trước đó hoàn thành, sau đó chưa học
                status:
                    index === 0 ? ('Đang học' as const) : index < 2 ? ('Hoàn thành' as const) : ('Chưa học' as const),
            }));

            setModules(modulesData);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Không thể tải danh sách module');
        } finally {
            setLoading(false);
        }
    };

    // Handle view document
    const handleViewDocument = (resource: any) => {
        if (resource?.url) {
            setPreviewUrl(resource.url);
            setPreviewFileName(resource.fileName || 'Document');
        }
    };

    // Helper to check if class has any progress
    const hasClassProgress = (classId: number): boolean => {
        const classKey = classId.toString();

        // Check if there's any progress for this class
        for (const key in progress) {
            if (key.startsWith(`${classKey}:`)) {
                return true;
            }
        }
        return false;
    };

    // Helper to convert class status
    const getClassStatus = (classDto: ClassDto): ClassStatus => {
        // First check if user has started learning (has progress)
        if (hasClassProgress(classDto.classId)) {
            return 'Đang học';
        }

        // Otherwise use API status
        switch (classDto.status) {
            case 'ONGOING':
                return 'Đang học';
            case 'FINISHED':
                return 'Hoàn thành';
            case 'PLANNED':
                return 'Sắp học';
            default:
                return 'Đang học';
        }
    };

    // Filter classes
    const filteredClasses = classes.filter((cls) => {
        const matchesSearch =
            cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (cls.programName && cls.programName.toLowerCase().includes(searchQuery.toLowerCase()));

        const classStatus = getClassStatus(cls);
        const matchesStatus = statusFilter === 'Tất cả' || classStatus === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const handleBackToList = () => {
        setSelectedClass(null);
        setModules([]);
        setView('list');
    };

    const handleEnterClassroom = async (cls: ClassDto) => {
        // Click vào thẻ class → Vào trang module Khan Academy style
        // Truyền class data qua state để tránh fetch lại
        navigate(`/my-classes/${cls.classId}/modules`, {
            state: { classData: cls },
        });
    };

    const handleViewClassDetail = async (cls: ClassDto) => {
        // Click nút Eye → Xem chi tiết inline với module overview
        setSelectedClass(cls);
        if (cls.programId) {
            await loadModules(cls.programId);
        }
        setView('detail');
    };

    // Show loading
    if (profileLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-sm text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    // Render Class List
    if (view === 'list') {
        // Helper function to get user initials
        const getUserInitials = () => {
            if (!me?.fullName) return '?';
            const names = me.fullName.split(' ');
            return names.length >= 2
                ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
                : names[0][0].toUpperCase();
        };

        // Calculate stats
        const totalCourses = classes.length;
        const completedLessons = Object.values(progress).filter((entry) => entry.status === 'completed').length;

        // Mock recent activities
        const recentActivities = [
            {
                type: 'continue',
                title: 'Tiếp tục bài "State trong React"',
                time: '2 giờ trước',
                icon: PlayCircle,
                color: 'text-blue-600',
            },
            {
                type: 'complete',
                title: 'Hoàn thành chương "JavaScript cơ bản"',
                time: '1 ngày trước',
                icon: CheckCircle,
                color: 'text-green-600',
            },
            {
                type: 'enroll',
                title: 'Đăng ký khóa "Fullstack JS"',
                time: '3 ngày trước',
                icon: Star,
                color: 'text-yellow-600',
            },
        ];

        // Mock recommended courses
        const recommendedCourses = [
            {
                title: 'React Nâng cao',
                description: 'Hooks, Context, Performance',
                difficulty: 'Intermediate',
                students: '2.5k',
            },
            { title: 'NodeJS cơ bản', description: 'Backend với Express', difficulty: 'Beginner', students: '3.2k' },
            { title: 'Git & CI/CD', description: 'Version control hiện đại', difficulty: 'Beginner', students: '1.8k' },
        ];

        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
                <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8 animate-fade-in">
                    {/* ⭐ 1. Banner chào mừng */}
                    <div className="relative rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-8">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40"></div>

                        <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                {/* Avatar */}
                                <div className="relative group">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white to-blue-50 flex items-center justify-center text-2xl font-bold text-indigo-600 shadow-lg ring-4 ring-white/50 group-hover:scale-105 transition-transform">
                                        {getUserInitials()}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                                        <Flame className="w-3.5 h-3.5 text-white" />
                                    </div>
                                </div>

                                {/* Info */}
                                <div>
                                    <h1 className="text-3xl font-bold text-white mb-1 drop-shadow-lg">
                                        Chào {me?.fullName || 'bạn'}!
                                    </h1>
                                    <div className="flex items-center gap-3">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium text-white border border-white/30">
                                            <GraduationCap className="w-4 h-4" />
                                            Intermediate
                                        </span>
                                        <span className="text-blue-100 text-sm">Chúc bạn học tập hiệu quả! 🚀</span>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative Icon */}
                            <div className="hidden lg:block opacity-20">
                                <BookOpen className="w-32 h-32 text-white" strokeWidth={1} />
                            </div>
                        </div>
                    </div>

                    {/* ⭐ 2. Progress Overview (Minimal icon style - 2 cards stretched) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Card 1: Tổng số khóa */}
                        <div className="group bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-blue-100 hover:-translate-y-0.5">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-10 h-10 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center">
                                    <BookOpen className="w-5 h-5 text-blue-600" />
                                </div>
                                <span className="text-xs font-medium text-blue-600 bg-blue-50/70 px-2 py-1 rounded-full border border-blue-200">
                                    Active
                                </span>
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 mb-1">{totalCourses}</h3>
                            <p className="text-sm text-gray-600">Tổng số lớp học</p>
                        </div>

                        {/* Card 2: Bài học hoàn thành */}
                        <div className="group bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-green-100 hover:-translate-y-0.5">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-10 h-10 rounded-md bg-green-50 border border-green-200 flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <span className="text-xs font-medium text-green-600 bg-green-50/70 px-2 py-1 rounded-full border border-green-200">
                                    +12
                                </span>
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 mb-1">{completedLessons}</h3>
                            <p className="text-sm text-gray-600">Bài học đã hoàn thành</p>
                        </div>
                    </div>

                    {/* ⭐ 3. Lớp học của tôi - Grid 3x2 với nền highlight */}
                    <div className="bg-blue-100/60 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">Lớp học của tôi</h2>
                            <span className="text-sm text-gray-500">{filteredClasses.length} lớp học</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredClasses.length === 0 ? (
                                <div className="col-span-full text-center py-16 text-gray-500">
                                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                    <p>Không tìm thấy lớp học nào.</p>
                                </div>
                            ) : (
                                <>
                                    {filteredClasses.map((cls, index) => {
                                        const classStatus = getClassStatus(cls);

                                        // Mảng các background pattern đẹp theo ảnh mẫu
                                        const backgrounds = [
                                            // 1. Circuit board - mạch điện xanh ngọc
                                            {
                                                gradient: 'from-teal-500 to-cyan-600',
                                                pattern: (
                                                    <svg
                                                        className="absolute inset-0 w-full h-full opacity-30"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                        <defs>
                                                            <pattern
                                                                id={`circuit-${cls.classId}`}
                                                                x="0"
                                                                y="0"
                                                                width="60"
                                                                height="60"
                                                                patternUnits="userSpaceOnUse"
                                                            >
                                                                <path
                                                                    d="M10,10 L50,10 M10,20 L30,20 M40,20 L50,20 M10,30 L20,30 M30,30 L50,30 M10,40 L50,40 M10,50 L30,50 M40,50 L50,50"
                                                                    stroke="currentColor"
                                                                    strokeWidth="2"
                                                                    fill="none"
                                                                />
                                                                <circle cx="30" cy="20" r="3" fill="currentColor" />
                                                                <circle cx="20" cy="30" r="3" fill="currentColor" />
                                                                <rect
                                                                    x="38"
                                                                    y="18"
                                                                    width="4"
                                                                    height="4"
                                                                    fill="currentColor"
                                                                />
                                                                <rect
                                                                    x="28"
                                                                    y="28"
                                                                    width="4"
                                                                    height="4"
                                                                    fill="currentColor"
                                                                />
                                                            </pattern>
                                                        </defs>
                                                        <rect
                                                            width="100%"
                                                            height="100%"
                                                            fill="url(#circuit-${cls.classId})"
                                                            className="text-white"
                                                        />
                                                    </svg>
                                                ),
                                            },
                                            // 2. Geometric triangles - hình học màu pastel
                                            {
                                                gradient: 'from-pink-300 via-purple-300 to-blue-300',
                                                pattern: (
                                                    <svg
                                                        className="absolute inset-0 w-full h-full opacity-40"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                        <defs>
                                                            <pattern
                                                                id={`geometric-${cls.classId}`}
                                                                x="0"
                                                                y="0"
                                                                width="80"
                                                                height="80"
                                                                patternUnits="userSpaceOnUse"
                                                            >
                                                                <polygon
                                                                    points="0,0 40,0 20,35"
                                                                    fill="rgba(255,255,255,0.3)"
                                                                />
                                                                <polygon
                                                                    points="40,0 80,0 60,35"
                                                                    fill="rgba(255,255,255,0.2)"
                                                                />
                                                                <polygon
                                                                    points="20,35 60,35 40,70"
                                                                    fill="rgba(255,255,255,0.25)"
                                                                />
                                                                <polygon
                                                                    points="0,40 40,40 20,75"
                                                                    fill="rgba(255,255,255,0.2)"
                                                                />
                                                                <polygon
                                                                    points="40,40 80,40 60,75"
                                                                    fill="rgba(255,255,255,0.3)"
                                                                />
                                                            </pattern>
                                                        </defs>
                                                        <rect
                                                            width="100%"
                                                            height="100%"
                                                            fill="url(#geometric-${cls.classId})"
                                                        />
                                                    </svg>
                                                ),
                                            },
                                            // 3. Galaxy stars - thiên hà tím
                                            {
                                                gradient: 'from-indigo-900 via-purple-800 to-pink-700',
                                                pattern: (
                                                    <svg
                                                        className="absolute inset-0 w-full h-full opacity-60"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                        <defs>
                                                            <radialGradient id={`galaxy-${cls.classId}`}>
                                                                <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
                                                                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                                                            </radialGradient>
                                                        </defs>
                                                        <circle cx="20%" cy="30%" r="2" fill="white" opacity="0.8" />
                                                        <circle cx="80%" cy="20%" r="1.5" fill="white" opacity="0.6" />
                                                        <circle
                                                            cx="50%"
                                                            cy="50%"
                                                            r="3"
                                                            fill={`url(#galaxy-${cls.classId})`}
                                                        />
                                                        <circle cx="70%" cy="60%" r="1" fill="white" opacity="0.7" />
                                                        <circle cx="30%" cy="70%" r="1.5" fill="white" opacity="0.5" />
                                                        <circle cx="85%" cy="80%" r="1" fill="white" opacity="0.6" />
                                                        <circle cx="15%" cy="85%" r="2" fill="white" opacity="0.4" />
                                                        <ellipse
                                                            cx="50%"
                                                            cy="50%"
                                                            rx="40%"
                                                            ry="15%"
                                                            fill="rgba(255,255,255,0.1)"
                                                            transform="rotate(-30 50 50)"
                                                        />
                                                    </svg>
                                                ),
                                            },
                                            // 4. Maze pattern - mê cung vàng xanh
                                            {
                                                gradient: 'from-teal-700 to-teal-900',
                                                pattern: (
                                                    <svg
                                                        className="absolute inset-0 w-full h-full opacity-40"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                        <defs>
                                                            <pattern
                                                                id={`maze-${cls.classId}`}
                                                                x="0"
                                                                y="0"
                                                                width="40"
                                                                height="40"
                                                                patternUnits="userSpaceOnUse"
                                                            >
                                                                <path
                                                                    d="M0,0 L0,40 M10,0 L10,30 M20,10 L20,40 M30,0 L30,30 M40,0 L40,40 M0,10 L30,10 M10,20 L40,20 M0,30 L20,30"
                                                                    stroke="rgba(251,191,36,0.8)"
                                                                    strokeWidth="2.5"
                                                                    fill="none"
                                                                />
                                                            </pattern>
                                                        </defs>
                                                        <rect
                                                            width="100%"
                                                            height="100%"
                                                            fill="url(#maze-${cls.classId})"
                                                        />
                                                    </svg>
                                                ),
                                            },
                                            // 5. Waves - sóng xanh lá
                                            {
                                                gradient: 'from-emerald-400 to-teal-500',
                                                pattern: (
                                                    <svg
                                                        className="absolute inset-0 w-full h-full opacity-25"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                        <defs>
                                                            <pattern
                                                                id={`waves-${cls.classId}`}
                                                                x="0"
                                                                y="0"
                                                                width="100"
                                                                height="100"
                                                                patternUnits="userSpaceOnUse"
                                                            >
                                                                <path
                                                                    d="M0,50 Q25,30 50,50 T100,50"
                                                                    stroke="white"
                                                                    strokeWidth="3"
                                                                    fill="none"
                                                                />
                                                                <path
                                                                    d="M0,70 Q25,50 50,70 T100,70"
                                                                    stroke="white"
                                                                    strokeWidth="3"
                                                                    fill="none"
                                                                />
                                                                <path
                                                                    d="M0,30 Q25,10 50,30 T100,30"
                                                                    stroke="white"
                                                                    strokeWidth="2"
                                                                    fill="none"
                                                                    opacity="0.5"
                                                                />
                                                            </pattern>
                                                        </defs>
                                                        <rect
                                                            width="100%"
                                                            height="100%"
                                                            fill="url(#waves-${cls.classId})"
                                                        />
                                                    </svg>
                                                ),
                                            },
                                            // 6. Dots grid - chấm tròn gradient
                                            {
                                                gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
                                                pattern: (
                                                    <svg
                                                        className="absolute inset-0 w-full h-full opacity-30"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                        <defs>
                                                            <pattern
                                                                id={`dots-${cls.classId}`}
                                                                x="0"
                                                                y="0"
                                                                width="30"
                                                                height="30"
                                                                patternUnits="userSpaceOnUse"
                                                            >
                                                                <circle cx="15" cy="15" r="3" fill="white" />
                                                                <circle
                                                                    cx="0"
                                                                    cy="0"
                                                                    r="2"
                                                                    fill="white"
                                                                    opacity="0.5"
                                                                />
                                                                <circle
                                                                    cx="30"
                                                                    cy="0"
                                                                    r="2"
                                                                    fill="white"
                                                                    opacity="0.5"
                                                                />
                                                                <circle
                                                                    cx="0"
                                                                    cy="30"
                                                                    r="2"
                                                                    fill="white"
                                                                    opacity="0.5"
                                                                />
                                                                <circle
                                                                    cx="30"
                                                                    cy="30"
                                                                    r="2"
                                                                    fill="white"
                                                                    opacity="0.5"
                                                                />
                                                            </pattern>
                                                        </defs>
                                                        <rect
                                                            width="100%"
                                                            height="100%"
                                                            fill="url(#dots-${cls.classId})"
                                                        />
                                                    </svg>
                                                ),
                                            },
                                        ];

                                        const background = backgrounds[index % backgrounds.length];

                                        return (
                                            <div
                                                key={cls.classId}
                                                className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300"
                                            >
                                                {/* Thumbnail/Header với pattern đẹp */}
                                                <div
                                                    className={`h-28 bg-gradient-to-br ${background.gradient} relative overflow-hidden`}
                                                >
                                                    {background.pattern}
                                                </div>

                                                {/* Body */}
                                                <div className="p-5 pt-5">
                                                    <h3 className="text-base font-semibold text-gray-900 line-clamp-2 mb-1">
                                                        {cls.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 mb-4">3 CHƯƠNG • 40 BÀI HỌC</p>

                                                    <div className="flex items-center justify-end">
                                                        {/* Action Button */}
                                                        <button
                                                            onClick={() => handleEnterClassroom(cls)}
                                                            className={`px-5 py-2 rounded-lg text-sm font-medium transition border ${
                                                                classStatus === 'Đang học'
                                                                    ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                                                                    : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                                            }`}
                                                        >
                                                            {classStatus === 'Đang học' ? 'Tiếp tục' : 'Bắt đầu'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Placeholder card nếu số lượng < 6 */}
                                    {filteredClasses.length < 6 && (
                                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300 cursor-pointer group">
                                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                <Lightbulb className="w-8 h-8 text-blue-600" />
                                            </div>
                                            <h3 className="font-semibold text-gray-700 mb-2">Khám phá thêm</h3>
                                            <p className="text-sm text-gray-500 mb-4">
                                                Xem các lớp học được đề xuất cho bạn
                                            </p>
                                            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                                Xem gợi ý →
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* ⭐ 5. Gợi ý lớp học */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">Gợi ý lớp học</h2>
                            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                Xem thêm →
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {recommendedCourses.map((course, idx) => (
                                <div
                                    key={idx}
                                    className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-pointer group"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                                            {course.title.substring(0, 1)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                                                {course.title}
                                            </h3>
                                            <p className="text-xs text-gray-500 mb-2">{course.description}</p>
                                            <div className="flex items-center gap-3 text-xs">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                                                    <Target className="w-3 h-3" />
                                                    {course.difficulty}
                                                </span>
                                                <span className="inline-flex items-center gap-1 text-gray-600">
                                                    <Users className="w-3 h-3" />
                                                    {course.students} học viên
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ⭐ 7. Footer */}
                    <div className="mt-12 pt-8 border-t border-gray-200">
                        <div className="text-center">
                            <p className="text-sm text-gray-500">
                                © 2024 <span className="font-semibold text-gray-700">Education Management</span>
                                {' • '}
                                <span className="text-blue-600">Powered by Huy Dev Team</span>
                            </p>
                            <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-400">
                                <a href="#" className="hover:text-blue-600 transition-colors">
                                    Về chúng tôi
                                </a>
                                <span>•</span>
                                <a href="#" className="hover:text-blue-600 transition-colors">
                                    Điều khoản
                                </a>
                                <span>•</span>
                                <a href="#" className="hover:text-blue-600 transition-colors">
                                    Hỗ trợ
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Render Class Detail (inline module overview + actions)
    if (view === 'detail' && selectedClass) {
        // Determine "tiếp tục" module (first Đang học or first Chưa học)
        const continueModule =
            modules.find((m) => m.status === 'Đang học') || modules.find((m) => m.status !== 'Hoàn thành');
        return (
            <div className="space-y-6">
                <button
                    onClick={handleBackToList}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={16} />
                    <span>Quay lại danh sách lớp</span>
                </button>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedClass.name}</h1>
                            <p className="text-sm text-gray-500">Mã lớp: #{selectedClass.classId}</p>
                        </div>
                        <span
                            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                                getClassStatus(selectedClass) === 'Đang học'
                                    ? 'bg-blue-100 text-blue-700'
                                    : getClassStatus(selectedClass) === 'Hoàn thành'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                            {getClassStatus(selectedClass)}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <BookOpen className="text-gray-400" size={20} />
                            <div>
                                <p className="text-xs text-gray-500">Chương trình</p>
                                <p className="text-sm font-medium text-gray-900">{selectedClass.programName}</p>
                            </div>
                        </div>
                        {(selectedClass.studyDays || selectedClass.studyTime) && (
                            <div className="flex items-center gap-3">
                                <Calendar className="text-gray-400" size={20} />
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 mb-1">Lịch học</p>
                                    {selectedClass.studyDays && (
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs text-gray-500">Ngày:</span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {selectedClass.studyDays.map(getStudyDayLabel).join(', ')}
                                            </span>
                                        </div>
                                    )}
                                    {selectedClass.studyTime && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">Giờ:</span>
                                            <span className="text-sm font-semibold text-blue-600">
                                                {getStudyTimeRange(selectedClass.studyTime)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {selectedClass.room && (
                            <div className="flex items-center gap-3">
                                <Users className="text-gray-400" size={20} />
                                <div>
                                    <p className="text-xs text-gray-500">Phòng học</p>
                                    <p className="text-sm font-medium text-gray-900">{selectedClass.room}</p>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                        {continueModule && (
                            <button
                                onClick={() =>
                                    navigate(`/my-classes/${selectedClass.classId}/modules/${continueModule.moduleId}`)
                                }
                                className="px-4 py-2 rounded-md bg-gray-900 text-white text-sm flex items-center gap-2"
                            >
                                <ArrowRight size={16} />
                                Tiếp tục
                            </button>
                        )}
                        <button
                            onClick={() => navigate(`/my-classes/${selectedClass.classId}/modules`)}
                            className="px-4 py-2 rounded-md border text-sm flex items-center gap-2 hover:bg-gray-50"
                        >
                            <BookOpen size={16} />
                            Xem tất cả module
                        </button>
                        {/* TODO: Tạo trang riêng cho sắp xếp module với drag-drop */}
                        <button
                            onClick={() => toast.info('Chức năng sắp xếp module đang được phát triển')}
                            className="px-4 py-2 rounded-md border text-sm flex items-center gap-2 hover:bg-gray-50"
                            title="Chức năng này sẽ cho phép bạn sắp xếp lại thứ tự các module không bắt buộc"
                        >
                            <ArrowUpDown size={16} />
                            Sắp xếp module
                        </button>
                    </div>
                </div>

                {/* Inline module overview (limit 6) */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Tổng quan module</h2>
                    {modules.length === 0 ? (
                        <div className="text-sm text-gray-500 py-8 text-center">Chưa có module nào.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {modules.slice(0, 6).map((m) => {
                                const completed = m.status === 'Hoàn thành';
                                return (
                                    <div
                                        key={m.moduleId}
                                        className="group border rounded-lg bg-white p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-medium text-sm line-clamp-2 pr-2">{m.name}</h3>
                                            {completed ? (
                                                <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full bg-gray-200 flex-shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-600 line-clamp-3 mb-3">
                                            {m.description || 'Không có mô tả'}
                                        </p>
                                        <div className="flex items-center gap-2 mb-3 text-[11px] text-gray-500">
                                            <span>Mã: {m.code}</span>
                                            <span>• {m.credits} tín chỉ</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span
                                                className={`text-[11px] px-2 py-0.5 rounded-full ${
                                                    m.status === 'Hoàn thành'
                                                        ? 'bg-green-100 text-green-700'
                                                        : m.status === 'Đang học'
                                                          ? 'bg-blue-100 text-blue-700'
                                                          : 'bg-gray-100 text-gray-700'
                                                }`}
                                            >
                                                {m.status || 'Chưa học'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return null;
}

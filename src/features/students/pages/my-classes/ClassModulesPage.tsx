import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft,
    BookOpen,
    Calendar,
    Users,
    CheckCircle,
    PlayCircle,
    FileText,
    Video,
    ClipboardList,
    PenTool,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { useToast } from '@/shared/hooks/useToast';
import { getMyClasses, type ClassDto } from '@/shared/api/classes';
import { getModulesByProgram, type ModuleResponse } from '@/shared/api/modules';
import { getLessonsByModule, type Lesson } from '@/shared/api/lessons';
import { lessonProgressApi, type LessonProgressResponse } from '@/shared/api/lesson-progress';
import { useUserProfile } from '@/stores/userProfile';
import { useProgressStore } from '../../hooks/useProgressStore';

// Augment module with status used elsewhere
interface ModuleWithStatus extends ModuleResponse {
    status?: 'Hoàn thành' | 'Đang học' | 'Chưa học';
}

const getStudyTimeRange = (studyTime?: string): string => {
    const timeMap: Record<string, string> = {
        MORNING: '08:00 - 11:00',
        AFTERNOON: '14:00 - 17:00',
        EVENING: '18:00 - 21:00',
    };
    return studyTime ? timeMap[studyTime] || studyTime : '';
};

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

export default function ClassModulesPage() {
    const { classId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();
    const { me } = useUserProfile();
    const { getLessonStatus, getModuleProgress } = useProgressStore();

    const [loading, setLoading] = useState(false);
    const [cls, setCls] = useState<ClassDto | null>(null);
    const [modules, setModules] = useState<ModuleWithStatus[]>([]);
    const [moduleLessons, setModuleLessons] = useState<Record<number, Lesson[]>>({});
    const [moduleProgressData, setModuleProgressData] = useState<
        Record<number, { total: number; completed: number; percentage: number }>
    >({});
    const [lessonProgressMap, setLessonProgressMap] = useState<Record<number, LessonProgressResponse>>({});
    const [expandedSemesters, setExpandedSemesters] = useState<Record<string, boolean>>({});

    // Ref to track if we already fetched to prevent re-fetch on re-render
    const hasFetchedRef = useRef(false);

    // Reset fetch flag when classId changes
    useEffect(() => {
        hasFetchedRef.current = false;
    }, [classId]);

    const refreshProgressData = async () => {
        if (modules.length === 0) return;
        const progressMap: Record<number, { total: number; completed: number; percentage: number }> = {};

        try {
            await Promise.all(
                modules.map(async (m) => {
                    try {
                        const lessons = moduleLessons[m.moduleId] || [];
                        if (lessons.length > 0) {
                            const lessonIds = lessons.map((l: Lesson) => l.lessonId);
                            const progressData = await lessonProgressApi.getProgressBulk(lessonIds);

                            // Calculate completed lessons
                            const completed = Object.values(progressData).filter(
                                (p: LessonProgressResponse) => p.status === 'COMPLETED',
                            ).length;

                            const percentage = Math.round((completed / lessons.length) * 100);

                            const newProgress = {
                                total: lessons.length,
                                completed: completed,
                                percentage: percentage,
                            };
                            progressMap[m.moduleId] = newProgress;
                        } else {
                            progressMap[m.moduleId] = { total: 0, completed: 0, percentage: 0 };
                        }
                    } catch (err) {
                        progressMap[m.moduleId] = moduleProgressData[m.moduleId] || {
                            total: 0,
                            completed: 0,
                            percentage: 0,
                        };
                    }
                }),
            );
            setModuleProgressData(progressMap);
        } catch (error) {
        }
    };

    // Refresh progress after modules are loaded
    useEffect(() => {
        if (modules.length > 0 && !loading) {
            // Delay slightly to ensure modules state is stable
            const timer = setTimeout(() => {
                refreshProgressData();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [modules.length, loading]);

    useEffect(() => {
        // Prevent multiple fetches
        if (hasFetchedRef.current) return;

        const run = async () => {
            try {
                setLoading(true);

                // Try to get class data from navigation state first (faster)
                const passedClass = location.state?.classData as ClassDto | undefined;
                let found: ClassDto | undefined = passedClass;

                // If no state passed, fetch from API
                if (!found) {
                    const classesRes = await getMyClasses();
                    found = classesRes.data.find((c: ClassDto) => c.classId.toString() === classId);
                }

                if (!found) {
                    toast.error('Không tìm thấy lớp học');
                    return;
                }
                setCls(found);
                if (found.programId) {
                    const mRes = await getModulesByProgram({ programId: found.programId });
                    const modulesData: ModuleWithStatus[] = mRes.data.map((m: ModuleResponse) => ({
                        ...m,
                        status: 'Chưa học', // Will update based on progress
                    }));
                    setModules(modulesData);
                    // Fetch real lessons and progress for each module
                    const lessonsMap: Record<number, Lesson[]> = {};
                    const progressMap: Record<number, { total: number; completed: number; percentage: number }> = {};

                    await Promise.all(
                        modulesData.map(async (m) => {
                            try {
                                const lessonsRes = await getLessonsByModule(m.moduleId);
                                const lessons = lessonsRes.data || [];
                                lessonsMap[m.moduleId] = lessons;

                                // Fetch progress from lesson-progress API
                                if (lessons.length > 0) {
                                    try {
                                        const lessonIds = lessons.map((l: Lesson) => l.lessonId);
                                        const progressData = await lessonProgressApi.getProgressBulk(lessonIds);

                                        // Calculate completed lessons
                                        const completed = Object.values(progressData).filter(
                                            (p: LessonProgressResponse) => p.status === 'COMPLETED',
                                        ).length;

                                        const percentage =
                                            lessons.length > 0 ? Math.round((completed / lessons.length) * 100) : 0;

                                        progressMap[m.moduleId] = {
                                            total: lessons.length,
                                            completed: completed,
                                            percentage: percentage,
                                        };
                                    } catch (err) {
                                        progressMap[m.moduleId] = { 
                                            total: lessons.length, 
                                            completed: 0, 
                                            percentage: 0 
                                        };
                                    }
                                } else {
                                    progressMap[m.moduleId] = { total: 0, completed: 0, percentage: 0 };
                                }
                            } catch (err) {
                                lessonsMap[m.moduleId] = [];
                                progressMap[m.moduleId] = { total: 0, completed: 0, percentage: 0 };
                            }
                        }),
                    );
                    setModuleLessons(lessonsMap);
                    setModuleProgressData(progressMap);

                    // Load lesson progress for all lessons
                    const allLessonIds: number[] = [];
                    Object.values(lessonsMap).forEach((lessons) => {
                        lessons.forEach((lesson) => allLessonIds.push(lesson.lessonId));
                    });
                    if (allLessonIds.length > 0) {
                        try {
                            const lessonProgress = await lessonProgressApi.getProgressBulk(allLessonIds);
                            setLessonProgressMap(lessonProgress);
                        } catch (err) {
                        }
                    }
                }

                // Mark as fetched
                hasFetchedRef.current = true;
            } catch (e: any) {
                toast.error(e?.response?.data?.message || 'Không thể tải dữ liệu');
            } finally {
                setLoading(false);
            }
        };
        if (me?.userId && !hasFetchedRef.current) {
            // Mark as fetched BEFORE running to avoid repeated retries on error
            hasFetchedRef.current = true;
            run();
        }
    }, [me?.userId, classId]);

    const getClassStatus = (status?: string) => {
        switch (status) {
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

    const handleLessonClick = (moduleId: number, lessonId: string, lessonType: string) => {
        // Prevent event bubbling to module card
        if (lessonType === 'QUIZ') {
            navigate(`/my-classes/${classId}/modules/${moduleId}/lessons/${lessonId}/quiz`);
        } else {
            navigate(`/my-classes/${classId}/modules/${moduleId}/lessons/${lessonId}`);
        }
    };

    const getLessonTypeIcon = (type: string) => {
        switch (type) {
            case 'VIDEO':
                return <Video size={14} className="text-[#0277BD]" />;
            case 'DOCUMENT':
                return <FileText size={14} className="text-[#2E7D32]" />;
            case 'QUIZ':
                return <ClipboardList size={14} className="text-[#6A1B9A]" />;
            case 'ASSIGNMENT':
                return <PenTool size={14} className="text-[#E65100]" />;
            default:
                return <FileText size={14} className="text-gray-600" />;
        }
    };

    // Group modules by semester
    const groupedModules = useMemo(() => {
        const groups: Record<string, ModuleWithStatus[]> = {};
        modules.forEach((module) => {
            const semester = module.semester || 'Chưa phân kỳ';
            if (!groups[semester]) {
                groups[semester] = [];
            }
            groups[semester].push(module);
        });
        return groups;
    }, [modules]);

    // Initialize all semesters as expanded on first load
    useEffect(() => {
        if (Object.keys(groupedModules).length > 0 && Object.keys(expandedSemesters).length === 0) {
            const initialExpanded: Record<string, boolean> = {};
            Object.keys(groupedModules).forEach((semester) => {
                initialExpanded[semester] = true;
            });
            setExpandedSemesters(initialExpanded);
        }
    }, [groupedModules, expandedSemesters]);

    const toggleSemester = (semester: string) => {
        setExpandedSemesters((prev) => ({
            ...prev,
            [semester]: !prev[semester],
        }));
    };

    // Use progress data from API
    const moduleProgressMap = moduleProgressData;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
                <div className="max-w-6xl mx-auto">
                    {/* Header skeleton */}
                    <div className="h-8 bg-gray-200 rounded w-32 mb-6 animate-pulse"></div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-6">
                        <div className="h-8 bg-gray-200 rounded w-2/3 mb-4 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                    </div>
                    {/* Modules skeleton */}
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-xl mb-4 p-4 animate-pulse">
                            <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!cls) {
        return (
            <div className="space-y-4">
                <button
                    onClick={() => navigate('/my-classes')}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft size={16} /> Quay lại
                </button>
                <div className="text-sm text-gray-500">Không tìm thấy lớp học.</div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 p-6">
            <button
                onClick={() => navigate('/my-classes')}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition"
            >
                <ArrowLeft size={16} /> Quay lại danh sách lớp
            </button>

            {/* Class header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl p-8 text-white shadow-lg">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{cls.name}</h1>
                        <p className="text-blue-100 text-sm">Mã lớp: #{cls.classId}</p>
                    </div>
                    <span className="px-4 py-2 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm">
                        {getClassStatus(cls.status)}
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-3">
                        <BookOpen size={20} className="text-blue-200" />
                        <div>
                            <p className="text-blue-100 text-xs">Chương trình</p>
                            <p className="font-medium">{cls.programName}</p>
                        </div>
                    </div>
                    {(cls.studyDays || cls.studyTime) && (
                        <div className="flex items-center gap-3">
                            <Calendar size={20} className="text-blue-200" />
                            <div>
                                <p className="text-blue-100 text-xs">Lịch học</p>
                                <p className="font-medium">
                                    {cls.studyDays?.map(getStudyDayLabel).join(', ')} •{' '}
                                    {getStudyTimeRange(cls.studyTime)}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modules list */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">Nội dung lớp học</h2>
                <div className="space-y-4">
                    {Object.entries(groupedModules).map(([semester, semesterModules]) => {
                        const isExpanded = expandedSemesters[semester];

                        return (
                            <div
                                key={semester}
                                className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden"
                            >
                                {/* Semester Header - Clickable */}
                                <button
                                    onClick={() => toggleSemester(semester)}
                                    className="w-full bg-gradient-to-br from-[#003366] to-[#00556B] px-6 py-4 flex items-center justify-between hover:from-[#002244] hover:to-[#004455] transition-all duration-200"
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <h2 className="text-xl font-bold text-white">
                                            {semester === 'Chưa phân kỳ' ? semester : `Kỳ ${semester}`}
                                        </h2>
                                        <span className="text-sm font-normal text-white/90 bg-white/20 px-3 py-1 rounded-full">
                                            {semesterModules.length} module
                                        </span>
                                    </div>
                                    <div className="text-white ml-auto flex-shrink-0">
                                        {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                    </div>
                                </button>

                                {/* Modules List - Collapsible */}
                                {isExpanded && (
                                    <div className="divide-y divide-gray-200">
                                        {semesterModules.map((module) => {
                                            const progressData = moduleProgressData[module.moduleId];
                                            const totalLessons = progressData?.total || 0;
                                            const completedLessons = progressData?.completed || 0;
                                            const progressPercentage = progressData?.percentage || 0;
                                            const lessons = moduleLessons[module.moduleId] || [];

                                            return (
                                                <div
                                                    key={module.moduleId}
                                                    className="p-6 bg-gradient-to-r from-gray-50 to-white hover:from-[#E8F4F8] hover:to-white transition-all duration-200"
                                                >
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex-1">
                                                            {/* Module Title - Made Prominent */}
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00796B] to-[#004D40] flex items-center justify-center shadow-lg">
                                                                    <BookOpen size={24} className="text-white" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                                                                        {module.name}
                                                                    </h3>
                                                                    <p className="text-xs text-gray-500">
                                                                        {module.code} • {module.credits} tín chỉ
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <p className="text-sm text-gray-600 ml-15">
                                                                {module.description || 'Không có mô tả'}
                                                            </p>
                                                        </div>
                                                        <div className="ml-6 flex-shrink-0">
                                                            {/* Circular Progress */}
                                                            <div className="relative w-20 h-20">
                                                                <svg
                                                                    width="80"
                                                                    height="80"
                                                                    className="transform -rotate-90"
                                                                >
                                                                    <circle
                                                                        cx="40"
                                                                        cy="40"
                                                                        r="36"
                                                                        fill="none"
                                                                        stroke="#e5e7eb"
                                                                        strokeWidth="6"
                                                                    />
                                                                    <circle
                                                                        cx="40"
                                                                        cy="40"
                                                                        r="36"
                                                                        fill="none"
                                                                        stroke={
                                                                            progressPercentage >= 100
                                                                                ? '#22c55e'
                                                                                : '#00796B'
                                                                        }
                                                                        strokeWidth="6"
                                                                        strokeDasharray={2 * Math.PI * 36}
                                                                        strokeDashoffset={
                                                                            2 *
                                                                            Math.PI *
                                                                            36 *
                                                                            (1 - progressPercentage / 100)
                                                                        }
                                                                        strokeLinecap="round"
                                                                        style={{
                                                                            transition: 'stroke-dashoffset 0.3s ease',
                                                                        }}
                                                                    />
                                                                </svg>
                                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                                    <span className="text-xl font-bold text-gray-900">
                                                                        {Math.round(progressPercentage)}%
                                                                    </span>
                                                                    <span className="text-xs text-gray-500 mt-0.5">
                                                                        {completedLessons}/{totalLessons}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {lessons.length > 0 ? (
                                                        <div className="space-y-1 mt-4 ml-15">
                                                            {lessons
                                                                .sort(
                                                                    (a, b) =>
                                                                        (a.lessonOrder || 0) - (b.lessonOrder || 0),
                                                                )
                                                                .map((lesson) => {
                                                                    const lessonProgress =
                                                                        lessonProgressMap[lesson.lessonId];
                                                                    const isCompleted =
                                                                        lessonProgress?.status === 'COMPLETED';

                                                                    return (
                                                                        <div
                                                                            key={lesson.lessonId}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleLessonClick(
                                                                                    module.moduleId,
                                                                                    String(lesson.lessonId),
                                                                                    lesson.lessonType,
                                                                                );
                                                                            }}
                                                                            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#E8F4F8] hover:text-[#00796B] hover:underline cursor-pointer transition-all duration-200 group border border-transparent hover:border-[#B2DFDB]"
                                                                        >
                                                                            <div className="flex-shrink-0">
                                                                                {getLessonTypeIcon(lesson.lessonType)}
                                                                            </div>
                                                                            <div className="flex-shrink-0 w-8 text-sm font-medium text-gray-500 group-hover:text-[#00796B]">
                                                                                {lesson.lessonOrder}
                                                                            </div>
                                                                            <div className="flex-1 text-sm font-medium text-gray-700 group-hover:text-[#00796B]">
                                                                                {lesson.lessonTitle}
                                                                            </div>
                                                                            {isCompleted && (
                                                                                <CheckCircle
                                                                                    size={20}
                                                                                    className="flex-shrink-0 text-green-600"
                                                                                />
                                                                            )}
                                                                            {lesson.lessonType === 'QUIZ' && (
                                                                                <span className="flex-shrink-0 text-xs px-2 py-1 bg-[#F3E5F5] text-[#6A1B9A] rounded-full font-medium">
                                                                                    Quiz
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-8 text-gray-500 text-sm ml-15">
                                                            Không có bài học nào
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, CheckCircle, PlayCircle, Search, Bell } from 'lucide-react';
import { getMyClasses, type ClassDto } from '@/shared/api/classes';
import { getModulesByProgram, type ModuleResponse } from '@/shared/api/modules';
import { useProgressStore } from '../../hooks/useProgressStore';
import { useToast } from '@/shared/hooks/useToast';
import { useUserProfile } from '@/stores/userProfile';

interface LessonItem {
    id: string;
    title: string;
    duration?: string;
    type?: 'video' | 'article' | 'exercise';
}

interface Semester {
    id: number;
    title: string;
    moduleCount: number;
}

// Helper function to get unique semesters from modules
const getSemestersFromModules = (modules: ModuleResponse[]): Semester[] => {
    const semesterMap = new Map<number, number>();

    modules.forEach((module) => {
        const semester = module.semester || 1;
        semesterMap.set(semester, (semesterMap.get(semester) || 0) + 1);
    });

    return Array.from(semesterMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([semesterId, count]) => ({
            id: semesterId,
            title: `Kỳ ${semesterId}`,
            moduleCount: count,
        }));
};

// Helper function to group modules by semester
const groupModulesBySemester = (modules: ModuleResponse[]) => {
    const grouped = modules.reduce(
        (acc, module) => {
            const semester = module.semester || 1;
            if (!acc[semester]) {
                acc[semester] = [];
            }
            acc[semester].push(module);
            return acc;
        },
        {} as Record<number, ModuleResponse[]>,
    );
    return grouped;
};

// Mock lesson generator
const generateMockLessons = (moduleId: number, count: number): LessonItem[] => {
    const lessonTypes: Array<'video' | 'article' | 'exercise'> = ['video', 'article', 'exercise'];
    return Array.from({ length: count }).map((_, i) => ({
        id: `M${moduleId}-L${i + 1}`,
        title:
            i === 0 ? 'AI là gì?' : i === 1 ? 'Năng lực hiểu biết về AI' : i === 2 ? 'Sơ lược về AI' : `Học ${i + 1}`,
        duration: `${8 + (i % 5)}m`,
        type: lessonTypes[i % 3],
    }));
};

// Mock quiz generator - one quiz per semester
const generateSemesterQuiz = (semesterId: number): LessonItem => ({
    id: `QUIZ-SEM${semesterId}`,
    title: `Bài kiểm tra cuối kỳ ${semesterId}`,
    duration: '15m',
    type: 'exercise',
});

export default function AllCoursesPage() {
    const navigate = useNavigate();
    const { courseId } = useParams();
    const toast = useToast();
    const { getLessonStatus } = useProgressStore();
    const { me } = useUserProfile();

    const [selectedClass, setSelectedClass] = useState<ClassDto | null>(null);
    const [modules, setModules] = useState<ModuleResponse[]>([]);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'overview' | 'semester'>('overview');
    const [searchQuery, setSearchQuery] = useState('');

    const getUserInitials = () => {
        if (!me?.fullName) return '?';
        const names = me.fullName.split(' ');
        return names.length >= 2
            ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
            : names[0][0].toUpperCase();
    };

    // Load class and modules when courseId changes
    useEffect(() => {
        if (courseId) {
            loadClassAndModules(courseId);
        }
    }, [courseId]);

    const loadClassAndModules = async (classId: string) => {
        try {
            setLoading(true);
            // Load class info
            const classesRes = await getMyClasses();
            const found = classesRes.data.find((c: ClassDto) => c.classId.toString() === classId);

            if (!found) {
                toast.error('Không tìm thấy lớp học');
                navigate('/my-classes');
                return;
            }

            setSelectedClass(found);

            // Load modules
            if (found.programId) {
                const response = await getModulesByProgram({ programId: found.programId });
                setModules(response.data);

                // Generate semesters list from modules
                const semestersList = getSemestersFromModules(response.data);
                setSemesters(semestersList);
            }
        } catch (error: any) {
            toast.error('Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const handleCourseCardClick = () => {
        // Click on course card -> show all semesters (overview mode)
        setViewMode('overview');
        setSelectedSemester(null);
    };

    const handleSemesterSelect = (semester: Semester) => {
        // Click on specific semester -> show modules of that semester
        setSelectedSemester(semester);
        setViewMode('semester');
    };

    const handleLessonClick = (moduleId: number, lessonId: string) => {
        if (!selectedClass) return;
        navigate(`/my-classes/${selectedClass.classId}/modules/${moduleId}/lessons/${lessonId}`);
    };

    if (loading && !selectedClass) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-sm text-gray-600">Đang tải...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-50 to-cyan-50 shadow-sm backdrop-blur-sm bg-opacity-95">
                <div className="px-6 h-16 flex items-center justify-between">
                    {/* Logo and Brand - Centered */}
                    <div className="flex-1 flex justify-center">
                        <button
                            onClick={() => navigate('/my-classes')}
                            className="group flex items-center space-x-3 rounded-md px-3 py-1.5 transition-colors hover:bg-white/50"
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

                    {/* Right Side */}
                    <div className="flex items-center gap-3">
                        <button className="relative rounded-full p-2 hover:bg-gray-100">
                            <Bell className="h-6 w-6 text-gray-600" />
                            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-blue-500"></span>
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-sm font-bold text-white">
                                {getUserInitials()}
                            </div>
                            <span className="text-sm font-medium text-gray-700">{me?.fullName}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Full Screen Layout */}
            <div className="flex">
                {/* Left Sidebar - Chapters List */}
                <aside className="w-80 bg-white/50 backdrop-blur-sm border-r border-blue-100 min-h-screen overflow-y-auto">
                    <div className="p-6">
                        <div className="mb-6">
                            <button
                                onClick={() => navigate('/my-classes')}
                                className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"
                            >
                                ← Quay lại
                            </button>
                        </div>

                        {/* Course Title - Clickable */}
                        {selectedClass && (
                            <div className="mb-6">
                                <button
                                    onClick={handleCourseCardClick}
                                    className={`w-full text-left rounded-lg p-3 transition ${
                                        viewMode === 'overview'
                                            ? 'bg-blue-50 border-l-4 border-blue-600'
                                            : 'hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0">
                                            <BookOpen className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h2 className="text-base font-bold text-gray-900">{selectedClass.name}</h2>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {semesters.length} KỲ • {modules.length} MÔN
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        )}

                        {/* Semesters List */}
                        <div className="space-y-2">
                            {semesters.map((semester) => (
                                <button
                                    key={semester.id}
                                    onClick={() => handleSemesterSelect(semester)}
                                    className={`w-full text-left rounded-lg p-3 transition ${
                                        selectedSemester?.id === semester.id
                                            ? 'bg-blue-50 border-l-4 border-blue-600'
                                            : 'hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="text-sm font-semibold text-gray-900">{semester.title}</div>
                                    <div className="text-xs text-gray-500 mt-1">{semester.moduleCount} môn học</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Right Content - Conditional rendering based on viewMode */}
                <main className="flex-1 overflow-y-auto bg-white">
                    {selectedClass ? (
                        <div className="max-w-5xl mx-auto px-8 py-8">
                            {/* OVERVIEW MODE: Show all semesters */}
                            {viewMode === 'overview' && (
                                <>
                                    <div className="mb-8">
                                        <h1 className="text-4xl font-bold text-gray-900 mb-3">{selectedClass.name}</h1>
                                    </div>

                                    {/* All Semesters as Cards */}
                                    <div className="space-y-4">
                                        {semesters.map((semester) => (
                                            <div
                                                key={semester.id}
                                                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition cursor-pointer"
                                                onClick={() => handleSemesterSelect(semester)}
                                            >
                                                <div className="p-6">
                                                    <div className="flex items-start gap-5">
                                                        <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                                                            <BookOpen className="w-8 h-8 text-white" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-xl font-bold text-blue-600 mb-2">
                                                                {semester.title}
                                                            </h3>
                                                            <div className="text-sm text-gray-600">
                                                                <div>{semester.moduleCount} môn học</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* SEMESTER MODE: Show modules & lessons of selected semester */}
                            {viewMode === 'semester' && selectedSemester && (
                                <>
                                    <div className="mb-8">
                                        {/* Breadcrumb */}
                                        <nav className="text-sm text-gray-600 mb-2">
                                            <span className="font-medium text-gray-900">eduMange</span>
                                            <span className="mx-2">/</span>
                                            <span className="text-gray-900">{selectedClass?.name || '...'}</span>
                                            <span className="mx-2">/</span>
                                            <span className="text-gray-900">{selectedSemester.title}</span>
                                        </nav>
                                        <div className="flex items-center justify-between">
                                            <h1 className="text-4xl font-bold text-gray-900 mb-3">
                                                {selectedSemester.title}
                                            </h1>
                                            {/* Search input */}
                                            <div className="relative ml-4">
                                                <input
                                                    type="text"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    placeholder="Tìm kiếm bài học theo chữ"
                                                    className="w-64 pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Display all modules in this semester */}
                                    {(() => {
                                        const semesterModules = modules.filter(
                                            (module) => module.semester === selectedSemester.id,
                                        );

                                        if (semesterModules.length === 0) {
                                            return (
                                                <div className="rounded-xl border border-gray-200 bg-white p-8">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                        Kỳ này chưa có nội dung
                                                    </h3>
                                                    <p className="text-gray-600">
                                                        Vui lòng quay lại sau. Giáo viên/Quản trị có thể thêm module cho
                                                        kỳ này trong phần Quản lý chương trình.
                                                    </p>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div className="space-y-6">
                                                {semesterModules.map((module) => {
                                                    const lessonCount = module.credits
                                                        ? Math.min(10, module.credits * 2)
                                                        : 6;
                                                    const lessons = generateMockLessons(module.moduleId, lessonCount);

                                                    return (
                                                        <div
                                                            key={module.moduleId}
                                                            className="bg-white border border-blue-100 rounded-xl overflow-hidden"
                                                        >
                                                            {/* Module Header - Display Only */}
                                                            <div className="p-6 bg-gradient-to-r from-blue-50/50 to-cyan-50/30 border-b border-blue-100">
                                                                <div className="flex items-start gap-5">
                                                                    <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                                                                        <BookOpen className="w-8 h-8 text-white" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h3 className="text-xl font-bold text-blue-600 mb-2">
                                                                            {module.name}
                                                                        </h3>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Lessons List - Always Visible */}
                                                            <div className="border-t border-gray-200 bg-white">
                                                                {/* Section: Giới thiệu khóa học */}
                                                                <div className="px-8 py-4">
                                                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                                                        Giới thiệu khóa học
                                                                    </h4>
                                                                    <div className="space-y-1 mb-6">
                                                                        {lessons
                                                                            .filter((l) =>
                                                                                l.title
                                                                                    .toLowerCase()
                                                                                    .includes(
                                                                                        searchQuery.toLowerCase(),
                                                                                    ),
                                                                            )
                                                                            .slice(0, 3)
                                                                            .map((lesson, idx) => {
                                                                                const status = selectedClass
                                                                                    ? getLessonStatus(
                                                                                          selectedClass.classId.toString(),
                                                                                          module.moduleId.toString(),
                                                                                          lesson.id,
                                                                                      )
                                                                                    : 'not-started';
                                                                                const isCompleted =
                                                                                    status === 'completed';
                                                                                const isInProgress =
                                                                                    status === 'in-progress';

                                                                                return (
                                                                                    <button
                                                                                        key={lesson.id}
                                                                                        onClick={() =>
                                                                                            handleLessonClick(
                                                                                                module.moduleId,
                                                                                                lesson.id,
                                                                                            )
                                                                                        }
                                                                                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white transition group text-left"
                                                                                    >
                                                                                        {/* Play Icon */}
                                                                                        <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                                                                                            {lesson.type === 'video' ? (
                                                                                                <PlayCircle className="w-5 h-5 text-gray-600" />
                                                                                            ) : lesson.type ===
                                                                                              'article' ? (
                                                                                                <BookOpen className="w-5 h-5 text-gray-600" />
                                                                                            ) : (
                                                                                                <CheckCircle className="w-5 h-5 text-gray-400" />
                                                                                            )}
                                                                                        </div>

                                                                                        {/* Lesson Title */}
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <p className="text-sm font-normal text-gray-900">
                                                                                                {lesson.title}
                                                                                            </p>
                                                                                        </div>
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                    </div>

                                                                    {/* Section: Tổng quan về AI */}
                                                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                                                        Tổng quan về AI
                                                                    </h4>
                                                                    <div className="space-y-1 mb-6">
                                                                        {lessons
                                                                            .filter((l) =>
                                                                                l.title
                                                                                    .toLowerCase()
                                                                                    .includes(
                                                                                        searchQuery.toLowerCase(),
                                                                                    ),
                                                                            )
                                                                            .slice(3, 7)
                                                                            .map((lesson, idx) => {
                                                                                const status = selectedClass
                                                                                    ? getLessonStatus(
                                                                                          selectedClass.classId.toString(),
                                                                                          module.moduleId.toString(),
                                                                                          lesson.id,
                                                                                      )
                                                                                    : 'not-started';

                                                                                return (
                                                                                    <button
                                                                                        key={lesson.id}
                                                                                        onClick={() =>
                                                                                            handleLessonClick(
                                                                                                module.moduleId,
                                                                                                lesson.id,
                                                                                            )
                                                                                        }
                                                                                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white transition text-left"
                                                                                    >
                                                                                        <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                                                                                            <PlayCircle className="w-5 h-5 text-gray-600" />
                                                                                        </div>
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <p className="text-sm font-normal text-gray-900">
                                                                                                {lesson.title}
                                                                                            </p>
                                                                                        </div>
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                    </div>

                                                                    {/* Section: AI trong giáo dục */}
                                                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                                                        AI trong giáo dục
                                                                    </h4>
                                                                    <div className="space-y-1">
                                                                        {lessons
                                                                            .filter((l) =>
                                                                                l.title
                                                                                    .toLowerCase()
                                                                                    .includes(
                                                                                        searchQuery.toLowerCase(),
                                                                                    ),
                                                                            )
                                                                            .slice(7)
                                                                            .map((lesson) => (
                                                                                <button
                                                                                    key={lesson.id}
                                                                                    onClick={() =>
                                                                                        handleLessonClick(
                                                                                            module.moduleId,
                                                                                            lesson.id,
                                                                                        )
                                                                                    }
                                                                                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white transition text-left"
                                                                                >
                                                                                    <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                                                                                        <PlayCircle className="w-5 h-5 text-gray-600" />
                                                                                    </div>
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <p className="text-sm font-normal text-gray-900">
                                                                                            {lesson.title}
                                                                                        </p>
                                                                                    </div>
                                                                                </button>
                                                                            ))}
                                                                    </div>

                                                                    {/* Section: Quiz cuối kỳ */}
                                                                    <h4 className="text-sm font-semibold text-gray-900 mb-3 mt-6">
                                                                        Bài kiểm tra
                                                                    </h4>
                                                                    <div className="space-y-1">
                                                                        {(() => {
                                                                            const quiz = generateSemesterQuiz(
                                                                                selectedSemester.id,
                                                                            );
                                                                            const quizStatus = selectedClass
                                                                                ? getLessonStatus(
                                                                                      selectedClass.classId.toString(),
                                                                                      module.moduleId.toString(),
                                                                                      quiz.id,
                                                                                  )
                                                                                : 'not-started';

                                                                            return (
                                                                                <button
                                                                                    key={quiz.id}
                                                                                    onClick={() =>
                                                                                        navigate(`/quiz/${quiz.id}`)
                                                                                    }
                                                                                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-left bg-blue-50 border border-blue-200"
                                                                                >
                                                                                    <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                                                                                        <CheckCircle className="w-5 h-5 text-blue-600" />
                                                                                    </div>
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <p className="text-sm font-semibold text-blue-900">
                                                                                            {quiz.title}
                                                                                        </p>
                                                                                        <p className="text-xs text-blue-600">
                                                                                            {quiz.duration} • Trắc
                                                                                            nghiệm
                                                                                        </p>
                                                                                    </div>
                                                                                </button>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-screen">
                            <p className="text-gray-500 text-lg">Đang tải...</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

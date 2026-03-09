import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlayCircle, CheckCircle, FileText, Video, ClipboardList, PenTool } from 'lucide-react';
import { useToast } from '@/shared/hooks/useToast';
import { getModulesByProgram, type ModuleResponse } from '@/shared/api/modules';
import { getLessonsByModule } from '@/shared/api/lessons';
import { lessonProgressApi, type LessonProgressResponse } from '@/shared/api/lesson-progress';
import type { Lesson } from '@/shared/types/lesson';

export default function ModuleLessonsListPage() {
    const { classId, moduleId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    const [loading, setLoading] = useState(false);
    const [module, setModule] = useState<ModuleResponse | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [progressMap, setProgressMap] = useState<Record<number, LessonProgressResponse>>({});

    useEffect(() => {
        const loadData = async () => {
            if (!classId || !moduleId) return;

            try {
                setLoading(true);

                // Load module info
                const urlParams = new URLSearchParams(window.location.search);
                const programId = urlParams.get('programId');

                if (programId) {
                    const moduleResponse = await getModulesByProgram({ programId: parseInt(programId) });
                    const foundModule = moduleResponse.data.find(
                        (m: ModuleResponse) => m.moduleId.toString() === moduleId,
                    );

                    if (foundModule) {
                        setModule(foundModule);

                        // Load lessons from backend
                        try {
                            const lessonsResponse = await getLessonsByModule(parseInt(moduleId));
                            const loadedLessons = lessonsResponse.data || [];
                            setLessons(loadedLessons);

                            // Load progress for all lessons
                            if (loadedLessons.length > 0) {
                                try {
                                    const lessonIds = loadedLessons.map((l: Lesson) => l.lessonId);
                                    const progressData = await lessonProgressApi.getProgressBulk(lessonIds);
                                    setProgressMap(progressData);
                                } catch (progressError) {
                                }
                            }
                        } catch (lessonError) {
                            toast.error('Không thể tải danh sách bài học');
                            setLessons([]);
                        }
                    } else {
                        toast.error('Không tìm thấy module');
                    }
                }
            } catch (e: any) {
                toast.error(e?.response?.data?.message || 'Không thể tải dữ liệu');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [classId, moduleId]);

    const handleLessonClick = (lesson: Lesson) => {
        // Nếu là QUIZ, chuyển đến trang quiz
        if (lesson.lessonType === 'QUIZ') {
            navigate(`/my-classes/${classId}/modules/${moduleId}/lessons/${lesson.lessonId}/quiz`);
        } else {
            // Các loại khác (VIDEO, DOCUMENT, etc.) vào lesson viewer
            navigate(`/my-classes/${classId}/modules/${moduleId}/lessons/${lesson.lessonId}`);
        }
    };

    const getLessonTypeIcon = (type: string) => {
        switch (type) {
            case 'VIDEO':
                return <Video size={16} className="text-blue-600" />;
            case 'DOCUMENT':
                return <FileText size={16} className="text-green-600" />;
            case 'QUIZ':
                return <ClipboardList size={16} className="text-purple-600" />;
            case 'ASSIGNMENT':
                return <PenTool size={16} className="text-orange-600" />;
            default:
                return <FileText size={16} className="text-gray-600" />;
        }
    };

    const formatDuration = (minutes?: number): string => {
        if (!minutes) return '';
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-sm text-gray-600">Đang tải...</div>
            </div>
        );
    }

    if (!module) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-sm text-gray-600">Không tìm thấy module</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto p-6 space-y-6">
                {/* Header */}
                <button
                    onClick={() => navigate(`/my-classes/${classId}/modules`)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition font-medium"
                >
                    <ArrowLeft size={18} /> Quay lại
                </button>

                {/* Module info card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{module.name}</h1>
                    <p className="text-sm text-gray-600 mb-4">{module.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                        <span>📘 {module.code}</span>
                        <span>⏱️ {module.credits} tín chỉ</span>
                        <span>📚 {lessons.length} bài học</span>
                    </div>

                    {/* Progress bar */}
                    {lessons.length > 0 &&
                        (() => {
                            const total = lessons.length;
                            const completed = lessons.filter(
                                (l) => progressMap[l.lessonId]?.status === 'COMPLETED',
                            ).length;
                            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

                            return (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium text-gray-700">Tiến độ hoàn thành</span>
                                        <span className="font-bold text-blue-600">
                                            {completed}/{total} bài học
                                        </span>
                                    </div>
                                    <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <div className="text-xs text-gray-500 text-right">{percentage}% hoàn thành</div>
                                </div>
                            );
                        })()}
                </div>

                {/* Lessons list */}
                <div className="space-y-3">
                    {lessons.length === 0 ? (
                        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                            <FileText size={48} className="mx-auto text-gray-400 mb-3" />
                            <p className="text-sm text-gray-600">Module này chưa có bài học nào</p>
                        </div>
                    ) : (
                        lessons.map((lesson, idx) => {
                            const progress = progressMap[lesson.lessonId];
                            const isCompleted = progress?.status === 'COMPLETED';
                            const isInProgress =
                                progress && progress.progressPercentage > 0 && progress.status !== 'COMPLETED';
                            const progressPercentage = progress?.progressPercentage || 0;

                            return (
                                <div
                                    key={lesson.lessonId}
                                    onClick={() => handleLessonClick(lesson)}
                                    className="bg-white rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer p-4 group"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Number/Status icon */}
                                        <div className="flex-shrink-0">
                                            {isCompleted ? (
                                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                                    <CheckCircle size={24} className="text-green-600" />
                                                </div>
                                            ) : isInProgress ? (
                                                <div className="relative w-10 h-10">
                                                    <svg width="40" height="40" className="transform -rotate-90">
                                                        <circle
                                                            cx="20"
                                                            cy="20"
                                                            r="18"
                                                            fill="none"
                                                            stroke="#e5e7eb"
                                                            strokeWidth="3"
                                                        />
                                                        <circle
                                                            cx="20"
                                                            cy="20"
                                                            r="18"
                                                            fill="none"
                                                            stroke="#3b82f6"
                                                            strokeWidth="3"
                                                            strokeDasharray={2 * Math.PI * 18}
                                                            strokeDashoffset={
                                                                2 * Math.PI * 18 * (1 - progressPercentage / 100)
                                                            }
                                                            strokeLinecap="round"
                                                            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                                                        />
                                                    </svg>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className="text-xs font-semibold text-blue-600">
                                                            {Math.round(progressPercentage)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm">
                                                    {lesson.lessonOrder}
                                                </div>
                                            )}
                                        </div>

                                        {/* Lesson info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition">
                                                    {lesson.lessonTitle}
                                                </h3>
                                                {lesson.isMandatory && (
                                                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                                                        Bắt buộc
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    {getLessonTypeIcon(lesson.lessonType)}
                                                    {lesson.lessonType}
                                                </span>
                                                {lesson.durationMinutes && (
                                                    <span>⏱️ {formatDuration(lesson.durationMinutes)}</span>
                                                )}
                                                {lesson.contentType && <span>📺 {lesson.contentType}</span>}
                                            </div>
                                            {lesson.description && (
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                                    {lesson.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Status badge */}
                                        {isCompleted && (
                                            <div className="flex-shrink-0 text-xs font-medium text-green-600">
                                                Đã hoàn thành
                                            </div>
                                        )}
                                        {isInProgress && (
                                            <div className="flex-shrink-0 text-xs font-medium text-blue-600">
                                                Đang học
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

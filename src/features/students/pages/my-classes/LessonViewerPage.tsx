import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    CheckCircle,
    PlayCircle,
    FileText,
    Video,
    ClipboardList,
    PenTool,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { useToast } from '@/shared/hooks/useToast';
import { useProgressStore } from '../../hooks/useProgressStore';
import { getLessonById, updateLessonProgress, getLessonsByModule, getLessonsByClass } from '@/shared/api/lessons';
import { lessonProgressApi } from '@/shared/api/lesson-progress';
import type { Lesson } from '@/shared/types/lesson';
import { VimeoPlayer } from '@/features/students/components/VimeoPlayer';

// Type definition
type ModulesBySemester = Record<number, Lesson[]>;

export default function LessonViewerPage() {
    const { classId, moduleId, lessonId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const progressStore = useProgressStore();

    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [allLessons, setAllLessons] = useState<Lesson[]>([]);
    const [modulesBySemester, setModulesBySemester] = useState<ModulesBySemester>({});
    const [loading, setLoading] = useState(true);
    const [currentStatus, setCurrentStatus] = useState<'not-started' | 'in-progress' | 'completed'>('not-started');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [videoProgress, setVideoProgress] = useState(0);
    const [lastWatchedPosition, setLastWatchedPosition] = useState(0);
    const [videoCompleted, setVideoCompleted] = useState(false);
    const [progressMap, setProgressMap] = useState<Record<number, { progressPercentage: number; status: string }>>({});
    const [expandedSemesters, setExpandedSemesters] = useState<Record<number, boolean>>({});

    useEffect(() => {
        const loadLesson = async () => {
            if (!classId || !moduleId || !lessonId) return;

            try {
                setLoading(true);

                // Load all lessons in the same semester
                try {
                    const classLessonsResponse = await getLessonsByClass(parseInt(classId));
                    const allClassLessons: Lesson[] = classLessonsResponse.data;

                    // Find current lesson to get its semester
                    const currentLesson = allClassLessons.find((l) => l.lessonId === parseInt(lessonId));
                    const currentSemester = currentLesson?.moduleSemester || 1;
                    const currentModuleId = currentLesson?.moduleId || parseInt(moduleId);

                    // Filter only lessons in the same semester
                    const sameSemesterLessons = allClassLessons.filter(
                        (l) => (l.moduleSemester || 1) === currentSemester,
                    );
                    setAllLessons(sameSemesterLessons);

                    // Initialize expanded state - expand current module by default
                    const initialExpandedState: Record<number, boolean> = {};
                    const uniqueModules = [...new Set(sameSemesterLessons.map((l) => l.moduleId))];
                    uniqueModules.forEach((modId) => {
                        initialExpandedState[modId] = modId === currentModuleId;
                    });
                    setExpandedSemesters(initialExpandedState);

                    // Load progress for all lessons in semester
                    if (sameSemesterLessons.length > 0) {
                        try {
                            const lessonIds = sameSemesterLessons.map((l: Lesson) => l.lessonId);
                            const progressData = await lessonProgressApi.getProgressBulk(lessonIds);
                            setProgressMap(progressData);
                        } catch (error) {
                        }
                    }
                } catch (error) {
                    // Fallback: nếu API getLessonsByClass không có, dùng getLessonsByModule
                    const lessonsResponse = await getLessonsByModule(parseInt(moduleId));
                    const lessons = lessonsResponse.data.sort((a, b) => (a.lessonOrder || 0) - (b.lessonOrder || 0));
                    setAllLessons(lessons);
                    setExpandedSemesters({ 1: true });

                    // Load progress
                    if (lessons.length > 0) {
                        try {
                            const lessonIds = lessons.map((l: Lesson) => l.lessonId);
                            const progressData = await lessonProgressApi.getProgressBulk(lessonIds);
                            setProgressMap(progressData);
                        } catch (error) {
                        }
                    }
                }

                // Load lesson from backend
                const response = await getLessonById(parseInt(lessonId));
                setLesson(response.data);

                // Load video progress if it's a video lesson
                if (response.data.lessonType === 'VIDEO') {
                    try {
                        const progress = await lessonProgressApi.getProgress(parseInt(lessonId));
                        if (progress) {
                            setLastWatchedPosition(progress.lastWatchedPosition || 0);
                            setVideoProgress(progress.progressPercentage || 0);
                            if (progress.status === 'COMPLETED') {
                                setVideoCompleted(true);
                                setCurrentStatus('completed');
                                progressStore.setLessonStatus(classId, moduleId, lessonId, 'completed');
                            }
                        }
                    } catch (error) {
                    }
                }

                // Get current status from local store
                const status = progressStore.getLessonStatus(classId, moduleId, lessonId);
                setCurrentStatus(status);

                // If not started, mark as in-progress and save to backend
                if (status === 'not-started') {
                    try {
                        // Call API to create progress record in backend
                        await updateLessonProgress(parseInt(lessonId), {
                            progressPercentage: 0, // Chưa hoàn thành
                            lastWatchedPosition: 0,
                            timeSpentSeconds: 0,
                        });
                    } catch (error: any) {
                        // Continue anyway, will try again on complete
                    }

                    // Update local state
                    progressStore.setLessonStatus(classId, moduleId, lessonId, 'in-progress');
                    setCurrentStatus('in-progress');
                }
            } catch (error: any) {
                toast.error(error?.response?.data?.message || 'Không thể tải bài học');
            } finally {
                setLoading(false);
            }
        };

        loadLesson();
    }, [classId, moduleId, lessonId]);

    const handleComplete = async () => {
        if (!classId || !moduleId || !lessonId) return;
        try {
            // Call API to save progress to backend
            const response = await updateLessonProgress(parseInt(lessonId), {
                progressPercentage: 100,
                lastWatchedPosition: 0,
                timeSpentSeconds: 0,
            });
            // Update progress store (local state)
            progressStore.setLessonStatus(classId, moduleId, lessonId, 'completed');

            // Update local state immediately
            setCurrentStatus('completed');
            toast.success('Đã hoàn thành bài học!');

            // Delay navigation to show completed state
            setTimeout(() => {
                navigate(`/my-classes/${classId}/modules`);
            }, 1500);
        } catch (error: any) {
            toast.error(
                'Không thể cập nhật tiến độ: ' +
                    (error?.response?.data?.message || error?.message || 'Lỗi không xác định'),
            );
        }
    };

    const getLessonTypeIcon = (type: string) => {
        switch (type) {
            case 'VIDEO':
                return <Video size={16} className="text-gray-600" />;
            case 'DOCUMENT':
                return <FileText size={16} className="text-gray-600" />;
            case 'QUIZ':
                return <ClipboardList size={16} className="text-gray-600" />;
            case 'ASSIGNMENT':
                return <PenTool size={16} className="text-gray-600" />;
            default:
                return <FileText size={16} className="text-gray-600" />;
        }
    };

    const handleLessonClick = (selectedLessonId: string, lessonType: string) => {
        if (lessonType === 'QUIZ') {
            navigate(`/my-classes/${classId}/modules/${moduleId}/lessons/${selectedLessonId}/quiz`);
        } else {
            navigate(`/my-classes/${classId}/modules/${moduleId}/lessons/${selectedLessonId}`);
        }
    };

    const getLessonStatus = (lessonIdToCheck: string) => {
        if (!classId || !moduleId) return 'not-started';
        return progressStore.getLessonStatus(classId, moduleId, lessonIdToCheck);
    };

    // Function to convert Vimeo URL to embed URL
    const getVimeoEmbedUrl = (url: string): string => {
        // Extract video ID from various Vimeo URL formats
        const patterns = [
            /vimeo\.com\/(\d+)/, // https://vimeo.com/123456789
            /player\.vimeo\.com\/video\/(\d+)/, // https://player.vimeo.com/video/123456789
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                // Add timestamp parameter if there's a saved position
                const baseUrl = `https://player.vimeo.com/video/${match[1]}`;
                if (lastWatchedPosition > 0) {
                    return `${baseUrl}#t=${Math.floor(lastWatchedPosition)}s`;
                }
                return baseUrl;
            }
        }

        // If already embed URL, return as is
        if (url.includes('player.vimeo.com')) {
            return url;
        }

        return url;
    };

    // Function to convert Google Drive URL to embed URL
    const getGoogleDriveEmbedUrl = (url: string): string => {
        // Convert /view to /preview for embedding
        // From: https://drive.google.com/file/d/FILE_ID/view
        // To: https://drive.google.com/file/d/FILE_ID/preview?embedded=true
        let embedUrl = url.replace('/view', '/preview');

        // Add parameters to hide UI elements and show only content
        const separator = embedUrl.includes('?') ? '&' : '?';
        embedUrl += `${separator}embedded=true&rm=minimal`;

        return embedUrl;
    };

    // Track video progress
    const handleVideoMessage = (event: MessageEvent) => {
        try {
            const data = JSON.parse(event.data);

            if (data.event === 'timeupdate') {
                const currentTime = data.data.seconds;
                const duration = data.data.duration;

                if (duration > 0) {
                    const progress = Math.round((currentTime / duration) * 100);
                    setVideoProgress(progress);
                    setLastWatchedPosition(currentTime);

                    // Auto-save progress every 10 seconds
                    if (Math.floor(currentTime) % 10 === 0 && lessonId) {
                        updateLessonProgress(parseInt(lessonId), {
                            progressPercentage: progress,
                            lastWatchedPosition: currentTime,
                            timeSpentSeconds: Math.floor(currentTime),
                        }).catch(() => {});
                    }

                    // Auto-complete if watched > 90%
                    if (progress >= 90 && currentStatus !== 'completed') {
                        handleComplete();
                    }
                }
            }
        } catch (e) {
            // Ignore non-JSON messages
        }
    };

    useEffect(() => {
        window.addEventListener('message', handleVideoMessage);
        return () => window.removeEventListener('message', handleVideoMessage);
    }, [currentStatus, lessonId]);

    if (loading || !lesson) {
        return (
            <div className="fixed inset-0 bg-gray-50 flex items-center justify-center">
                <div className="text-sm text-gray-600">Đang tải bài học...</div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[#FAFAFA] overflow-hidden flex">
            {/* Sidebar - Lessons list */}
            <div
                className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col overflow-hidden ${
                    sidebarOpen ? 'w-80' : 'w-0'
                }`}
                style={{ height: '100vh' }}
            >
                {sidebarOpen && (
                    <>
                        {/* Sidebar header */}
                        <div className="px-4 py-4 border-b bg-gradient-to-br from-[#003366] to-[#00556B] flex-shrink-0">
                            <h2 className="font-bold text-white text-lg flex items-center gap-2">
                                <PlayCircle size={20} />
                                Danh sách bài học
                            </h2>
                            <p className="text-sm text-white/90 mt-1">{allLessons.length} bài học trong lớp</p>
                        </div>

                        {/* Lessons by semester - Accordion */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="space-y-0">
                                {/* Group lessons by module */}
                                {Object.entries(
                                    allLessons.reduce<Record<string, typeof allLessons>>((acc, lesson) => {
                                        const moduleKey = `${lesson.moduleSemester || 1}-${lesson.moduleName || 'Module'}`;
                                        if (!acc[moduleKey]) acc[moduleKey] = [];
                                        acc[moduleKey].push(lesson);
                                        return acc;
                                    }, {}),
                                )
                                    .sort(([a], [b]) => {
                                        const [semA] = a.split('-');
                                        const [semB] = b.split('-');
                                        return Number(semA) - Number(semB);
                                    })
                                    .map(([moduleKey, moduleLessons]) => {
                                        const [semester, ...moduleNameParts] = moduleKey.split('-');
                                        const moduleName = moduleNameParts.join('-');
                                        const moduleId = moduleLessons[0]?.moduleId;
                                        const isExpanded = expandedSemesters[moduleId || 0];

                                        // Calculate module progress
                                        const completedCount = moduleLessons.filter(
                                            (l) => progressMap[l.lessonId]?.status === 'COMPLETED',
                                        ).length;
                                        const progressPercent = Math.round(
                                            (completedCount / moduleLessons.length) * 100,
                                        );

                                        // Check if this module contains the current lesson
                                        const isActiveModule = moduleLessons.some(
                                            (l) => String(l.lessonId) === lessonId,
                                        );

                                        return (
                                            <div key={moduleKey} className="border-b border-gray-200 last:border-b-0">
                                                {/* Module header */}
                                                <button
                                                    onClick={() =>
                                                        setExpandedSemesters((prev) => ({
                                                            ...prev,
                                                            [moduleId || 0]: !prev[moduleId || 0],
                                                        }))
                                                    }
                                                    className={`w-full px-3 py-2.5 transition-all flex items-center justify-between gap-2.5 group border-l-4 ${
                                                        isActiveModule
                                                            ? 'bg-[#E8F4F8] border-l-[#00796B] hover:bg-[#D0EBF3]'
                                                            : 'bg-white border-l-transparent hover:border-l-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <div
                                                        className={`font-semibold text-base flex-1 text-left ${
                                                            isActiveModule ? 'text-[#00796B]' : 'text-gray-900'
                                                        }`}
                                                    >
                                                        {moduleName}
                                                    </div>
                                                    <div className="flex-shrink-0">
                                                        {isExpanded ? (
                                                            <ChevronDown
                                                                size={18}
                                                                className={
                                                                    isActiveModule ? 'text-[#00796B]' : 'text-gray-600'
                                                                }
                                                            />
                                                        ) : (
                                                            <ChevronUp
                                                                size={18}
                                                                className={
                                                                    isActiveModule ? 'text-[#00796B]' : 'text-gray-600'
                                                                }
                                                            />
                                                        )}
                                                    </div>
                                                </button>

                                                {/* Lessons in module */}
                                                {isExpanded && (
                                                    <div className="space-y-0">
                                                        {moduleLessons
                                                            .sort((a, b) => a.lessonOrder - b.lessonOrder)
                                                            .map((item) => {
                                                                const isActive = String(item.lessonId) === lessonId;
                                                                const status = getLessonStatus(String(item.lessonId));
                                                                const progress = progressMap[item.lessonId];
                                                                const isCompleted = progress?.status === 'COMPLETED';
                                                                const isInProgress =
                                                                    progress &&
                                                                    progress.progressPercentage > 0 &&
                                                                    progress.status !== 'COMPLETED';
                                                                const progressPercentage = isActive
                                                                    ? videoProgress
                                                                    : progress?.progressPercentage || 0;

                                                                return (
                                                                    <button
                                                                        key={item.lessonId}
                                                                        onClick={() =>
                                                                            handleLessonClick(
                                                                                String(item.lessonId),
                                                                                item.lessonType,
                                                                            )
                                                                        }
                                                                        className={`w-full text-left px-2.5 py-2 transition-all duration-200 group border-l-4 ${
                                                                            isActive
                                                                                ? 'bg-[#E8F4F8] border-l-[#00796B]'
                                                                                : 'hover:bg-gray-50 border-l-transparent hover:border-l-gray-300'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-start gap-1.5">
                                                                            {/* Progress indicator or icon */}
                                                                            <div className="flex-shrink-0 mt-0.5">
                                                                                {item.lessonType === 'VIDEO' &&
                                                                                isCompleted ? (
                                                                                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                                                                        <CheckCircle
                                                                                            size={14}
                                                                                            className="text-gray-600"
                                                                                        />
                                                                                    </div>
                                                                                ) : item.lessonType === 'VIDEO' &&
                                                                                  (isInProgress || isActive) ? (
                                                                                    <div className="relative w-6 h-6">
                                                                                        <svg
                                                                                            width="24"
                                                                                            height="24"
                                                                                            className="transform -rotate-90"
                                                                                        >
                                                                                            <circle
                                                                                                cx="12"
                                                                                                cy="12"
                                                                                                r="10"
                                                                                                fill="none"
                                                                                                stroke="#e5e7eb"
                                                                                                strokeWidth="2"
                                                                                            />
                                                                                            <circle
                                                                                                cx="12"
                                                                                                cy="12"
                                                                                                r="10"
                                                                                                fill="none"
                                                                                                stroke="#6b7280"
                                                                                                strokeWidth="2"
                                                                                                strokeDasharray={
                                                                                                    2 * Math.PI * 10
                                                                                                }
                                                                                                strokeDashoffset={
                                                                                                    2 *
                                                                                                    Math.PI *
                                                                                                    10 *
                                                                                                    (1 -
                                                                                                        progressPercentage /
                                                                                                            100)
                                                                                                }
                                                                                                strokeLinecap="round"
                                                                                                style={{
                                                                                                    transition:
                                                                                                        'stroke-dashoffset 0.3s ease',
                                                                                                }}
                                                                                            />
                                                                                        </svg>
                                                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                                                            <span className="text-[9px] font-bold text-gray-600">
                                                                                                {Math.round(
                                                                                                    progressPercentage,
                                                                                                )}
                                                                                                %
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    getLessonTypeIcon(item.lessonType)
                                                                                )}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p
                                                                                    className={`text-sm line-clamp-2 transition-colors ${
                                                                                        isActive
                                                                                            ? 'text-[#00796B] font-semibold'
                                                                                            : 'text-gray-700 font-normal group-hover:text-[#00796B] group-hover:font-medium'
                                                                                    }`}
                                                                                >
                                                                                    {item.lessonTitle}
                                                                                </p>
                                                                                {item.durationMinutes && (
                                                                                    <p className="text-[10px] text-gray-500 mt-0.5">
                                                                                        ⏱️ {item.durationMinutes} phút
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Toggle sidebar button */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="absolute left-0 top-20 z-20 bg-white border border-gray-200 rounded-r-lg shadow-md hover:shadow-lg transition-all duration-200 p-2"
                style={{
                    left: sidebarOpen ? '320px' : '0px',
                    transition: 'left 0.3s ease-in-out',
                }}
                title={sidebarOpen ? 'Ẩn danh sách' : 'Hiện danh sách'}
            >
                {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>

            {/* Main content area */}
            <div className="flex-1 overflow-y-auto">
                {/* Top navigation bar */}
                <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
                    <div className="px-6 py-4 flex items-center justify-between">
                        <button
                            onClick={() => navigate(`/my-classes/${classId}/modules`)}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition font-medium"
                        >
                            <ArrowLeft size={18} /> Quay lại
                        </button>
                    </div>
                </div>

                {/* Main content */}
                <div className="max-w-6xl mx-auto px-6 py-8">
                    {/* Lesson title */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{lesson.lessonTitle}</h1>
                        {lesson.description && <p className="text-gray-600">{lesson.description}</p>}
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                            <span>📘 {lesson.lessonType}</span>
                            {lesson.durationMinutes && <span>⏱️ {lesson.durationMinutes} phút</span>}
                            {lesson.contentType && <span>📺 {lesson.contentType}</span>}
                        </div>
                    </div>

                    {/* Video player - Vimeo with SDK */}
                    {lesson.contentUrl && lesson.lessonType === 'VIDEO' && lesson.contentType === 'VIMEO' && (
                        <div className="space-y-4 mx-auto" style={{ maxWidth: '1000px' }}>
                            <VimeoPlayer
                                videoUrl={lesson.contentUrl}
                                lessonId={lesson.lessonId}
                                lastPosition={lastWatchedPosition}
                                onProgressUpdate={(progress, completed) => {
                                    // Kiểm tra xem video đã hoàn thành chưa (từ state hoặc từ progressMap)
                                    const wasCompleted =
                                        videoCompleted || progressMap[lesson.lessonId]?.status === 'COMPLETED';

                                    // Chỉ cập nhật UI nếu video chưa hoàn thành
                                    if (!wasCompleted) {
                                        setVideoProgress(progress);
                                        // Update progressMap for realtime sidebar display
                                        setProgressMap((prev) => ({
                                            ...prev,
                                            [lesson.lessonId]: {
                                                progressPercentage: progress,
                                                status: completed ? 'COMPLETED' : 'IN_PROGRESS',
                                            },
                                        }));
                                    }

                                    // Chỉ trigger completed event lần đầu tiên
                                    if (completed && !videoCompleted) {
                                        setVideoCompleted(true);
                                        setCurrentStatus('completed');
                                        progressStore.setLessonStatus(classId!, moduleId!, lessonId!, 'completed');
                                        toast.success('Chúc mừng! Bạn đã hoàn thành video này');
                                    }
                                }}
                            />
                        </div>
                    )}

                    {/* Fallback for non-Vimeo or old iframe */}
                    {lesson.contentUrl && lesson.lessonType === 'VIDEO' && lesson.contentType !== 'VIMEO' && (
                        <div className="space-y-4">
                            <div
                                className="bg-black rounded-xl overflow-hidden shadow-2xl"
                                style={{ aspectRatio: '16/9' }}
                            >
                                <iframe
                                    src={lesson.contentUrl}
                                    title={lesson.lessonTitle}
                                    className="w-full h-full"
                                    allow="autoplay; fullscreen; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>

                            {/* Video Progress Bar for non-Vimeo */}
                            {videoProgress > 0 && videoProgress < 100 && (
                                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700">Tiến độ xem video</span>
                                        <span className="text-sm font-bold text-[#00796B]">{videoProgress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-[#00796B] to-[#004D40] transition-all duration-300"
                                            style={{ width: `${videoProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Video sẽ tự động hoàn thành khi xem đủ 90%
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Document viewer for other content types */}
                    {lesson.contentUrl && lesson.lessonType === 'DOCUMENT' && (
                        <div className="space-y-4 mb-8">
                            {lesson.contentType === 'GOOGLE_DRIVE' ? (
                                // Google Drive iframe embed - clean view without Drive UI
                                <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                                        <h2 className="text-xl font-bold text-gray-900">Tài liệu học tập</h2>
                                        <a
                                            href={lesson.contentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-[#0277BD] hover:text-[#01579B] hover:underline font-medium inline-flex items-center gap-2"
                                        >
                                            <FileText size={16} />
                                            Mở trong Drive
                                        </a>
                                    </div>
                                    <div className="bg-gray-100">
                                        <iframe
                                            src={getGoogleDriveEmbedUrl(lesson.contentUrl)}
                                            title={lesson.lessonTitle}
                                            className="w-full"
                                            style={{ minHeight: '700px', height: '75vh', border: 'none' }}
                                            allow="autoplay"
                                        />
                                    </div>
                                </div>
                            ) : (
                                // Other document types - show link only
                                <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Tài liệu học tập</h2>
                                    <a
                                        href={lesson.contentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#0277BD] hover:text-[#01579B] hover:underline font-medium"
                                    >
                                        Xem tài liệu →
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Lesson content */}
                    {lesson.description && (
                        <div className="bg-white rounded-xl p-8 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Nội dung bài học</h2>
                            <div className="prose max-w-none text-gray-700">
                                <p className="whitespace-pre-wrap">{lesson.description}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

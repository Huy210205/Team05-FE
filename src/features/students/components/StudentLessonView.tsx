import React, { useState, useEffect } from 'react';
import { Video, FileText, ClipboardList, PenTool, CheckCircle, Circle, Clock, ExternalLink } from 'lucide-react';
import { useToast } from '@/shared/hooks/useToast';
import { getLessonsByModule, getModuleProgress, updateLessonProgress } from '@/shared/api/lessons';
import type { Lesson, ModuleProgress } from '@/shared/types/lesson';

interface StudentLessonViewProps {
  moduleId: number;
  moduleName: string;
}

const StudentLessonView: React.FC<StudentLessonViewProps> = ({ moduleId, moduleName }) => {
  const { success: showSuccess, error: showError } = useToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<ModuleProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    loadData();
  }, [moduleId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [lessonsRes, progressRes] = await Promise.all([
        getLessonsByModule(moduleId),
        getModuleProgress(moduleId).catch(() => ({ data: null })),
      ]);
      
      setLessons(lessonsRes.data || []);
      setProgress(progressRes.data);
    } catch (error: any) {
      showError('Lỗi tải dữ liệu', error?.response?.data?.message || 'Không thể tải danh sách bài học');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProgress = async (lessonId: number, progressPercentage: number, timeSpent?: number) => {
    try {
      await updateLessonProgress(lessonId, {
        progressPercentage,
        timeSpentSeconds: timeSpent || 0,
      });
      
      // Reload progress
      const progressRes = await getModuleProgress(moduleId);
      setProgress(progressRes.data);
      
      if (progressPercentage >= 100) {
        showSuccess('Hoàn thành bài học', 'Bạn đã hoàn thành bài học này');
      }
    } catch (error: any) {
      showError('Lỗi cập nhật tiến độ', error?.response?.data?.message || 'Không thể cập nhật tiến độ học tập');
    }
  };

  const getLessonProgress = (lessonId: number) => {
    if (!progress) return null;
    const lessonProgress = progress.lessons.find(l => l.lessonId === lessonId);
    return lessonProgress?.progress || null;
  };

  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case 'VIDEO': return <Video size={20} className="text-blue-600" />;
      case 'DOCUMENT': return <FileText size={20} className="text-green-600" />;
      case 'QUIZ': return <ClipboardList size={20} className="text-purple-600" />;
      case 'ASSIGNMENT': return <PenTool size={20} className="text-orange-600" />;
      default: return <FileText size={20} className="text-gray-600" />;
    }
  };

  const getLessonTypeBadge = (type: string) => {
    switch (type) {
      case 'VIDEO': return 'bg-blue-100 text-blue-700';
      case 'DOCUMENT': return 'bg-green-100 text-green-700';
      case 'QUIZ': return 'bg-purple-100 text-purple-700';
      case 'ASSIGNMENT': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Clock size={48} className="mx-auto mb-3 animate-spin" />
        Đang tải bài học...
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <FileText size={48} className="mx-auto text-gray-400 mb-3" />
        <p className="text-sm font-medium text-gray-700">
          Module này chưa có bài học nào
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Module Progress Overview */}
      {progress && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Tiến độ học tập</h3>
            <span className="text-sm font-medium text-blue-700">
              {progress.completedLessons}/{progress.totalLessons} bài học
            </span>
          </div>
          <div className="w-full bg-white rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-500"
              style={{ width: `${progress.progressPercentage}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Hoàn thành {progress.progressPercentage.toFixed(0)}%
          </div>
        </div>
      )}

      {/* Lessons List */}
      <div className="space-y-3">
        {lessons
          .sort((a, b) => a.lessonOrder - b.lessonOrder)
          .map((lesson) => {
            const lessonProgress = getLessonProgress(lesson.lessonId);
            const isCompleted = lessonProgress?.isCompleted || false;
            const progressPercentage = lessonProgress?.progressPercentage || 0;

            return (
              <div
                key={lesson.lessonId}
                className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                  isCompleted
                    ? 'border-green-300 bg-green-50/30'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                }`}
                onClick={() => setSelectedLesson(lesson)}
              >
                <div className="flex items-start gap-4">
                  {/* Order Number */}
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center font-semibold text-gray-600">
                    {lesson.lessonOrder}
                  </div>

                  {/* Lesson Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getLessonTypeIcon(lesson.lessonType)}
                      <h4 className="font-medium text-gray-900">
                        {lesson.lessonTitle}
                      </h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getLessonTypeBadge(lesson.lessonType)}`}>
                        {lesson.lessonType}
                      </span>
                      {lesson.isMandatory && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                          Bắt buộc
                        </span>
                      )}
                    </div>

                    {lesson.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {lesson.description}
                      </p>
                    )}

                    {/* Progress Bar */}
                    {progressPercentage > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600">Tiến độ</span>
                          <span className="text-xs font-medium text-blue-700">
                            {progressPercentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {lesson.contentUrl && (
                        <a
                          href={lesson.contentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={12} />
                          {lesson.contentType || 'Mở bài học'}
                        </a>
                      )}
                      {lessonProgress?.timeSpentSeconds && lessonProgress.timeSpentSeconds > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          Đã học: {formatTime(lessonProgress.timeSpentSeconds)}
                        </span>
                      )}
                      {lesson.passingScore !== undefined && lesson.passingScore > 0 && (
                        <span>Điểm đạt: {lesson.passingScore}%</span>
                      )}
                    </div>
                  </div>

                  {/* Completion Status */}
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle size={24} className="text-green-600" />
                    ) : (
                      <Circle size={24} className="text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Quick Actions for Video */}
                {lesson.lessonType === 'VIDEO' && !isCompleted && (
                  <div className="mt-3 pt-3 border-t flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateProgress(lesson.lessonId, 30, 300);
                      }}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Xem 30%
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateProgress(lesson.lessonId, 50, 600);
                      }}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Xem 50%
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateProgress(lesson.lessonId, 100, 1200);
                      }}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Hoàn thành
                    </button>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default StudentLessonView;

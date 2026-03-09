export type LessonType = 'VIDEO' | 'DOCUMENT' | 'QUIZ' | 'ASSIGNMENT';
export type ContentType = 'VIMEO' | 'YOUTUBE' | 'GOOGLE_DRIVE' | 'FILE_UPLOAD';

export interface Lesson {
  lessonId: number;
  moduleId: number;
  lessonTitle: string;
  lessonType: LessonType;
  lessonOrder: number;
  contentUrl?: string;
  contentType?: ContentType;
  durationMinutes?: number;
  description?: string;
  isMandatory: boolean;
  passingScore?: number;
  moduleSemester?: number;
  moduleName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LessonProgress {
    lessonId: number;
    studentId: number;
    progressPercentage: number;
    isCompleted: boolean;
    lastWatchedPosition?: number;
    timeSpentSeconds?: number;
    completedAt?: string;
    updatedAt: string;
}

export interface ModuleProgress {
    moduleId: number;
    totalLessons: number;
    completedLessons: number;
    progressPercentage: number;
    lessons: Array<{
        lessonId: number;
        lessonTitle: string;
        lessonType: LessonType;
        isMandatory: boolean;
        progress?: LessonProgress;
    }>;
}

import api from './http';

// Type definitions for Lesson
export interface Lesson {
    lessonId: number;
    moduleId: number;
    lessonTitle: string;
    lessonType: 'VIDEO' | 'DOCUMENT' | 'QUIZ' | 'ASSIGNMENT';
    lessonOrder: number;
    contentUrl?: string;
    contentType?: 'VIMEO' | 'YOUTUBE' | 'GOOGLE_DRIVE' | 'FILE_UPLOAD';
    description?: string;
    isMandatory: boolean;
    passingScore?: number;
    moduleSemester?: number;
    moduleName?: string;
    createdAt?: string;
    updatedAt?: string;
}

// API cho Admin/Academic Staff: Quản lý lessons
export const createLesson = (data: {
    moduleId: number;
    lessonTitle: string;
    lessonType: 'VIDEO' | 'DOCUMENT' | 'QUIZ' | 'ASSIGNMENT';
    lessonOrder: number;
    contentUrl?: string;
    contentType?: 'VIMEO' | 'YOUTUBE' | 'GOOGLE_DRIVE' | 'FILE_UPLOAD';
    description?: string;
    isMandatory: boolean;
    passingScore?: number;
}) => api.post('/api/lessons', data);

export const updateLesson = (
    lessonId: number,
    data: {
        lessonTitle?: string;
        lessonType?: 'VIDEO' | 'DOCUMENT' | 'QUIZ' | 'ASSIGNMENT';
        lessonOrder?: number;
        contentUrl?: string;
        contentType?: 'VIMEO' | 'YOUTUBE' | 'GOOGLE_DRIVE' | 'FILE_UPLOAD';
        description?: string;
        isMandatory?: boolean;
        passingScore?: number;
    },
) => api.put(`/api/lessons/${lessonId}`, data);

export const deleteLesson = (lessonId: number) => api.delete(`/api/lessons/${lessonId}`);

// API cho Student: Xem lessons
export const getLessonsByModule = (moduleId: number) => api.get(`/api/lessons/module/${moduleId}`);

// API cho Student: Xem tất cả lessons trong class (all semesters/modules)
export const getLessonsByClass = (classId: number) => api.get(`/api/lessons/class/${classId}`);

// API cho Student: Xem chi tiết 1 lesson
export const getLessonById = (lessonId: number) => api.get(`/api/lessons/${lessonId}`);

// API cho Student: Update progress
export const updateLessonProgress = (
    lessonId: number,
    data: {
        progressPercentage: number;
        lastWatchedPosition?: number;
        timeSpentSeconds?: number;
    },
) => api.post(`/api/lessons/${lessonId}/progress`, data);

// API cho Student: Xem module progress
export const getModuleProgress = (moduleId: number) => api.get(`/api/lessons/module/${moduleId}/progress`);

// API cho Student: Get completed lesson IDs for a module
export const getCompletedLessonIds = (moduleId: number) => api.get<number[]>(`/api/lessons/module/${moduleId}/completed`);

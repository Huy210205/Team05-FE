import { useState, useEffect } from 'react';

// Lesson progress status
export type LessonStatus = 'not-started' | 'in-progress' | 'completed';

// Progress state structure: { "classId:moduleId:lessonId": { status, lastAccess } }
interface ProgressEntry {
    status: LessonStatus;
    lastAccess: number; // timestamp
}

type ProgressStore = Record<string, ProgressEntry>;

const STORAGE_KEY = 'student_lesson_progress';

// Helper: Load from localStorage
function loadProgress(): ProgressStore {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

// Helper: Save to localStorage
function saveProgress(data: ProgressStore): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
    }
}

// Hook to manage lesson progress
export function useProgressStore() {
    const [progress, setProgress] = useState<ProgressStore>(loadProgress);

    // Sync to localStorage on change
    useEffect(() => {
        saveProgress(progress);
    }, [progress]);

    const getKey = (classId: string, moduleId: string, lessonId: string) => `${classId}:${moduleId}:${lessonId}`;

    const getLessonStatus = (classId: string, moduleId: string, lessonId: string): LessonStatus => {
        const key = getKey(classId, moduleId, lessonId);
        return progress[key]?.status || 'not-started';
    };

    const setLessonStatus = (classId: string, moduleId: string, lessonId: string, status: LessonStatus) => {
        const key = getKey(classId, moduleId, lessonId);
        setProgress((prev) => ({
            ...prev,
            [key]: { status, lastAccess: Date.now() },
        }));
    };

    const getModuleProgress = (classId: string, moduleId: string, lessonIds: string[]) => {
        const completed = lessonIds.filter((lid) => getLessonStatus(classId, moduleId, lid) === 'completed').length;
        const inProgress = lessonIds.filter((lid) => getLessonStatus(classId, moduleId, lid) === 'in-progress').length;
        return {
            total: lessonIds.length,
            completed,
            inProgress,
            percentage: lessonIds.length > 0 ? Math.round((completed / lessonIds.length) * 100) : 0,
        };
    };

    return {
        progress, // Expose progress data
        getLessonStatus,
        setLessonStatus,
        getModuleProgress,
    };
}

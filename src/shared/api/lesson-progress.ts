import http from './http';

export interface LessonProgressUpdate {
    lessonId: number;
    currentPosition: number; // seconds
    duration: number; // seconds
    timeSpent: number; // seconds spent in this session
}

export interface LessonProgressResponse {
    progressId: number;
    studentId: number;
    lessonId: number;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    progressPercentage: number;
    timeSpentSeconds: number;
    lastWatchedPosition: number;
    completedAt?: string;
    lastAccessedAt?: string;
}

export const lessonProgressApi = {
    /**
     * Update video progress
     */
    updateVideoProgress: async (data: LessonProgressUpdate): Promise<LessonProgressResponse> => {
        const response = await http.post<LessonProgressResponse>('/api/lesson-progress/video', data);
        return response.data;
    },

    /**
     * Get progress for a single lesson
     */
    getProgress: async (lessonId: number): Promise<LessonProgressResponse | null> => {
        try {
            const response = await http.get<LessonProgressResponse>(`/api/lesson-progress/lesson/${lessonId}`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 204) {
                return null;
            }
            throw error;
        }
    },

    /**
     * Get progress for multiple lessons (bulk)
     */
    getProgressBulk: async (lessonIds: number[]): Promise<Record<number, LessonProgressResponse>> => {
        const response = await http.post<Record<number, LessonProgressResponse>>('/api/lesson-progress/bulk', lessonIds);
        return response.data;
    },
};

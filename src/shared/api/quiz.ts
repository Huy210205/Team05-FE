import api from './http';

// ======================== TYPES ========================

export interface QuizQuestion {
    questionId: number;
    questionText: string;
    questionOrder: number;
    points: number;
    options: QuizOption[];
}

export interface QuizOption {
    optionId: number;
    optionText: string;
    optionOrder: number;
    isCorrect?: boolean; // Chỉ có khi admin xem hoặc sau khi submit
}

export interface QuizDetail {
    quizId: number;
    lessonId: number;
    quizTitle: string;
    quizType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
    timeLimitMinutes: number;
    passingScore: number;
    maxAttempts: number;
    questions: QuizQuestion[];
}

export interface StartAttemptResponse {
    attemptId: number;
    quizId: number;
    quizTitle: string;
    timeLimitMinutes: number;
    startedAt: string;
    questions: QuizQuestion[]; // Không có isCorrect
}

export interface QuizAnswer {
    questionId: number;
    selectedOptionId: number;
}

export interface QuestionResult {
    questionId: number;
    questionText: string;
    selectedOptionId?: number;
    selectedOptionText?: string;
    isCorrect: boolean;
    correctOptionText?: string;
    points: number;
}

export interface SubmitQuizResponse {
    attemptId: number;
    score: number;
    totalPoints: number;
    percentage: number;
    status: string;
    completedAt: string;
    timeSpentSeconds: number;
    correctAnswers: number;
    totalQuestions: number;
    isPassed: boolean;
    canRetake: boolean;
    attemptsRemaining: number;
    results: QuestionResult[];
    // Deprecated - for backward compatibility
    passingScore?: number;
    submittedAt?: string;
    questions?: QuestionResult[];
}

export interface AttemptSummary {
    attemptId: number;
    attemptNumber: number;
    score: number;
    percentage: number;
    status: string;
    startedAt: string;
    completedAt: string | null;
    timeSpentSeconds: number | null;
}

export interface QuizAttemptHistoryResponse {
    quizId: number;
    quizTitle: string;
    maxAttempts: number;
    attempts: AttemptSummary[];
    bestScore: number | null;
    canRetake: boolean;
    attemptsRemaining: number;
}

// ======================== API CALLS ========================

/**
 * API 3: Lấy chi tiết Quiz theo lessonId
 * GET /api/quizzes/lesson/{lessonId}
 * - Student: không có đáp án (includeAnswers=false)
 * - Admin: có đáp án (includeAnswers=true)
 */
export const getQuizByLesson = (lessonId: number, includeAnswers: boolean = false) => {
    return api.get<QuizDetail>(`/api/quizzes/lesson/${lessonId}`, {
        params: { includeAnswers }
    });
};

/**
 * API 4: Bắt đầu làm Quiz (Student only)
 * POST /api/quizzes/attempts/start
 */
export const startQuizAttempt = (quizId: number) => {
    return api.post<StartAttemptResponse>('/api/quizzes/attempts/start', {
        quizId
    });
};

/**
 * API 5: Lưu nhiều câu trả lời cùng lúc (Student only)
 * POST /api/quizzes/attempts/{attemptId}/answers
 */
export const saveQuizAnswers = (attemptId: number, answers: QuizAnswer[]) => {
    return api.post(`/api/quizzes/attempts/${attemptId}/answers`, {
        answers
    });
};

/**
 * API 6: Submit Quiz (Student only)
 * POST /api/quizzes/attempts/{attemptId}/submit
 */
export const submitQuiz = (attemptId: number) => {
    return api.post<SubmitQuizResponse>(`/api/quizzes/attempts/${attemptId}/submit`);
};

/**
 * API 7: Xem lịch sử làm Quiz (Student only)
 * GET /api/quizzes/attempts/quiz/{quizId}/my-attempts
 */
export const getMyQuizAttempts = (quizId: number) => {
    return api.get<QuizAttemptHistoryResponse>(`/api/quizzes/attempts/quiz/${quizId}/my-attempts`);
};

// ======================== ADMIN APIs ========================

export interface CreateQuizRequest {
    lessonId: number;
    quizTitle: string;
    quizType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
    timeLimitMinutes: number;
    passingScore: number;
    maxAttempts: number;
}

/**
 * API 1: Tạo Quiz mới (Admin only)
 * POST /api/quizzes
 */
export const createQuiz = (data: CreateQuizRequest) => {
    return api.post<QuizDetail>('/api/quizzes', data);
};

/**
 * API 2: Import câu hỏi từ file Word (Admin only)
 * POST /api/quizzes/{quizId}/questions/import
 */
export const importQuizQuestionsFromWord = (quizId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post<string>(`/api/quizzes/${quizId}/questions/import`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

/**
 * API 8: Xem chi tiết kết quả của một attempt cụ thể (Student only)
 * GET /api/quizzes/attempts/{attemptId}/result
 */
export const getAttemptResult = (attemptId: number) => {
    return api.get<SubmitQuizResponse>(`/api/quizzes/attempts/${attemptId}/result`);
};

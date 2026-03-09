// Chat Analytics API - Admin Dashboard
import api from './http';

export interface OverviewStats {
    totalQuestions: number;
    totalUsers: number;
    avgResponseTime: number;
    questionsTrend: number;
    usersTrend: number;
    responseTimeTrend: number;
}

export interface PopularQuestion {
    question: string;
    count: number;
    satisfactionRate: number;
}

export interface UnansweredQuestion {
    questionId: number;
    question: string;
    avgSimilarity: number;
    askedCount: number;
    lastAsked: string;
}

export interface UsageTrend {
    date: string;
    questionCount: number;
    userCount: number;
    avgResponseTime: number;
}

export interface ResponseTimeRange {
    range: string;
    count: number;
    percentage: number;
}

export interface RatingDistribution {
    rating: number;
    count: number;
}

export interface UserSatisfaction {
    avgRating: number;
    ratingDistribution: RatingDistribution[];
    feedbackCount: number;
}

/**
 * Get overview statistics
 */
export const getOverview = async (startDate?: string, endDate?: string): Promise<OverviewStats> => {
    const response = await api.get<OverviewStats>('/api/admin/chat-analytics/overview', {
        params: { startDate, endDate }
    });
    return response.data;
};

/**
 * Get popular questions
 */
export const getPopularQuestions = async (limit: number = 10): Promise<PopularQuestion[]> => {
    const response = await api.get<PopularQuestion[]>('/api/admin/chat-analytics/popular-questions', {
        params: { limit }
    });
    return response.data;
};

/**
 * Get unanswered questions (low similarity)
 */
export const getUnansweredQuestions = async (limit: number = 5): Promise<UnansweredQuestion[]> => {
    const response = await api.get<UnansweredQuestion[]>('/api/admin/chat-analytics/unanswered-questions', {
        params: { limit }
    });
    return response.data;
};

/**
 * Get usage trends over time
 */
export const getUsageTrends = async (days: number = 7): Promise<UsageTrend[]> => {
    const response = await api.get<UsageTrend[]>('/api/admin/chat-analytics/usage-trends', {
        params: { days }
    });
    return response.data;
};

/**
 * Get response time distribution
 */
export const getResponseTimeDistribution = async (): Promise<ResponseTimeRange[]> => {
    const response = await api.get<ResponseTimeRange[]>('/api/admin/chat-analytics/response-time-distribution');
    return response.data;
};

/**
 * Get user satisfaction ratings
 */
export const getUserSatisfaction = async (): Promise<UserSatisfaction> => {
    const response = await api.get<UserSatisfaction>('/api/admin/chat-analytics/user-satisfaction');
    return response.data;
};

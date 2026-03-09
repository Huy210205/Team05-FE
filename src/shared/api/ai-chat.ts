// src/shared/api/ai-chat.ts
// MOCK API - No backend needed
import http from './http';

export interface AIChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface AIChatRequest {
    message: string;
    userId: number;
    userName: string;
    useOpenAI?: boolean;
}

export interface AIChatResponse {
    message: string;
    responseType: 'rule-based' | 'openai' | 'error';
    success: boolean;
}

export interface AIChatAnalytics {
    totalQuestions: number;
    totalUsers: number;
    avgResponseTime: number;
    totalCost: number;
    percentChange: number;
    dailyChats: Array<{
        date: string;
        count: number;
    }>;
    topQuestions: Array<{
        question: string;
        count: number;
        satisfactionRate: number;
    }>;
    unansweredQuestions: Array<{
        question: string;
        attempts: number;
    }>;
}

// In-memory storage for chat history
const chatHistoryStore: Map<number, AIChatMessage[]> = new Map();

// Mock AI responses based on keywords
const getMockResponse = (message: string, userName: string): string => {
    const msg = message.toLowerCase();

    // Greetings
    if (msg.match(/^(xin chào|chào|hello|hi|hey)/)) {
        return `Xin chào ${userName}! 👋 Tôi là trợ lý AI của bạn. Tôi có thể giúp bạn với:\n• Thông tin về lớp học\n• Lịch học và bài tập\n• Điểm số và tiến độ\n• Câu hỏi về khóa học\n\nBạn cần hỗ trợ gì không?`;
    }

    // Class info
    if (msg.includes('lớp') || msg.includes('class') || msg.includes('khóa học')) {
        return `📚 Về lớp học của bạn:\n• Bạn đang tham gia 3 lớp học\n• 1 lớp đang học (Java Spring Boot)\n• 1 lớp đã hoàn thành (HTML/CSS)\n• 1 lớp chưa bắt đầu (ReactJS Advanced)\n\nBạn muốn xem chi tiết lớp nào?`;
    }

    // Schedule
    if (msg.includes('lịch') || msg.includes('schedule') || msg.includes('thời gian')) {
        return `📅 Lịch học tuần này:\n• Thứ 2: Java Spring Boot (19:00-21:00)\n• Thứ 4: Java Spring Boot (19:00-21:00)\n• Thứ 6: Review & QA (19:00-20:30)\n\nBạn có thể xem chi tiết trong mục "Lịch học" nhé!`;
    }

    // Grades
    if (msg.includes('điểm') || msg.includes('grade') || msg.includes('kết quả')) {
        return `📊 Kết quả học tập của bạn:\n• Điểm trung bình: 8.5/10\n• Java Spring Boot: 9.0/10\n• HTML/CSS: 8.0/10\n• Hoàn thành: 70% bài tập\n\nBạn đang học rất tốt! 👍`;
    }

    // Assignments
    if (msg.includes('bài tập') || msg.includes('assignment') || msg.includes('homework')) {
        return `📝 Bài tập hiện tại:\n• 2 bài tập đang chờ nộp (Java Spring Boot)\n• Deadline: 3 ngày nữa\n• 1 bài tập đã nộp, chờ chấm điểm\n\nBạn có cần hỗ trợ gì với bài tập không?`;
    }

    // Progress
    if (msg.includes('tiến độ') || msg.includes('progress') || msg.includes('học được')) {
        return `📈 Tiến độ học tập:\n• Java Spring Boot: 45% (7/20 bài)\n• Tốc độ học: Tốt ✓\n• Thời gian học: 45 giờ\n• Mục tiêu: Hoàn thành trong 2 tháng\n\nBạn đang đi đúng hướng!`;
    }

    // Help
    if (msg.includes('giúp') || msg.includes('help') || msg.includes('hỗ trợ')) {
        return `🤝 Tôi có thể giúp bạn với:\n1️⃣ Thông tin lớp học và khóa học\n2️⃣ Lịch học và deadline\n3️⃣ Điểm số và kết quả học tập\n4️⃣ Bài tập và dự án\n5️⃣ Câu hỏi về nội dung bài học\n\nHãy hỏi tôi bất cứ điều gì nhé!`;
    }

    // Thanks
    if (msg.match(/^(cảm ơn|thanks|thank you|cám ơn)/)) {
        return `Không có gì! 😊 Tôi luôn sẵn sàng hỗ trợ bạn. Chúc bạn học tốt!`;
    }

    // Default response
    return `Tôi là trợ lý AI của bạn! 🤖\n\nTôi có thể giúp bạn với:\n• Thông tin lớp học\n• Lịch học và bài tập\n• Điểm số và tiến độ\n• Câu hỏi về khóa học\n\nHãy thử hỏi tôi về lớp học, lịch học, điểm số, bài tập hoặc tiến độ học tập nhé!`;
};

/**
 * Send a message to AI assistant (MOCK)
 */
export const sendAIMessage = async (request: AIChatRequest): Promise<AIChatResponse> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const response = getMockResponse(request.message, request.userName);

    // Add to history
    const history = chatHistoryStore.get(request.userId) || [];
    history.push({
        role: 'user',
        content: request.message,
        timestamp: new Date().toISOString(),
    });
    history.push({
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
    });
    chatHistoryStore.set(request.userId, history);

    return {
        message: response,
        responseType: 'rule-based',
        success: true,
    };
};

/**
 * Get chat history for current user (MOCK)
 */
export const getChatHistory = async (userId: number): Promise<AIChatMessage[]> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    return chatHistoryStore.get(userId) || [];
};

/**
 * Clear chat history for current user (MOCK)
 */
export const clearChatHistory = async (userId: number): Promise<void> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    chatHistoryStore.delete(userId);
};

/**
 * Get analytics data for admin dashboard
 */
export const getAIChatAnalytics = async (days: number = 7): Promise<AIChatAnalytics> => {
    try {
        const response = await http.get<AIChatAnalytics>('/api/ai-chat/analytics', {
            params: { days },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching AI chat analytics:', error);
        // Return mock data as fallback
        return getMockAnalytics(days);
    }
};

/**
 * Generate mock analytics data for development
 */
const getMockAnalytics = (days: number): AIChatAnalytics => {
    const dailyChats = [];
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dailyChats.push({
            date: date.toISOString().split('T')[0],
            count: Math.floor(Math.random() * 100) + 50,
        });
    }

    return {
        totalQuestions: 1234,
        totalUsers: 456,
        avgResponseTime: 1.8,
        totalCost: 12.5,
        percentChange: 12,
        dailyChats,
        topQuestions: [
            { question: "Làm sao nộp bài tập?", count: 89, satisfactionRate: 0.94 },
            { question: "Lịch học tuần này?", count: 67, satisfactionRate: 0.88 },
            { question: "Điểm thi giữa kỳ của mình?", count: 54, satisfactionRate: 0.92 },
            { question: "Hướng dẫn cài đặt môi trường", count: 45, satisfactionRate: 0.87 },
            { question: "Cách submit code lên GitHub", count: 38, satisfactionRate: 0.91 },
            { question: "Lớp học nào đang active?", count: 32, satisfactionRate: 0.89 },
            { question: "Thời hạn nộp bài cuối kỳ", count: 28, satisfactionRate: 0.93 },
            { question: "Giảng viên dạy môn Java", count: 24, satisfactionRate: 0.85 },
            { question: "Điểm danh như thế nào?", count: 19, satisfactionRate: 0.90 },
            { question: "Tài liệu học tập ở đâu?", count: 15, satisfactionRate: 0.86 },
        ],
        unansweredQuestions: [
            { question: "Thủ tục xin bảo lưu như nào?", attempts: 12 },
            { question: "Học phí trả góp 0% lãi suất?", attempts: 8 },
            { question: "Chuyển lớp sang buổi khác được không?", attempts: 6 },
            { question: "Có hỗ trợ tìm việc sau khóa học?", attempts: 5 },
            { question: "Giảm học phí cho sinh viên?", attempts: 4 },
        ],
    };
};

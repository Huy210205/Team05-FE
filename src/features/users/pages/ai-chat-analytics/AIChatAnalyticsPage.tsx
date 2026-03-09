// src/features/users/pages/ai-chat-analytics/AIChatAnalyticsPage.tsx
import React, { useState, useEffect } from 'react';
import { 
    MessageSquare, 
    Users, 
    Clock, 
    TrendingUp, 
    TrendingDown,
    AlertTriangle,
    BarChart3
} from 'lucide-react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    LineChart,
    Line,
    Legend,
    Cell
} from 'recharts';
import { 
    getOverview, 
    getPopularQuestions, 
    getUnansweredQuestions, 
    getUsageTrends,
    getResponseTimeDistribution,
    getUserSatisfaction,
    type OverviewStats,
    type PopularQuestion,
    type UnansweredQuestion,
    type UsageTrend,
    type ResponseTimeRange,
    type UserSatisfaction
} from '@/shared/api/chatAnalytics';
import { useToast } from '@/shared/hooks/useToast';

export default function AIChatAnalyticsPage() {
    const [overview, setOverview] = useState<OverviewStats | null>(null);
    const [popularQuestions, setPopularQuestions] = useState<PopularQuestion[]>([]);
    const [unansweredQuestions, setUnansweredQuestions] = useState<UnansweredQuestion[]>([]);
    const [usageTrends, setUsageTrends] = useState<UsageTrend[]>([]);
    const [responseTimeDistribution, setResponseTimeDistribution] = useState<ResponseTimeRange[]>([]);
    const [satisfaction, setSatisfaction] = useState<UserSatisfaction | null>(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(7);
    const toast = useToast();

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                // Fetch all analytics data in parallel
                const [
                    overviewData,
                    questionsData,
                    unansweredData,
                    trendsData,
                    responseTimeData,
                    satisfactionData
                ] = await Promise.all([
                    getOverview(),
                    getPopularQuestions(10),
                    getUnansweredQuestions(5),
                    getUsageTrends(days),
                    getResponseTimeDistribution(),
                    getUserSatisfaction()
                ]);

                setOverview(overviewData);
                setPopularQuestions(questionsData);
                setUnansweredQuestions(unansweredData);
                setUsageTrends(trendsData);
                setResponseTimeDistribution(responseTimeData);
                setSatisfaction(satisfactionData);
            } catch (error) {
                console.error('Error fetching analytics:', error);
                toast.error('Lỗi', 'Không thể tải dữ liệu thống kê');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [days]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!overview) {
        return (
            <div className="p-6 text-center text-gray-500">
                Không thể tải dữ liệu thống kê
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        THỐNG KÊ AI CHAT
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Thống kê và phân tích hiệu suất AI Assistant
                    </p>
                </div>
                
                {/* Days selector */}
                <select
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value={7}>7 ngày qua</option>
                    <option value={14}>14 ngày qua</option>
                    <option value={30}>30 ngày qua</option>
                </select>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Câu hỏi */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-blue-600" />
                            <span className="text-sm font-medium text-gray-600">Câu hỏi</span>
                        </div>
                        <div className={`flex items-center gap-1 text-sm ${
                            overview.questionsTrend >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                            {overview.questionsTrend >= 0 ? (
                                <TrendingUp className="h-4 w-4" />
                            ) : (
                                <TrendingDown className="h-4 w-4" />
                            )}
                            <span>{Math.abs(overview.questionsTrend).toFixed(1)}%</span>
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                        {overview.totalQuestions.toLocaleString()}
                    </div>
                </div>

                {/* Users */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-medium text-gray-600">Người dùng</span>
                        </div>
                        <div className={`flex items-center gap-1 text-sm ${
                            overview.usersTrend >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                            {overview.usersTrend >= 0 ? (
                                <TrendingUp className="h-4 w-4" />
                            ) : (
                                <TrendingDown className="h-4 w-4" />
                            )}
                            <span>{Math.abs(overview.usersTrend).toFixed(1)}%</span>
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                        {overview.totalUsers}
                    </div>
                </div>

                {/* Avg time */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-purple-600" />
                            <span className="text-sm font-medium text-gray-600">Thời gian TB</span>
                        </div>
                        <div className={`flex items-center gap-1 text-sm ${
                            overview.responseTimeTrend <= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                            {overview.responseTimeTrend <= 0 ? (
                                <TrendingDown className="h-4 w-4" />
                            ) : (
                                <TrendingUp className="h-4 w-4" />
                            )}
                            <span>{Math.abs(overview.responseTimeTrend).toFixed(1)}%</span>
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                        {overview.avgResponseTime.toFixed(1)}s
                    </div>
                </div>
            </div>

            {/* Charts Section - Usage Trends */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Xu hướng sử dụng</h2>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={usageTrends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            stroke="#888"
                        />
                        <YAxis 
                            tick={{ fontSize: 12 }}
                            stroke="#888"
                        />
                        <Tooltip 
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                        />
                        <Legend />
                        <Line 
                            type="monotone" 
                            dataKey="questionCount" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            name="Câu hỏi"
                        />
                        <Line 
                            type="monotone" 
                            dataKey="userCount" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            name="Người dùng"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Response Time Distribution */}
            {responseTimeDistribution.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock className="h-5 w-5 text-purple-600" />
                        <h2 className="text-lg font-semibold text-gray-900">
                            Phân bố thời gian phản hồi
                        </h2>
                    </div>

                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={responseTimeDistribution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis 
                                dataKey="range" 
                                tick={{ fontSize: 12 }}
                                stroke="#888"
                            />
                            <YAxis 
                                tick={{ fontSize: 12 }}
                                stroke="#888"
                            />
                            <Tooltip 
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            />
                            <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#8b5cf6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* User Satisfaction */}
            {satisfaction && satisfaction.feedbackCount > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                        <MessageSquare className="h-5 w-5 text-yellow-600" />
                        <h2 className="text-lg font-semibold text-gray-900">
                            Độ hài lòng
                        </h2>
                    </div>

                    <div className="mb-6">
                        <div className="text-4xl font-bold text-gray-900">
                            ⭐ {satisfaction.avgRating.toFixed(1)}/5
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                            {satisfaction.feedbackCount} đánh giá
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={satisfaction.ratingDistribution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis 
                                dataKey="rating" 
                                tick={{ fontSize: 12 }}
                                stroke="#888"
                                label={{ value: 'Số sao', position: 'insideBottom', offset: -5 }}
                            />
                            <YAxis 
                                tick={{ fontSize: 12 }}
                                stroke="#888"
                            />
                            <Tooltip 
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            />
                            <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#eab308" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Top 10 Questions */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                        Top {popularQuestions.length} câu hỏi phổ biến
                    </h2>
                </div>

                {popularQuestions.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        Chưa có dữ liệu
                    </div>
                ) : (
                    <div className="space-y-3">
                        {popularQuestions.map((q, index) => (
                            <div 
                                key={index}
                                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
                                    {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 mb-1">
                                        {q.question}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span>{q.count} lần</span>
                                        <span className="flex items-center gap-1">
                                            <span className="text-green-600">●</span>
                                            {Math.round(q.satisfactionRate)}% hài lòng
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Unanswered Questions */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                        Câu hỏi cần cải thiện (similarity &lt; 50%)
                    </h2>
                </div>

                {unansweredQuestions.length === 0 ? (
                    <div className="text-center text-green-600 py-8">
                        ✅ Tất cả câu hỏi đều được trả lời tốt!
                    </div>
                ) : (
                    <div className="space-y-2">
                        {unansweredQuestions.map((q, index) => (
                            <div 
                                key={index}
                                className="p-3 rounded-lg bg-orange-50 border border-orange-100"
                            >
                                <div className="flex items-start gap-3 mb-2">
                                    <div className="w-6 h-6 rounded-full bg-orange-200 text-orange-700 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                                        {index + 1}
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 flex-1">
                                        {q.question}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-600 ml-9">
                                    <span>Similarity: {(q.avgSimilarity * 100).toFixed(1)}%</span>
                                    <span>Hỏi: {q.askedCount} lần</span>
                                    <span className="text-gray-400">
                                        {new Date(q.lastAsked).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

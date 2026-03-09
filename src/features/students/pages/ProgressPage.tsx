import React from 'react';
import { TrendingUp, Calendar, Award, BarChart, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ProgressPage() {
    // Mock data
    const weeklyProgress = [
        { day: 'T2', hours: 2, points: 50 },
        { day: 'T3', hours: 1.5, points: 40 },
        { day: 'T4', hours: 3, points: 75 },
        { day: 'T5', hours: 2.5, points: 60 },
        { day: 'T6', hours: 2, points: 55 },
        { day: 'T7', hours: 4, points: 100 },
        { day: 'CN', hours: 3.5, points: 85 },
    ];

    const monthlyStats = [
        { month: 'T8', completed: 2 },
        { month: 'T9', completed: 3 },
        { month: 'T10', completed: 4 },
        { month: 'T11', completed: 5 },
    ];

    const currentStats = {
        weeklyHours: 18.5,
        weeklyPoints: 465,
        monthlyGoal: 20,
        achievementRate: 85,
        currentStreak: 5,
        longestStreak: 12,
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Tiến trình học tập</h1>
                <p className="mt-2 text-gray-600">Theo dõi hành trình học tập và thống kê của bạn</p>
            </div>

            {/* Current Stats */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Giờ học tuần này</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{currentStats.weeklyHours}h</p>
                            <p className="mt-1 text-xs text-green-600">↑ Tăng 2.5h so với tuần trước</p>
                        </div>
                        <div className="rounded-full bg-blue-100 p-3">
                            <Clock className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Điểm tuần này</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{currentStats.weeklyPoints}</p>
                            <p className="mt-1 text-xs text-green-600">↑ Tăng 75 điểm so với tuần trước</p>
                        </div>
                        <div className="rounded-full bg-yellow-100 p-3">
                            <Award className="h-6 w-6 text-yellow-600" />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Chuỗi hiện tại</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{currentStats.currentStreak}</p>
                            <p className="mt-1 text-xs text-gray-500">Dài nhất: {currentStats.longestStreak} ngày</p>
                        </div>
                        <div className="rounded-full bg-orange-100 p-3">
                            <TrendingUp className="h-6 w-6 text-orange-600" />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Tỷ lệ hoàn thành</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{currentStats.achievementRate}%</p>
                            <p className="mt-1 text-xs text-green-600">↑ Tăng 5% so với tháng trước</p>
                        </div>
                        <div className="rounded-full bg-green-100 p-3">
                            <BarChart className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Weekly Hours Chart */}
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Giờ học trong tuần</h2>
                    <p className="mt-1 text-sm text-gray-600">Thời gian học của bạn trong 7 ngày qua</p>
                </div>

                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={weeklyProgress}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} stroke="#e5e7eb" />
                            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} stroke="#e5e7eb" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="hours"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                dot={{ fill: '#3b82f6', r: 5 }}
                                activeDot={{ r: 7 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Weekly Points Chart */}
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Điểm năng lượng trong tuần</h2>
                    <p className="mt-1 text-sm text-gray-600">Số điểm bạn đã kiếm được trong 7 ngày qua</p>
                </div>

                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={weeklyProgress}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} stroke="#e5e7eb" />
                            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} stroke="#e5e7eb" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="points"
                                stroke="#f59e0b"
                                strokeWidth={3}
                                dot={{ fill: '#f59e0b', r: 5 }}
                                activeDot={{ r: 7 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Learning Calendar */}
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Lịch học tập</h2>
                    <p className="mt-1 text-sm text-gray-600">Các ngày bạn đã học trong tháng này</p>
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 35 }, (_, i) => {
                        const hasActivity = Math.random() > 0.3;
                        const intensity = Math.floor(Math.random() * 4);
                        const colors = ['bg-gray-100', 'bg-green-200', 'bg-green-400', 'bg-green-600'];

                        return (
                            <div
                                key={i}
                                className={`aspect-square rounded ${hasActivity ? colors[intensity] : 'bg-gray-100'} transition-colors hover:ring-2 hover:ring-blue-500`}
                                title={`Ngày ${i + 1}`}
                            />
                        );
                    })}
                </div>

                <div className="mt-4 flex items-center justify-end space-x-2 text-xs text-gray-600">
                    <span>Ít</span>
                    <div className="h-3 w-3 rounded bg-gray-100" />
                    <div className="h-3 w-3 rounded bg-green-200" />
                    <div className="h-3 w-3 rounded bg-green-400" />
                    <div className="h-3 w-3 rounded bg-green-600" />
                    <span>Nhiều</span>
                </div>
            </div>

            {/* Monthly Completion */}
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Lớp học hoàn thành theo tháng</h2>
                    <p className="mt-1 text-sm text-gray-600">Số lượng lớp học bạn đã hoàn thành mỗi tháng</p>
                </div>

                <div className="space-y-4">
                    {monthlyStats.map((stat) => (
                        <div key={stat.month}>
                            <div className="mb-2 flex items-center justify-between text-sm">
                                <span className="font-medium text-gray-700">{stat.month}</span>
                                <span className="font-semibold text-gray-900">{stat.completed} lớp học</span>
                            </div>
                            <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                    style={{ width: `${(stat.completed / 6) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

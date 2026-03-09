import React from 'react';
import { Trophy, Star, Award, TrendingUp, Target, Zap } from 'lucide-react';

export default function AchievementsPage() {
    const achievements = [
        {
            id: 1,
            title: 'Người kiên trì',
            description: 'Học liên tục 5 ngày',
            icon: '🔥',
            color: 'from-orange-400 to-red-500',
            points: 50,
            unlocked: true,
            date: '2025-11-20',
            progress: 100,
        },
        {
            id: 2,
            title: 'Học sinh xuất sắc',
            description: 'Đạt 500+ điểm năng lượng',
            icon: '⭐',
            color: 'from-yellow-400 to-amber-500',
            points: 100,
            unlocked: true,
            date: '2025-11-18',
            progress: 100,
        },
        {
            id: 3,
            title: 'Hoàn thành lớp học',
            description: 'Hoàn thành 3 lớp học',
            icon: '🎯',
            color: 'from-green-400 to-emerald-500',
            points: 150,
            unlocked: true,
            date: '2025-11-15',
            progress: 100,
        },
        {
            id: 4,
            title: 'Người chăm chỉ',
            description: 'Học 12 giờ trong tuần',
            icon: '💪',
            color: 'from-blue-400 to-cyan-500',
            points: 75,
            unlocked: true,
            date: '2025-11-22',
            progress: 100,
        },
        {
            id: 5,
            title: 'Streak Master',
            description: 'Học liên tục 30 ngày',
            icon: '🚀',
            color: 'from-purple-400 to-pink-500',
            points: 200,
            unlocked: false,
            progress: 16,
        },
        {
            id: 6,
            title: 'Chiến binh tri thức',
            description: 'Đạt 1000+ điểm năng lượng',
            icon: '⚡',
            color: 'from-indigo-400 to-purple-500',
            points: 250,
            unlocked: false,
            progress: 52,
        },
    ];

    const stats = {
        totalAchievements: 20,
        unlocked: 4,
        totalPoints: 375,
        rank: 'Đồng',
    };

    const unlockedAchievements = achievements.filter((a) => a.unlocked);
    const lockedAchievements = achievements.filter((a) => !a.unlocked);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Thành tích của tôi</h1>
                <p className="mt-2 text-gray-600">Theo dõi tiến độ và các cột mốc bạn đã đạt được</p>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-6 text-white shadow-lg">
                    <Trophy className="mb-3 h-8 w-8" />
                    <p className="text-sm opacity-90">Đã mở khóa</p>
                    <p className="mt-1 text-3xl font-bold">
                        {stats.unlocked}/{stats.totalAchievements}
                    </p>
                </div>

                <div className="rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 p-6 text-white shadow-lg">
                    <Star className="mb-3 h-8 w-8" />
                    <p className="text-sm opacity-90">Tổng điểm</p>
                    <p className="mt-1 text-3xl font-bold">{stats.totalPoints}</p>
                </div>

                <div className="rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 p-6 text-white shadow-lg">
                    <Target className="mb-3 h-8 w-8" />
                    <p className="text-sm opacity-90">Tỷ lệ hoàn thành</p>
                    <p className="mt-1 text-3xl font-bold">
                        {Math.round((stats.unlocked / stats.totalAchievements) * 100)}%
                    </p>
                </div>

                <div className="rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-6 text-white shadow-lg">
                    <Award className="mb-3 h-8 w-8" />
                    <p className="text-sm opacity-90">Hạng hiện tại</p>
                    <p className="mt-1 text-3xl font-bold">{stats.rank}</p>
                </div>
            </div>

            {/* Unlocked Achievements */}
            <div>
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Thành tích đã mở khóa ({unlockedAchievements.length})
                    </h2>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {unlockedAchievements.map((achievement) => (
                        <div
                            key={achievement.id}
                            className="group overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-gray-200 transition-all hover:shadow-lg"
                        >
                            <div className={`bg-gradient-to-br ${achievement.color} p-6 text-white`}>
                                <div className="mb-4 flex items-center justify-between">
                                    <span className="text-5xl">{achievement.icon}</span>
                                    <div className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur">
                                        +{achievement.points} điểm
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold">{achievement.title}</h3>
                                <p className="mt-2 text-sm opacity-90">{achievement.description}</p>
                            </div>

                            <div className="p-4">
                                <div className="flex items-center text-sm text-gray-600">
                                    <Trophy className="mr-2 h-4 w-4" />
                                    Mở khóa ngày {achievement.date}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Locked Achievements */}
            <div>
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Thành tích chưa mở ({lockedAchievements.length})
                    </h2>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {lockedAchievements.map((achievement) => (
                        <div
                            key={achievement.id}
                            className="overflow-hidden rounded-xl bg-gray-50 shadow-sm ring-1 ring-gray-200"
                        >
                            <div className="bg-gray-200 p-6">
                                <div className="mb-4 flex items-center justify-between">
                                    <span className="text-5xl grayscale">{achievement.icon}</span>
                                    <div className="rounded-full bg-gray-300 px-3 py-1 text-xs font-medium text-gray-600">
                                        +{achievement.points} điểm
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-700">{achievement.title}</h3>
                                <p className="mt-2 text-sm text-gray-600">{achievement.description}</p>
                            </div>

                            <div className="p-4">
                                <div className="mb-2 flex items-center justify-between text-sm">
                                    <span className="font-medium text-gray-700">Tiến độ</span>
                                    <span className="font-semibold text-gray-900">{achievement.progress}%</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-gray-300">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                                        style={{ width: `${achievement.progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

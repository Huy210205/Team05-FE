import React from 'react';
import { BookOpen, Clock, TrendingUp, Trophy, BarChart3, Layers, CheckCircle2 } from 'lucide-react';

export default function StudentDashboard() {
    // Mock data cho demo - TODO: Kết nối API thật sau
    type Course = {
        id: number;
        name: string;
        description: string;
        progress: number;
        icon?: React.ReactNode;
        level: string;
        lessons: { completed: number; total: number };
    };

    const mockCourses: Course[] = [
        {
            id: 1,
            name: 'Java Spring Boot',
            description: 'Học framework Spring Boot từ cơ bản đến nâng cao',
            progress: 45,
            level: 'intermediate',
            lessons: { completed: 7, total: 20 },
            icon: <Layers className="h-5 w-5" />,
        },
        {
            id: 2,
            name: 'HTML & CSS Fundamentals',
            description: 'Nền tảng thiết kế web với HTML5 và CSS3',
            progress: 100,
            level: 'beginner',
            lessons: { completed: 15, total: 15 },
            icon: <CheckCircle2 className="h-5 w-5" />,
        },
        {
            id: 3,
            name: 'ReactJS Advanced',
            description: 'Xây dựng ứng dụng web hiện đại với React',
            progress: 0,
            level: 'advanced',
            lessons: { completed: 0, total: 25 },
            icon: <BookOpen className="h-5 w-5" />,
        },
    ];

    const [courses] = React.useState<Course[]>(mockCourses);
    const learningStreak = 5;
    const totalPoints = 520;
    const completedCourses = 3;

    return (
        <div className="space-y-6">
            {/* Welcome Header - Giảm padding */}
            <div className="rounded-2xl bg-gray-800 p-6 text-white shadow-sm">
                <h1 className="mb-1 text-3xl font-semibold">Chào mừng trở lại</h1>
                <p className="text-sm text-gray-300">Tiếp tục hành trình học tập của bạn hôm nay với eduMange</p>
            </div>

            {/* Stats Cards - Giữ nguyên */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Chuỗi học tập</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{learningStreak}</p>
                            <p className="mt-1 text-xs text-gray-500">ngày liên tiếp</p>
                        </div>
                        <div className="rounded-full bg-orange-100 p-3">
                            <TrendingUp className="h-6 w-6 text-orange-600" />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Điểm năng lượng</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{totalPoints}</p>
                            <p className="mt-1 text-xs text-gray-500">tổng điểm</p>
                        </div>
                        <div className="rounded-full bg-yellow-100 p-3">
                            <Trophy className="h-6 w-6 text-yellow-600" />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Lớp học</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{completedCourses}</p>
                            <p className="mt-1 text-xs text-gray-500">đã hoàn thành</p>
                        </div>
                        <div className="rounded-full bg-green-100 p-3">
                            <BookOpen className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Thời gian học</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">12h</p>
                            <p className="mt-1 text-xs text-gray-500">tuần này</p>
                        </div>
                        <div className="rounded-full bg-blue-100 p-3">
                            <Clock className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Courses Section - Tối ưu */}
            <div>
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Các lớp học của tôi</h2>
                        <p className="mt-0.5 text-sm text-gray-600">Tiếp tục học tập từ nơi bạn đã dừng lại</p>
                    </div>
                    <button className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100">
                        Quản lý lớp học
                    </button>
                </div>

                {/* Lớp đang học - Grid layout */}
                <div className="mb-6">
                    <h3 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Đang học ({courses.filter((c) => c.progress > 0 && c.progress < 100).length})
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {courses
                            .filter((c) => c.progress > 0 && c.progress < 100)
                            .map((course) => (
                                <div
                                    key={course.id}
                                    className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md hover:border-blue-300"
                                >
                                    {/* Progress bar ngay trên cùng */}
                                    <div className="h-1 bg-gray-100">
                                        <div
                                            className="h-full bg-blue-600 transition-all duration-500"
                                            style={{ width: `${course.progress}%` }}
                                        />
                                    </div>

                                    {/* Course Content - Giảm padding */}
                                    <div className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2 flex-1">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600 flex-shrink-0">
                                                    {course.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-semibold text-gray-900 leading-tight truncate">
                                                        {course.name}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 line-clamp-1">
                                                        {course.description}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-blue-600 ml-2">
                                                {course.progress}%
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                                            <span>
                                                {course.lessons.completed}/{course.lessons.total} bài học
                                            </span>
                                            <span className="text-gray-400">•</span>
                                            <span>
                                                {Math.round((course.lessons.completed / course.lessons.total) * 100)}%
                                                hoàn thành
                                            </span>
                                        </div>

                                        <button className="w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
                                            Tiếp tục học
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Lớp hoàn thành - List layout như Khan Academy */}
                {courses.filter((c) => c.progress === 100).length > 0 && (
                    <div className="mb-6">
                        <h3 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Đã hoàn thành ({courses.filter((c) => c.progress === 100).length})
                        </h3>
                        <div className="space-y-2">
                            {courses
                                .filter((c) => c.progress === 100)
                                .map((course) => (
                                    <div
                                        key={course.id}
                                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 transition-all hover:shadow-sm hover:border-green-300"
                                    >
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-50 text-green-600">
                                                <CheckCircle2 className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-sm font-semibold text-gray-900">{course.name}</h3>
                                                <p className="text-xs text-gray-500">{course.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-medium text-green-600">
                                                {course.lessons.total} bài học
                                            </span>
                                            <button className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50">
                                                Xem lại
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Lớp chưa bắt đầu - List layout compact */}
                {courses.filter((c) => c.progress === 0).length > 0 && (
                    <div>
                        <h3 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Chưa bắt đầu ({courses.filter((c) => c.progress === 0).length})
                        </h3>
                        <div className="space-y-2">
                            {courses
                                .filter((c) => c.progress === 0)
                                .map((course) => (
                                    <div
                                        key={course.id}
                                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 transition-all hover:shadow-sm hover:border-gray-300"
                                    >
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100 text-gray-400">
                                                {course.icon}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-sm font-semibold text-gray-900">{course.name}</h3>
                                                <p className="text-xs text-gray-500">{course.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-gray-500">
                                                {course.lessons.total} bài học
                                            </span>
                                            <button className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-800">
                                                Bắt đầu
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Achievements Section - Giảm khoảng cách */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Thành tích gần đây</h2>
                        <p className="mt-0.5 text-xs text-gray-600">Các cột mốc học tập đã đạt</p>
                    </div>
                    <button className="text-sm font-medium text-blue-600 hover:text-blue-700">Xem tất cả →</button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        { title: 'Chuỗi 5 ngày', desc: 'Học liên tục', icon: <TrendingUp className="h-4 w-4" /> },
                        { title: '500+ điểm', desc: 'Điểm tích luỹ', icon: <Trophy className="h-4 w-4" /> },
                        { title: '3 khóa hoàn thành', desc: 'Tiến độ tốt', icon: <BookOpen className="h-4 w-4" /> },
                        { title: '12 giờ / tuần', desc: 'Thời gian học', icon: <Clock className="h-4 w-4" /> },
                    ].map((a, i) => (
                        <div
                            key={i}
                            className="flex items-start space-x-2.5 rounded-md border border-gray-200 bg-white p-3"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-gray-600">
                                {a.icon}
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-xs font-semibold text-gray-900">{a.title}</h3>
                                <p className="text-xs text-gray-500">{a.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

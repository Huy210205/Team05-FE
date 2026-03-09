import React, { useState, useEffect } from 'react';
import { Users2, TrendingUp, TrendingDown, AlertCircle, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getAttendanceStatistics, type AttendanceStatisticsResponse } from '@/api/attendance-statistics';
import { useUserProfile } from '@/stores/userProfile';
import http from '@/shared/api/http';
import { getCentersLite } from '@/shared/api/centers';

type ClassLiteDto = {
    classId: number;
    name: string;
    programName?: string;
    centerName?: string;
    status: string;
};

type CenterLiteDto = {
    centerId: number;
    name: string;
};

export default function AttendanceStatisticsPage() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const { me } = useUserProfile();
    const [selectedCenter, setSelectedCenter] = useState<number | ''>('');
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [viewType, setViewType] = useState<'daily' | 'monthly'>('daily');
    const [loading, setLoading] = useState(false);
    const [statistics, setStatistics] = useState<AttendanceStatisticsResponse | null>(null);

    // Data
    const [centers, setCenters] = useState<CenterLiteDto[]>([]);
    const [classes, setClasses] = useState<ClassLiteDto[]>([]);

    // Check user roles
    const isAdmin = me?.roles?.some((role) => role.code === 'SUPER_ADMIN') ?? false;
    const isStaff = me?.roles?.some((role) => role.code === 'ACADEMIC_STAFF') ?? false;
    const isLecturer = me?.roles?.some((role) => role.code === 'LECTURER') ?? false;
    const userCenterId = me?.centerId;

    const months = [
        { value: 1, label: 'Tháng 1' },
        { value: 2, label: 'Tháng 2' },
        { value: 3, label: 'Tháng 3' },
        { value: 4, label: 'Tháng 4' },
        { value: 5, label: 'Tháng 5' },
        { value: 6, label: 'Tháng 6' },
        { value: 7, label: 'Tháng 7' },
        { value: 8, label: 'Tháng 8' },
        { value: 9, label: 'Tháng 9' },
        { value: 10, label: 'Tháng 10' },
        { value: 11, label: 'Tháng 11' },
        { value: 12, label: 'Tháng 12' },
    ];

    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    // Fetch centers (for Admin only)
    useEffect(() => {
        if (!isAdmin) return;

        const fetchCenters = async () => {
            try {
                const { data } = await getCentersLite();
                setCenters(data);
            } catch (error) {
            }
        };

        fetchCenters();
    }, [isAdmin]);

    // Fetch classes based on role
    useEffect(() => {
        const fetchClasses = async () => {
            try {
                let response;

                if (isLecturer) {
                    // Lecturer: fetch classes they are teaching
                    response = await http.get('/api/classes/my-classes');
                } else if (isStaff && userCenterId) {
                    // Staff: fetch classes in their center
                    response = await http.get('/api/classes', {
                        params: { centerId: userCenterId },
                    });
                } else if (isAdmin) {
                    // Admin: fetch classes by selected center or all
                    const params = selectedCenter ? { centerId: selectedCenter } : {};
                    response = await http.get('/api/classes', { params });
                } else {
                    setClasses([]);
                    return;
                }

                const classesData: ClassLiteDto[] = response.data;
                setClasses(classesData);

                // Auto-select first class if none selected
                if (classesData.length > 0 && !selectedClass) {
                    setSelectedClass(classesData[0].classId.toString());
                }
            } catch (error) {
                setClasses([]);
            }
        };

        // Only fetch when:
        // - Lecturer (no center selection needed)
        // - Staff with centerId
        // - Admin with or without selected center
        if (isLecturer || (isStaff && userCenterId) || isAdmin) {
            fetchClasses();
        }
    }, [isLecturer, isStaff, isAdmin, userCenterId, selectedCenter]);

    // Fetch statistics
    useEffect(() => {
        // Don't fetch if no class is selected
        if (!selectedClass) {
            setStatistics(null);
            return;
        }

        const fetchStatistics = async () => {
            setLoading(true);
            try {
                const { data } = await getAttendanceStatistics({
                    classId: selectedClass,
                    month: viewType === 'daily' ? selectedMonth : undefined,
                    year: selectedYear,
                    viewType,
                });
                setStatistics(data);
            } catch (error) {
                setStatistics(null);
            } finally {
                setLoading(false);
            }
        };

        fetchStatistics();
    }, [selectedClass, selectedMonth, selectedYear, viewType]);

    // Prepare chart data
    const chartData =
        viewType === 'daily'
            ? statistics?.dailyData?.map((d) => ({
                  name: new Date(d.date).getDate().toString(),
                  'Tỷ lệ chuyên cần': Number(d.attendanceRate.toFixed(1)),
              }))
            : statistics?.monthlyData?.map((d) => ({
                  name: `Tháng ${d.month}`,
                  'Tỷ lệ chuyên cần': Number(d.attendanceRate.toFixed(1)),
              }));

    // Export to Excel
    const handleExport = async () => {
        if (!selectedClass || !selectedMonth || !selectedYear) {
            alert('Vui lòng chọn lớp học, tháng và năm');
            return;
        }

        try {
            const response = await http.get(`/api/classes/${selectedClass}/attendance/export/excel`, {
                params: {
                    month: selectedMonth,
                    year: selectedYear,
                },
                responseType: 'blob',
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance_statistics_class${selectedClass}_${selectedMonth}_${selectedYear}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            alert('Không thể xuất file Excel. Vui lòng thử lại.');
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Thống kê chuyên cần</h1>
                    <p className="text-sm text-gray-500 mt-1">Theo dõi và phân tích tình hình chuyên cần của lớp học</p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Xuất Excel
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Center selection (Admin only) */}
                    {isAdmin && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Trung tâm</label>
                            <select
                                value={selectedCenter}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setSelectedCenter(value ? Number(value) : '');
                                    setSelectedClass(''); // Reset class selection
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Tất cả trung tâm</option>
                                {centers.map((center) => (
                                    <option key={center.centerId} value={center.centerId}>
                                        {center.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Class selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Lớp học</label>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={classes.length === 0}
                        >
                            {classes.length === 0 ? (
                                <option value="">Không có lớp học</option>
                            ) : (
                                <>
                                    <option value="">-- Chọn lớp học --</option>
                                    {classes.map((cls) => (
                                        <option key={cls.classId} value={cls.classId}>
                                            {cls.name} {cls.centerName ? `- ${cls.centerName}` : ''}
                                        </option>
                                    ))}
                                </>
                            )}
                        </select>
                    </div>

                    {/* Month selection (only for daily view) */}
                    {viewType === 'daily' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tháng</label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {months.map((month) => (
                                    <option key={month.value} value={month.value}>
                                        {month.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Year selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Năm</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {years.map((year) => (
                                <option key={year} value={year}>
                                    Năm {year}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* View type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hiển thị theo</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewType('daily')}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                                    viewType === 'daily'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Theo ngày
                            </button>
                            <button
                                onClick={() => setViewType('monthly')}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                                    viewType === 'monthly'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Theo tháng
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {!selectedClass ? (
                <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="text-center">
                        <p className="text-gray-500 text-lg mb-2">Vui lòng chọn lớp học để xem thống kê</p>
                        <p className="text-gray-400 text-sm">Chọn trung tâm và lớp học từ bộ lọc phía trên</p>
                    </div>
                </div>
            ) : loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Đang tải dữ liệu...</div>
                </div>
            ) : statistics ? (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Tổng học viên</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">
                                        {statistics.summary.totalStudents}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Users2 className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Tỷ lệ trung bình</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">
                                        {statistics.overallRate.toFixed(1)}%
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Tổng số buổi</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">
                                        {statistics.summary.totalSessions}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <TrendingDown className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">HV cần hỗ trợ</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">
                                        {statistics.summary.needSupportStudents}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <AlertCircle className="w-6 h-6 text-orange-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Line Chart */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Xu hướng chuyên cần theo {viewType === 'daily' ? 'ngày' : 'tháng'}
                        </h2>
                        <div className="text-sm text-gray-500 mb-4">
                            Biểu đồ hiển thị tỷ lệ chuyên cần trung bình của lớp {statistics.className} trong{' '}
                            {viewType === 'daily' ? `tháng ${selectedMonth}/${selectedYear}` : `năm ${selectedYear}`}
                        </div>
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                                <YAxis
                                    domain={[0, 100]}
                                    stroke="#6b7280"
                                    style={{ fontSize: '12px' }}
                                    label={{ value: 'Tỷ lệ (%)', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        padding: '8px 12px',
                                    }}
                                    formatter={(value: number) => [`${value}%`, 'Tỷ lệ chuyên cần']}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="Tỷ lệ chuyên cần"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={{ fill: '#3b82f6', r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Student Details Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Chi tiết chuyên cần từng học viên</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Bảng thống kê chi tiết tình hình điểm danh của từng học viên trong{' '}
                                {viewType === 'daily'
                                    ? `tháng ${selectedMonth}/${selectedYear}`
                                    : `năm ${selectedYear}`}
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            STT
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Mã HV
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Họ và tên
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tổng số buổi
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Có mặt
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Nghỉ
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tỷ lệ chuyên cần
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {statistics.studentDetails
                                        .sort((a, b) => b.attendanceRate - a.attendanceRate)
                                        .map((student, index) => (
                                            <tr key={student.studentId} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {student.studentCode}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {student.fullName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                    {student.totalSessions}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        {student.presentCount}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        {student.absentCount}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className="flex-1 max-w-[100px] bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className={`h-2 rounded-full ${
                                                                    student.attendanceRate >= 90
                                                                        ? 'bg-green-500'
                                                                        : student.attendanceRate >= 80
                                                                          ? 'bg-blue-500'
                                                                          : student.attendanceRate >= 70
                                                                            ? 'bg-yellow-500'
                                                                            : 'bg-red-500'
                                                                }`}
                                                                style={{
                                                                    width: `${student.attendanceRate}%`,
                                                                }}
                                                            />
                                                        </div>
                                                        <span
                                                            className={`text-sm font-semibold ${
                                                                student.attendanceRate >= 90
                                                                    ? 'text-green-600'
                                                                    : student.attendanceRate >= 80
                                                                      ? 'text-blue-600'
                                                                      : student.attendanceRate >= 70
                                                                        ? 'text-yellow-600'
                                                                        : 'text-red-600'
                                                            }`}
                                                        >
                                                            {student.attendanceRate.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Legend */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center gap-6 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span className="text-gray-600">≥ 90%: Xuất sắc</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                                <span className="text-gray-600">80-89%: Tốt</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <span className="text-gray-600">70-79%: Trung bình</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <span className="text-gray-600">&lt; 70%: Cần hỗ trợ</span>
                            </div>
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    );
}

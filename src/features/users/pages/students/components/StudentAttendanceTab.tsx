import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/shared/hooks/useToast';
import { getStudentAttendanceHistory, type StudentAttendanceHistory } from '@/shared/api/attendance';
import type { StudentUI } from '@/shared/types/student-ui';

interface StudentAttendanceTabProps {
    student: StudentUI;
}

const StudentAttendanceTab: React.FC<StudentAttendanceTabProps> = ({ student }) => {
    const { error: showErrorToast } = useToast();
    const [selectedClass, setSelectedClass] = useState<any | null>(null);
    const [attendanceData, setAttendanceData] = useState<StudentAttendanceHistory | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    // Auto-select first enrollment if available
    useEffect(() => {
        if (student.enrollments && student.enrollments.length > 0 && !selectedClass) {
            const firstEnrollment = student.enrollments[0];
            setSelectedClass({
                classId: firstEnrollment.classId,
                className: firstEnrollment.className,
            });
        }
    }, [student.enrollments, selectedClass]);

    // Fetch attendance data when class is selected
    useEffect(() => {
        const fetchAttendance = async () => {
            if (!selectedClass) {
                setAttendanceData(null);
                return;
            }

            try {
                setIsLoading(true);
                const response = await getStudentAttendanceHistory(parseInt(student.id), selectedClass.classId);
                setAttendanceData(response.data);
            } catch (error: any) {
                // Silently handle 404 (no data yet), show error for other cases
                if (error.response?.status !== 404) {
                    showErrorToast('Lỗi tải dữ liệu', 'Không thể tải lịch sử điểm danh');
                }
                setAttendanceData(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAttendance();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClass, student.id]);

    // Auto-select month/year from first attendance record when data is loaded
    useEffect(() => {
        if (attendanceData?.records && attendanceData.records.length > 0) {
            const firstRecord = attendanceData.records[0]; // Already sorted newest first
            const date = new Date(firstRecord.attendanceDate);
            setSelectedYear(date.getFullYear());
            setSelectedMonth(date.getMonth() + 1);
        }
    }, [attendanceData]);

    // Filter records by selected month/year
    const filteredRecords = useMemo(() => {
        if (!attendanceData?.records) return [];
        
        return attendanceData.records.filter(record => {
            const date = new Date(record.attendanceDate);
            return date.getMonth() + 1 === selectedMonth && date.getFullYear() === selectedYear;
        });
    }, [attendanceData, selectedMonth, selectedYear]);

    // Calculate statistics for filtered data
    const filteredStats = useMemo(() => {
        const totalSessions = filteredRecords.length;
        const presentCount = filteredRecords.filter(r => r.status === 'PRESENT').length;
        const absentCount = filteredRecords.filter(r => r.status === 'ABSENT').length;
        const percentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;
        
        return { totalSessions, presentCount, absentCount, percentage };
    }, [filteredRecords]);

    const getAttendancePercentage = () => {
        if (!attendanceData || attendanceData.totalSessions === 0) return 0;
        return Math.round((attendanceData.presentCount / attendanceData.totalSessions) * 100);
    };

    // Generate month/year options
    const months = Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: `Tháng ${i + 1}`
    }));

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => ({
        value: currentYear - i,
        label: `${currentYear - i}`
    }));

    return (
        <div className="space-y-5">
            {/* Class Selector */}
            {student.enrollments.length > 0 ? (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Chọn lớp học
                    </label>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {student.enrollments.map((enrollment) => (
                            <button
                                key={enrollment.classId}
                                onClick={() =>
                                    setSelectedClass({
                                        classId: enrollment.classId,
                                        className: enrollment.className,
                                    })
                                }
                                className={`flex-shrink-0 px-4 py-3 rounded-lg border-2 transition-all ${
                                    selectedClass?.classId === enrollment.classId
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                            >
                                <div className="text-left">
                                    <div className="text-sm font-semibold text-gray-900">
                                        {enrollment.className}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {enrollment.programName}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">Học viên chưa được gán vào lớp học nào</p>
                </div>
            )}

            {/* Attendance Data */}
            {selectedClass && (
                <div className="space-y-5">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-600 mx-auto mb-3"></div>
                            <p className="text-sm text-gray-600">Đang tải dữ liệu...</p>
                        </div>
                    ) : attendanceData ? (
                        <>
                            {/* Attendance Statistics */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                    <div className="text-xs font-medium text-gray-500 mb-2">Tổng buổi</div>
                                    <div className="text-2xl font-semibold text-gray-900">{filteredStats.totalSessions}</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                    <div className="text-xs font-medium text-gray-500 mb-2">Có mặt</div>
                                    <div className="text-2xl font-semibold text-green-600">{filteredStats.presentCount}</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                    <div className="text-xs font-medium text-gray-500 mb-2">Vắng</div>
                                    <div className="text-2xl font-semibold text-red-600">{filteredStats.absentCount}</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                    <div className="text-xs font-medium text-gray-500 mb-2">Tỷ lệ tham dự</div>
                                    <div className="text-2xl font-semibold text-blue-600">{filteredStats.percentage}%</div>
                                </div>
                            </div>

                            {/* Month/Year Filter - Always visible */}
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-900">
                                    Lịch sử điểm danh ({filteredRecords.length} buổi)
                                </h4>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Tháng:</span>
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                        className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                                    >
                                        {months.map(month => (
                                            <option key={month.value} value={month.value}>{month.label}</option>
                                        ))}
                                    </select>
                                    <span className="text-sm text-gray-600">Năm:</span>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                        className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                                    >
                                        {years.map(year => (
                                            <option key={year.value} value={year.value}>{year.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Detailed Records */}
                            {filteredRecords.length > 0 ? (
                                <div>
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <div className="max-h-96 overflow-y-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-50 sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 border-b border-gray-200">
                                                            Ngày điểm danh
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 border-b border-gray-200">
                                                            Trạng thái
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 border-b border-gray-200">
                                                            Giảng viên
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 border-b border-gray-200">
                                                            Ghi chú
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-100">
                                                    {filteredRecords.map((record) => (
                                                        <tr key={record.sessionId} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                                {new Date(record.attendanceDate).toLocaleDateString('vi-VN', {
                                                                    day: '2-digit',
                                                                    month: '2-digit',
                                                                    year: 'numeric'
                                                                })}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                                    record.status === 'PRESENT' 
                                                                        ? 'bg-green-100 text-green-700' 
                                                                        : 'bg-red-100 text-red-700'
                                                                }`}>
                                                                    {record.status === 'PRESENT' ? '✓ Có mặt' : '✕ Vắng'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                                {record.teacherName || '—'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                                {record.notes || '—'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-sm text-gray-600">Không có dữ liệu điểm danh trong tháng {selectedMonth}/{selectedYear}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Thử chọn tháng/năm khác
                                    </p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-600">Không tìm thấy dữ liệu điểm danh</p>
                            <p className="text-xs text-gray-500 mt-1">
                                Học viên chưa được điểm danh trong lớp này
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default StudentAttendanceTab;


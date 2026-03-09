import { Calendar, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { type StudentAttendanceHistory } from '@/shared/api/attendance';
import { useToast } from '@/shared/hooks/useToast';
import { useUserProfile } from '@/stores/userProfile';
import { getMyClasses, type ClassDto } from '@/shared/api/classes';
import http from '@/shared/api/http';

export default function MyAttendancePage() {
    const [classes, setClasses] = useState<ClassDto[]>([]);
    const [selectedClass, setSelectedClass] = useState<ClassDto | null>(null);
    const [attendanceData, setAttendanceData] = useState<StudentAttendanceHistory | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const toast = useToast();
    const { me } = useUserProfile();

    // Load classes
    useEffect(() => {
        loadClasses();
    }, [me]);

    // Load attendance when class selected
    useEffect(() => {
        if (selectedClass && me) {
            loadAttendance();
        }
    }, [selectedClass, me]);

    // Auto-select month/year from first attendance record when data is loaded
    useEffect(() => {
        if (attendanceData?.records && attendanceData.records.length > 0) {
            const firstRecord = attendanceData.records[0]; // Already sorted newest first
            const date = new Date(firstRecord.attendanceDate);
            setSelectedYear(date.getFullYear());
            setSelectedMonth(date.getMonth() + 1);
        }
    }, [attendanceData]);

    const loadClasses = async () => {
        try {
            setLoading(true);
            const response = await getMyClasses();
            const myClasses = response.data;
            setClasses(myClasses);
            
            // Auto-select first class
            if (myClasses.length > 0 && !selectedClass) {
                setSelectedClass(myClasses[0]);
            }
        } catch (error: any) {
            toast.error('Không thể tải danh sách lớp');
        } finally {
            setLoading(false);
        }
    };

    const loadAttendance = async () => {
        if (!selectedClass || !me) return;
        
        try {
            setLoading(true);
            // Backend có endpoint /api/students/{studentId}/classes/{classId}/attendance
            // Nhưng frontend cần studentId, không có userId
            // Giải pháp: Lấy từ enrollment trong myClasses
            const enrollment = classes.find(c => c.classId === selectedClass.classId);
            if (!enrollment) {
                setAttendanceData(null);
                return;
            }

            // Gọi API mới sử dụng JWT authentication, không cần userId trong URL
            const response = await http.get<StudentAttendanceHistory>(
                `/api/attendance/my-attendance/${selectedClass.classId}`
            );
            setAttendanceData(response.data);
        } catch (error: any) {
            if (error?.response?.status !== 404) {
                toast.error('Không thể tải điểm danh');
            }
            setAttendanceData(null);
        } finally {
            setLoading(false);
        }
    };

    // Filter records by month/year
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

    // Generate month/year options
    const months = Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: `Tháng ${i + 1}`
    }));

    // Generate years dynamically from actual attendance data
    const years = useMemo(() => {
        if (!attendanceData?.records || attendanceData.records.length === 0) {
            // Fallback to current year if no data
            const currentYear = new Date().getFullYear();
            return [{ value: currentYear, label: `${currentYear}` }];
        }
        
        // Extract unique years from attendance dates
        const yearSet = new Set<number>();
        attendanceData.records.forEach(record => {
            if (record.attendanceDate) {
                const year = new Date(record.attendanceDate).getFullYear();
                yearSet.add(year);
            }
        });
        
        // Convert to sorted array (newest first)
        const sortedYears = Array.from(yearSet).sort((a, b) => b - a);
        return sortedYears.map(year => ({ value: year, label: `${year}` }));
    }, [attendanceData]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-700" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Điểm danh của tôi</h1>
            </div>

            <div className="bg-white rounded-xl border shadow-sm p-6 space-y-5">
                {/* Class Selector */}
                {classes.length > 0 ? (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Chọn lớp học
                        </label>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {classes.map((classItem) => (
                                <button
                                    key={classItem.classId}
                                    onClick={() => setSelectedClass(classItem)}
                                    className={`flex-shrink-0 px-4 py-3 rounded-lg border-2 transition-all ${
                                        selectedClass?.classId === classItem.classId
                                            ? 'border-blue-600 bg-blue-50'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                                >
                                    <div className="text-left">
                                        <div className="text-sm font-semibold text-gray-900">
                                            {classItem.name}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-600">Bạn chưa được gán vào lớp học nào</p>
                    </div>
                )}

                {/* Attendance Data */}
                {selectedClass && (
                    <div className="space-y-5">
                        {loading ? (
                            <div className="text-center py-12">
                                <Loader2 className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-600 mx-auto mb-3" />
                                <p className="text-sm text-gray-600">Đang tải dữ liệu...</p>
                            </div>
                        ) : attendanceData ? (
                            <>
                                {/* Statistics */}
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

                                {/* Month/Year Filter */}
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
                                                                    {record.status === 'PRESENT' ? (
                                                                        <><CheckCircle size={12} className="mr-1" /> Có mặt</>
                                                                    ) : (
                                                                        <><XCircle size={12} className="mr-1" /> Vắng</>
                                                                    )}
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
                                ) : (
                                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                                        <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                                        <p className="text-sm text-gray-600">Không có dữ liệu điểm danh trong tháng {selectedMonth}/{selectedYear}</p>
                                        <p className="text-xs text-gray-500 mt-1">Thử chọn tháng/năm khác</p>
                                    </div>
                                )}

                                {/* Warning for low attendance */}
                                {filteredStats.percentage < 80 && filteredRecords.length > 0 && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-yellow-800">Cảnh báo tỷ lệ điểm danh thấp</p>
                                                <p className="text-xs text-yellow-700 mt-1">
                                                    Tỷ lệ điểm danh của bạn trong tháng này là {filteredStats.percentage}%. 
                                                    Vui lòng tham gia đầy đủ các buổi học để đảm bảo kết quả học tập.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-sm text-gray-600">Không tìm thấy dữ liệu điểm danh</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Bạn chưa được điểm danh trong lớp này
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

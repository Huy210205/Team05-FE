import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, CheckCircle, XCircle, Clock, AlertCircle, Users, Save, User } from 'lucide-react';
import { useToast } from '@/shared/hooks/useToast';
import { useUserProfile } from '@/stores/userProfile';
import { createAttendanceSession, getAttendanceSessionDetail, updateAttendanceSession, type AttendanceStatus as ApiAttendanceStatus } from '@/shared/api/attendance';
import http from '@/shared/api/http';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | null;

type Student = {
    id: number;
    enrollmentId: number;
    studentCode: string;
    fullName: string;
    email: string;
};

type AttendanceRecord = {
    studentId: number;
    enrollmentId?: number;
    recordId?: number; // For edit mode
    status: AttendanceStatus;
    note: string;
};

export default function TakeAttendancePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { me } = useUserProfile();
    const { success: showSuccessToast, error: showErrorToast } = useToast();

    // Sử dụng useMemo để đảm bảo date không bị reset khi re-render
    const classId = useMemo(() => searchParams.get('classId') || '1', [searchParams]);
    const className = useMemo(() => searchParams.get('className') || 'Lớp học', [searchParams]);
    const sessionIdParam = useMemo(() => searchParams.get('sessionId'), [searchParams]); // Check if editing existing session
    const viewMode = useMemo(() => searchParams.get('viewMode') || 'month', [searchParams]); // Get view mode to return to
    const date = useMemo(() => {
        const urlDate = searchParams.get('date');
        if (!urlDate) {
            // Use local timezone instead of UTC
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        return urlDate;
    }, [searchParams]);

    const [students, setStudents] = useState<Student[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<Map<number, AttendanceRecord>>(new Map());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [sessionId, setSessionId] = useState<number | null>(null);

    // Fetch students and existing attendance data if editing
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                
                // Check if editing existing session
                if (sessionIdParam) {
                    setIsEditMode(true);
                    setSessionId(parseInt(sessionIdParam));
                    
                    // Fetch existing attendance session
                    const sessionResponse = await getAttendanceSessionDetail(parseInt(sessionIdParam));
                    const sessionData = sessionResponse.data;
                    
                    // Build students list from records
                    const studentsData: Student[] = sessionData.records.map((record: any) => ({
                        id: record.studentId,
                        enrollmentId: record.enrollmentId,
                        studentCode: record.studentCode || `SV${record.studentId}`,
                        fullName: record.studentName,
                        email: record.studentEmail || '',
                    }));
                    setStudents(studentsData);
                    
                    // Initialize attendance records with existing data
                    // Use enrollmentId as key (consistent with create mode)
                    const existingRecords = new Map(
                        sessionData.records.map((r: any) => [
                            r.enrollmentId,
                            {
                                studentId: r.studentId,
                                enrollmentId: r.enrollmentId,
                                recordId: r.recordId,
                                status: r.status as AttendanceStatus,
                                note: r.notes || '',
                            },
                        ])
                    );
                    setAttendanceRecords(existingRecords);
                } else {
                    // Creating new attendance - fetch ONLY ACTIVE students
                    const response = await http.get(`/api/classes/${classId}/students`, {
                        params: {
                            status: 'ACTIVE',  // Chỉ lấy học viên đang học
                            page: 0,
                            size: 1000
                        }
                    });
                    const enrollments = response.data.content || response.data.items || response.data;

                    const studentsData: Student[] = enrollments.map((enrollment: any) => ({
                        id: enrollment.studentId,
                        enrollmentId: enrollment.enrollmentId,
                        studentCode: enrollment.studentCode || `SV${enrollment.studentId}`,
                        fullName: enrollment.studentName,
                        email: enrollment.studentEmail,
                    }));
                    setStudents(studentsData);

                    // Initialize attendance records with PRESENT by default
                    // Use enrollmentId as key to avoid duplicate keys
                    const initialRecords = new Map(
                        studentsData.map((s) => [
                            s.enrollmentId,
                            {
                                studentId: s.id,
                                enrollmentId: s.enrollmentId,
                                status: 'PRESENT' as AttendanceStatus,
                                note: '',
                            },
                        ])
                    );
                    setAttendanceRecords(initialRecords);
                }
            } catch (error) {
                showErrorToast('Lỗi', 'Không thể tải dữ liệu');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [classId, sessionIdParam]);

    const handleStatusChange = (enrollmentId: number, status: AttendanceStatus) => {
        setAttendanceRecords((prev) => {
            const newMap = new Map(prev);
            const record = newMap.get(enrollmentId);
            if (record) {
                newMap.set(enrollmentId, { ...record, status });
            }
            return newMap;
        });
    };

    const handleNoteChange = (enrollmentId: number, note: string) => {
        setAttendanceRecords((prev) => {
            const newMap = new Map(prev);
            const record = newMap.get(enrollmentId);
            if (record) {
                newMap.set(enrollmentId, { ...record, note });
            }
            return newMap;
        });
    };

    // Handle "Select All" checkbox for PRESENT status
    const handleSelectAll = (checked: boolean) => {
        setAttendanceRecords((prev) => {
            const newMap = new Map(prev);
            newMap.forEach((record, enrollmentId) => {
                newMap.set(enrollmentId, { ...record, status: checked ? 'PRESENT' : null });
            });
            return newMap;
        });
    };

    // Check if all students are marked as PRESENT
    const allPresent = Array.from(attendanceRecords.values()).every((r) => r.status === 'PRESENT');

    const handleSubmit = async () => {
        if (!me?.userId && !isEditMode) {
            showErrorToast('Lỗi', 'Không tìm thấy thông tin giảng viên');
            return;
        }

        setIsSubmitting(true);
        try {
            if (isEditMode && sessionId) {
                // UPDATE existing session
                const records = students.map((student) => {
                    const record = attendanceRecords.get(student.enrollmentId);
                    return {
                        recordId: record?.recordId!,
                        status: record?.status || 'ABSENT',
                        notes: record?.note || undefined,
                    };
                });

                await updateAttendanceSession(sessionId, {
                    notes: '',
                    records,
                });

                showSuccessToast('Thành công', 'Đã cập nhật điểm danh');
            } else {
                // CREATE new session
                const records = students.map((student) => {
                    const record = attendanceRecords.get(student.enrollmentId);
                    return {
                        enrollmentId: student.enrollmentId!,
                        studentId: student.id,
                        status: record?.status || 'ABSENT',
                        notes: record?.note || undefined,
                    };
                });

                await createAttendanceSession({
                    classId: parseInt(classId),
                    teacherId: me!.userId,
                    attendanceDate: date,
                    notes: '',
                    records,
                });

                showSuccessToast('Thành công', 'Đã lưu điểm danh');
            }
            
            // Navigate back with viewMode and date parameters to restore correct view and date
            setTimeout(() => navigate(`/attendance?view=${viewMode}&date=${date}`), 500);
        } catch (error: any) {
            const errorData = error?.response?.data;
            const errorMessage = errorData?.message || errorData?.error || 'Không thể lưu điểm danh';
            
            // Show specific error message
            if (errorMessage.includes('already taken') || errorMessage.includes('Attendance already taken')) {
                showErrorToast('Lỗi', 'Đã có điểm danh cho ngày này rồi. Vui lòng vào "Lịch sử điểm danh" để xem hoặc chỉnh sửa.');
            } else if (errorMessage.includes('not found') || errorMessage.includes('Not found')) {
                showErrorToast('Lỗi', 'Không tìm thấy thông tin lớp học hoặc học viên');
            } else {
                showErrorToast('Lỗi', errorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoBack = () => {
        navigate(`/attendance?view=${viewMode}&date=${date}`);
    };

    const StatusCheckbox = ({
        status,
        currentStatus,
        onClick,
        label,
    }: {
        status: AttendanceStatus;
        currentStatus: AttendanceStatus;
        onClick: () => void;
        label: string;
    }) => {
        const isChecked = currentStatus === status;
        return (
            <input
                type="checkbox"
                checked={isChecked}
                onChange={onClick}
                className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                title={label}
            />
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-50 z-50 overflow-y-auto"
        >
            {/* Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white border-b sticky top-0 z-10 shadow-sm"
            >
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleGoBack}
                                className="h-10 w-10 rounded-lg border bg-white hover:bg-gray-50 flex items-center justify-center"
                            >
                                <ArrowLeft size={20} />
                            </motion.button>
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white shadow-md">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <h1 className="text-xl font-semibold text-gray-900">{className}</h1>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            {(() => {
                                                // Parse date string directly without timezone conversion
                                                const [year, month, day] = date.split('-');
                                                return `${day}/${month}/${year}`;
                                            })()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Attendance Table */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-xl shadow-sm border overflow-hidden"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                                <tr>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 w-20">
                                        <div className="flex items-center gap-2">
                                            <span>STT</span>
                                        </div>
                                    </th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 w-32">
                                        <div className="flex items-center gap-2">
                                            <User size={16} />
                                            <span>Mã số</span>
                                        </div>
                                    </th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">
                                        <div className="flex items-center gap-2">
                                            <Users size={16} />
                                            <span>Họ đệm</span>
                                        </div>
                                    </th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">
                                        <span>Tên</span>
                                    </th>
                                    <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700 w-28">
                                        <div className="flex flex-col items-center justify-center gap-1">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle size={16} className="text-green-600" />
                                                <span>Có mặt</span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={allPresent}
                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                                className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                                                title="Chọn tất cả"
                                            />
                                        </div>
                                    </th>
                                    <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700 w-16">
                                        <div className="flex items-center justify-center gap-2">
                                            <XCircle size={16} className="text-red-600" />
                                            <span>Vắng</span>
                                        </div>
                                    </th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 w-64">
                                        <span>Ghi chú</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                                            Đang tải danh sách học viên...
                                        </td>
                                    </tr>
                                ) : (
                                    <AnimatePresence>
                                        {students.map((student, index) => {
                                            const record = attendanceRecords.get(student.enrollmentId);
                                            const nameParts = student.fullName.split(' ');
                                            const firstName = nameParts[nameParts.length - 1];
                                            const lastName = nameParts.slice(0, -1).join(' ');

                                            return (
                                                <motion.tr
                                                    key={student.enrollmentId}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.02 }}
                                                    whileHover={{ backgroundColor: '#f9fafb' }}
                                                    className="hover:bg-gray-50 transition-colors"
                                                >
                                                    <td className="px-4 py-4 text-sm text-gray-900">{index + 1}</td>
                                                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                                        {student.studentCode}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-700">{lastName}</td>
                                                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{firstName}</td>
                                                    <td className="px-4 py-4 text-center">
                                                        <div className="flex justify-center">
                                                            <StatusCheckbox
                                                                status="PRESENT"
                                                                currentStatus={record?.status || null}
                                                                onClick={() => handleStatusChange(student.enrollmentId, 'PRESENT')}
                                                                label="Có mặt"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <div className="flex justify-center">
                                                            <StatusCheckbox
                                                                status="ABSENT"
                                                                currentStatus={record?.status || null}
                                                                onClick={() => handleStatusChange(student.enrollmentId, 'ABSENT')}
                                                                label="Vắng"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <input
                                                            type="text"
                                                            value={record?.note || ''}
                                                            onChange={(e) => handleNoteChange(student.enrollmentId, e.target.value)}
                                                            placeholder="Nhập ghi chú..."
                                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                                        />
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </AnimatePresence>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Footer Actions */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-6 flex items-center justify-between"
                >
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGoBack}
                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 flex items-center gap-2"
                    >
                        <ArrowLeft size={18} />
                        <span>Quay lại</span>
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
                    >
                        <Save size={18} />
                        <span>{isSubmitting ? 'Đang lưu...' : 'Lưu điểm danh'}</span>
                    </motion.button>
                </motion.div>
            </div>
        </motion.div>
    );
}

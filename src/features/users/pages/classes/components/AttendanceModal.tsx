import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle, X } from 'lucide-react';
import { useToast } from '@/shared/hooks/useToast';
import http from '@/shared/api/http';

type Class = {
    id: number;
    name: string;
    programName: string;
    centerName: string;
    status: string;
};

type Student = {
    id: number;
    fullName: string;
    studentCode: string;
    email: string;
    phone: string;
};

type AttendanceRecord = {
    id: number;
    studentId: number;
    studentName: string;
    date: string;
    status: 'PRESENT' | 'ABSENT';
    note?: string;
};

interface AttendanceModalProps {
    classItem: Class;
    onClose: () => void;
    initialDate?: string; // yyyy-mm-dd, optional preset for selected date
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({ classItem, onClose, initialDate }) => {
    const { error: showErrorToast } = useToast();
    const [students, setStudents] = useState<Student[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [selectedDate, setSelectedDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch students
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setIsLoading(true);
                const response = await http.get(`/api/classes/${classItem.id}/students`);
                const enrollments = response.data.content || response.data.items || response.data;

                const studentsData: Student[] = enrollments.map((enrollment: any) => ({
                    id: enrollment.studentId,
                    fullName: enrollment.studentName,
                    studentCode: enrollment.studentCode || '',
                    email: enrollment.studentEmail,
                    phone: enrollment.phone || '',
                }));

                setStudents(studentsData);
            } catch (error) {
                showErrorToast('Lỗi tải dữ liệu', 'Không thể tải danh sách học viên');
            } finally {
                setIsLoading(false);
            }
        };

        fetchStudents();
    }, [classItem.id]);

    // Initialize attendance records when students are loaded
    useEffect(() => {
        if (students.length > 0) {
            // Initialize with default records (all PRESENT)
            const defaultRecords: AttendanceRecord[] = students.map((student) => ({
                id: 0,
                studentId: student.id,
                studentName: student.fullName,
                date: selectedDate,
                status: 'PRESENT',
                note: '',
            }));
            setAttendanceRecords(defaultRecords);
        }
    }, [students, selectedDate]);

    const handleStatusChange = (studentId: number, status: 'PRESENT' | 'ABSENT') => {
        setAttendanceRecords((prev) =>
            prev.map((record) => (record.studentId === studentId ? { ...record, status } : record)),
        );
    };

    const handleNoteChange = (studentId: number, note: string) => {
        setAttendanceRecords((prev) =>
            prev.map((record) => (record.studentId === studentId ? { ...record, note } : record)),
        );
    };

    const getStatusCounts = () => {
        const counts = {
            present: 0,
            absent: 0,
        };

        attendanceRecords.forEach((record) => {
            if (record.status === 'PRESENT') {
                counts.present++;
            } else if (record.status === 'ABSENT') {
                counts.absent++;
            }
        });

        return counts;
    };

    const counts = getStatusCounts();

    return (
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col">
            {/* Header - fixed at top */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                <div>
                    <h2 className="text-base font-semibold text-gray-900">Điểm danh lớp học</h2>
                    <p className="text-xs text-gray-600 mt-0.5">{classItem.name}</p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <X size={18} />
                </button>
            </div>

            {/* Date Selection + Statistics */}
            <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0 space-y-3">
                {/* Date */}
                <div className="flex items-center gap-3">
                    <Calendar size={14} className="text-gray-500" />
                    <label className="text-xs font-medium text-gray-700">Ngày:</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 bg-green-50 rounded">
                        <div className="flex items-center justify-center gap-1 text-green-600 mb-0.5">
                            <CheckCircle size={12} />
                            <span className="text-xs font-medium">Có mặt</span>
                        </div>
                        <div className="text-base font-semibold text-gray-900">{counts.present}</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                        <div className="flex items-center justify-center gap-1 text-red-600 mb-0.5">
                            <XCircle size={12} />
                            <span className="text-xs font-medium">Vắng</span>
                        </div>
                        <div className="text-base font-semibold text-gray-900">{counts.absent}</div>
                    </div>
                </div>
            </div>

            {/* Attendance List - scrollable content */}
            <div className="px-4 py-3 flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="text-center py-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-3"></div>
                        <p className="text-sm text-gray-600">Đang tải...</p>
                    </div>
                ) : (
                    <div className="overflow-auto">
                        <table className="min-w-full border border-gray-200 rounded overflow-hidden text-sm">
                            <thead className="bg-gray-50">
                                <tr className="text-left text-xs text-gray-600">
                                    <th className="px-2 py-2 border-b w-10">STT</th>
                                    <th className="px-2 py-2 border-b w-28">Mã SV</th>
                                    <th className="px-2 py-2 border-b">Họ đệm</th>
                                    <th className="px-2 py-2 border-b w-28">Tên</th>
                                    <th className="px-2 py-2 border-b text-center w-20">Có mặt</th>
                                    <th className="px-2 py-2 border-b text-center w-20">Vắng</th>
                                    <th className="px-2 py-2 border-b min-w-[180px]">Ghi chú</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendanceRecords.map((record, idx) => {
                                    const student = students.find((s) => s.id === record.studentId);
                                    const code = student?.studentCode || '';
                                    const full = record.studentName || '';
                                    const parts = full.trim().split(/\s+/);
                                    const first = parts.length ? parts[parts.length - 1] : '';
                                    const last = parts.slice(0, -1).join(' ');

                                    const cellBtn = (
                                        active: boolean,
                                        color: string,
                                        onClick: () => void,
                                        label: string,
                                    ) => (
                                        <button
                                            type="button"
                                            title={label}
                                            onClick={onClick}
                                            className={`mx-auto block h-5 w-5 rounded border transition-colors text-xs ${
                                                active
                                                    ? `${color} text-white border-transparent`
                                                    : 'bg-white text-gray-400 border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            {active ? '✓' : ''}
                                        </button>
                                    );

                                    return (
                                        <tr key={record.studentId}>
                                            <td className="px-2 py-1.5 border-b text-gray-600 text-xs">{idx + 1}</td>
                                            <td className="px-2 py-1.5 border-b font-medium text-gray-900 text-xs">{code}</td>
                                            <td className="px-2 py-1.5 border-b text-gray-900 text-xs">{last}</td>
                                            <td className="px-2 py-1.5 border-b font-medium text-gray-900 text-xs">{first}</td>
                                            <td className="px-2 py-1.5 border-b text-center">
                                                <input
                                                    type="radio"
                                                    name={`status-${record.studentId}`}
                                                    checked={record.status === 'PRESENT'}
                                                    onChange={() => handleStatusChange(record.studentId, 'PRESENT')}
                                                    className="w-4 h-4 border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-2 py-1.5 border-b text-center">
                                                <input
                                                    type="radio"
                                                    name={`status-${record.studentId}`}
                                                    checked={record.status === 'ABSENT'}
                                                    onChange={() => handleStatusChange(record.studentId, 'ABSENT')}
                                                    className="w-4 h-4 border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-2 py-1.5 border-b">
                                                <input
                                                    type="text"
                                                    value={record.note || ''}
                                                    onChange={(e) => handleNoteChange(record.studentId, e.target.value)}
                                                    placeholder="Nhập ghi chú..."
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendanceModal;

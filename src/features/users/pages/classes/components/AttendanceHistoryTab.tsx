import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Users, CheckCircle, XCircle, Eye, Edit, Trash2, X, Save, ChevronDown } from 'lucide-react';
import { useToast } from '@/shared/hooks/useToast';
import {
    getClassAttendanceSessions,
    getAttendanceSessionDetail,
    updateAttendanceSession,
    deleteAttendanceSession,
    type AttendanceSessionSummary,
    type AttendanceSessionDetail,
    type AttendanceStatus,
} from '@/shared/api/attendance';
import ConfirmDialog from '@/shared/components/ConfirmDialog';

interface AttendanceHistoryTabProps {
    classId: number;
}

const AttendanceHistoryTab: React.FC<AttendanceHistoryTabProps> = ({ classId }) => {
    const { success: showSuccessToast, error: showErrorToast } = useToast();

    // States
    const [sessions, setSessions] = useState<AttendanceSessionSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState<AttendanceSessionDetail | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    // Filter states
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1); // 1-12
    const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

    // Edit states
    const [editNotes, setEditNotes] = useState('');
    const [editRecords, setEditRecords] = useState<Map<number, { status: AttendanceStatus; notes?: string }>>(
        new Map(),
    );

    // Fetch sessions list
    const fetchSessions = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await getClassAttendanceSessions(classId);
            // Sort by date descending (newest first)
            const sorted = response.data.sort(
                (a, b) => new Date(b.attendanceDate).getTime() - new Date(a.attendanceDate).getTime(),
            );
            setSessions(sorted);
        } catch (error) {
            // Don't show toast on error to avoid spam
        } finally {
            setIsLoading(false);
        }
    }, [classId]); // Remove showErrorToast to prevent infinite loop

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    // Auto-select month/year from first session when sessions are loaded
    useEffect(() => {
        if (sessions.length > 0) {
            const firstSession = sessions[0]; // Already sorted newest first
            const [year, month] = firstSession.attendanceDate.split('-');
            setSelectedYear(parseInt(year));
            setSelectedMonth(parseInt(month));
        }
    }, [sessions]);

    // Auto-refresh when tab becomes visible (e.g., after creating attendance)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                fetchSessions();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [fetchSessions]);

    // Open detail modal
    const handleViewSession = async (sessionId: number) => {
        try {
            const response = await getAttendanceSessionDetail(sessionId);
            setSelectedSession(response.data);
            setEditNotes(response.data.notes || '');

            // Initialize edit records
            const recordsMap = new Map(
                response.data.records.map((r) => [r.recordId, { status: r.status, notes: r.notes }]),
            );
            setEditRecords(recordsMap);

            setIsModalOpen(true);
            setIsEditMode(false);
        } catch (error) {
            showErrorToast('Lỗi', 'Không thể tải chi tiết điểm danh');
        }
    };

    // Update session
    const handleSave = async () => {
        if (!selectedSession) return;

        try {
            const records = selectedSession.records.map((r) => {
                const editRecord = editRecords.get(r.recordId);
                return {
                    recordId: r.recordId,
                    status: editRecord?.status || r.status,
                    notes: editRecord?.notes,
                };
            });

            await updateAttendanceSession(selectedSession.sessionId, {
                notes: editNotes || undefined,
                records,
            });

            showSuccessToast('Thành công', 'Đã cập nhật điểm danh');
            setIsEditMode(false);
            setIsModalOpen(false);
            fetchSessions();
        } catch (error: any) {
            showErrorToast('Lỗi', error?.response?.data?.message || 'Không thể cập nhật điểm danh');
        }
    };

    // Delete session
    const handleDelete = async (sessionId: number) => {
        try {
            await deleteAttendanceSession(sessionId);
            showSuccessToast('Thành công', 'Đã xóa buổi điểm danh');
            setDeleteConfirmId(null);
            setIsModalOpen(false);
            fetchSessions();
        } catch (error: any) {
            showErrorToast('Lỗi', error?.response?.data?.message || 'Không thể xóa điểm danh');
        }
    };

    // Update record status
    const updateRecordStatus = (recordId: number, status: AttendanceStatus) => {
        setEditRecords((prev) => {
            const newMap = new Map(prev);
            const current = newMap.get(recordId) || { status: 'PRESENT' };
            newMap.set(recordId, { ...current, status });
            return newMap;
        });
    };

    // Update record notes
    const updateRecordNotes = (recordId: number, notes: string) => {
        setEditRecords((prev) => {
            const newMap = new Map(prev);
            const current = newMap.get(recordId) || { status: 'PRESENT' };
            newMap.set(recordId, { ...current, notes });
            return newMap;
        });
    };

    // Format date
    const formatDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    // Filter sessions by month/year
    const filteredSessions = useMemo(() => {
        return sessions.filter((session) => {
            const [year, month] = session.attendanceDate.split('-');
            return parseInt(month) === selectedMonth && parseInt(year) === selectedYear;
        });
    }, [sessions, selectedMonth, selectedYear]);

    // Get available years from sessions
    const availableYears = useMemo(() => {
        const years = new Set(sessions.map((s) => parseInt(s.attendanceDate.split('-')[0])));
        return Array.from(years).sort((a, b) => b - a);
    }, [sessions]);

    // Generate month options
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

    return (
        <div className="space-y-4">
            {/* Header with Filters */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h3 className="text-lg font-semibold text-gray-900">Lịch sử điểm danh</h3>

                {/* Month/Year Filters */}
                <div className="flex items-center gap-3">
                    {/* Month Selector */}
                    <div className="relative">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                        >
                            {months.map((month) => (
                                <option key={month.value} value={month.value}>
                                    {month.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            size={16}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                    </div>

                    {/* Year Selector */}
                    <div className="relative">
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                        >
                            {availableYears.length > 0 ? (
                                availableYears.map((year) => (
                                    <option key={year} value={year}>
                                        Năm {year}
                                    </option>
                                ))
                            ) : (
                                <option value={selectedYear}>Năm {selectedYear}</option>
                            )}
                        </select>
                        <ChevronDown
                            size={16}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                    </div>
                </div>
            </div>

            {/* Result Count */}
            {!isLoading && sessions.length > 0 && (
                <div className="flex items-center justify-between px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="text-sm text-blue-800">
                        <span className="font-semibold">{filteredSessions.length}</span> buổi điểm danh trong Tháng{' '}
                        {selectedMonth}/{selectedYear}
                    </span>
                </div>
            )}

            {/* Sessions List */}
            {isLoading ? (
                <div className="text-center py-12 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm">Đang tải...</p>
                </div>
            ) : filteredSessions.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-12 text-center">
                    <Calendar size={48} className="mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600 font-medium mb-1">
                        {sessions.length === 0
                            ? 'Chưa có buổi điểm danh nào'
                            : `Không có buổi điểm danh nào trong Tháng ${selectedMonth}/${selectedYear}`}
                    </p>
                    <p className="text-sm text-gray-500">
                        {sessions.length === 0
                            ? 'Điểm danh sẽ xuất hiện ở đây sau khi bạn tạo buổi đầu tiên'
                            : 'Hãy chọn tháng/năm khác để xem lịch sử điểm danh'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSessions.map((session) => (
                        <div
                            key={session.sessionId}
                            onClick={() => handleViewSession(session.sessionId)}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer"
                        >
                            {/* Date */}
                            <div className="flex items-center gap-2 mb-3">
                                <Calendar size={18} className="text-blue-600" />
                                <span className="font-semibold text-gray-900">
                                    {formatDate(session.attendanceDate)}
                                </span>
                            </div>

                            {/* Stats */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <span className="text-sm text-gray-600 flex items-center gap-1">
                                        <Users size={14} />
                                        Tổng số
                                    </span>
                                    <span className="font-semibold text-sm">{session.totalStudents}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                                        <span className="text-xs text-green-700 flex items-center gap-1">
                                            <CheckCircle size={12} />
                                            Có mặt
                                        </span>
                                        <span className="font-semibold text-sm text-green-700">
                                            {session.presentCount}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                                        <span className="text-xs text-red-700 flex items-center gap-1">
                                            <XCircle size={12} />
                                            Vắng
                                        </span>
                                        <span className="font-semibold text-sm text-red-700">
                                            {session.absentCount}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            {isModalOpen && selectedSession && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Chi tiết điểm danh</h3>
                                <p className="text-sm text-gray-600 mt-0.5">
                                    {formatDate(selectedSession.attendanceDate)} - {selectedSession.className}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                {isEditMode ? (
                                    <>
                                        <button
                                            onClick={handleSave}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2"
                                        >
                                            <Save size={16} />
                                            Lưu
                                        </button>
                                        <button
                                            onClick={() => setIsEditMode(false)}
                                            className="px-4 py-2 border text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                                        >
                                            Hủy
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setIsEditMode(true)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
                                        >
                                            <Edit size={16} />
                                            Sửa
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirmId(selectedSession.sessionId)}
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center gap-2"
                                        >
                                            <Trash2 size={16} />
                                            Xóa
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setIsEditMode(false);
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Session Info */}
                            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                                    <div>
                                        <span className="text-gray-600">Giảng viên:</span>
                                        <span className="ml-2 font-medium text-gray-900">
                                            {selectedSession.teacherName}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Ngày:</span>
                                        <span className="ml-2 font-medium text-gray-900">
                                            {formatDate(selectedSession.attendanceDate)}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        Ghi chú buổi học:
                                    </label>
                                    {isEditMode ? (
                                        <textarea
                                            value={editNotes}
                                            onChange={(e) => setEditNotes(e.target.value)}
                                            placeholder="Nhập ghi chú chung cho buổi học..."
                                            rows={2}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    ) : (
                                        <p className="text-sm text-gray-700 italic">
                                            {selectedSession.notes || '(Không có ghi chú)'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Student List */}
                            <h4 className="font-semibold text-gray-900 mb-3">
                                Danh sách học viên ({selectedSession.records.length})
                            </h4>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-16">
                                                STT
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                Mã SV
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                Họ tên
                                            </th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-24">
                                                Có mặt
                                            </th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-24">
                                                Vắng
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                Ghi chú
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {selectedSession.records.map((record, index) => {
                                            const editRecord = editRecords.get(record.recordId);
                                            const currentStatus = isEditMode
                                                ? editRecord?.status || record.status
                                                : record.status;
                                            const currentNotes = isEditMode
                                                ? (editRecord?.notes ?? record.notes ?? '')
                                                : record.notes || '';

                                            return (
                                                <tr key={record.recordId} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                        {record.studentCode}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                        {record.studentName}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {isEditMode ? (
                                                            <input
                                                                type="radio"
                                                                name={`status-${record.recordId}`}
                                                                checked={currentStatus === 'PRESENT'}
                                                                onChange={() =>
                                                                    updateRecordStatus(record.recordId, 'PRESENT')
                                                                }
                                                                className="w-5 h-5 border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                                                            />
                                                        ) : currentStatus === 'PRESENT' ? (
                                                            <CheckCircle size={20} className="mx-auto text-green-600" />
                                                        ) : null}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {isEditMode ? (
                                                            <input
                                                                type="radio"
                                                                name={`status-${record.recordId}`}
                                                                checked={currentStatus === 'ABSENT'}
                                                                onChange={() =>
                                                                    updateRecordStatus(record.recordId, 'ABSENT')
                                                                }
                                                                className="w-5 h-5 border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                                            />
                                                        ) : currentStatus === 'ABSENT' ? (
                                                            <XCircle size={20} className="mx-auto text-red-600" />
                                                        ) : null}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {isEditMode ? (
                                                            <input
                                                                type="text"
                                                                value={currentNotes}
                                                                onChange={(e) =>
                                                                    updateRecordNotes(record.recordId, e.target.value)
                                                                }
                                                                placeholder="Ghi chú..."
                                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        ) : (
                                                            <span className="text-sm text-gray-600">
                                                                {currentNotes || '-'}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteConfirmId && (
                <ConfirmDialog
                    open={true}
                    onClose={() => setDeleteConfirmId(null)}
                    onConfirm={() => handleDelete(deleteConfirmId)}
                    title="Xóa buổi điểm danh"
                    description="Bạn có chắc chắn muốn xóa buổi điểm danh này không? Hành động này không thể hoàn tác."
                />
            )}
        </div>
    );
};

export default AttendanceHistoryTab;

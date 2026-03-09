import React, { useState } from 'react';
import { X, Mail, Phone, Calendar, User, Edit2 } from 'lucide-react';
import { updateEnrollment } from '@/shared/api/classes';
import { useToast } from '@/shared/hooks/useToast';

type Student = {
    enrollmentId: number;
    studentId: number;
    name: string;
    email: string;
    phone?: string;
    initial: string;
    status: string;
    enrolledAt: string;
    leftAt?: string;
    note?: string;
};

interface StudentDetailsModalProps {
    student: Student;
    classId: number;
    onClose?: () => void;
    onStatusUpdated?: () => void;
}

const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({ student, classId, onClose, onStatusUpdated }) => {
    const { success: showSuccessToast, error: showErrorToast } = useToast();
    const [isEditingStatus, setIsEditingStatus] = useState(false);
    const [newStatus, setNewStatus] = useState(student.status);
    const [newLeftAt, setNewLeftAt] = useState(student.leftAt || '');
    const [newNote, setNewNote] = useState(student.note || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleUpdateStatus = async () => {
        if (newStatus === student.status && newLeftAt === (student.leftAt || '') && newNote === (student.note || '')) {
            setIsEditingStatus(false);
            return;
        }

        try {
            setIsSubmitting(true);
            await updateEnrollment(classId, student.enrollmentId, {
                status: newStatus,
                leftAt: newLeftAt || undefined,
                note: newNote || undefined
            });
            
            showSuccessToast('Cập nhật trạng thái thành công!');
            setIsEditingStatus(false);
            onStatusUpdated?.();
            onClose?.();
        } catch (error: any) {
            showErrorToast(error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusDisplay = (status: string) => {
        switch(status) {
            case 'ACTIVE': return 'Đang học';
            case 'SUSPENDED': return 'Bảo lưu';
            case 'DROPPED': return 'Đã nghỉ';
            case 'GRADUATED': return 'Tốt nghiệp';
            default: return status;
        }
    };

    const getStatusClass = (status: string) => {
        switch(status) {
            case 'ACTIVE': return 'bg-green-50 text-green-700';
            case 'SUSPENDED': return 'bg-yellow-50 text-yellow-700';
            case 'DROPPED': return 'bg-red-50 text-red-700';
            case 'GRADUATED': return 'bg-blue-50 text-blue-700';
            default: return 'bg-gray-50 text-gray-700';
        }
    };

    return (
        <div className="bg-white rounded-lg max-w-md w-full">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 grid place-items-center">
                        <User size={16} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Chi tiết Học viên</h2>
                        <p className="text-sm text-gray-500">Thông tin chi tiết của học viên</p>
                    </div>
                </div>
                <button
                    className="text-gray-400 hover:text-gray-600"
                    onClick={onClose}
                >
                    <X size={20} />
                </button>
            </div>

            {/* Student Profile */}
            <div className="px-4 py-4">
                <div className="flex items-center gap-4 mb-4">
                    <div className="h-16 w-16 rounded-full bg-blue-100 text-blue-700 grid place-items-center text-2xl font-bold">
                        {student.initial}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(student.status)}`}>
                                {getStatusDisplay(student.status)}
                            </span>
                            <button
                                onClick={() => setIsEditingStatus(!isEditingStatus)}
                                className="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-1"
                            >
                                <Edit2 size={12} />
                                Đổi trạng thái
                            </button>
                        </div>
                    </div>
                </div>

                {/* Edit Status Form */}
                {isEditingStatus && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Trạng thái mới
                            </label>
                            <select
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md text-sm"
                            >
                                <option value="ACTIVE">Đang học</option>
                                <option value="SUSPENDED">Tạm dừng</option>
                                <option value="DROPPED">Đã rớt</option>
                            </select>
                        </div>
                        
                        {newStatus !== 'ACTIVE' && (
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Ngày kết thúc (tùy chọn)
                                </label>
                                <input
                                    type="date"
                                    value={newLeftAt}
                                    onChange={(e) => setNewLeftAt(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md text-sm"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Ghi chú (tùy chọn)
                            </label>
                            <textarea
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border rounded-md text-sm"
                                placeholder="Nhập ghi chú..."
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleUpdateStatus}
                                disabled={isSubmitting}
                                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Đang lưu...' : 'Lưu'}
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditingStatus(false);
                                    setNewStatus(student.status);
                                    setNewLeftAt(student.leftAt || '');
                                    setNewNote(student.note || '');
                                }}
                                className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                )}

                {/* Contact Information */}
                <div className="space-y-3">
                    {/* Email */}
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gray-50 text-gray-600 grid place-items-center">
                            <Mail size={14} />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Email</div>
                            <div className="text-sm font-medium text-gray-900">{student.email}</div>
                        </div>
                    </div>

                    {/* Phone */}
                    {student.phone && (
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-gray-50 text-gray-600 grid place-items-center">
                                <Phone size={14} />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">Điện thoại</div>
                                <div className="text-sm font-medium text-gray-900">{student.phone}</div>
                            </div>
                        </div>
                    )}

                    {/* Enrolled Date */}
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gray-50 text-gray-600 grid place-items-center">
                            <Calendar size={14} />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Ngày ghi danh</div>
                            <div className="text-sm font-medium text-gray-900">{student.enrolledAt}</div>
                        </div>
                    </div>

                    {/* Left Date */}
                    {student.leftAt && (
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-gray-50 text-gray-600 grid place-items-center">
                                <Calendar size={14} />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">Ngày kết thúc</div>
                                <div className="text-sm font-medium text-gray-900">{student.leftAt}</div>
                            </div>
                        </div>
                    )}

                    {/* Note */}
                    {student.note && (
                        <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-lg bg-gray-50 text-gray-600 grid place-items-center">
                                <User size={14} />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">Ghi chú</div>
                                <div className="text-sm font-medium text-gray-900">{student.note}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 border-t flex justify-end">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                    Đóng
                </button>
            </div>
        </div>
    );
};

export default StudentDetailsModal;

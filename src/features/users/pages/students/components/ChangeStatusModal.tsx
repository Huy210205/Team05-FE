import React, { useState } from 'react';
import { X, UserCheck } from 'lucide-react';
import { updateStudentStatus } from '@/shared/api/students';
import type { StudentUI } from '@/shared/types/student-ui';
import ConfirmDialog from '@/shared/components/ConfirmDialog';

interface ChangeStatusModalProps {
    student: StudentUI;
    onClose: () => void;
    onSave: (studentId: string, newStatus: StudentUI['status']) => void;
}

const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({ student, onClose, onSave }) => {
    // Default chọn "Nghỉ học" vì đây là option duy nhất
    const [selectedStatus, setSelectedStatus] = useState<StudentUI['status']>('Nghỉ học');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string>('');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // Map UI status to backend enum
    const mapStatusToAPI = (status: StudentUI['status']): string => {
        switch(status) {
            case 'Đang chờ': return 'PENDING';
            case 'Đang học': return 'ACTIVE';
            case 'Nghỉ học': return 'DROPPED';
            case 'Tốt nghiệp': return 'GRADUATED';
            default: return 'ACTIVE';
        }
    };

    const handleSave = () => {
        if (selectedStatus === student.status) {
            onClose();
            return;
        }

        // Hiển thị confirm dialog
        setShowConfirmDialog(true);
    };

    const handleConfirmSave = async () => {
        try {
            setIsSubmitting(true);
            setError('');
            
            const apiStatus = mapStatusToAPI(selectedStatus);
            await updateStudentStatus(parseInt(student.id), apiStatus);
            
            onSave(student.id, selectedStatus);
            onClose();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Chỉ cho phép chuyển sang trạng thái "Nghỉ học"
    // Các trạng thái khác (Đang chờ, Đang học, Tốt nghiệp) được quản lý tự động từ enrollment
    const statusOptions: { value: StudentUI['status']; label: string; description: string }[] = [
        {
            value: 'Nghỉ học',
            label: 'Nghỉ học',
            description: 'Đánh dấu học viên đã nghỉ học hoàn toàn, không quay lại'
        }
    ];

    return (
        <div className="bg-white rounded-lg w-96 max-w-sm">
            {/* Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 justify-center">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 grid place-items-center">
                        <UserCheck size={16} />
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-900">Thay đổi trạng thái</h3>
                        <p className="text-sm text-gray-500">Cập nhật trạng thái học viên</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Student Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4 justify-center">
                        <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-700 grid place-items-center text-lg font-medium">
                            {student.initial}
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.studentId}</div>
                            <div className="text-sm text-gray-500">{student.email}</div>
                        </div>
                    </div>
                </div>

                {/* Current Status */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Trạng thái hiện tại</div>
                    <div className="text-sm font-medium text-gray-900">{student.status}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {student.status === 'Nghỉ học' 
                            ? 'Học viên đã nghỉ học' 
                            : 'Trạng thái này được tự động cập nhật từ lớp học'}
                    </div>
                </div>

                {/* Status Selection */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Đánh dấu học viên nghỉ học vĩnh viễn
                        </label>
                        <div className="space-y-3">
                            {statusOptions.map((option) => (
                                <label
                                    key={option.value}
                                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                                        selectedStatus === option.value
                                            ? 'border-red-500 bg-red-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="status"
                                        value={option.value}
                                        checked={selectedStatus === option.value}
                                        onChange={(e) => setSelectedStatus(e.target.value as StudentUI['status'])}
                                        className="mt-1"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">{option.label}</div>
                                        <div className="text-sm text-gray-500">{option.description}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <div className="mt-3 text-xs text-gray-500 bg-yellow-50 p-2 rounded border border-yellow-200">
                            <strong>Lưu ý:</strong> Thao tác này chỉ dùng để đánh dấu học viên nghỉ học hoàn toàn.
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-3">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    Hủy
                </button>
                <button
                    onClick={handleSave}
                    disabled={isSubmitting || student.status === 'Nghỉ học'}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Đang cập nhật...' : student.status === 'Nghỉ học' ? 'Đã nghỉ học' : 'Xác nhận nghỉ học'}
                </button>
            </div>

            {/* Confirm Dialog */}
            <ConfirmDialog
                open={showConfirmDialog}
                onClose={() => setShowConfirmDialog(false)}
                onConfirm={handleConfirmSave}
                title="⚠️ Cảnh báo: Không thể hoàn tác"
                description={`Bạn có chắc chắn muốn đánh dấu học viên "${student.name}" là "Nghỉ học"?\n\nSau khi xác nhận, trạng thái này sẽ không thể tự động thay đổi và học viên sẽ bị đánh dấu đã nghỉ học vĩnh viễn.`}
                confirmText="Xác nhận nghỉ học"
                cancelText="Hủy bỏ"
                variant="danger"
            />
        </div>
    );
};

export default ChangeStatusModal;

import React, { useState, useEffect } from 'react';
import { Search, Plus, Calendar, Clock, FileText, X, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/shared/hooks/useToast';
import { useUserProfile } from '@/stores/userProfile';
import ConfirmDialog from '@/shared/components/ConfirmDialog';
import type { JournalResponse, JournalType } from '@/shared/types/journal';
import { createJournal, updateJournal, deleteJournal, getJournalsByClass } from '@/shared/api/journals';

type Class = {
    classId: number;
    name: string;
    programName: string;
    centerName: string;
    status: string;
};

interface ClassLogTabProps {
    selectedClass: Class | null;
    classes?: Class[];
    onClassChange?: (classItem: Class | null) => void;
    readOnly?: boolean; // View-only mode (no create/edit/delete/search/filter)
}

const ClassLogTab: React.FC<ClassLogTabProps> = ({
    selectedClass,
    classes = [],
    onClassChange = () => {},
    readOnly = false,
}) => {
    const { success: showSuccessToast, error: showErrorToast } = useToast();
    const { me: userProfile } = useUserProfile();
    const [logs, setLogs] = useState<JournalResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingJournal, setEditingJournal] = useState<JournalResponse | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<JournalResponse | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        journalType: 'NOTE' as JournalType,
        journalDate: new Date().toISOString().split('T')[0],
        journalTime: new Date().toTimeString().slice(0, 5), // HH:mm
    });

    useEffect(() => {
        const fetchJournals = async () => {
            if (!selectedClass) {
                setLogs([]);
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                const data = await getJournalsByClass(selectedClass.classId);
                setLogs(data);
            } catch (error: any) {
                // Backend API chưa sẵn sàng, sử dụng empty state
                if (error.code === 'ECONNABORTED' || error.response?.status === 500 || error.response?.status === 404) {
                    setLogs([]); // Hiển thị empty state thay vì error
                } else {
                    showErrorToast('Lỗi tải dữ liệu', 'Không thể tải danh sách nhật ký');
                    setLogs([]);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchJournals();
    }, [selectedClass]);

    const handleCreateLog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClass) return;

        setIsSubmitting(true);
        try {
            const now = new Date();
            const newJournal = await createJournal({
                classId: selectedClass.classId,
                title: formData.title,
                content: formData.content,
                journalType: formData.journalType,
                journalDate: now.toISOString().split('T')[0],
                journalTime: now.toTimeString().slice(0, 8), // HH:mm:ss
            });

            setLogs((prev) => [newJournal, ...prev]);
            showSuccessToast('Tạo nhật ký thành công', 'Nhật ký đã được tạo');

            setFormData({
                title: '',
                content: '',
                journalType: 'NOTE',
                journalDate: new Date().toISOString().split('T')[0],
                journalTime: new Date().toTimeString().slice(0, 5),
            });
            setShowCreateModal(false);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Không thể tạo nhật ký';
            showErrorToast('Lỗi tạo nhật ký', errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditLog = (journal: JournalResponse) => {
        setEditingJournal(journal);
        setFormData({
            title: journal.title,
            content: journal.content,
            journalType: journal.journalType,
            journalDate: journal.journalDate,
            journalTime: journal.journalTime,
        });
        setShowEditModal(true);
    };

    const handleUpdateLog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingJournal) return;

        setIsSubmitting(true);
        try {
            const now = new Date();
            const updatedJournal = await updateJournal(editingJournal.journalId, {
                title: formData.title,
                content: formData.content,
                journalType: formData.journalType,
                journalDate: now.toISOString().split('T')[0],
                journalTime: now.toTimeString().slice(0, 8), // HH:mm:ss
            });

            setLogs((prev) => prev.map((log) => (log.journalId === updatedJournal.journalId ? updatedJournal : log)));
            showSuccessToast('Cập nhật thành công', 'Nhật ký đã được cập nhật');

            setFormData({
                title: '',
                content: '',
                journalType: 'NOTE',
                journalDate: new Date().toISOString().split('T')[0],
                journalTime: new Date().toTimeString().slice(0, 5),
            });
            setShowEditModal(false);
            setEditingJournal(null);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Không thể cập nhật nhật ký';
            showErrorToast('Lỗi cập nhật', errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteLog = (journal: JournalResponse) => {
        setDeleteConfirm(journal);
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;

        try {
            await deleteJournal(deleteConfirm.journalId);
            setLogs((prev) => prev.filter((log) => log.journalId !== deleteConfirm.journalId));
            showSuccessToast('Xóa thành công', 'Nhật ký đã được xóa');
            setDeleteConfirm(null);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Không thể xóa nhật ký';
            showErrorToast('Lỗi xóa', errorMessage);
            setDeleteConfirm(null);
        }
    };

    const getTypeLabel = (type: JournalType) => {
        switch (type) {
            case 'PROGRESS':
                return 'Tiến độ';
            case 'ANNOUNCEMENT':
                return 'Thông báo';
            case 'ISSUE':
                return 'Vấn đề';
            case 'NOTE':
                return 'Ghi chú';
            case 'OTHER':
                return 'Khác';
            default:
                return type;
        }
    };

    const getTypeColor = (type: JournalType) => {
        switch (type) {
            case 'PROGRESS':
                return 'bg-blue-50 text-blue-700 border border-blue-200';
            case 'ANNOUNCEMENT':
                return 'bg-orange-50 text-orange-700 border border-orange-200';
            case 'ISSUE':
                return 'bg-red-50 text-red-700 border border-red-200';
            case 'NOTE':
                return 'bg-green-50 text-green-700 border border-green-200';
            case 'OTHER':
                return 'bg-gray-50 text-gray-700 border border-gray-200';
            default:
                return 'bg-gray-50 text-gray-700 border border-gray-200';
        }
    };

    const filteredLogs = logs.filter((log) => {
        // In readOnly mode, skip filtering
        if (readOnly) return true;

        const matchesSearch =
            log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'all' || log.journalType === filterType;
        return matchesSearch && matchesFilter;
    });

    const canEditDelete = (journal: JournalResponse) => {
        const isSuperAdmin = userProfile?.roles.some((role) => role.code === 'SUPER_ADMIN');
        const isOwner = journal.teacherId === userProfile?.userId;
        return isSuperAdmin || isOwner;
    };

    return (
        <div className="space-y-6">
            {/* Action Bar */}
            {!readOnly && (
                <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 flex flex-wrap items-center gap-4">
                    <div className="relative flex-grow">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm nhật ký..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#f3f3f5] border-transparent rounded-lg pl-10 pr-4 py-2 text-sm placeholder:text-[#717182] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                    {/* Only show class dropdown if there are multiple classes */}
                    {classes.length > 1 && (
                        <div className="relative w-full sm:w-auto md:w-64">
                            <select
                                value={selectedClass?.classId || ''}
                                onChange={(e) => {
                                    const classId = parseInt(e.target.value);
                                    const classItem = classes.find((c) => c.classId === classId);
                                    onClassChange(classItem || null);
                                }}
                                className="w-full bg-[#f3f3f5] border-transparent rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                {classes.map((classItem) => (
                                    <option key={classItem.classId} value={classItem.classId}>
                                        {classItem.name} - {classItem.programName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="relative w-full sm:w-auto md:w-48">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="appearance-none w-full bg-[#f3f3f5] rounded-lg px-4 py-2 text-sm focus:outline-none"
                        >
                            <option value="all">Tất cả loại</option>
                            <option value="PROGRESS">Tiến độ</option>
                            <option value="ANNOUNCEMENT">Thông báo</option>
                            <option value="ISSUE">Vấn đề</option>
                            <option value="NOTE">Ghi chú</option>
                            <option value="OTHER">Khác</option>
                        </select>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#030213] text-white text-sm font-medium px-4 py-2 hover:bg-black focus:outline-none"
                    >
                        <Plus className="w-4 h-4" />
                        Viết Nhật ký mới
                    </button>
                </div>
            )}

            {/* Logs List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
                        <p className="text-sm text-gray-600">Đang tải nhật ký...</p>
                    </div>
                ) : filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                        <div
                            key={log.journalId}
                            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-200"
                            role="article"
                            aria-label={`Nhật ký: ${log.title}`}
                        >
                            {/* Header: Badge + Actions */}
                            <div className="flex items-center justify-between mb-3">
                                <span
                                    className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium ${getTypeColor(log.journalType)}`}
                                >
                                    {getTypeLabel(log.journalType)}
                                </span>
                                {!readOnly && canEditDelete(log) && (
                                    <div className="flex items-center gap-2.5">
                                        <button
                                            onClick={() => handleEditLog(log)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                            title="Chỉnh sửa nhật ký"
                                            aria-label={`Chỉnh sửa nhật ký ${log.title}`}
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteLog(log)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                            title="Xóa nhật ký"
                                            aria-label={`Xóa nhật ký ${log.title}`}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Title */}
                            <h3 className="text-base font-bold text-gray-900 mb-3 line-clamp-1">{log.title}</h3>

                            {/* Content Preview */}
                            <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-2">{log.content}</p>

                            {/* Footer Metadata */}
                            <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-100">
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={14} className="text-gray-400" />
                                    <span>{new Date(log.journalDate).toLocaleDateString('vi-VN')}</span>
                                </div>
                                {log.teacherName && (
                                    <div className="flex items-center gap-1.5">
                                        <FileText size={14} className="text-gray-400" />
                                        <span className="truncate max-w-[120px]">{log.teacherName}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5">
                                    <Clock size={14} className="text-gray-400" />
                                    <span>
                                        {new Date(log.createdAt).toLocaleTimeString('vi-VN', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                        <div className="text-gray-300 mb-3">
                            <FileText size={40} className="mx-auto" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">Chưa có nhật ký nào</h3>
                        <p className="text-xs text-gray-500">Hãy tạo nhật ký đầu tiên cho lớp học này</p>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-gray-900">Viết Nhật ký Lớp học mới</h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Ghi lại tiến độ, thông báo hoặc ghi chú về lớp học
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateLog} className="px-6 py-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Tiêu đề</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                                    placeholder="Tiêu đề nhật ký"
                                    className="w-full bg-[#f3f3f5] border-transparent rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Nội dung</label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                                    placeholder="Nội dung chi tiết..."
                                    rows={5}
                                    className="w-full bg-[#f3f3f5] border-transparent rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Loại</label>
                                <select
                                    value={formData.journalType}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, journalType: e.target.value as JournalType }))
                                    }
                                    className="w-full bg-[#f3f3f5] border-transparent rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    <option value="PROGRESS">Tiến độ</option>
                                    <option value="ANNOUNCEMENT">Thông báo</option>
                                    <option value="ISSUE">Vấn đề</option>
                                    <option value="NOTE">Ghi chú</option>
                                    <option value="OTHER">Khác</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        Ngày ghi nhật ký
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={new Date().toLocaleDateString('vi-VN')}
                                            readOnly
                                            className="w-full bg-gray-100 border-transparent rounded-lg px-4 py-2.5 text-sm text-gray-700 cursor-not-allowed"
                                        />
                                        <Calendar
                                            size={14}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        Giờ ghi nhật ký
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={new Date().toLocaleTimeString('vi-VN', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                            readOnly
                                            className="w-full bg-gray-100 border-transparent rounded-lg px-4 py-2.5 text-sm text-gray-700 cursor-not-allowed"
                                        />
                                        <Clock
                                            size={14}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2.5 border border-transparent text-white text-sm font-medium bg-[#030213] rounded-lg hover:bg-black focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSubmitting ? 'Đang tạo...' : 'Tạo Nhật ký'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingJournal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-gray-900">Chỉnh sửa Nhật ký</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Cập nhật thông tin nhật ký lớp học</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingJournal(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateLog} className="px-6 py-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Tiêu đề</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                                    placeholder="Tiêu đề nhật ký"
                                    className="w-full bg-[#f3f3f5] border-transparent rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Nội dung</label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                                    placeholder="Nội dung chi tiết..."
                                    rows={5}
                                    className="w-full bg-[#f3f3f5] border-transparent rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Loại</label>
                                <select
                                    value={formData.journalType}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, journalType: e.target.value as JournalType }))
                                    }
                                    className="w-full bg-[#f3f3f5] border-transparent rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    <option value="PROGRESS">Tiến độ</option>
                                    <option value="ANNOUNCEMENT">Thông báo</option>
                                    <option value="ISSUE">Vấn đề</option>
                                    <option value="NOTE">Ghi chú</option>
                                    <option value="OTHER">Khác</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        Ngày ghi nhật ký
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={new Date().toLocaleDateString('vi-VN')}
                                            readOnly
                                            className="w-full bg-gray-100 border-transparent rounded-lg px-4 py-2.5 text-sm text-gray-700 cursor-not-allowed"
                                        />
                                        <Calendar
                                            size={14}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        Giờ ghi nhật ký
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={new Date().toLocaleTimeString('vi-VN', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                            readOnly
                                            className="w-full bg-gray-100 border-transparent rounded-lg px-4 py-2.5 text-sm text-gray-700 cursor-not-allowed"
                                        />
                                        <Clock
                                            size={14}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingJournal(null);
                                    }}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2.5 border border-transparent text-white text-sm font-medium bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={confirmDelete}
                title="Xác nhận xóa nhật ký"
                description={`Bạn có chắc chắn muốn xóa nhật ký "${deleteConfirm?.title}"? Hành động này không thể hoàn tác.`}
                confirmText="Xóa"
                cancelText="Hủy"
                variant="danger"
            />
        </div>
    );
};

export default ClassLogTab;

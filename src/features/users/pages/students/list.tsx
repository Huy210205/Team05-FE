import { Mail, Phone, Calendar, GraduationCap, Clock, CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StudentActions from './components/actions';
import type { StudentUI } from '@/shared/types/student-ui';

interface StudentListProps {
    students: StudentUI[];
    totalStudents: number;
    currentPage: number;
    totalPages: number;
    onView?: (student: StudentUI) => void;
    onEdit?: (student: StudentUI) => void;
    onChangeStatus?: (student: StudentUI) => void;
    onDelete?: (student: StudentUI) => void;
    openMenuId?: string | null;
    onMenuToggle?: (id: string) => void;
    onPageChange?: (page: number) => void;
}

const StudentList: React.FC<StudentListProps> = ({
    students,
    totalStudents,
    currentPage,
    totalPages,
    onView,
    onEdit,
    onChangeStatus,
    onDelete,
    openMenuId: _openMenuId,
    onMenuToggle: _onMenuToggle,
    onPageChange,
}) => {
    // no-op helpers removed to avoid unused warnings

    const navigate = useNavigate();

    return (
        <section className="rounded-2xl border border-gray-200 bg-white">
            <div className="px-4 py-3 border-b">
                <div className="text-sm font-medium">Danh sách Học viên</div>
                <div className="text-xs text-gray-500">Quản lý tất cả hồ sơ học viên ({totalStudents} kết quả)</div>
            </div>

            <div className="p-3 space-y-3">
                {students.map((student) => (
                    <div
                        key={student.id}
                        onClick={() => navigate(`/students/${student.id}`)}
                        className="group border rounded-xl p-3 bg-white hover:bg-gray-50 hover:shadow-sm transition-all cursor-pointer"
                    >
                        <div className="flex items-start gap-3">
                            {/* Avatar */}
                            {student.avatar ? (
                                <img
                                    src={student.avatar}
                                    alt={student.name}
                                    className="h-10 w-10 rounded-full object-cover border border-gray-200"
                                />
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 grid place-items-center text-sm font-medium">
                                    {student.initial}
                                </div>
                            )}

                            {/* Middle content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-gray-900 truncate">
                                            {student.name}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">{student.studentId}</div>
                                    </div>
                                    {/* Status */}
                                    <span
                                        className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                            student.status === 'Đang học'
                                                ? 'bg-green-50 text-green-700'
                                                : student.status === 'Đang chờ'
                                                  ? 'bg-yellow-50 text-yellow-700'
                                                  : student.status === 'Nghỉ học'
                                                    ? 'bg-red-50 text-red-700'
                                                    : 'bg-blue-50 text-blue-700'
                                        }`}
                                    >
                                        {student.status === 'Đang học' ? (
                                            <CheckCircle size={14} className="text-green-600" />
                                        ) : student.status === 'Đang chờ' ? (
                                            <Clock size={14} className="text-yellow-600" />
                                        ) : student.status === 'Nghỉ học' ? (
                                            <X size={14} className="text-red-600" />
                                        ) : (
                                            <GraduationCap size={14} className="text-blue-600" />
                                        )}
                                        {student.status}
                                    </span>
                                </div>

                                {/* Meta info row */}
                                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                    <div className="flex items-center gap-2 text-gray-700 min-w-0">
                                        <Mail size={12} className="text-gray-400" />
                                        <span className="text-xs truncate">{student.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Phone size={12} className="text-gray-400" />
                                        <span className="text-xs">{student.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Calendar size={12} className="text-gray-400" />
                                        <span className="text-xs">{student.registrationDate}</span>
                                    </div>
                                </div>

                                {/* Classes preview */}
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {student.enrollments && student.enrollments.length > 0 ? (
                                        student.enrollments.slice(0, 3).map((enrollment, idx) => (
                                            <span
                                                key={idx}
                                                className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-[11px] font-medium"
                                            >
                                                {enrollment.className}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-gray-500">Chưa có lớp</span>
                                    )}
                                    {student.enrollments && student.enrollments.length > 3 && (
                                        <span className="text-xs text-[#717182]">
                                            +{student.enrollments.length - 3} lớp nữa
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions - stop propagation so card click won't trigger */}
                            <div onClick={(e) => e.stopPropagation()}>
                                <StudentActions
                                    onView={() => (onView ? onView(student) : navigate(`/students/${student.id}`))}
                                    onEdit={() => onEdit?.(student)}
                                    onChangeStatus={() => onChangeStatus?.(student)}
                                    onRemove={() => onDelete?.(student)}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            <div className="px-3 py-3 border-t flex items-center justify-between text-sm text-gray-500">
                <div>
                    Hiển thị {(currentPage - 1) * 8 + 1} - {Math.min(currentPage * 8, totalStudents)} trong số{' '}
                    {totalStudents} kết quả
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onPageChange?.(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-2 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => onPageChange?.(page)}
                            className={`px-2 py-1 text-xs rounded ${
                                currentPage === page ? 'bg-gray-900 text-white' : 'border hover:bg-gray-50'
                            }`}
                        >
                            {page}
                        </button>
                    ))}

                    <button
                        onClick={() => onPageChange?.(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-2 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            </div>
        </section>
    );
};

export default StudentList;

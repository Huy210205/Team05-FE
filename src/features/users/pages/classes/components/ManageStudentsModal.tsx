import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Eye, UserMinus, Edit2, AlertCircle } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import StudentDetailsModal from './StudentDetailsModal';
import AddStudentModal from './AddStudentModal';
import { getClassStudents, removeStudentFromClass, updateEnrollment } from '@/shared/api/classes';
import { useToast } from '@/shared/hooks/useToast';
import type { EnrollmentResponse } from '@/shared/types/classes';
import { getStudentAttendanceHistory } from '@/shared/api/attendance';
import { getStudentGradesByStudentId } from '@/shared/api/grade-entries';

type Instructor = {
    id: string;
    name: string;
    initial: string;
    avatar?: string;
};

type Class = {
    id: string;
    name: string;
    description: string;
    program: string;
    startDate: string;
    schedule: string;
    location: string;
    students: number;
    maxStudents: number;
    instructors: Instructor[];
    status: 'Chuẩn bị' | 'Đang học' | 'Hoàn thành' | 'Tạm dừng';
};

type Student = {
    enrollmentId: number;
    studentId: number;
    name: string;
    email: string;
    phone?: string;
    initial: string;
    studentOverallStatus: string;  // Trạng thái tổng quan của học viên
    status: string;  // Trạng thái enrollment
    enrolledAt: string;
    leftAt?: string;
    note?: string;
};

interface ManageStudentsModalProps {
    classItem: Class;
    onClose?: () => void;
    inlineMode?: boolean; // when true, render as inline panel (no close/footer)
    onStudentsChanged?: () => void; // callback when students list changes (add/remove/status)
    readOnly?: boolean; // when true, hide add/edit/delete buttons
}

const ManageStudentsModal: React.FC<ManageStudentsModalProps> = ({
    classItem,
    onClose,
    inlineMode = false,
    onStudentsChanged,
    readOnly = false,
}) => {
    const navigate = useNavigate();
    const { success: showSuccessToast, error: showErrorToast } = useToast();
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [openAddStudent, setOpenAddStudent] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingStatus, setEditingStatus] = useState<number | null>(null);
    const [newStatus, setNewStatus] = useState<string>('');
    const [newNote, setNewNote] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    
    // Warning system states
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [studentWarnings, setStudentWarnings] = useState<Map<number, { absences: number; failedExams: number }>>(new Map());

    // Load students from API
    useEffect(() => {
        loadStudents();
    }, [classItem.id]);

    // Load warnings when students or month/year changes
    useEffect(() => {
        if (students.length > 0) {
            loadStudentWarnings();
        }
    }, [students.length, selectedMonth, selectedYear]);

    // Auto-select current month/year when component first loads
    // (Keep current date logic for this component as it's for warnings/monitoring)
    useEffect(() => {
        const now = new Date();
        setSelectedMonth(now.getMonth() + 1);
        setSelectedYear(now.getFullYear());
    }, []);

    const loadStudents = async () => {
        try {
            setIsLoading(true);

            // WORKAROUND: Backend có vấn đề với status filter
            // Khi update status sang SUSPENDED/DROPPED, API ?status=SUSPENDED trả về 0
            // Có thể backend đang soft delete thay vì chỉ update status
            // Thử gọi không có status param để xem có trả về tất cả không
            
            let allEnrollments: EnrollmentResponse[] = [];
            
            try {
                // Thử 1: Gọi KHÔNG có status param
                const responseAll = await getClassStudents(parseInt(classItem.id), {
                    page: 0,
                    size: 1000,
                });
                
                if (responseAll.data) {
                    if (Array.isArray(responseAll.data)) {
                        allEnrollments = responseAll.data;
                    } else if (responseAll.data.content && Array.isArray(responseAll.data.content)) {
                        allEnrollments = responseAll.data.content;
                    }
                }
                // Nếu vẫn chỉ có ACTIVE, thì backend có vấn đề nghiêm trọng
                const hasNonActive = allEnrollments.some(e => e.status !== 'ACTIVE');
                if (!hasNonActive && allEnrollments.length > 0) {
                }
            } catch (error) {
                // Fallback: Thử gọi với từng status
                const statuses = ['ACTIVE', 'SUSPENDED', 'DROPPED', 'GRADUATED'];
                
                const responses = await Promise.all(
                    statuses.map(status => 
                        getClassStudents(parseInt(classItem.id), {
                            status,
                            page: 0,
                            size: 1000,
                        }).catch(err => {
                            return { data: { content: [] } };
                        })
                    )
                );

                // Merge results
                responses.forEach((response, idx) => {
                    if (response.data) {
                        let enrollments: EnrollmentResponse[] = [];
                        if (Array.isArray(response.data)) {
                            enrollments = response.data;
                        } else if (response.data.content && Array.isArray(response.data.content)) {
                            enrollments = response.data.content;
                        }
                        allEnrollments.push(...enrollments);
                    }
                });
            }

            
            // Log each enrollment with its status
            allEnrollments.forEach((e, idx) => {
            });

            const formattedStudents: Student[] = allEnrollments.map((enrollment) => ({
                enrollmentId: enrollment.enrollmentId,
                studentId: enrollment.studentId,
                name: enrollment.studentName,
                email: enrollment.studentEmail,
                initial: enrollment.studentName.charAt(0).toUpperCase(),
                studentOverallStatus: enrollment.studentOverallStatus,
                status: enrollment.status,
                enrolledAt: enrollment.enrolledAt,
                leftAt: enrollment.leftAt,
                note: enrollment.note,
            }));
            setStudents(formattedStudents);
        } catch (error: any) {
            showErrorToast(error?.response?.data?.message || 'Không thể tải danh sách học viên');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddStudents = () => {
        // Reload the student list after adding
        loadStudents();
        setOpenAddStudent(false);
        onStudentsChanged?.(); // notify parent
    };

    const handleViewDetails = (student: Student) => {
        // Navigate to student detail page
        navigate(`/students/${student.studentId}`);
    };

    const handleRemoveFromClass = async (student: Student) => {
        try {
            await removeStudentFromClass(parseInt(classItem.id), student.enrollmentId, 'Xóa bởi giáo viên/quản trị');

            showSuccessToast(`Đã xóa học viên ${student.name} khỏi lớp`);
            // Reload the student list
            loadStudents();
            onStudentsChanged?.(); // notify parent
        } catch (error: any) {
            showErrorToast(error?.response?.data?.message || 'Có lỗi xảy ra khi xóa học viên');
        }
    };

    const handleAddStudent = () => {
        setOpenAddStudent(true);
    };

    const handleChangeStatus = async (student: Student) => {
        if (!newStatus) return;

        try {
            const payload: any = {
                status: newStatus,
            };

            // Add note if changed or provided
            if (newNote.trim()) {
                payload.note = newNote.trim();
            }

            await updateEnrollment(parseInt(classItem.id), student.enrollmentId, payload);

            const statusText =
                newStatus === 'ACTIVE'
                    ? 'Đang học'
                    : newStatus === 'SUSPENDED'
                      ? 'Bảo lưu'
                      : newStatus === 'GRADUATED'
                        ? 'Tốt nghiệp'
                        : newStatus === 'DROPPED'
                          ? 'Đã nghỉ'
                          : newStatus;

            showSuccessToast(`Đã cập nhật trạng thái thành ${statusText}`);
            setEditingStatus(null);
            setNewNote('');
            loadStudents();
            onStudentsChanged?.(); // notify parent
        } catch (error: any) {
            showErrorToast(error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'Đang học';
            case 'SUSPENDED':
                return 'Bảo lưu';
            case 'GRADUATED':
                return 'Tốt nghiệp';
            case 'DROPPED':
                return 'Đã nghỉ';
            default:
                return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'bg-green-100 text-green-700';
            case 'SUSPENDED':
                return 'bg-yellow-100 text-yellow-700';
            case 'GRADUATED':
                return 'bg-blue-100 text-blue-700';
            case 'DROPPED':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const loadStudentWarnings = async () => {
        const warningsMap = new Map<number, { absences: number; failedExams: number }>();
        
        await Promise.all(
            students.map(async (student) => {
                try {
                    // Load attendance data
                    const attendanceResponse = await getStudentAttendanceHistory(
                        student.studentId,
                        parseInt(classItem.id)
                    );
                    
                    // Load grades data
                    const gradesResponse = await getStudentGradesByStudentId(student.studentId);
                    
                    // Filter attendance by selected month/year - data is in records array
                    const absences = (attendanceResponse.data.records || []).filter((record: any) => {
                        const date = new Date(record.attendanceDate);
                        return (
                            date.getMonth() + 1 === selectedMonth &&
                            date.getFullYear() === selectedYear &&
                            (record.status === 'ABSENT' || record.status === 'LATE')
                        );
                    }).length;
                    
                    // Filter failed exams by selected month/year and THIS CLASS ONLY
                    const failedExams = (gradesResponse || []).filter((grade: any) => {
                        if (!grade.entryDate) return false;
                        // Only count exams from THIS class
                        if (grade.classId !== parseInt(classItem.id)) return false;
                        const date = new Date(grade.entryDate);
                        return (
                            date.getMonth() + 1 === selectedMonth &&
                            date.getFullYear() === selectedYear &&
                            grade.passStatus === 'FAIL'
                        );
                    }).length;
                    
                    
                    if (absences >= 2 || failedExams >= 2) {
                        warningsMap.set(student.studentId, { absences, failedExams });
                    }
                } catch (error) {
                }
            })
        );
        setStudentWarnings(warningsMap);
    };

    // Filter students based on status filter
    const filteredStudents = statusFilter === 'ALL' ? students : students.filter((s) => s.status === statusFilter);

    return (
        <div className="bg-white rounded-lg">
            {/* Header */}
            <div className="px-4 py-3 border-b flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                        {inlineMode ? 'Danh sách học viên' : `Quản lý Học viên - ${classItem.name}`}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {inlineMode
                            ? 'Danh sách học viên của lớp học và thêm mới'
                            : 'Xem và quản lý danh sách học viên của lớp học'}
                    </p>
                </div>
                {!inlineMode && (
                    <button
                        className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                        onClick={() => {
                            onClose?.();
                        }}
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Student Count and Add Button */}
            <div className="px-4 py-3 border-b flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">
                        Sĩ số: {students.filter((s) => s.status === 'ACTIVE').length}/{classItem.maxStudents} học viên
                        <span className="text-gray-400 ml-2">(Tổng: {students.length})</span>
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="text-sm border rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-200"
                    >
                        <option value="ALL">Tất cả trạng thái</option>
                        <option value="ACTIVE">Đang học</option>
                        <option value="SUSPENDED">Bảo lưu</option>
                        <option value="DROPPED">Đã nghỉ</option>
                        <option value="GRADUATED">Tốt nghiệp</option>
                    </select>
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="text-sm border rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-200"
                    >
                        <option value={1}>Tháng 1</option>
                        <option value={2}>Tháng 2</option>
                        <option value={3}>Tháng 3</option>
                        <option value={4}>Tháng 4</option>
                        <option value={5}>Tháng 5</option>
                        <option value={6}>Tháng 6</option>
                        <option value={7}>Tháng 7</option>
                        <option value={8}>Tháng 8</option>
                        <option value={9}>Tháng 9</option>
                        <option value={10}>Tháng 10</option>
                        <option value={11}>Tháng 11</option>
                        <option value={12}>Tháng 12</option>
                    </select>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="text-sm border rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-200"
                    >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>
                {!readOnly && (
                    <button
                        onClick={handleAddStudent}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                        <Plus size={16} />
                        Thêm học viên
                    </button>
                )}
            </div>

            {/* Students List */}
            <div className="max-h-96 overflow-y-auto" style={{ overflowX: 'visible', overflowY: 'auto' }}>
                <div className="px-4 py-2 border-b bg-gray-50 text-xs text-gray-500 grid grid-cols-12 gap-4">
                    <div className="col-span-5">Học viên</div>
                    <div className="col-span-4">Trạng thái</div>
                    <div className="col-span-3">Thao tác</div>
                </div>

                {isLoading ? (
                    <div className="px-4 py-8 text-center text-gray-500">Đang tải danh sách học viên...</div>
                ) : filteredStudents.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                        {statusFilter === 'ALL'
                            ? 'Chưa có học viên nào trong lớp'
                            : `Không có học viên ${getStatusText(statusFilter)}`}
                    </div>
                ) : (
                    <div className="divide-y" style={{ paddingTop: '60px', marginTop: '-60px' }}>
                        {filteredStudents.map((student) => (
                            <div 
                                key={student.enrollmentId} 
                                className="px-4 py-3 grid grid-cols-12 gap-4 items-center cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => handleViewDetails(student)}
                            >
                                {/* Student Info */}
                                <div className="col-span-5 flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 grid place-items-center text-sm font-medium">
                                        {student.initial}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-900">{student.name}</span>
                                            {studentWarnings.has(student.studentId) && (
                                                <div className="group relative inline-block">
                                                    <AlertCircle className="text-orange-500 cursor-pointer" size={16} />
                                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-[9999] hidden group-hover:block w-max max-w-xs p-3 bg-white text-gray-800 text-sm rounded-lg shadow-2xl border-2 border-gray-300">
                                                        <div className="font-bold text-orange-600 mb-2 flex items-center gap-1">
                                                            <AlertCircle size={14} />
                                                            Cảnh báo
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            {studentWarnings.get(student.studentId)!.absences > 0 && (
                                                                <div className="flex items-start gap-2">
                                                                    <span className="text-orange-500 font-bold">•</span>
                                                                    <span>Vắng {studentWarnings.get(student.studentId)!.absences} buổi học</span>
                                                                </div>
                                                            )}
                                                            {studentWarnings.get(student.studentId)!.failedExams > 0 && (
                                                                <div className="flex items-start gap-2">
                                                                    <span className="text-orange-500 font-bold">•</span>
                                                                    <span>Trượt {studentWarnings.get(student.studentId)!.failedExams} bài thi</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {/* Arrow pointer */}
                                                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white"></div>
                                                        <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-[1px] w-0 h-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-300"></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500">{student.email}</div>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="col-span-4" onClick={(e) => e.stopPropagation()}>
                                    {editingStatus === student.enrollmentId ? (
                                        <div className="space-y-2">
                                            <select
                                                value={newStatus}
                                                onChange={(e) => setNewStatus(e.target.value)}
                                                className="w-full text-xs border rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-200"
                                                autoFocus
                                            >
                                                <option value="">Chọn trạng thái</option>
                                                <option value="ACTIVE">Đang học</option>
                                                <option value="SUSPENDED">Bảo lưu</option>
                                                <option value="DROPPED">Đã nghỉ</option>
                                                <option value="GRADUATED">Tốt nghiệp</option>
                                            </select>
                                            <textarea
                                                value={newNote}
                                                onChange={(e) => setNewNote(e.target.value)}
                                                placeholder="Ghi chú (tùy chọn)"
                                                className="w-full text-xs border rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                                                rows={2}
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent row click
                                                        handleChangeStatus(student);
                                                    }}
                                                    disabled={!newStatus || newStatus === student.status}
                                                    className="flex-1 text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                                >
                                                    Lưu
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent row click
                                                        setEditingStatus(null);
                                                        setNewNote('');
                                                    }}
                                                    className="flex-1 text-xs px-2 py-1 border rounded hover:bg-gray-50"
                                                >
                                                    Hủy
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getStatusColor(student.status)}`}
                                                >
                                                    {getStatusText(student.status)}
                                                </span>
                                                {!readOnly && student.studentOverallStatus !== 'DROPPED' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent row click
                                                            setEditingStatus(student.enrollmentId);
                                                            setNewStatus(student.status);
                                                            setNewNote(student.note || '');
                                                        }}
                                                        className="text-gray-400 hover:text-blue-600"
                                                        title="Đổi trạng thái"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            {student.note && (
                                                <div className="text-xs text-gray-500 italic">Note: {student.note}</div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="col-span-3" onClick={(e) => e.stopPropagation()}>
                                    {!readOnly && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger className="h-8 w-8 rounded hover:bg-gray-100 flex items-center justify-center">
                                                <span className="text-gray-400">⋯</span>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-48">
                                                <DropdownMenuItem onClick={() => handleViewDetails(student)}>
                                                    <Eye size={14} className="mr-2" />
                                                    Xem chi tiết
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleRemoveFromClass(student)}
                                                    className="text-red-600"
                                                >
                                                    <UserMinus size={14} className="mr-2" />
                                                    Xóa khỏi lớp
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                    {readOnly && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent double navigation
                                                handleViewDetails(student);
                                            }}
                                            className="h-8 px-3 text-xs rounded border hover:bg-gray-50 flex items-center gap-1"
                                        >
                                            <Eye size={14} />
                                            Xem
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            {!inlineMode && (
                <div className="px-4 py-3 border-t flex justify-end">
                    <button
                        onClick={() => {
                            onClose?.();
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                        Đóng
                    </button>
                </div>
            )}

            {/* Student Details Modal */}
            {selectedStudent && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
                    <StudentDetailsModal
                        student={selectedStudent}
                        classId={parseInt(classItem.id)}
                        onClose={() => setSelectedStudent(null)}
                        onStatusUpdated={loadStudents}
                    />
                </div>
            )}

            <AddStudentModal
                open={openAddStudent}
                onClose={() => setOpenAddStudent(false)}
                classItem={classItem}
                onAddStudents={handleAddStudents}
            />
        </div>
    );
};

export default ManageStudentsModal;

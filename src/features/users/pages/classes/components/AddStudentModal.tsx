import React, { useState, useEffect } from 'react';
import { X, Search, Mail, Phone, Check, AlertTriangle, Clock, Calendar } from 'lucide-react';
import { enrollStudent, listClasses, getClassStudents } from '@/shared/api/classes';
import { listStudents } from '@/shared/api/students';
import { useToast } from '@/shared/hooks/useToast';
import type { StudentDto } from '@/shared/types/student';
import type { ClassDto } from '@/shared/api/classes';

type StudentEnrolledClass = {
    className: string;
    programName: string;
    studyDays?: string[];
    studyTime?: string;
};

type Student = {
    studentId: number;
    fullName: string;
    email: string;
    phone: string;
    initial: string;
    overallStatus?: string;
    enrolledClasses?: StudentEnrolledClass[];
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
    instructors: any[];
    status: 'Chuẩn bị' | 'Đang học' | 'Hoàn thành' | 'Tạm dừng';
    studyDays?: string[];
    studyTime?: string;
};

interface AddStudentModalProps {
    open: boolean;
    onClose: () => void;
    classItem: Class;
    onAddStudents: (studentIds: string[]) => void;
}

const AddStudentModal: React.FC<AddStudentModalProps> = ({
    open,
    onClose,
    classItem,
    onAddStudents
}) => {
    const { success: showSuccessToast, error: showErrorToast } = useToast();
    const [query, setQuery] = useState('');
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Load students from API
    useEffect(() => {
        if (open) {
            loadStudents();
        }
    }, [open]);

    const loadStudents = async () => {
        try {
            setIsLoading(true);
            
            // Load students
            const response = await listStudents();
            const students: StudentDto[] = response.data;
            
            // Load all classes to get enrollments
            const classesResponse = await listClasses();
            const allClasses: ClassDto[] = classesResponse.data;
            
            // Map to store each student's enrolled classes
            const studentClassesMap = new Map<number, StudentEnrolledClass[]>();
            
            // Load enrollments for each class
            for (const classItem of allClasses) {
                try {
                    const enrollmentsResponse = await getClassStudents(classItem.classId, {
                        status: 'ACTIVE',
                        page: 0,
                        size: 1000
                    });
                    const enrollments = enrollmentsResponse.data.content || enrollmentsResponse.data;
                    
                    // For each enrollment, add class info to student's map
                    enrollments.forEach((enrollment: any) => {
                        if (!studentClassesMap.has(enrollment.studentId)) {
                            studentClassesMap.set(enrollment.studentId, []);
                        }
                        studentClassesMap.get(enrollment.studentId)!.push({
                            className: classItem.name,
                            programName: classItem.programName,
                            studyDays: classItem.studyDays,
                            studyTime: classItem.studyTime
                        });
                    });
                } catch (error) {
                    // Skip if can't access this class
                }
            }
            
            // Format students with enrolled classes
            // Hiển thị học viên PENDING và ACTIVE để có thể đăng ký thêm lớp (nếu không trùng lịch)
            // Loại bỏ học viên DROPPED (nghỉ học) - họ không thể đăng ký lớp mới
            // Cho phép học viên GRADUATED (tốt nghiệp) đăng ký lại nếu muốn
            const formattedStudents: Student[] = students
                .filter(student => student.overallStatus !== 'DROPPED') // Loại bỏ học viên đã nghỉ học
                .map(student => ({
                    studentId: student.studentId,
                    fullName: student.fullName,
                    email: student.email,
                    phone: student.phone,
                    initial: student.fullName.charAt(0).toUpperCase(),
                    overallStatus: student.overallStatus,
                    enrolledClasses: studentClassesMap.get(student.studentId) || []
                }));
            
            setAllStudents(formattedStudents);
        } catch (error: any) {
            showErrorToast(error?.response?.data?.message || 'Không thể tải danh sách học viên');
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to format study days
    const formatStudyDays = (days?: string[]) => {
        if (!days || days.length === 0) return 'Chưa có';
        const dayMap: { [key: string]: string } = {
            'MONDAY': 'T2',
            'TUESDAY': 'T3',
            'WEDNESDAY': 'T4',
            'THURSDAY': 'T5',
            'FRIDAY': 'T6',
            'SATURDAY': 'T7',
            'SUNDAY': 'CN'
        };
        return days.map(d => dayMap[d] || d).join(', ');
    };

    // Helper function to format study time
    const formatStudyTime = (time?: string) => {
        if (!time) return 'Chưa có';
        const timeMap: { [key: string]: string } = {
            'MORNING': 'Sáng (8:00-11:00)',
            'AFTERNOON': 'Chiều (14:00-17:00)',
            'EVENING': 'Tối (18:00-21:00)'
        };
        return timeMap[time] || time;
    };

    // Check if there's a schedule conflict
    const checkScheduleConflict = (student: Student): { hasConflict: boolean; conflictMessage?: string } => {
        if (!classItem.studyDays || !classItem.studyTime || !student.enrolledClasses || student.enrolledClasses.length === 0) {
            return { hasConflict: false };
        }

        for (const enrolledClass of student.enrolledClasses) {
            if (!enrolledClass.studyDays || !enrolledClass.studyTime) continue;

            // Check if any day overlaps
            const hasOverlappingDay = classItem.studyDays.some(day => 
                enrolledClass.studyDays?.includes(day)
            );

            if (hasOverlappingDay && classItem.studyTime === enrolledClass.studyTime) {
                return {
                    hasConflict: true,
                    conflictMessage: `Trùng lịch với lớp "${enrolledClass.className}" (${formatStudyDays(enrolledClass.studyDays)} - ${formatStudyTime(enrolledClass.studyTime)})`
                };
            }
        }

        return { hasConflict: false };
    };

    // Filter students based on search
    const filteredStudents = allStudents
        .filter(student => {
            const matchesQuery = 
                student.fullName.toLowerCase().includes(query.toLowerCase()) ||
                student.email.toLowerCase().includes(query.toLowerCase()) ||
                student.studentId.toString().includes(query.toLowerCase());
            
            return matchesQuery;
        })
        .sort((a, b) => {
            // Sort students: those without conflicts first, then those with conflicts
            const conflictA = checkScheduleConflict(a).hasConflict;
            const conflictB = checkScheduleConflict(b).hasConflict;
            
            if (conflictA === conflictB) return 0;
            return conflictA ? 1 : -1; // Students without conflict come first
        });

    const handleStudentSelect = (studentId: number) => {
        setSelectedStudents(prev => 
            prev.includes(studentId) 
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSelectAll = () => {
        // Filter out students WITH conflicts (keep only valid ones)
        const validStudents = filteredStudents.filter(student => {
            const conflict = checkScheduleConflict(student);
            return !conflict.hasConflict;
        });

        // If all valid students are selected, deselect all
        // Otherwise, select all valid students
        const validStudentIds = validStudents.map(s => s.studentId);
        const allValidSelected = validStudentIds.every(id => selectedStudents.includes(id));

        if (allValidSelected && selectedStudents.length > 0) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(validStudentIds);
        }
    };

    const handleSubmit = async () => {
        if (selectedStudents.length === 0) return;

        setIsSubmitting(true);

        try {
            // Call API to enroll each selected student
            const enrollmentPromises = selectedStudents.map(studentId => {
                return enrollStudent(parseInt(classItem.id), {
                    studentId: studentId,
                    enrolledAt: new Date().toISOString().split('T')[0],
                    note: ''
                });
            });

            await Promise.all(enrollmentPromises);
            
            showSuccessToast(`Đã thêm ${selectedStudents.length} học viên vào lớp thành công!`);
            onAddStudents([]);
            handleClose();
        } catch (error: any) {
            showErrorToast(error?.response?.data?.message || 'Có lỗi xảy ra khi thêm học viên');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedStudents([]);
        setQuery('');
        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[70]">
            <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-4xl rounded-lg bg-white shadow-xl border max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Thêm học viên vào lớp</h2>
                            <p className="text-sm text-gray-500">{classItem.name}</p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="h-8 w-8 rounded hover:bg-gray-100 flex items-center justify-center"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="px-6 py-4 border-b space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="w-full h-9 pl-10 pr-3 rounded-md border text-sm outline-none focus:ring-2 focus:ring-blue-200"
                                    placeholder="Tìm kiếm theo tên, email, mã học viên..."
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleSelectAll}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    {(() => {
                                        const allValidSelected = filteredStudents
                                            .filter(s => !checkScheduleConflict(s).hasConflict)
                                            .every(s => selectedStudents.includes(s.studentId));
                                        return allValidSelected && selectedStudents.length > 0 ? 'Bỏ chọn tất cả' : 'Chọn tất cả';
                                    })()}
                                </button>
                                <span className="text-sm text-gray-500">
                                    ({selectedStudents.length} học viên đã chọn)
                                </span>
                            </div>
                            <div className="text-sm text-gray-500">
                                {(() => {
                                    const validCount = filteredStudents.filter(s => !checkScheduleConflict(s).hasConflict).length;
                                    const conflictCount = filteredStudents.filter(s => checkScheduleConflict(s).hasConflict).length;
                                    return (
                                        <>
                                            <span className="text-green-600 font-medium">{validCount} hợp lệ</span>
                                            {conflictCount > 0 && (
                                                <>
                                                    <span className="mx-2">•</span>
                                                    <span className="text-orange-600 font-medium">{conflictCount} trùng lịch</span>
                                                </>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Student List */}
                    <div className="px-6 py-4 max-h-96 overflow-y-auto">
                        {isLoading ? (
                            <div className="text-center py-8 text-gray-500">
                                Đang tải danh sách học viên...
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    {filteredStudents.map((student) => {
                                        const conflict = checkScheduleConflict(student);
                                        return (
                                            <div
                                                key={student.studentId}
                                                className={`p-3 rounded-lg border transition-colors ${
                                                    conflict.hasConflict
                                                        ? 'border-orange-300 bg-orange-50 cursor-not-allowed'
                                                        : selectedStudents.includes(student.studentId)
                                                        ? 'border-blue-500 bg-blue-50 cursor-pointer'
                                                        : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                                                }`}
                                                onClick={() => !conflict.hasConflict && handleStudentSelect(student.studentId)}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                                                        conflict.hasConflict
                                                            ? 'bg-orange-200 text-orange-700'
                                                            : selectedStudents.includes(student.studentId)
                                                            ? 'bg-gray-900 text-white'
                                                            : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {selectedStudents.includes(student.studentId) ? (
                                                            <Check size={16} />
                                                        ) : (
                                                            student.initial
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-medium">{student.fullName}</h3>
                                                            <span className="text-xs text-gray-500">(ID: {student.studentId})</span>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                                            <div className="flex items-center gap-1">
                                                                <Mail size={12} />
                                                                <span className="truncate">{student.email}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Phone size={12} />
                                                                {student.phone}
                                                            </div>
                                                        </div>

                                                        {/* Display enrolled classes */}
                                                        {student.enrolledClasses && student.enrolledClasses.length > 0 && (
                                                            <div className="mt-2 space-y-1">
                                                                <div className="text-xs font-medium text-gray-600">Các lớp đang học:</div>
                                                                <div className="flex flex-col gap-1">
                                                                    {student.enrolledClasses.map((cls, idx) => (
                                                                        <div key={idx} className="flex items-center gap-2 text-xs bg-white rounded px-2 py-1 border border-gray-200">
                                                                            <span className="font-medium text-gray-900">{cls.className}</span>
                                                                            <span className="text-gray-500">•</span>
                                                                            <div className="flex items-center gap-1 text-gray-600">
                                                                                <Calendar size={10} />
                                                                                <span>{formatStudyDays(cls.studyDays)}</span>
                                                                            </div>
                                                                            <span className="text-gray-500">•</span>
                                                                            <div className="flex items-center gap-1 text-gray-600">
                                                                                <Clock size={10} />
                                                                                <span>{formatStudyTime(cls.studyTime)}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Display conflict warning */}
                                                        {conflict.hasConflict && (
                                                            <div className="mt-2 flex items-center gap-2 text-xs text-orange-700 bg-orange-100 p-2 rounded">
                                                                <AlertTriangle size={14} className="flex-shrink-0" />
                                                                <span>{conflict.conflictMessage}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {student.overallStatus && (
                                                        <div className="text-right flex-shrink-0">
                                                            <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                                                                Đang chờ
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                {filteredStudents.length === 0 && !isLoading && (
                                    <div className="text-center py-8 text-gray-500">
                                        Không tìm thấy học viên nào
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t flex items-center justify-end gap-3">
                        <button
                            onClick={handleClose}
                            className="h-9 px-4 rounded-md border bg-white hover:bg-gray-50 text-sm"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={selectedStudents.length === 0 || isSubmitting}
                            className="h-9 px-4 rounded-md bg-gray-900 text-white hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            {isSubmitting ? 'Đang thêm...' : `Thêm ${selectedStudents.length} học viên`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddStudentModal;

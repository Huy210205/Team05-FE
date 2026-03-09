import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Calendar, GraduationCap, Clock, CheckCircle, XCircle, BookOpen, MapPin, Users, BarChart3, FileText } from 'lucide-react';
import { listClasses } from '@/shared/api/classes';
import { getClassStudents } from '@/shared/api/classes';
import { getStudentGradesByStudentId, type GradeRecordResponse } from '@/shared/api/grade-entries';
import { useToast } from '@/shared/hooks/useToast';
import ClassLogTab from '@/features/users/pages/classes/components/journals/ClassLogTab';
import type { EnrollmentResponse } from '@/shared/types/classes';
import type { StudentUI } from '@/shared/types/student-ui';

interface StudentViewProps {
    student: StudentUI;
    onClose?: () => void;
}

const StudentView: React.FC<StudentViewProps> = ({ student, onClose }) => {
    alert('Component rendered: ' + student.name); // DEBUG
    
    const { error: showErrorToast } = useToast();
    const [activeTab, setActiveTab] = useState('info');
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);
    const [selectedClass, setSelectedClass] = useState<any | null>(null);
    const [studentGrades, setStudentGrades] = useState<GradeRecordResponse[]>([]);
    const [isLoadingGrades, setIsLoadingGrades] = useState(false);

    const loadStudentGrades = async () => {
        try {
            setIsLoadingGrades(true);
            alert('Calling API for student: ' + student.id); // DEBUG - xóa sau
            const grades = await getStudentGradesByStudentId(parseInt(student.id));
            // Sort by semester and entry date
            grades.sort((a, b) => {
                if (a.semester !== b.semester) {
                    return (a.semester || 0) - (b.semester || 0);
                }
                return (a.entryDate || '').localeCompare(b.entryDate || '');
            });
            setStudentGrades(grades);
        } catch (error: any) {
            showErrorToast('Lỗi tải điểm thi', error?.response?.data?.message || 'Không thể tải điểm thi của học viên');
        } finally {
            setIsLoadingGrades(false);
        }
    };


    const loadEnrollments = async () => {
        try {
            setIsLoadingEnrollments(true);
            // Get all classes
            const classesResponse = await listClasses();
            const classes = classesResponse.data;
            
            // For each class, get enrollments and find this student
            const studentEnrollments: any[] = [];
            
            for (const classItem of classes) {
                try {
                    const response = await getClassStudents(classItem.classId, {
                        page: 0,
                        size: 1000
                    });
                    const enrollmentsData: EnrollmentResponse[] = response.data.content || response.data;
                    
                    // Find this student's enrollment in this class
                    const studentEnrollment = enrollmentsData.find(e => e.studentId === parseInt(student.id));
                    if (studentEnrollment) {
                        const enrollment = {
                            ...studentEnrollment,
                            className: classItem.name,
                            classId: classItem.classId,
                            programName: classItem.programName
                        };
                        studentEnrollments.push(enrollment);
                    }
                } catch (error) {
                    // Skip if can't access this class
                }
            }
            
            setEnrollments(studentEnrollments);
            // Auto-select first class if available
            if (studentEnrollments.length > 0 && !selectedClass) {
                setSelectedClass({
                    classId: studentEnrollments[0].classId,
                    name: studentEnrollments[0].className,
                    programName: studentEnrollments[0].programName,
                    centerName: '',
                    status: 'ACTIVE'
                });
            }
        } catch (error: any) {
            showErrorToast('Lỗi tải danh sách lớp học', error?.response?.data?.message || 'Không thể tải danh sách lớp học');
        } finally {
            setIsLoadingEnrollments(false);
        }
    };

    // Load student's enrollments and grades when component mounts
    useEffect(() => {
        alert('useEffect triggered! Student: ' + student.name); // DEBUG - xóa sau
        loadEnrollments(); // Load ngay khi mount để có activeEnrollment
        loadStudentGrades(); // Load điểm của học viên
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [student.id]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Đang chờ':
                return <Clock size={16} className="text-yellow-600" />;
            case 'Đang học':
                return <CheckCircle size={16} className="text-green-600" />;
            case 'Nghỉ học':
                return <XCircle size={16} className="text-red-600" />;
            case 'Tốt nghiệp':
                return <GraduationCap size={16} className="text-blue-600" />;
            default:
                return <Clock size={16} className="text-gray-600" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Đang chờ':
                return 'bg-yellow-50 text-yellow-700';
            case 'Đang học':
                return 'bg-green-50 text-green-700';
            case 'Nghỉ học':
                return 'bg-red-50 text-red-700';
            case 'Tốt nghiệp':
                return 'bg-blue-50 text-blue-700';
            default:
                return 'bg-gray-50 text-gray-700';
        }
    };

    const tabs = [
        { id: 'info', label: 'Thông tin', icon: User },
        { id: 'classes', label: 'Lớp học', icon: BookOpen },
        { id: 'attendance', label: 'Điểm danh', icon: Users },
        { id: 'scores', label: 'Điểm thi', icon: BarChart3 },
        { id: 'logs', label: 'Nhật ký', icon: FileText },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'info':
                return (
                    <div className="space-y-6">
                        {/* Personal Information */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-4">Thông tin cá nhân</h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Mail size={16} className="text-gray-500" />
                                    <span className="text-sm">{student.email}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone size={16} className="text-gray-500" />
                                    <span className="text-sm">{student.phone}</span>
                                </div>
                                {student.address && (
                                    <div className="flex items-center gap-3">
                                        <MapPin size={16} className="text-gray-500" />
                                        <span className="text-sm">{student.address}</span>
                                    </div>
                                )}
                                {student.dob && (
                                    <div className="flex items-center gap-3">
                                        <Calendar size={16} className="text-gray-500" />
                                        <span className="text-sm">Sinh: {student.dob}</span>
                                    </div>
                                )}
                                {student.gender && (
                                    <div className="flex items-center gap-3">
                                        <User size={16} className="text-gray-500" />
                                        <span className="text-sm">
                                            Giới tính: {
                                                student.gender === 'MALE' ? 'Nam' :
                                                student.gender === 'FEMALE' ? 'Nữ' :
                                                student.gender === 'OTHER' ? 'Khác' : student.gender
                                            }
                                        </span>
                                    </div>
                                )}
                                {student.nationalIdNo && (
                                    <div className="flex items-center gap-3">
                                        <Calendar size={16} className="text-gray-500" />
                                        <span className="text-sm">CMND/CCCD: {student.nationalIdNo}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Academic Information */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-4">Thông tin học tập</h4>
                            <div className="space-y-3">
                                {student.enrollments && student.enrollments.length > 0 ? (
                                    <>
                                        <div className="flex items-center gap-3">
                                            <BookOpen size={16} className="text-gray-500" />
                                            <span className="text-sm">{student.enrollments[0].programName}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <User size={16} className="text-gray-500" />
                                            <span className="text-sm">{student.enrollments[0].className}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <BookOpen size={16} className="text-gray-500" />
                                        <span className="text-sm text-gray-400">Chưa có lớp</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    <Calendar size={16} className="text-gray-500" />
                                    <span className="text-sm">Đăng ký: {student.registrationDate}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle size={16} className="text-green-500" />
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                                        {student.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>
                );

            case 'classes':
                return (
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-900">Danh sách lớp học đã đăng ký</h4>
                        
                        {isLoadingEnrollments ? (
                            <div className="text-center py-8 text-gray-500">Đang tải...</div>
                        ) : enrollments.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">Chưa đăng ký lớp học nào</div>
                        ) : (
                            <div className="space-y-3">
                                {enrollments.map((enrollment) => (
                                    <div key={enrollment.enrollmentId} className="border rounded-lg p-4 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h5 className="font-medium text-gray-900">{enrollment.className}</h5>
                                                <p className="text-sm text-gray-500">{enrollment.programName}</p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                    <span>Đăng ký: {enrollment.enrolledAt}</span>
                                                    {enrollment.leftAt && <span>Kết thúc: {enrollment.leftAt}</span>}
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                enrollment.status === 'ACTIVE' ? 'bg-green-50 text-green-700' :
                                                enrollment.status === 'SUSPENDED' ? 'bg-yellow-50 text-yellow-700' :
                                                'bg-red-50 text-red-700'
                                            }`}>
                                                {enrollment.status === 'ACTIVE' ? 'Đang học' :
                                                 enrollment.status === 'SUSPENDED' ? 'Tạm dừng' : 'Đã rớt'}
                                            </span>
                                        </div>

                                        {enrollment.note && (
                                            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                                Ghi chú: {enrollment.note}
                                            </p>
                                        )}

                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case 'attendance':
                return (
                    <div className="space-y-6">
                        {/* Attendance Statistics */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">20</div>
                                <div className="text-xs text-gray-500">Tổng buổi</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">18</div>
                                <div className="text-xs text-gray-500">Có mặt</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">1</div>
                                <div className="text-xs text-gray-500">Vắng</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">90%</div>
                                <div className="text-xs text-gray-500">Tỷ lệ</div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-gray-600 h-2 rounded-full" style={{ width: '90%' }}></div>
                        </div>
                    </div>
                );

            case 'scores':
                return (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="text-sm font-medium text-gray-900">Bảng điểm thi</h4>
                            {studentGrades.length > 0 && (
                                <span className="text-sm text-gray-600">
                                    Tổng: {studentGrades.length} bài thi
                                </span>
                            )}
                        </div>
                        
                        {isLoadingGrades ? (
                            <div className="text-center py-8 text-gray-500">Đang tải điểm...</div>
                        ) : studentGrades.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                                <BarChart3 size={48} className="mx-auto text-gray-300 mb-2" />
                                <p className="text-sm text-gray-600">Chưa có điểm thi nào</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-gray-50">
                                            <th className="text-left py-2 px-3">Kì</th>
                                            <th className="text-left py-2 px-3">Module</th>
                                            <th className="text-left py-2 px-3">Lớp</th>
                                            <th className="text-left py-2 px-3">Lý thuyết</th>
                                            <th className="text-left py-2 px-3">Thực hành</th>
                                            <th className="text-left py-2 px-3">Tổng kết</th>
                                            <th className="text-left py-2 px-3">Kết quả</th>
                                            <th className="text-left py-2 px-3">Ngày thi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studentGrades.map((grade) => (
                                            <tr key={grade.gradeRecordId} className="border-b hover:bg-gray-50">
                                                <td className="py-2 px-3">
                                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                                        Kì {grade.semester || '-'}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3">
                                                    <div className="font-medium">{grade.moduleName}</div>
                                                    <div className="text-xs text-gray-500">{grade.moduleCode}</div>
                                                </td>
                                                <td className="py-2 px-3 text-xs text-gray-600">{grade.className}</td>
                                                <td className="py-2 px-3 font-medium">{grade.theoryScore?.toFixed(1) || '-'}</td>
                                                <td className="py-2 px-3 font-medium">{grade.practiceScore?.toFixed(1) || '-'}</td>
                                                <td className="py-2 px-3 font-bold text-blue-600">{grade.finalScore?.toFixed(1) || '-'}</td>
                                                <td className="py-2 px-3">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                        grade.passStatus === 'PASS' 
                                                            ? 'bg-green-100 text-green-700' 
                                                            : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {grade.passStatus === 'PASS' ? 'Đạt' : 'Không đạt'}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3 text-xs text-gray-600">
                                                    {grade.entryDate ? new Date(grade.entryDate).toLocaleDateString('vi-VN') : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );

            case 'logs':
                return (
                    <div className="space-y-4">
                        {/* Class Selector - Scrollable horizontal list */}
                        {isLoadingEnrollments ? (
                            <div className="text-center py-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="text-sm text-gray-600 mt-2">Đang tải danh sách lớp học...</p>
                            </div>
                        ) : enrollments.length > 0 ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-3">Lớp học đã đăng ký</label>
                                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                    {enrollments.map((enrollment) => (
                                        <button
                                            key={enrollment.classId}
                                            onClick={() => setSelectedClass({
                                                classId: enrollment.classId,
                                                name: enrollment.className,
                                                programName: enrollment.programName,
                                                centerName: '',
                                                status: 'ACTIVE'
                                            })}
                                            className={`flex-shrink-0 px-4 py-3 rounded-lg border-2 transition-all ${
                                                selectedClass?.classId === enrollment.classId
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 bg-white hover:border-blue-300'
                                            }`}
                                        >
                                            <div className="text-left">
                                                <div className="text-sm font-medium text-gray-900">{enrollment.className}</div>
                                                <div className="text-xs text-gray-500 mt-1">{enrollment.programName}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                                <BookOpen size={48} className="mx-auto text-gray-300 mb-2" />
                                <p className="text-sm text-gray-600">Học viên chưa được gán vào lớp học nào</p>
                            </div>
                        )}

                        {/* Journal List for Selected Class */}
                        {selectedClass && (
                            <div className="mt-4">
                                <ClassLogTab selectedClass={selectedClass} readOnly={true} />
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="bg-white rounded-lg w-full">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 grid place-items-center">
                        <User size={16} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Hồ sơ Học viên - {student.name}</h2>
                        <p className="text-sm text-gray-500">
                            {student.studentId} • {student.enrollments && student.enrollments.length > 0 ? student.enrollments[0].className : 'Chưa có lớp'}
                        </p>
                    </div>
                </div>
                <button 
                    className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                    onClick={onClose}
                >
                    <X size={20} />
                </button>
            </div>

            {/* Tabs Navigation */}
            <div className="px-4 py-2 border-b">
                <div className="flex space-x-1">
                    {tabs.map((tab) => {
                        const IconComponent = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                    activeTab === tab.id
                                        ? 'bg-gray-100 text-gray-900'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <IconComponent size={14} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="px-4 py-4">
                {renderTabContent()}
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

export default StudentView;

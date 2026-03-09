import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    User,
    Mail,
    Phone,
    Calendar,
    CheckCircle,
    BookOpen,
    Users,
    BarChart3,
    FileText,
    ArrowLeft,
    MapPin,
} from 'lucide-react';
import { getStudentWithEnrollmentsById } from '@/shared/api/students';
import { getStudentGradesByStudentId, type GradeRecordResponse } from '@/shared/api/grade-entries';
import type { StudentUI } from '@/shared/types/student-ui';
import type { StudentEnrollment, StudentWithEnrollmentsDto } from '@/shared/types/student';
import ClassLogTab from '@/features/users/pages/classes/components/journals/ClassLogTab';
import StudentAttendanceTab from './components/StudentAttendanceTab';

export default function StudentDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [student, setStudent] = useState<StudentUI | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'info' | 'classes' | 'attendance' | 'scores' | 'logs'>('info');
    const [selectedClass, setSelectedClass] = useState<any | null>(null);
    const [grades, setGrades] = useState<GradeRecordResponse[]>([]);
    const [gradesLoading, setGradesLoading] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedClassForScores, setSelectedClassForScores] = useState<string>('ALL');

    // Map DTO -> UI
    const mapDto = (dto: StudentWithEnrollmentsDto): StudentUI => ({
        id: dto.studentId.toString(),
        studentId: `SV${String(dto.studentId).padStart(3, '0')}`,
        name: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        initial: dto.fullName
            .split(' ')
            .map((n) => n[0])
            .join(''),
        registrationDate: dto.createdAt.split('T')[0],
        status: (dto.overallStatus === 'PENDING'
            ? 'Đang chờ'
            : dto.overallStatus === 'ACTIVE'
              ? 'Đang học'
              : dto.overallStatus === 'DROPPED'
                ? 'Nghỉ học'
                : dto.overallStatus === 'GRADUATED'
                  ? 'Tốt nghiệp'
                  : 'Đang chờ') as StudentUI['status'],
        avatar: localStorage.getItem(`student_avatar_${dto.studentId}`) || '',
        dob: dto.dob || null,
        address: dto.addressLine || null,
        gender: dto.gender || null,
        nationalIdNo: dto.nationalIdNo || null,
        enrollments: dto.enrollments || [],
    });

    useEffect(() => {
        const run = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const res = await getStudentWithEnrollmentsById(parseInt(id));
                const ui = mapDto(res.data);
                setStudent(ui);
                if (ui.enrollments?.length) {
                    const e = ui.enrollments[0];
                    setSelectedClass({
                        classId: e.classId,
                        name: e.className,
                        programName: e.programName,
                        centerName: '',
                        status: e.status,
                    });
                }
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [id]);

    // Fetch grades when scores tab is active
    useEffect(() => {
        const fetchGrades = async () => {
            if (activeTab !== 'scores' || !id) return;
            
            try {
                setGradesLoading(true);
                const data = await getStudentGradesByStudentId(parseInt(id));
                setGrades(data || []);
            } catch (error) {
                setGrades([]);
            } finally {
                setGradesLoading(false);
            }
        };

        fetchGrades();
    }, [activeTab, id]);

    const calculateOverallStatus = (enrollments: StudentEnrollment[]): 'Đang chờ' | 'Đang học' | 'Nghỉ học' => {
        if (!enrollments || enrollments.length === 0) return 'Đang chờ';
        const hasActive = enrollments.some((e) => e.status === 'ACTIVE');
        const hasSuspended = enrollments.some((e) => e.status === 'SUSPENDED');
        const hasDropped = enrollments.some((e) => e.status === 'DROPPED');
        if (hasActive) return 'Đang học';
        if (hasSuspended) return 'Đang chờ';
        if (hasDropped) return 'Nghỉ học';
        return 'Đang chờ';
    };

    const getEnrollmentStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'bg-green-50 text-green-700';
            case 'SUSPENDED':
                return 'bg-yellow-50 text-yellow-700';
            case 'DROPPED':
                return 'bg-red-50 text-red-700';
            case 'GRADUATED':
                return 'bg-blue-50 text-blue-700';
            default:
                return 'bg-gray-50 text-gray-700';
        }
    };

    const getEnrollmentStatusText = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'Đang học';
            case 'SUSPENDED':
                return 'Bảo lưu';
            case 'DROPPED':
                return 'Đã nghỉ';
            case 'GRADUATED':
                return 'Tốt nghiệp';
            default:
                return status;
        }
    };

    // Filter grades by month/year and class
    const filteredGrades = grades.filter(grade => {
        // Filter by class
        if (selectedClassForScores !== 'ALL' && grade.className !== selectedClassForScores) {
            return false;
        }
        
        // Filter by month/year if entryDate exists
        if (grade.entryDate) {
            const date = new Date(grade.entryDate);
            return date.getMonth() + 1 === selectedMonth && date.getFullYear() === selectedYear;
        }
        
        return true;
    });

    // Calculate statistics for filtered grades
    const gradeStats = {
        totalExams: filteredGrades.length,
        passedExams: filteredGrades.filter(g => g.passStatus === 'PASS').length,
        failedExams: filteredGrades.filter(g => g.passStatus === 'FAIL').length,
        passRate: filteredGrades.length > 0 
            ? Math.round((filteredGrades.filter(g => g.passStatus === 'PASS').length / filteredGrades.length) * 100)
            : 0
    };

    // Generate month/year options
    const months = Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: `Tháng ${i + 1}`
    }));

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => ({
        value: currentYear - i,
        label: `${currentYear - i}`
    }));

    // Get unique class names from grades
    const classOptions = ['ALL', ...Array.from(new Set(grades.map(g => g.className).filter(Boolean)))];

    if (loading) return <div className="bg-white rounded-lg border p-8 text-center">Đang tải dữ liệu...</div>;
    if (!student) return <div className="bg-white rounded-lg border p-8 text-center">Không tìm thấy học viên</div>;

    const tabs = [
        { id: 'info', label: 'Thông tin', icon: User },
        { id: 'classes', label: 'Lớp học', icon: BookOpen },
        { id: 'attendance', label: 'Điểm danh', icon: Users },
        { id: 'scores', label: 'Điểm thi', icon: BarChart3 },
        { id: 'logs', label: 'Nhật ký', icon: FileText },
    ] as const;

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b shadow-sm px-6 py-4 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-lg border hover:bg-gray-50 transition-colors">
                        <ArrowLeft size={18} />
                    </button>
                    <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 grid place-items-center flex-shrink-0">
                        <User size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-lg font-semibold text-gray-900 truncate">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.studentId}</div>
                    </div>
                </div>
            </div>

            {/* Tabs and Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Tabs Navigation */}
                <div className="bg-white border-b px-6 flex-shrink-0">
                    <div className="flex gap-1 overflow-x-auto">
                        {tabs.map((t) => {
                            const Icon = t.icon;
                            const isActive = activeTab === (t.id as typeof activeTab);
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setActiveTab(t.id as typeof activeTab)}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <Icon size={16} />
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto bg-gray-50">
                    <div className="max-w-7xl mx-auto px-6 py-6">
                        {activeTab === 'info' && (
                            <div className="bg-white rounded-xl border shadow-sm p-8">
                                <h4 className="text-xl font-semibold text-gray-900 mb-8 pb-4 border-b">
                                    Thông tin học viên
                                </h4>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Thông tin cá nhân */}
                                    <div>
                                        <h5 className="text-base font-semibold text-gray-800 mb-6">
                                            Thông tin cá nhân
                                        </h5>
                                        <div className="space-y-6">
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1 flex-shrink-0">
                                                    <Mail size={20} className="text-gray-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-gray-600 mb-2">Email</div>
                                                    <div className="text-base text-gray-900 break-words">{student.email}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1 flex-shrink-0">
                                                    <Phone size={20} className="text-gray-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-gray-600 mb-2">Số điện thoại</div>
                                                    <div className="text-base text-gray-900">{student.phone}</div>
                                                </div>
                                            </div>
                                            {student.address && (
                                                <div className="flex items-start gap-4">
                                                    <div className="mt-1 flex-shrink-0">
                                                        <MapPin size={20} className="text-gray-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-gray-600 mb-2">Địa chỉ</div>
                                                        <div className="text-base text-gray-900 break-words">{student.address}</div>
                                                    </div>
                                                </div>
                                            )}
                                            {student.dob && (
                                                <div className="flex items-start gap-4">
                                                    <div className="mt-1 flex-shrink-0">
                                                        <Calendar size={20} className="text-gray-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-gray-600 mb-2">Ngày sinh</div>
                                                        <div className="text-base text-gray-900">{student.dob}</div>
                                                    </div>
                                                </div>
                                            )}
                                            {student.gender && (
                                                <div className="flex items-start gap-4">
                                                    <div className="mt-1 flex-shrink-0">
                                                        <User size={20} className="text-gray-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-gray-600 mb-2">Giới tính</div>
                                                        <div className="text-base text-gray-900">
                                                            {student.gender === 'MALE' ? 'Nam' : student.gender === 'FEMALE' ? 'Nữ' : student.gender === 'OTHER' ? 'Khác' : student.gender}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {student.nationalIdNo && (
                                                <div className="flex items-start gap-4">
                                                    <div className="mt-1 flex-shrink-0">
                                                        <Calendar size={20} className="text-gray-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-gray-600 mb-2">CMND/CCCD</div>
                                                        <div className="text-base text-gray-900">{student.nationalIdNo}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Thông tin học tập */}
                                    <div>
                                        <h5 className="text-base font-semibold text-gray-800 mb-6">
                                            Thông tin học tập
                                        </h5>
                                        <div className="space-y-6">
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1 flex-shrink-0">
                                                    <Calendar size={20} className="text-gray-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-gray-600 mb-2">Ngày đăng ký</div>
                                                    <div className="text-base text-gray-900">{student.registrationDate}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1 flex-shrink-0">
                                                    <CheckCircle size={20} className="text-green-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-gray-600 mb-2">Trạng thái</div>
                                                    <span
                                                        className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium ${calculateOverallStatus(student.enrollments) === 'Đang học' ? 'bg-green-50 text-green-700' : calculateOverallStatus(student.enrollments) === 'Đang chờ' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}
                                                    >
                                                        {calculateOverallStatus(student.enrollments)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1 flex-shrink-0">
                                                    <BookOpen size={20} className="text-gray-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-gray-600 mb-2">Số lớp học</div>
                                                    <div className="text-base text-gray-900 font-semibold">{student.enrollments.length} lớp học</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'classes' && (
                            <div className="space-y-4">
                                {student.enrollments.length === 0 ? (
                                    <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
                                        <BookOpen size={48} className="mx-auto text-gray-300 mb-3" />
                                        <p className="text-sm text-gray-600">Chưa đăng ký lớp học nào</p>
                                    </div>
                                ) : (
                                    student.enrollments.map((enrollment) => (
                                        <div
                                            key={enrollment.enrollmentId}
                                            className="bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h5 className="text-base font-semibold text-gray-900">{enrollment.className}</h5>
                                                        <span
                                                            className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getEnrollmentStatusColor(enrollment.status)}`}
                                                        >
                                                            {getEnrollmentStatusText(enrollment.status)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-3">{enrollment.programName}</p>
                                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={14} />
                                                            Đăng ký: {enrollment.enrolledAt}
                                                        </span>
                                                        {enrollment.leftAt && (
                                                            <span className="flex items-center gap-1">
                                                                <Calendar size={14} />
                                                                Kết thúc: {enrollment.leftAt}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'attendance' && (
                            <div className="bg-white rounded-xl border shadow-sm p-6">
                                <StudentAttendanceTab student={student} />
                            </div>
                        )}

                        {activeTab === 'scores' && (
                            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                                <div className="p-6 border-b">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-base font-semibold text-gray-900">Bảng điểm</h4>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Danh sách điểm thi của học viên
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-gray-600">Lớp học:</span>
                                            <select
                                                value={selectedClassForScores}
                                                onChange={(e) => setSelectedClassForScores(e.target.value)}
                                                className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                                            >
                                                <option value="ALL">Tất cả lớp</option>
                                                {classOptions.filter(c => c !== 'ALL').map(className => (
                                                    <option key={className} value={className}>{className}</option>
                                                ))}
                                            </select>
                                            <span className="text-sm text-gray-600">Tháng:</span>
                                            <select
                                                value={selectedMonth}
                                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                                className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                                            >
                                                {months.map(month => (
                                                    <option key={month.value} value={month.value}>{month.label}</option>
                                                ))}
                                            </select>
                                            <span className="text-sm text-gray-600">Năm:</span>
                                            <select
                                                value={selectedYear}
                                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                                className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                                            >
                                                {years.map(year => (
                                                    <option key={year.value} value={year.value}>{year.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {gradesLoading ? (
                                    <div className="p-8 text-center text-gray-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                        Đang tải điểm...
                                    </div>
                                ) : grades.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">
                                        <BarChart3 size={40} className="mx-auto mb-3 text-gray-300" />
                                        <p>Chưa có điểm thi nào</p>
                                    </div>
                                ) : (
                                    <>
                                        {filteredGrades.length === 0 ? (
                                            <div className="p-8 text-center text-gray-500">
                                                <BarChart3 size={40} className="mx-auto mb-3 text-gray-300" />
                                                <p>Không có điểm thi trong tháng {selectedMonth}/{selectedYear}</p>
                                                <p className="text-xs text-gray-400 mt-1">Thử chọn tháng/năm hoặc lớp khác</p>
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="text-left py-3 px-6 font-medium text-gray-700">Lớp học</th>
                                                        <th className="text-left py-3 px-6 font-medium text-gray-700">Module</th>
                                                        <th className="text-left py-3 px-6 font-medium text-gray-700">Học kỳ</th>
                                                        <th className="text-center py-3 px-6 font-medium text-gray-700">Lý thuyết</th>
                                                        <th className="text-center py-3 px-6 font-medium text-gray-700">Thực hành</th>
                                                        <th className="text-center py-3 px-6 font-medium text-gray-700">Tổng kết</th>
                                                        <th className="text-center py-3 px-6 font-medium text-gray-700">Kết quả</th>
                                                        <th className="text-left py-3 px-6 font-medium text-gray-700">Ngày thi</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {filteredGrades.map((grade, index) => (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className="py-3 px-6 text-gray-900">
                                                            {grade.className || '-'}
                                                        </td>
                                                        <td className="py-3 px-6 text-gray-900">
                                                            <div className="font-medium">{grade.moduleName || '-'}</div>
                                                            {grade.moduleCode && (
                                                                <div className="text-xs text-gray-500">{grade.moduleCode}</div>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-6 text-gray-600">
                                                            {grade.semester ? `Học kỳ ${grade.semester}` : '-'}
                                                        </td>
                                                        <td className="py-3 px-6 text-center text-gray-900">
                                                            {grade.theoryScore.toFixed(1)}
                                                        </td>
                                                        <td className="py-3 px-6 text-center text-gray-900">
                                                            {grade.practiceScore.toFixed(1)}
                                                        </td>
                                                        <td className="py-3 px-6 text-center font-semibold text-gray-900">
                                                            {grade.finalScore.toFixed(1)}
                                                        </td>
                                                        <td className="py-3 px-6 text-center">
                                                            <span
                                                                className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                                                    grade.passStatus === 'PASS'
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : 'bg-red-100 text-red-800'
                                                                }`}
                                                            >
                                                                {grade.passStatus === 'PASS' ? 'Đạt' : 'Chưa đạt'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-6 text-gray-600">
                                                            {grade.entryDate || '-'}
                                                        </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === 'logs' && (
                            <div className="space-y-6">
                                {student.enrollments && student.enrollments.length > 0 ? (
                                    <>
                                        <div className="bg-white rounded-xl border shadow-sm p-6">
                                            <label className="block text-sm font-semibold text-gray-900 mb-4">
                                                Chọn lớp học để xem nhật ký
                                            </label>
                                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                                {student.enrollments.map((enrollment) => (
                                                    <button
                                                        key={enrollment.classId}
                                                        onClick={() =>
                                                            setSelectedClass({
                                                                classId: enrollment.classId,
                                                                name: enrollment.className,
                                                                programName: enrollment.programName,
                                                                centerName: '',
                                                                status: enrollment.status,
                                                            })
                                                        }
                                                        className={`flex-shrink-0 px-4 py-3 rounded-lg border-2 transition-all ${selectedClass?.classId === enrollment.classId ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'}`}
                                                    >
                                                        <div className="text-left">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {enrollment.className}
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                {enrollment.programName}
                                                            </div>
                                                            <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs ${getEnrollmentStatusColor(enrollment.status)}`}>
                                                                {getEnrollmentStatusText(enrollment.status)}
                                                            </span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {selectedClass && (
                                            <div className="bg-white rounded-xl border shadow-sm p-6">
                                                <ClassLogTab selectedClass={selectedClass} readOnly={true} />
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
                                        <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                                        <p className="text-sm text-gray-600">Chưa có lớp học</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

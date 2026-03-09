// src/shared/api/student-warnings.ts
import http from './http';
import { getAllStudentsWithEnrollments } from './students';
import { getStudentAttendanceHistory } from './attendance';
import { getStudentGradesByStudentId } from './grade-entries';
import { listClasses } from './classes';

export interface StudentWarning {
    studentId: number;
    code: string;
    name: string;
    reason: string;
    detail: string;
    program: string;
    classCode: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface StudentWarningsResponse {
    warnings: StudentWarning[];
    totalCount: number;
}

export interface MyWarning {
    classId: number;
    className: string;
    programName: string;
    absentCount: number;
    failCount: number;
    hasAbsenceWarning: boolean;
    hasFailWarning: boolean;
}

export const studentWarningsApi = {
    /**
     * GET /api/students/my-warnings
     * Lấy cảnh báo của học viên hiện tại (vắng > 2, trượt > 2)
     */
    getMyWarnings: async (): Promise<MyWarning[]> => {
        const response = await http.get<MyWarning[]>('/api/students/my-warnings');
        return response.data;
    },

    /**
     * GET /api/students/warnings?centerId={centerId}
     * Lấy danh sách học sinh bị cảnh báo theo trung tâm
     * Tổng hợp từ attendance (vắng mặt) và grades (thi trượt)
     */
    getStudentWarnings: async (centerId?: number): Promise<StudentWarningsResponse> => {
        try {
            // Try backend API first
            const params = centerId ? { centerId } : {};
            const response = await http.get<StudentWarningsResponse>('/api/students/warnings', { params });
            return response.data;
        } catch (error) {
            // Fallback: Calculate warnings from attendance and grades (suppress expected 500 error)
            
            try {
                const studentsResponse = await getAllStudentsWithEnrollments();
                const students = studentsResponse.data;
                const warnings: StudentWarning[] = [];
                
                const now = new Date();
                const currentMonth = now.getMonth() + 1;
                const currentYear = now.getFullYear();
                
                // Load all classes to get centerId mapping
                let classToCenterMap: Map<number, number> = new Map();
                if (centerId) {
                    try {
                        const classesResponse = await listClasses({ centerId });
                        const classes = classesResponse.data;
                        classes.forEach((cls: any) => {
                            classToCenterMap.set(cls.classId, cls.centerId);
                        });
                    } catch (err) {
                    }
                }
                
                // Cache grades by studentId to prevent duplicate API calls
                const gradesCache = new Map<number, any[]>();
                
                await Promise.all(
                    students.map(async (student) => {
                        try {
                            // Only check students with active enrollments
                            const activeEnrollments = student.enrollments.filter(e => e.status === 'ACTIVE');
                            if (activeEnrollments.length === 0) return;
                            
                            // Filter by centerId if provided
                            const relevantEnrollments = centerId 
                                ? activeEnrollments.filter(e => classToCenterMap.get(e.classId) === centerId)
                                : activeEnrollments;
                            
                            if (relevantEnrollments.length === 0) return;
                            
                            // Load grades once per student and cache it
                            if (!gradesCache.has(student.studentId)) {
                                const gradesResponse = await getStudentGradesByStudentId(student.studentId);
                                gradesCache.set(student.studentId, gradesResponse);
                            }
                            const allGrades = gradesCache.get(student.studentId) || [];
                            
                            for (const enrollment of relevantEnrollments) {
                                // Load attendance for this specific class
                                const attendanceResponse = await getStudentAttendanceHistory(
                                    student.studentId,
                                    enrollment.classId
                                );
                                
                                // Count absences in current month for this class
                                const absences = (attendanceResponse.data.records || []).filter((record: any) => {
                                    const date = new Date(record.attendanceDate);
                                    return (
                                        date.getMonth() + 1 === currentMonth &&
                                        date.getFullYear() === currentYear &&
                                        record.status === 'ABSENT'
                                    );
                                }).length;
                                
                                // Count failed exams in current month for this class only (use cached grades)
                                const failedExams = (allGrades || []).filter((grade: any) => {
                                    if (!grade.entryDate) return false;
                                    // Filter by classId to only count exams in this class
                                    if (grade.classId !== enrollment.classId) return false;
                                    const date = new Date(grade.entryDate);
                                    return (
                                        date.getMonth() + 1 === currentMonth &&
                                        date.getFullYear() === currentYear &&
                                        grade.passStatus === 'FAIL'
                                    );
                                }).length;
                                
                                // Add warning if absences >= 2 or failed >= 2
                                if (absences >= 2 || failedExams >= 2) {
                                    let reason = '';
                                    let detail = '';
                                    let severity: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
                                    
                                    if (absences >= 5 || failedExams >= 3) {
                                        severity = 'HIGH';
                                    }
                                    
                                    if (absences >= 2 && failedExams >= 2) {
                                        reason = 'Nghỉ học nhiều & Thi trượt';
                                        detail = `Vắng ${absences} buổi học, trượt ${failedExams} bài thi`;
                                    } else if (absences >= 2) {
                                        reason = 'Nghỉ học nhiều';
                                        detail = `Đã nghỉ ${absences} buổi học trong tháng`;
                                    } else {
                                        reason = 'Điểm số thấp';
                                        detail = `Trượt ${failedExams} bài thi trong tháng`;
                                    }
                                    
                                    warnings.push({
                                        studentId: student.studentId,
                                        code: `HV${String(student.studentId).padStart(3, '0')}`,
                                        name: student.fullName,
                                        reason,
                                        detail,
                                        program: enrollment.programName,
                                        classCode: enrollment.className,
                                        severity,
                                    });
                                    // Don't break - check all classes for this student
                                }
                            }
                        } catch (err) {
                        }
                    })
                );
                
                return {
                    warnings,
                    totalCount: warnings.length,
                };
            } catch (err) {
                // Return empty if all fails
                return {
                    warnings: [],
                    totalCount: 0,
                };
            }
        }
    },
};

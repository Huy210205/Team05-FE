// src/shared/api/attendance.ts
import http from './http';

// ===== TYPES =====
export type AttendanceStatus = 'PRESENT' | 'ABSENT'; // Backend chỉ hỗ trợ 2 trạng thái này
export type SessionStatus = 'NOT_TAKEN' | 'TAKEN';

export interface AttendanceSchedule {
    classId: number;
    className: string;
    attendanceDate: string; // yyyy-mm-dd
    sessionStatus: SessionStatus;
}

export interface AttendanceRecord {
    enrollmentId?: number;
    studentId: number;
    status: AttendanceStatus;
    notes?: string;
    recordId?: number;
}

export interface CreateAttendanceSessionRequest {
    classId: number;
    teacherId: number;
    attendanceDate: string;
    notes?: string;
    records: AttendanceRecord[];
}

export interface UpdateAttendanceSessionRequest {
    notes?: string;
    records: {
        recordId: number;
        status: AttendanceStatus;
        notes?: string;
    }[];
}

export interface AttendanceSessionSummary {
    sessionId: number;
    attendanceDate: string;
    totalStudents: number;
    presentCount: number;
    absentCount: number;
}

export interface AttendanceSessionDetail {
    sessionId: number;
    classId: number;
    className: string;
    teacherId: number;
    teacherName: string;
    attendanceDate: string;
    notes?: string;
    records: Array<{
        recordId: number;
        enrollmentId: number;
        studentId: number;
        studentName: string;
        studentCode: string;
        status: AttendanceStatus;
        notes?: string;
    }>;
}

// ===== API CALLS =====

/**
 * 1. Lấy lịch dạy của giảng viên
 * GET /api/attendance-schedules?teacher_id={teacherId}&from={from}&to={to}
 */
export const getTeacherAttendanceSchedules = (teacherId: number, from: string, to: string) =>
    http.get<AttendanceSchedule[]>('/api/attendance-schedules', {
        params: { teacher_id: teacherId, from, to },
    });

/**
 * 2. Tạo buổi điểm danh
 * POST /api/attendance-sessions
 */
export const createAttendanceSession = (data: CreateAttendanceSessionRequest) =>
    http.post('/api/attendance-sessions', data);

/**
 * 3. Lấy danh sách buổi điểm danh của lớp
 * GET /api/classes/{classId}/attendance-sessions
 */
export const getClassAttendanceSessions = (classId: number) =>
    http.get<AttendanceSessionSummary[]>(`/api/classes/${classId}/attendance-sessions`);

/**
 * 4. Lấy chi tiết buổi điểm danh
 * GET /api/attendance-sessions/{sessionId}
 */
export const getAttendanceSessionDetail = (sessionId: number) =>
    http.get<AttendanceSessionDetail>(`/api/attendance-sessions/${sessionId}`);

/**
 * 5. Cập nhật buổi điểm danh
 * PUT /api/attendance-sessions/{sessionId}
 */
export const updateAttendanceSession = (sessionId: number, data: UpdateAttendanceSessionRequest) =>
    http.put(`/api/attendance-sessions/${sessionId}`, data);

/**
 * 6. Xóa buổi điểm danh (Soft Delete)
 * DELETE /api/attendance-sessions/{sessionId}
 */
export const deleteAttendanceSession = (sessionId: number) =>
    http.delete(`/api/attendance-sessions/${sessionId}`);

// ===== STUDENT ATTENDANCE HISTORY =====

export interface StudentAttendanceHistory {
    studentId: number;
    studentName: string;
    studentCode: string;
    classId: number;
    className: string;
    totalSessions: number;
    presentCount: number;
    absentCount: number;
    records: Array<{
        sessionId: number;
        attendanceDate: string; // yyyy-mm-dd
        status: AttendanceStatus;
        notes?: string;
        teacherName: string;
    }>;
}

/**
 * 7. Lấy lịch sử điểm danh của học viên trong một lớp
 * GET /api/students/{studentId}/classes/{classId}/attendance
 */
export const getStudentAttendanceHistory = (studentId: number, classId: number) =>
    http.get<StudentAttendanceHistory>(`/api/students/${studentId}/classes/${classId}/attendance`);



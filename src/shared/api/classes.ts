// src/shared/api/classes.ts
import api from './http';
import type {
    ListResponse,
    EnrollmentResponse,
    EnrollmentRequest,
    UpdateEnrollmentRequest,
} from '@/shared/types/classes';

// ===== TYPES =====
export type StudyDay = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
export type StudyTime = 'MORNING' | 'AFTERNOON' | 'EVENING';
export type ClassStatus = 'PLANNED' | 'ONGOING' | 'FINISHED' | 'CANCELLED';
export type DeliveryMode = 'ONLINE' | 'OFFLINE' | 'HYBRID';

// ===== PROGRAM DTOs =====
export type ProgramLiteDto = {
    programId: number;
    code: string;
    name: string;
    description: string | null;
    durationHours: number;
    deliveryMode: DeliveryMode;
    categoryCode: string;
    isActive: boolean;
};

// ===== CLASS DTOs =====
export type CreateClassDto = {
    centerId?: number; // Optional - chỉ Super Admin mới truyền
    programId: number;
    name: string;
    description?: string;
    startDate?: string; // ISO date: "2025-01-15"
    endDate?: string; // ISO date: "2025-06-30"
    room?: string;
    capacity?: number;
    studyDays?: StudyDay[]; // ["MONDAY", "THURSDAY"]
    studyTime?: StudyTime; // "EVENING"
};

export type UpdateClassDto = {
    programId?: number;
    name?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    room?: string;
    capacity?: number;
    status?: ClassStatus;
    studyDays?: StudyDay[];
    studyTime?: StudyTime;
};

export type ClassDto = {
    classId: number;
    centerId: number;
    centerName: string;
    programId: number;
    programName: string;
    name: string;
    description: string | null;
    startDate: string | null;
    endDate: string | null;
    status: ClassStatus;
    room: string | null;
    capacity: number | null;
    studyDays: StudyDay[] | null;
    studyTime: StudyTime | null;
    createdAt: string;
    updatedAt: string;
    createdBy: number | null;
    updatedBy: number | null;
};

export type ClassLiteDto = {
    classId: number;
    name: string;
    programName: string;
    centerName: string;
    status: ClassStatus;
};

// ===== PROGRAM APIs =====
/**
 * Lấy danh sách Chương trình học cho dropdown (phiên bản rút gọn)
 */
export const getProgramsLite = (category?: string) =>
    api.get<ProgramLiteDto[]>('/api/programs/lite', {
        params: category ? { category } : undefined,
    });

/**
 * Lấy tất cả Chương trình học đang hoạt động
 */
export const getPrograms = () => api.get<ProgramLiteDto[]>('/api/programs');

// ===== CLASS APIs =====
/**
 * Tạo Lớp học mới
 * - Super Admin: truyền centerId trong body
 * - Academic Staff: không cần centerId (tự động lấy từ user)
 */
export const createClass = (payload: CreateClassDto) => api.post<ClassDto>('/api/classes', payload);

/**
 * Hiển thị Danh sách Lớp học
 * - Super Admin: có thể filter theo centerId, status
 * - Academic Staff: tự động lọc theo center của mình
 */
export const listClasses = (params?: { centerId?: number; status?: ClassStatus }) =>
    api.get<ClassDto[]>('/api/classes', { params });

/**
 * Lấy danh sách lớp học mà giảng viên được phân công
 * - Lecturer: chỉ xem lớp mình được phân công giảng dạy
 */
export const getMyLecturerClasses = () => api.get<ClassDto[]>('/api/classes/my-classes');

/**
 * Lấy chi tiết Lớp học theo ID
 */
export const getClassById = (classId: number) => api.get<ClassDto>(`/api/classes/${classId}`);

/**
 * Lấy danh sách Lớp học cho dropdown (phiên bản rút gọn)
 */
export const getClassesLite = () => api.get<ClassLiteDto[]>('/api/classes/lite');

/**
 * Sửa chi tiết Lớp học theo ID
 */
export const updateClass = (classId: number, payload: UpdateClassDto) =>
    api.put<ClassDto>(`/api/classes/${classId}`, payload);

/**
 * Xóa Lớp học theo ID
 */
export const deleteClass = (classId: number) => api.delete(`/api/classes/${classId}`);

// ===== ENROLLMENT APIs =====
/**
 * Lấy danh sách học viên trong lớp
 * GET /api/classes/{classId}/students
 */
export const getClassStudents = (
    classId: number,
    params?: { status?: string; page?: number; size?: number; sort?: string },
) => api.get(`/api/classes/${classId}/students`, { params });

/**
 * Thêm học viên vào lớp (Enroll)
 * POST /api/classes/{classId}/students
 */
export const enrollStudent = (classId: number, payload: { studentId: number; enrolledAt?: string; note?: string }) =>
    api.post(`/api/classes/${classId}/students`, payload);

/**
 * Cập nhật trạng thái enrollment
 * PATCH /api/classes/{classId}/students/{enrollmentId}
 */
export const updateEnrollment = (
    classId: number,
    enrollmentId: number,
    payload: { status?: string; leftAt?: string; note?: string },
) => api.patch(`/api/classes/${classId}/students/${enrollmentId}`, payload);

/**
 * Xóa học viên khỏi lớp (Soft delete - DROPPED)
 * DELETE /api/classes/{classId}/students/{enrollmentId}
 */
export const removeStudentFromClass = (classId: number, enrollmentId: number, reason?: string) =>
    api.delete(`/api/classes/${classId}/students/${enrollmentId}`, {
        params: reason ? { reason } : undefined,
    });

// ===== STUDENT CLASSES APIs =====
/**
 * Lấy danh sách lớp học của một học viên
 * GET /api/students/{studentId}/classes
 */
export const getStudentClasses = (studentId: number) => api.get<ClassDto[]>(`/api/students/${studentId}/classes`);

export const getMyClasses = () => api.get<ClassDto[]>('/api/students/my-classes');

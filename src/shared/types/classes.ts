// src/shared/types/classes.ts
export type ClassStatus = 'PLANNED' | 'ONGOING' | 'FINISHED' | 'CANCELLED';
export type EnrollmentStatus = 'ACTIVE' | 'SUSPENDED' | 'DROPPED' | 'GRADUATED';

export type CreateClassRequest = {
    programId: number;
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    room?: string;
    capacity?: number;
};

export type UpdateClassRequest = {
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    room?: string;
    capacity?: number;
    status?: ClassStatus;
    studyDays?: string[];
    studyTime?: string;
};

export type ClassResponse = {
    classId: number;
    centerId: number;
    centerName: string;
    programId: number;
    programName: string;
    programCode: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    status: ClassStatus;
    room: string;
    capacity: number;
    studyDays?: string[];
    studyTime?: string;
    createdAt: string;
    updatedAt: string;
    createdBy: number;
    updatedBy: number;
};

export type ClassLiteResponse = {
    classId: number;
    name: string;
    programName: string;
    centerName: string;
    status: ClassStatus;
};

export type AssignLecturerRequest = {
    startDate: string;
    note?: string;
};

export type RemoveLecturerRequest = {
    endDate?: string;
    note?: string;
};

export type ClassLecturerResponse = {
    id: number;
    classId: number;
    teacherId: number;
    teacherName: string;
    teacherEmail: string;
    effStartDate: string;
    effEndDate: string;
    createdAt: string;
    createdBy: string;
};

export type EnrollmentResponse = {
    enrollmentId: number;
    classId: number;
    studentId: number;
    studentName: string;
    studentEmail: string;
    studentOverallStatus: string;  // Trạng thái tổng quan của học viên
    status: string;  // Trạng thái enrollment trong lớp
    enrolledAt: string;
    leftAt: string;
    note: string;
};

export type EnrollmentRequest = {
    studentId: number;
    enrolledAt?: string;
    note?: string;
};

export type UpdateEnrollmentRequest = {
    status: EnrollmentStatus;
    leftAt?: string;
    note?: string;
};

// Types cho UI components
export type ClassFormData = {
    name: string;
    description: string;
    program: string;
    startDate: string;
    endDate?: string;
    schedule: string;
    location: string;
    maxStudents: number;
    status: 'Chuẩn bị' | 'Đang học' | 'Hoàn thành' | 'Tạm dừng';
};

export type StudentFormData = {
    name: string;
    email: string;
};

export type ClassStats = {
    label: string;
    value: string;
};

// Generic wrapper for paginated responses
export type ListResponse<T> = {
    total: number;
    items: T[];
};
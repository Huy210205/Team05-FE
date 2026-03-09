// src/shared/types/student.ts

export type StudentDto = {
    studentId: number;
    fullName: string;
    email: string;
    phone: string;
    dob?: string | null; // ISO date string
    gender?: string | null;
    nationalIdNo?: string | null;
    addressLine?: string | null;
    province?: string | null;
    district?: string | null;
    ward?: string | null;
    note?: string | null;
    overallStatus?: string;
    createdAt: string; // ISO
    updatedAt: string; // ISO
};

export type CreateStudentDto = {
    fullName: string;
    email: string;
    phone: string;
    dob?: string | null; // ISO date string (YYYY-MM-DD)
    gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
    nationalIdNo?: string | null;
    addressLine?: string | null;
    province?: string | null;
    district?: string | null;
    ward?: string | null;
    note?: string | null;
};

export type UpdateStudentDto = {
    fullName: string;
    email: string;
    phone: string;
    dob?: string | null;
    addressLine?: string | null;
};

// ENROLLMENT STATUS (thuộc bảng enrollments - quản lí lớp học)
// Enrollment có 4 trạng thái: ACTIVE, SUSPENDED, DROPPED, GRADUATED
export type StudentEnrollment = {
    enrollmentId: number;
    classId: number;
    className: string;
    programName: string;
    status: 'ACTIVE' | 'SUSPENDED' | 'DROPPED' | 'GRADUATED';
    enrolledAt: string;
    leftAt?: string;
    enrollmentNote?: string;
};

// STUDENT OVERALL STATUS (thuộc bảng students - hồ sơ học viên)
// Student có 4 trạng thái: PENDING, ACTIVE, DROPPED, GRADUATED
export type StudentOverallStatus = 'PENDING' | 'ACTIVE' | 'DROPPED' | 'GRADUATED';

// DTO mới từ backend với enrollments
export type StudentWithEnrollmentsDto = {
    studentId: number;
    fullName: string;
    email: string;
    phone: string;
    dob?: string | null;
    gender?: string | null;
    nationalIdNo?: string | null;
    addressLine?: string | null;
    province?: string | null;
    district?: string | null;
    ward?: string | null;
    note?: string | null;
    overallStatus: string;
    userId?: number;
    createdAt: string;
    updatedAt: string;
    enrollments: StudentEnrollment[];
};
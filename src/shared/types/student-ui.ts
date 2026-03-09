// src/shared/types/student-ui.ts
import type { StudentEnrollment } from './student';

export type StudentUI = {
    id: string;
    studentId: string;
    name: string;
    email: string;
    phone: string;
    initial: string;
    registrationDate: string;
    status: 'Đang chờ' | 'Đang học' | 'Nghỉ học' | 'Tốt nghiệp';
    avatar?: string;
    dob?: string | null;
    address?: string | null;
    gender?: string | null;
    nationalIdNo?: string | null;
    
    // Thay đổi: enrollments thay vì classes
    enrollments: StudentEnrollment[];
};

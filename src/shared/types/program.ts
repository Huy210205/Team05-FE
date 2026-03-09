// src/shared/types/class.ts

export type StudyDay = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export type StudyTime = 'MORNING' | 'AFTERNOON' | 'EVENING';

export type ClassStatus = 'PLANNED' | 'ONGOING' | 'FINISHED' | 'CANCELLED';

export type ClassDto = {
    classId: number;
    centerId: number;
    centerName: string;
    programId: number;
    programName: string;
    name: string;
    description: string | null;
    startDate: string | null; // ISO 8601: "2025-01-15"
    endDate: string | null;   // ISO 8601: "2025-06-30"
    status: ClassStatus;
    room: string | null;
    capacity: number | null;
    studyDays: StudyDay[] | null; // ["MONDAY", "THURSDAY"]
    studyTime: StudyTime | null;  // "EVENING"
    createdAt: string; // ISO 8601
    updatedAt: string; // ISO 8601
    createdBy: number | null;
    updatedBy: number | null;
    deletedAt?: string | null; // ISO 8601
};

export type ClassLiteDto = {
    classId: number;
    name: string;
    programName: string;
    centerName: string;
    status: ClassStatus;
};
// Types for Grade Entry System (V42)

export interface GradeRecord {
    gradeRecordId: number;
    gradeEntryId: number;
    studentId: number;
    studentName: string;
    theoryScore: number | null;
    practiceScore: number | null;
    finalScore: number | null; // Auto-calculated: theory * 0.3 + practice * 0.7
    passStatus: 'PASS' | 'FAIL' | null; // Auto-calculated: PASS if finalScore >= 50
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface GradeEntry {
    gradeEntryId: number;
    classId: number;
    className: string;
    moduleId: number;
    moduleName: string;
    entryDate: string;
    createdBy: number;
    createdByName: string;
    createdAt: string;
    updatedAt: string;
    totalStudents: number;
    gradedStudents: number;
}

export interface GradeEntryDetail extends GradeEntry {
    gradeRecords: GradeRecord[];
}

export interface CreateGradeEntryRequest {
    classId: number;
    moduleId: number;
    entryDate: string;
    records: {
        studentId: number;
        theoryScore?: number | null;
        practiceScore?: number | null;
        notes?: string;
    }[];
}

export interface UpdateGradeRecordsRequest {
    records: {
        gradeRecordId: number;
        theoryScore?: number | null;
        practiceScore?: number | null;
        notes?: string;
    }[];
}

export interface StudentGradesResponse {
    studentId: number;
    studentName: string;
    grades: {
        moduleId: number;
        moduleName: string;
        entryDate: string;
        theoryScore: number | null;
        practiceScore: number | null;
        finalScore: number | null;
        passStatus: 'PASS' | 'FAIL' | null;
    }[];
}

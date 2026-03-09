import type { GradeEntry, GradeEntryDetail, GradeRecord, StudentGradesResponse } from '@/shared/types/grades';

// Mock modules for the program
export const mockModules = [
    { moduleId: 1, code: 'JS-M01', name: 'HTML & CSS Cơ bản', semester: 1 },
    { moduleId: 2, code: 'JS-M02', name: 'JavaScript ES6+', semester: 1 },
    { moduleId: 3, code: 'JS-M03', name: 'React Framework', semester: 1 },
    { moduleId: 4, code: 'JS-M04', name: 'Node.js & Express', semester: 2 },
    { moduleId: 5, code: 'JS-M05', name: 'Database MySQL', semester: 2 },
    { moduleId: 6, code: 'JS-M06', name: 'Final Project', semester: 2 },
];

// Mock students in the class
export const mockStudents = [
    { studentId: 1, fullName: 'Nguyễn Minh Anh', email: 'minhanh@student.codegym.vn' },
    { studentId: 2, fullName: 'Lê Hoàng Bách', email: 'hoangbach@student.codegym.vn' },
    { studentId: 3, fullName: 'Phạm Thu Hà', email: 'thuha@student.codegym.vn' },
    { studentId: 4, fullName: 'Hoàng Văn Dũng', email: 'vandung@student.codegym.vn' },
    { studentId: 5, fullName: 'Vũ Thị Mai', email: 'thimai@student.codegym.vn' },
];

// Mock grade entries
export const mockGradeEntries: GradeEntry[] = [
    {
        gradeEntryId: 1,
        classId: 1,
        className: 'FULLSTACK-JS-K01',
        moduleId: 1,
        moduleName: 'HTML & CSS Cơ bản',
        entryDate: '2025-02-28',
        createdBy: 1,
        createdByName: 'Trần Văn Hùng',
        createdAt: '2025-02-28T10:00:00',
        updatedAt: '2025-02-28T10:00:00',
        totalStudents: 5,
        gradedStudents: 5,
    },
    {
        gradeEntryId: 2,
        classId: 1,
        className: 'FULLSTACK-JS-K01',
        moduleId: 2,
        moduleName: 'JavaScript ES6+',
        entryDate: '2025-04-15',
        createdBy: 1,
        createdByName: 'Trần Văn Hùng',
        createdAt: '2025-04-15T10:00:00',
        updatedAt: '2025-04-15T10:00:00',
        totalStudents: 5,
        gradedStudents: 5,
    },
    {
        gradeEntryId: 3,
        classId: 1,
        className: 'FULLSTACK-JS-K01',
        moduleId: 3,
        moduleName: 'React Framework',
        entryDate: '2025-06-01',
        createdBy: 1,
        createdByName: 'Trần Văn Hùng',
        createdAt: '2025-06-01T10:00:00',
        updatedAt: '2025-06-01T10:00:00',
        totalStudents: 5,
        gradedStudents: 3,
    },
    {
        gradeEntryId: 4,
        classId: 1,
        className: 'FULLSTACK-JS-K01',
        moduleId: 4,
        moduleName: 'Node.js & Express',
        entryDate: '2025-07-01',
        createdBy: 1,
        createdByName: 'Trần Văn Hùng',
        createdAt: '2025-07-01T10:00:00',
        updatedAt: '2025-07-01T10:00:00',
        totalStudents: 5,
        gradedStudents: 0,
    },
];

// Mock grade records for each entry
const mockGradeRecordsData: Record<number, GradeRecord[]> = {
    1: [
        // HTML & CSS - Hoàn thành
        {
            gradeRecordId: 1,
            gradeEntryId: 1,
            studentId: 1,
            studentName: 'Nguyễn Minh Anh',
            theoryScore: 85,
            practiceScore: 90,
            finalScore: 88.5,
            passStatus: 'PASS',
            createdAt: '2025-02-28T10:00:00',
            updatedAt: '2025-02-28T10:00:00',
        },
        {
            gradeRecordId: 2,
            gradeEntryId: 1,
            studentId: 2,
            studentName: 'Lê Hoàng Bách',
            theoryScore: 70,
            practiceScore: 75,
            finalScore: 73.5,
            passStatus: 'PASS',
            createdAt: '2025-02-28T10:00:00',
            updatedAt: '2025-02-28T10:00:00',
        },
        {
            gradeRecordId: 3,
            gradeEntryId: 1,
            studentId: 3,
            studentName: 'Phạm Thu Hà',
            theoryScore: 90,
            practiceScore: 85,
            finalScore: 86.5,
            passStatus: 'PASS',
            createdAt: '2025-02-28T10:00:00',
            updatedAt: '2025-02-28T10:00:00',
        },
        {
            gradeRecordId: 4,
            gradeEntryId: 1,
            studentId: 4,
            studentName: 'Hoàng Văn Dũng',
            theoryScore: 60,
            practiceScore: 65,
            finalScore: 63.5,
            passStatus: 'PASS',
            createdAt: '2025-02-28T10:00:00',
            updatedAt: '2025-02-28T10:00:00',
        },
        {
            gradeRecordId: 5,
            gradeEntryId: 1,
            studentId: 5,
            studentName: 'Vũ Thị Mai',
            theoryScore: 80,
            practiceScore: 85,
            finalScore: 83.5,
            passStatus: 'PASS',
            createdAt: '2025-02-28T10:00:00',
            updatedAt: '2025-02-28T10:00:00',
        },
    ],
    2: [
        // JavaScript - Hoàn thành
        {
            gradeRecordId: 6,
            gradeEntryId: 2,
            studentId: 1,
            studentName: 'Nguyễn Minh Anh',
            theoryScore: 75,
            practiceScore: 80,
            finalScore: 78.5,
            passStatus: 'PASS',
            createdAt: '2025-04-15T10:00:00',
            updatedAt: '2025-04-15T10:00:00',
        },
        {
            gradeRecordId: 7,
            gradeEntryId: 2,
            studentId: 2,
            studentName: 'Lê Hoàng Bách',
            theoryScore: 60,
            practiceScore: 70,
            finalScore: 67,
            passStatus: 'PASS',
            createdAt: '2025-04-15T10:00:00',
            updatedAt: '2025-04-15T10:00:00',
        },
        {
            gradeRecordId: 8,
            gradeEntryId: 2,
            studentId: 3,
            studentName: 'Phạm Thu Hà',
            theoryScore: 80,
            practiceScore: 90,
            finalScore: 87,
            passStatus: 'PASS',
            createdAt: '2025-04-15T10:00:00',
            updatedAt: '2025-04-15T10:00:00',
        },
        {
            gradeRecordId: 9,
            gradeEntryId: 2,
            studentId: 4,
            studentName: 'Hoàng Văn Dũng',
            theoryScore: 45,
            practiceScore: 55,
            finalScore: 52,
            passStatus: 'PASS',
            createdAt: '2025-04-15T10:00:00',
            updatedAt: '2025-04-15T10:00:00',
        },
        {
            gradeRecordId: 10,
            gradeEntryId: 2,
            studentId: 5,
            studentName: 'Vũ Thị Mai',
            theoryScore: 70,
            practiceScore: 80,
            finalScore: 77,
            passStatus: 'PASS',
            createdAt: '2025-04-15T10:00:00',
            updatedAt: '2025-04-15T10:00:00',
        },
    ],
    3: [
        // React - Đang học (chỉ có theory)
        {
            gradeRecordId: 11,
            gradeEntryId: 3,
            studentId: 1,
            studentName: 'Nguyễn Minh Anh',
            theoryScore: 80,
            practiceScore: null,
            finalScore: null,
            passStatus: null,
            createdAt: '2025-06-01T10:00:00',
            updatedAt: '2025-06-01T10:00:00',
        },
        {
            gradeRecordId: 12,
            gradeEntryId: 3,
            studentId: 2,
            studentName: 'Lê Hoàng Bách',
            theoryScore: 70,
            practiceScore: null,
            finalScore: null,
            passStatus: null,
            createdAt: '2025-06-01T10:00:00',
            updatedAt: '2025-06-01T10:00:00',
        },
        {
            gradeRecordId: 13,
            gradeEntryId: 3,
            studentId: 3,
            studentName: 'Phạm Thu Hà',
            theoryScore: 90,
            practiceScore: null,
            finalScore: null,
            passStatus: null,
            createdAt: '2025-06-01T10:00:00',
            updatedAt: '2025-06-01T10:00:00',
        },
        {
            gradeRecordId: 14,
            gradeEntryId: 3,
            studentId: 4,
            studentName: 'Hoàng Văn Dũng',
            theoryScore: null,
            practiceScore: null,
            finalScore: null,
            passStatus: null,
            createdAt: '2025-06-01T10:00:00',
            updatedAt: '2025-06-01T10:00:00',
        },
        {
            gradeRecordId: 15,
            gradeEntryId: 3,
            studentId: 5,
            studentName: 'Vũ Thị Mai',
            theoryScore: null,
            practiceScore: null,
            finalScore: null,
            passStatus: null,
            createdAt: '2025-06-01T10:00:00',
            updatedAt: '2025-06-01T10:00:00',
        },
    ],
    4: [
        // Node.js - Chưa bắt đầu
        {
            gradeRecordId: 16,
            gradeEntryId: 4,
            studentId: 1,
            studentName: 'Nguyễn Minh Anh',
            theoryScore: null,
            practiceScore: null,
            finalScore: null,
            passStatus: null,
            createdAt: '2025-07-01T10:00:00',
            updatedAt: '2025-07-01T10:00:00',
        },
        {
            gradeRecordId: 17,
            gradeEntryId: 4,
            studentId: 2,
            studentName: 'Lê Hoàng Bách',
            theoryScore: null,
            practiceScore: null,
            finalScore: null,
            passStatus: null,
            createdAt: '2025-07-01T10:00:00',
            updatedAt: '2025-07-01T10:00:00',
        },
        {
            gradeRecordId: 18,
            gradeEntryId: 4,
            studentId: 3,
            studentName: 'Phạm Thu Hà',
            theoryScore: null,
            practiceScore: null,
            finalScore: null,
            passStatus: null,
            createdAt: '2025-07-01T10:00:00',
            updatedAt: '2025-07-01T10:00:00',
        },
        {
            gradeRecordId: 19,
            gradeEntryId: 4,
            studentId: 4,
            studentName: 'Hoàng Văn Dũng',
            theoryScore: null,
            practiceScore: null,
            finalScore: null,
            passStatus: null,
            createdAt: '2025-07-01T10:00:00',
            updatedAt: '2025-07-01T10:00:00',
        },
        {
            gradeRecordId: 20,
            gradeEntryId: 4,
            studentId: 5,
            studentName: 'Vũ Thị Mai',
            theoryScore: null,
            practiceScore: null,
            finalScore: null,
            passStatus: null,
            createdAt: '2025-07-01T10:00:00',
            updatedAt: '2025-07-01T10:00:00',
        },
    ],
};

// Mock API functions
export const getClassGradeEntries = async (classId: number): Promise<GradeEntry[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockGradeEntries.filter((entry) => entry.classId === classId);
};

// Create a new grade entry for a module in a class (mock)
export const createGradeEntry = async (
    classId: number,
    moduleId: number,
    options?: { createdBy?: number; createdByName?: string; className?: string; entryDate?: string },
): Promise<number> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const mod = mockModules.find((m) => m.moduleId === moduleId);
    if (!mod) throw new Error('Module not found in program');

    const nextId = Math.max(0, ...mockGradeEntries.map((e) => e.gradeEntryId)) + 1;
    const now = new Date();
    const entryDate = options?.entryDate ?? now.toISOString().slice(0, 10);
    const createdAt = now.toISOString();

    const createdBy = options?.createdBy ?? 1;
    const createdByName = options?.createdByName ?? 'System Mock';
    const className = options?.className ?? 'FULLSTACK-JS-K01';

    const newEntry: GradeEntry = {
        gradeEntryId: nextId,
        classId,
        className,
        moduleId,
        moduleName: mod.name,
        entryDate,
        createdBy,
        createdByName,
        createdAt,
        updatedAt: createdAt,
        totalStudents: mockStudents.length,
        gradedStudents: 0,
    };

    // Build grade records for all students with empty scores
    const baseRecordId = Math.max(
        0,
        ...Object.values(mockGradeRecordsData)
            .flat()
            .map((r) => r.gradeRecordId),
    );
    const records: GradeRecord[] = mockStudents.map((s, idx) => ({
        gradeRecordId: baseRecordId + idx + 1,
        gradeEntryId: nextId,
        studentId: s.studentId,
        studentName: s.fullName,
        theoryScore: null,
        practiceScore: null,
        finalScore: null,
        passStatus: null,
        createdAt,
        updatedAt: createdAt,
    }));

    mockGradeEntries.push(newEntry);
    mockGradeRecordsData[nextId] = records;

    return nextId;
};

export const getGradeEntryDetail = async (gradeEntryId: number): Promise<GradeEntryDetail> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const entry = mockGradeEntries.find((e) => e.gradeEntryId === gradeEntryId);
    if (!entry) throw new Error('Grade entry not found');

    return {
        ...entry,
        gradeRecords: mockGradeRecordsData[gradeEntryId] || [],
    };
};

export const getStudentGrades = async (studentId: number): Promise<StudentGradesResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const student = mockStudents.find((s) => s.studentId === studentId);
    if (!student) throw new Error('Student not found');

    const grades = mockGradeEntries.map((entry) => {
        const record = mockGradeRecordsData[entry.gradeEntryId]?.find((r) => r.studentId === studentId);
        return {
            moduleId: entry.moduleId,
            moduleName: entry.moduleName,
            entryDate: entry.entryDate,
            theoryScore: record?.theoryScore ?? null,
            practiceScore: record?.practiceScore ?? null,
            finalScore: record?.finalScore ?? null,
            passStatus: record?.passStatus ?? null,
        };
    });

    return {
        studentId,
        studentName: student.fullName,
        grades,
    };
};

export const updateGradeRecords = async (
    gradeEntryId: number,
    records: { gradeRecordId: number; theoryScore?: number | null; practiceScore?: number | null; notes?: string }[],
): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simulate update
    const gradeRecords = mockGradeRecordsData[gradeEntryId];
    if (!gradeRecords) throw new Error('Grade entry not found');

    records.forEach((update) => {
        const record = gradeRecords.find((r) => r.gradeRecordId === update.gradeRecordId);
        if (record) {
            if (update.theoryScore !== undefined) record.theoryScore = update.theoryScore;
            if (update.practiceScore !== undefined) record.practiceScore = update.practiceScore;
            if (update.notes !== undefined) record.notes = update.notes;

            // Auto-calculate final score and pass status
            if (record.theoryScore !== null && record.practiceScore !== null) {
                record.finalScore = Math.round((record.theoryScore * 0.3 + record.practiceScore * 0.7) * 100) / 100;
                record.passStatus = record.finalScore >= 50 ? 'PASS' : 'FAIL';
            } else {
                record.finalScore = null;
                record.passStatus = null;
            }

            record.updatedAt = new Date().toISOString();
        }
    });
};

export const deleteGradeEntry = async (
    classId: number,
    moduleId: number,
    entryDate: string,
): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Find and remove the grade entry
    const entryIndex = mockGradeEntries.findIndex(
        (e) => e.classId === classId && e.moduleId === moduleId && e.entryDate === entryDate,
    );
    if (entryIndex === -1) throw new Error('Grade entry not found');

    const entry = mockGradeEntries[entryIndex];
    mockGradeEntries.splice(entryIndex, 1);

    // Remove grade records
    delete mockGradeRecordsData[entry.gradeEntryId];
};
// Mock data và API cho Exam Results
// Backend sẽ implement sau, hiện tại dùng mock để test UI

export interface StudentScoreInput {
    studentId: number;
    theoryScore: number;
    practicalScore: number;
    note?: string;
}

export interface CreateExamResultRequest {
    classId: number;
    moduleId: number;
    examDate: string;
    studentScores: StudentScoreInput[];
}

export interface UpdateExamResultRequest {
    examDate?: string;
    studentScores?: StudentScoreInput[];
}

export interface StudentScoreResponse {
    studentId: number;
    studentCode: string;
    fullName: string;
    theoryScore: number;
    practicalScore: number;
    finalScore: number;
    status: 'PASS' | 'FAIL';
    note?: string;
}

export interface ExamResultResponse {
    examResultId: number;
    classId: number;
    className: string;
    moduleId: number;
    moduleName: string;
    examDate: string;
    createdBy: number;
    creatorName: string;
    createdAt: string;
    updatedAt: string;
    studentScores: StudentScoreResponse[];
}

// ============= MOCK DATA =============
let mockExamResults: ExamResultResponse[] = [
    {
        examResultId: 1,
        classId: 1,
        className: 'SCC-JS-01',
        moduleId: 1,
        moduleName: 'HTML & CSS Basics',
        examDate: '2025-10-15',
        createdBy: 1,
        creatorName: 'Nguyễn Văn Giảng',
        createdAt: '2025-10-15T10:00:00',
        updatedAt: '2025-10-15T10:00:00',
        studentScores: [
            {
                studentId: 1,
                studentCode: 'SV001',
                fullName: 'Trần Văn An',
                theoryScore: 8.5,
                practicalScore: 7.0,
                finalScore: 7.45,
                status: 'PASS',
                note: 'Thực hành tốt',
            },
            {
                studentId: 2,
                studentCode: 'SV002',
                fullName: 'Lê Thị Bình',
                theoryScore: 6.0,
                practicalScore: 8.5,
                finalScore: 7.75,
                status: 'PASS',
                note: '',
            },
            {
                studentId: 3,
                studentCode: 'SV003',
                fullName: 'Phạm Văn Cường',
                theoryScore: 4.0,
                practicalScore: 5.5,
                finalScore: 5.05,
                status: 'PASS',
                note: 'Vừa đạt',
            },
            {
                studentId: 4,
                studentCode: 'SV004',
                fullName: 'Hoàng Thị Dung',
                theoryScore: 3.0,
                practicalScore: 4.0,
                finalScore: 3.7,
                status: 'FAIL',
                note: 'Cần học bổ sung',
            },
            {
                studentId: 5,
                studentCode: 'SV005',
                fullName: 'Vũ Văn Em',
                theoryScore: 7.5,
                practicalScore: 9.0,
                finalScore: 8.55,
                status: 'PASS',
                note: 'Xuất sắc',
            },
        ],
    },
    {
        examResultId: 2,
        classId: 1,
        className: 'SCC-JS-01',
        moduleId: 2,
        moduleName: 'JavaScript Fundamentals',
        examDate: '2025-10-20',
        createdBy: 1,
        creatorName: 'Nguyễn Văn Giảng',
        createdAt: '2025-10-20T14:00:00',
        updatedAt: '2025-10-20T14:00:00',
        studentScores: [
            {
                studentId: 1,
                studentCode: 'SV001',
                fullName: 'Trần Văn An',
                theoryScore: 9.0,
                practicalScore: 8.5,
                finalScore: 8.65,
                status: 'PASS',
            },
            {
                studentId: 2,
                studentCode: 'SV002',
                fullName: 'Lê Thị Bình',
                theoryScore: 7.5,
                practicalScore: 9.0,
                finalScore: 8.55,
                status: 'PASS',
            },
            {
                studentId: 3,
                studentCode: 'SV003',
                fullName: 'Phạm Văn Cường',
                theoryScore: 5.5,
                practicalScore: 6.0,
                finalScore: 5.85,
                status: 'PASS',
            },
            {
                studentId: 4,
                studentCode: 'SV004',
                fullName: 'Hoàng Thị Dung',
                theoryScore: 6.0,
                practicalScore: 7.0,
                finalScore: 6.7,
                status: 'PASS',
            },
            {
                studentId: 5,
                studentCode: 'SV005',
                fullName: 'Vũ Văn Em',
                theoryScore: 9.5,
                practicalScore: 10.0,
                finalScore: 9.85,
                status: 'PASS',
            },
        ],
    },
    {
        examResultId: 3,
        classId: 1,
        className: 'SCC-JS-01',
        moduleId: 3,
        moduleName: 'React Basics',
        examDate: '2025-10-25',
        createdBy: 1,
        creatorName: 'Nguyễn Văn Giảng',
        createdAt: '2025-10-25T09:00:00',
        updatedAt: '2025-10-25T09:00:00',
        studentScores: [
            {
                studentId: 1,
                studentCode: 'SV001',
                fullName: 'Trần Văn An',
                theoryScore: 8.0,
                practicalScore: 7.5,
                finalScore: 7.65,
                status: 'PASS',
            },
            {
                studentId: 2,
                studentCode: 'SV002',
                fullName: 'Lê Thị Bình',
                theoryScore: 7.0,
                practicalScore: 8.5,
                finalScore: 8.05,
                status: 'PASS',
            },
            {
                studentId: 3,
                studentCode: 'SV003',
                fullName: 'Phạm Văn Cường',
                theoryScore: 4.5,
                practicalScore: 5.0,
                finalScore: 4.85,
                status: 'FAIL',
                note: 'Chưa nắm vững',
            },
            {
                studentId: 4,
                studentCode: 'SV004',
                fullName: 'Hoàng Thị Dung',
                theoryScore: 6.5,
                practicalScore: 7.2,
                finalScore: 6.99,
                status: 'PASS',
            },
            {
                studentId: 5,
                studentCode: 'SV005',
                fullName: 'Vũ Văn Em',
                theoryScore: 8.8,
                practicalScore: 9.5,
                finalScore: 9.29,
                status: 'PASS',
            },
        ],
    },
    {
        examResultId: 4,
        classId: 1,
        className: 'SCC-JS-01',
        moduleId: 1,
        moduleName: 'HTML & CSS Basics',
        examDate: '2025-10-30',
        createdBy: 1,
        creatorName: 'Nguyễn Văn Giảng',
        createdAt: '2025-10-30T15:00:00',
        updatedAt: '2025-10-30T15:00:00',
        studentScores: [
            {
                studentId: 1,
                studentCode: 'SV001',
                fullName: 'Trần Văn An',
                theoryScore: 9.2,
                practicalScore: 8.8,
                finalScore: 8.92,
                status: 'PASS',
                note: 'Tiến bộ rõ rệt',
            },
            {
                studentId: 2,
                studentCode: 'SV002',
                fullName: 'Lê Thị Bình',
                theoryScore: 8.5,
                practicalScore: 9.2,
                finalScore: 8.99,
                status: 'PASS',
            },
            {
                studentId: 3,
                studentCode: 'SV003',
                fullName: 'Phạm Văn Cường',
                theoryScore: 5.8,
                practicalScore: 6.5,
                finalScore: 6.29,
                status: 'PASS',
                note: 'Đã cải thiện',
            },
            {
                studentId: 4,
                studentCode: 'SV004',
                fullName: 'Hoàng Thị Dung',
                theoryScore: 4.8,
                practicalScore: 5.5,
                finalScore: 5.29,
                status: 'PASS',
            },
            {
                studentId: 5,
                studentCode: 'SV005',
                fullName: 'Vũ Văn Em',
                theoryScore: 9.8,
                practicalScore: 10.0,
                finalScore: 9.94,
                status: 'PASS',
                note: 'Xuất sắc',
            },
        ],
    },
];

let nextId = 5;

// ============= MOCK API FUNCTIONS =============

/**
 * Tạo đợt nhập điểm mới (MOCK)
 */
export const createExamResult = async (request: CreateExamResultRequest): Promise<ExamResultResponse> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newExamResult: ExamResultResponse = {
        examResultId: nextId++,
        classId: request.classId,
        className: 'Mock Class',
        moduleId: request.moduleId,
        moduleName: 'Mock Module',
        examDate: request.examDate,
        createdBy: 1,
        creatorName: 'Current User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        studentScores: request.studentScores.map((score) => {
            const finalScore = score.theoryScore * 0.3 + score.practicalScore * 0.7;
            return {
                studentId: score.studentId,
                studentCode: `SV${String(score.studentId).padStart(3, '0')}`,
                fullName: `Student ${score.studentId}`,
                theoryScore: score.theoryScore,
                practicalScore: score.practicalScore,
                finalScore: Math.round(finalScore * 100) / 100,
                status: finalScore >= 5.0 ? 'PASS' : 'FAIL',
                note: score.note,
            };
        }),
    };

    mockExamResults.push(newExamResult);
    return newExamResult;
};

/**
 * Lấy danh sách đợt nhập điểm theo lớp (MOCK)
 */
export const getExamResultsByClass = async (classId: number): Promise<ExamResultResponse[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockExamResults.filter((r) => r.classId === classId);
};

/**
 * Lấy danh sách đợt nhập điểm theo lớp và module (MOCK)
 */
export const getExamResultsByClassAndModule = async (
    classId: number,
    moduleId: number,
): Promise<ExamResultResponse[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockExamResults.filter((r) => r.classId === classId && r.moduleId === moduleId);
};

/**
 * Lấy chi tiết một đợt nhập điểm (MOCK)
 */
export const getExamResultById = async (examResultId: number): Promise<ExamResultResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const result = mockExamResults.find((r) => r.examResultId === examResultId);
    if (!result) {
        throw new Error('Exam result not found');
    }
    return result;
};

/**
 * Cập nhật đợt nhập điểm (MOCK)
 */
export const updateExamResult = async (
    examResultId: number,
    request: UpdateExamResultRequest,
): Promise<ExamResultResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const index = mockExamResults.findIndex((r) => r.examResultId === examResultId);
    if (index === -1) {
        throw new Error('Exam result not found');
    }

    const existing = mockExamResults[index];

    if (request.examDate) {
        existing.examDate = request.examDate;
    }

    if (request.studentScores) {
        existing.studentScores = request.studentScores.map((score) => {
            const finalScore = score.theoryScore * 0.3 + score.practicalScore * 0.7;
            const existingStudent = existing.studentScores.find((s) => s.studentId === score.studentId);
            return {
                studentId: score.studentId,
                studentCode: existingStudent?.studentCode || `SV${String(score.studentId).padStart(3, '0')}`,
                fullName: existingStudent?.fullName || `Student ${score.studentId}`,
                theoryScore: score.theoryScore,
                practicalScore: score.practicalScore,
                finalScore: Math.round(finalScore * 100) / 100,
                status: finalScore >= 5.0 ? 'PASS' : 'FAIL',
                note: score.note,
            };
        });
    }

    existing.updatedAt = new Date().toISOString();
    mockExamResults[index] = existing;

    return existing;
};

/**
 * Xóa đợt nhập điểm (MOCK)
 */
export const deleteExamResult = async (examResultId: number): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    mockExamResults = mockExamResults.filter((r) => r.examResultId !== examResultId);
};

/**
 * Lấy danh sách ngày nhập điểm của module trong lớp (MOCK)
 */
export const getExamDatesByClassAndModule = async (classId: number, moduleId: number): Promise<string[]> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const results = mockExamResults.filter((r) => r.classId === classId && r.moduleId === moduleId);
    return Array.from(new Set(results.map((r) => r.examDate))).sort();
};

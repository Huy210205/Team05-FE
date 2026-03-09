// src/shared/api/grade-entries.ts
import api from './http';

// ===== TYPES =====

export interface GradeRecordRequest {
    studentId: number;
    theoryScore: number;
    practiceScore: number;
}

export interface CreateGradeEntryRequest {
    classId: number;
    moduleId: number;
    semester?: number;
    entryDate: string; // ISO date: "2025-01-15"
    gradeRecords: GradeRecordRequest[];
}

export interface UpdateGradeRecordsRequest {
    classId: number;
    moduleId: number;
    semester: number;
    entryDate: string; // ISO date: "2025-01-15"
    gradeRecords: GradeRecordRequest[];
}

export interface StudentGradeRecord {
    studentId: number;
    studentCode: string;
    fullName: string;
    theoryScore: number;
    practiceScore: number;
    finalScore: number;
    status: 'PASS' | 'FAIL';
    note?: string;
}

export interface GradeRecordResponse {
    gradeRecordId: number;
    studentId: number;
    studentName: string;
    studentEmail?: string;
    theoryScore: number;
    practiceScore: number;
    finalScore: number;
    passStatus: 'PASS' | 'FAIL';
    entryDate?: string; // ISO date: "2025-01-15" - ngày thi của đợt nhập điểm này
    // Thông tin module và class (cho API lấy điểm theo student)
    moduleId?: number;
    moduleCode?: string;
    moduleName?: string;
    semester?: number;
    classId?: number;
    className?: string;
}

export interface GradeEntryResponse {
    gradeEntryId: number;
    classId: number;
    className: string;
    moduleId: number;
    moduleCode?: string;
    moduleName: string;
    semester?: number;
    entryDate: string;
    createdBy: number;
    createdByName: string;
    createdAt: string;
    updatedAt: string;
    passCount?: number;
    failCount?: number;
}

export interface GradeEntryDetailResponse {
    gradeEntryId: number;
    classId: number;
    className: string;
    programId?: number;
    programName?: string;
    moduleId: number;
    moduleCode?: string;
    moduleName: string;
    semester?: number;
    entryDate: string;
    createdBy: number;
    createdByName: string;
    createdAt: string;
    updatedAt: string;
    gradeRecords: GradeRecordResponse[];
}

export interface StudentGradesResponse {
    // Backend trả về ModuleResponse[] (có field 'name', không phải 'moduleName')
    modules?: Array<{
        moduleId: number;
        moduleCode?: string;
        moduleName?: string; // Deprecated - dùng 'name' thay thế
        name?: string; // Field thực tế từ backend
        semester?: number;
    }>;
    gradeRecords?: GradeRecordResponse[];
    classId: number;
    className: string;
    semester: number;
    moduleId?: number;
}

// ===== API FUNCTIONS =====

/**
 * POST /api/grade-entries
 * Tạo đợt nhập điểm mới với danh sách điểm của học viên
 */
export const createGradeEntry = async (
    request: CreateGradeEntryRequest,
): Promise<GradeEntryDetailResponse> => {
    const response = await api.post<GradeEntryDetailResponse>('/api/grade-entries', request);
    return response.data;
};

/**
 * PUT /api/grade-entries
 * Sửa điểm học viên trong một đợt nhập điểm
 */
export const updateGradeRecords = async (
    request: UpdateGradeRecordsRequest,
): Promise<GradeEntryDetailResponse> => {
    const response = await api.put<GradeEntryDetailResponse>('/api/grade-entries', request);
    return response.data;
};

/**
 * DELETE /api/grade-entries?classId=1&moduleId=5&entryDate=2024-01-15
 * Xóa đợt nhập điểm theo classId, moduleId và entryDate
 */
export const deleteGradeEntry = async (
    classId: number,
    moduleId: number,
    entryDate: string,
): Promise<void> => {
    await api.delete('/api/grade-entries', {
        params: {
            classId,
            moduleId,
            entryDate,
        },
    });
};

/**
 * GET /api/grade-entries?classId=1&moduleId=5&entryDate=2024-01-15
 * Lấy danh sách đợt nhập điểm của một lớp
 * Có thể filter theo moduleId và entryDate
 */
export const getGradeEntries = async (
    classId: number,
    moduleId?: number,
    entryDate?: string,
): Promise<GradeEntryResponse[]> => {
    const params: any = { classId };
    if (moduleId) params.moduleId = moduleId;
    if (entryDate) params.entryDate = entryDate;

    const response = await api.get<GradeEntryResponse[]>('/api/grade-entries', { params });
    return response.data;
};

/**
 * GET /api/grade-entries/student-grades?classId=1&semester=1&moduleId=26
 * Lấy điểm của học viên theo lớp, semester và module
 * - Nếu chưa có moduleId: trả về danh sách modules để chọn
 * - Nếu có moduleId: trả về danh sách điểm của học viên trong lớp, cùng moduleId
 */
export const getStudentGrades = async (
    classId: number,
    semester: number,
    moduleId?: number,
): Promise<StudentGradesResponse> => {
    const params: any = { classId, semester };
    if (moduleId) params.moduleId = moduleId;

    const response = await api.get<StudentGradesResponse>('/api/grade-entries/student-grades', { params });
    return response.data;
};

/**
 * POST /api/grade-entries/import
 * Import điểm từ file Excel cho một đợt nhập điểm
 */
export const importGradesFromExcel = async (
    file: File,
    classId: number,
    moduleId: number,
    entryDate: string,
): Promise<GradeEntryDetailResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('classId', classId.toString());
    formData.append('moduleId', moduleId.toString());
    formData.append('entryDate', entryDate);

    const response = await api.post<GradeEntryDetailResponse>('/api/grade-entries/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

/**
 * GET /api/grade-entries/export-template?classId=1&moduleId=5
 * Download Excel template để nhập điểm
 */
export const downloadGradeTemplate = async (classId: number, moduleId: number) => {
    const response = await api.get('/api/grade-entries/export-template', {
        responseType: 'blob',
        headers: { 'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
        params: { classId, moduleId },
    });

    // Create download link
    const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'grade_import_template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

/**
 * GET /api/grade-entries/export?classId=1&semester=1&moduleId=5&entryDate=2024-01-01
 * Export danh sách điểm ra Excel (sau khi filter)
 * @param entryDate Bắt buộc khi đã chọn moduleId
 */
export const exportGrades = async (classId: number, semester: number, moduleId?: number, entryDate?: string) => {
    const params: any = { classId, semester };
    if (moduleId) params.moduleId = moduleId;
    if (entryDate) params.entryDate = entryDate;

    const response = await api.get('/api/grade-entries/export', {
        responseType: 'blob',
        headers: { 'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
        params,
    });

    // Create download link
    const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = `grades_export_${classId}_${semester}${moduleId ? `_${moduleId}` : ''}${entryDate ? `_${entryDate}` : ''}.xlsx`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

/**
 * GET /api/grade-entries/student/{studentId}
 * Lấy tất cả điểm thi của một học viên cụ thể
 */
export const getStudentGradesByStudentId = async (studentId: number): Promise<GradeRecordResponse[]> => {
    const response = await api.get<GradeRecordResponse[]>(`/api/grade-entries/student/${studentId}`);
    return response.data;
};

/**
 * GET /api/grade-entries/my-grades
 * Lấy tất cả điểm thi của học viên hiện tại (dựa vào token)
 */



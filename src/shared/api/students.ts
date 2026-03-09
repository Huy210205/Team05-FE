// src/shared/api/students.ts
import api from './http';
import type { StudentDto, CreateStudentDto, UpdateStudentDto, StudentWithEnrollmentsDto } from '../types/student';

/**
 * Tạo học viên mới
 * POST /api/students
 */
export const createStudent = (payload: CreateStudentDto) => 
    api.post<StudentDto>('/api/students', payload);

/**
 * Lấy danh sách tất cả học viên (chưa bị xóa mềm)
 * GET /api/students
 */
export const listStudents = () => api.get<StudentDto[]>('/api/students');

/**
 * Lấy chi tiết một học viên theo ID
 * GET /api/students/{id}
 */
export const getStudentById = (studentId: number) => api.get<StudentDto>(`/api/students/${studentId}`);

/**
 * Cập nhật thông tin học viên (chỉ 5 trường: fullName, email, phone, dob, addressLine)
 * PUT /api/students/{id}
 */
export const updateStudent = (studentId: number, payload: UpdateStudentDto) => 
    api.put<StudentDto>(`/api/students/${studentId}`, payload);

/**
 * Xóa mềm học viên (soft delete - đổi status sang INACTIVE)
 * DELETE /api/students/{id}
 */
export const deleteStudent = (studentId: number) => 
    api.delete(`/api/students/${studentId}`);

/**
 * Cập nhật trạng thái học viên
 * PATCH /api/students/{id}/status
 */
export const updateStudentStatus = (studentId: number, status: string) => 
    api.patch<StudentDto>(`/api/students/${studentId}/status`, { status });

/**
 * Tìm kiếm học viên theo tên hoặc email
 * GET /api/students/search?keyword={text}
 */
export const searchStudents = (keyword: string) => 
    api.get<StudentDto[]>(`/api/students/search?keyword=${encodeURIComponent(keyword)}`);

/**
 * Export danh sách học viên ra file Excel (.xlsx)
 * GET /api/students/export?status={status}
 * @param status (Optional) Filter by status: STUDYING, GRADUATED, SUSPENDED, ON_LEAVE
 * Returns: Blob (Excel file)
 */
export const exportStudents = (status?: string) => 
    api.get('/api/students/export', { 
        responseType: 'blob',
        headers: { 'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
        params: status ? { status } : {}
    });

/**
 * Download Excel template for student import
 * GET /api/students/template
 * Returns: Blob (Excel file with headers and example row)
 */
export const downloadStudentTemplate = async () => {
    const response = await api.get('/api/students/template', { 
        responseType: 'blob',
        headers: { 'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    });
    
    // Create download link
    const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'student_import_template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

/**
 * Import học viên từ file Excel (.xlsx)
 * POST /api/students/import
 * Returns: Array of created StudentDto
 */
export const importStudentsFromExcel = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<StudentDto[]>('/api/students/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

/**
 * Lấy thông tin chi tiết học viên với enrollments theo ID
 * GET /api/students/{id}/enrollments
 */
export const getStudentWithEnrollmentsById = (studentId: number) => 
    api.get<StudentWithEnrollmentsDto>(`/api/students/${studentId}/enrollments`);

/**
 * Lấy danh sách tất cả học viên với enrollments chi tiết
 * GET /api/students/with-enrollments
 */
export const getAllStudentsWithEnrollments = () => 
    api.get<StudentWithEnrollmentsDto[]>('/api/students/with-enrollments');

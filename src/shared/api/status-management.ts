import http from './http';

export interface ChangeStatusRequest {
    status: string;
    note?: string;
}

export interface StatusChangeResponse {
    message: string;
    enrollmentId?: string;
    studentId?: string;
    classId?: string;
    newStatus: string;
}

export const statusManagementApi = {
    /**
     * Chuyển đổi trạng thái Enrollment
     */
    changeEnrollmentStatus: async (
        enrollmentId: number,
        request: ChangeStatusRequest,
    ): Promise<StatusChangeResponse> => {
        const response = await http.put(`/api/status-management/enrollment/${enrollmentId}`, request);
        return response.data;
    },

    /**
     * Chuyển đổi trạng thái Student
     */
    changeStudentStatus: async (studentId: number, request: ChangeStatusRequest): Promise<StatusChangeResponse> => {
        const response = await http.put(`/api/status-management/student/${studentId}`, request);
        return response.data;
    },

    /**
     * Tự động tốt nghiệp tất cả học viên trong lớp
     */
    graduateClassStudents: async (classId: number): Promise<StatusChangeResponse> => {
        const response = await http.post(`/api/status-management/class/${classId}/graduate`);
        return response.data;
    },

    /**
     * Đồng bộ trạng thái Student từ Enrollment
     */
    syncStudentStatus: async (studentId: number): Promise<StatusChangeResponse> => {
        const response = await http.post(`/api/status-management/student/${studentId}/sync`);
        return response.data;
    },
};

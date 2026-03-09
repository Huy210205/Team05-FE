import api from '@/shared/api/http';

export type ListResponse<T> = { total: number; items: T[] };

const normalize = <T>(data: any): ListResponse<T> => {
    // Hỗ trợ cả 3 dạng: wrapper chuẩn, Spring Page, mảng thuần
    if (data?.items) return { total: Number(data.total ?? data.items.length ?? 0), items: data.items as T[] };
    if (Array.isArray(data)) return { total: data.length, items: data as T[] };
    if (data?.content) return { total: Number(data.totalElements ?? 0), items: data.content as T[] };
    return { total: 0, items: [] };
};

export const getClassStudents = async (classId: number, params?: any) => {
    const { data } = await api.get(`/api/classes/${classId}/students`, { params });
    return normalize<any>(data); // EnrollmentResponse[]
};

export const enrollStudent = (classId: number, body: { studentId: number; enrolledAt: string; note?: string | null }) =>
    api.post(`/api/classes/${classId}/students`, body);

export const updateEnrollment = (classId: number, enrollmentId: number, body: any) =>
    api.patch(`/api/classes/${classId}/students/${enrollmentId}`, body);

export const revokeEnrollment = (classId: number, enrollmentId: number, reason?: string) =>
    api.delete(`/api/classes/${classId}/students/${enrollmentId}`, { params: { reason } });
import api from '@/shared/api/http';
export type UserView = { userId: number; fullName: string; email: string; phone?: string | null; avatarUrl?: string | null };

export const getStudentsByCenter = async (centerId: number, q?: string) => {
    const { data } = await api.get('/api/user-views', { params: { centerId, roleCode: 'STUDENT', q } });
    // /api/user-views trả LIST thuần → luôn trả mảng
    return Array.isArray(data) ? (data as UserView[]) : [];
};
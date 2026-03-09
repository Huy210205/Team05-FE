import api from '../shared/api/http';

export interface AssignRoleRequest {
    roleId: number;
    centerId?: number | null;
}

export interface AssignRolesResponse {
    createdCount: number;
    skippedCount: number;
    errors: string[];
}

// GET /api/user-views/{userId}
export const getUserView = (userId: number) =>
    api.get(`/api/user-views/${userId}`);

// POST /api/user-roles/user/{userId}
export const assignRolesBatch = (userId: number, items: AssignRoleRequest[]) =>
    api.post<AssignRolesResponse>(`/api/user-roles/user/${userId}`, items);

// DELETE /api/user-roles (body: [id,…]) – chỉ SA
export const revokeUserRolesBulk = (ids: number[]) =>
    api.delete('/api/user-roles', { data: ids });

// DELETE /api/user-roles/{id} – non-SA dùng
export const revokeUserRole = (id: number) =>
    api.delete(`/api/user-roles/${id}`);

// GET /api/user-roles – Lấy danh sách user-roles với assignmentId (cho SA)
export const getUserRoles = () =>
    api.get('/api/user-roles');

// GET /api/user-roles/user/{userId} – Lấy user-roles của user cụ thể với assignmentId
export const getUserRolesByUserId = (userId: number) =>
    api.get(`/api/user-roles/user/${userId}`);

// GET /api/user-roles/user/{userId}/revoked – Lấy revoked roles của user
export const getRevokedRolesByUserId = (userId: number) =>
    api.get(`/api/user-roles/user/${userId}/revoked`);
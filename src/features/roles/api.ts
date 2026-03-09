import api from '../../shared/api/http';
import type {
    Role,
    RoleListResponse,
    CreateRoleRequest,
    UpdateRoleRequest,
    RoleFormData,
    PermissionGroupsResponse
} from './model/types';

// Get all roles with optional active filter
export const getRoles = async (active = true): Promise<RoleListResponse> => {
    const response = await api.get<RoleListResponse>('/api/roles', { params: { active } });
    return response.data;
};

// Get role by ID
export const getRoleById = async (id: number): Promise<Role> => {
    const response = await api.get<Role>(`/api/roles/${id}`);
    return response.data;
};

// Create new role
export const createRole = async (roleData: CreateRoleRequest): Promise<Role> => {
    const response = await api.post<Role>('/api/roles', roleData);
    return response.data;
};

// Update existing role
export const updateRole = async (id: number, roleData: UpdateRoleRequest): Promise<Role> => {
    const response = await api.put<Role>(`/api/roles/${id}`, roleData);
    return response.data;
};

// Delete role
export const deleteRole = async (id: number): Promise<void> => {
    await api.delete(`/api/roles/${id}`);
};

// Helper function to transform form data to API format
export const transformFormDataToCreateRequest = (formData: RoleFormData): CreateRoleRequest => ({
    code: formData.code,
    name: formData.name,
    active: formData.active,
    permissionIds: formData.permissionIds,
});

// Helper function to transform form data to update request
export const transformFormDataToUpdateRequest = (id: number, formData: RoleFormData): UpdateRoleRequest => ({
    roleId: id,
    code: formData.code,
    name: formData.name,
    active: formData.active,
    permissionIds: formData.permissionIds,
});

// Get permission groups
export const getPermissionGroups = async (): Promise<PermissionGroupsResponse> => {
    const response = await api.get<PermissionGroupsResponse>('/api/permissions/groups');
    return response.data;
};
// Types for Roles feature based on BE API

export interface PermissionSummary {
    total: number;
    count: number;
    actions: string[];
}

export interface RoleSummary {
    [category: string]: PermissionSummary;
}

export interface Role {
    roleId: number;
    code: string;
    name: string;
    active: boolean;
    createdAt: string;
    updatedAt?: string;
    userCount: number;
    permissionCount: number;
    permissionIds?: number[];
    permissionNamesPreview?: string[];
    summary?: RoleSummary;
}

export interface RoleListResponse {
    total: number;
    items: Role[];
}

export interface CreateRoleRequest {
    code: string;
    name: string;
    active?: boolean;
    permissionIds?: number[];
}

export interface UpdateRoleRequest extends CreateRoleRequest {
    roleId: number;
}

export interface RoleFormData {
    code: string;
    name: string;
    active: boolean;
    permissionIds: number[];
}

// Types for Permissions Groups API
export interface Permission {
    permissionId: number;
    code: string;
    name: string;
    active: boolean;
    granted: boolean | null;
}

export interface PermissionGroup {
    category: string;
    categoryLabel: string;
    order: number;
    total: number;
    items: Permission[];
}

export type PermissionGroupsResponse = PermissionGroup[];
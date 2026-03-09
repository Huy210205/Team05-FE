// Re-export types from the roles feature for backward compatibility
export type { Role, RoleListResponse, CreateRoleRequest, UpdateRoleRequest, RoleFormData } from '../../features/roles/model/types';

// Legacy types for backward compatibility
export type RoleScope = 'GLOBAL' | 'CENTER';
export type RoleDto = {
    roleId: number;
    code: string;
    name: string;
    scope: RoleScope;
    active: boolean;
};

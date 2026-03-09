// src/shared/types/userView.ts
export type RoleScope = 'GLOBAL' | 'CENTER';

// ❗ mềm hóa: không union cố định, để string
export type RoleCode = string;

export interface UserAssignment {
    assignmentId: number;
    roleId: number;
    roleCode: RoleCode; // string
    roleName: string;
    scope: RoleScope;   // backend trả về
    centerId: number | null;
    centerName: string | null;
    assignedAt?: string; // Optional: timestamp khi được gán vai trò
}

export interface UserViewDto {
    userId: number;
    fullName: string;
    email: string;
    phone: string;
    active: boolean;
    specialty: string | null;
    assignments: UserAssignment[];
}

export interface UserViewQuery {
    centerId?: number;
    roleCode?: RoleCode; // string
    q?: string;
    page?: number;
    size?: number;
}

export type RoleStatsResponse = Record<string, number>;

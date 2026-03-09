import api from './http';
import type { RoleDto } from '../types/role';
export const getRoles = (active = true) =>
    api.get<RoleDto[]>('/api/roles', { params: { active } });

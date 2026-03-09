// src/shared/api/centers.ts
import api from './http';
import type {
    CenterDto,
    CenterLiteDto,
    CreateCenterDto,
    UpdateCenterDto,
} from '../types/centers';

// ---------- Dropdown lite cho FE (dùng ở UsersPage, CreateUserModal...)
export const getCentersLite = () =>
    api.get<CenterLiteDto[]>('/api/centers/lite');

// ---------- Quản trị Centers (dev1 giữ nguyên)
export const createCenter = (payload: CreateCenterDto) =>
    api.post<CenterDto>('/api/centers', payload);

export const listActiveCenters = () =>
    api.get<CenterDto[]>('/api/centers');           // active-only

export const listAllCenters = () =>
    api.get<CenterDto[]>('/api/centers/all');       // gồm cả vô hiệu

export const getCenterById = (id: number) =>
    api.get<CenterDto>(`/api/centers/${id}`);

export const updateCenter = (id: number, payload: UpdateCenterDto) =>
    api.put<CenterDto>(`/api/centers/${id}`, payload);

export const deactivateCenter = (id: number) =>
    api.delete<void>(`/api/centers/${id}`);

export const reactivateCenter = (id: number) =>
    api.put<CenterDto>(`/api/centers/${id}/reactivate`, {});

// Helpers (tuỳ nhu cầu)
export const getCentersByStatus = (active: boolean) =>
    active ? listActiveCenters() : listAllCenters();

export const getCentersByProvince = async (province: string) => {
    const res = await listAllCenters();
    return {
        ...res,
        data: res.data.filter((c) => c.province === province),
    };
};

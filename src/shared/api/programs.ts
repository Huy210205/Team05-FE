// src/shared/api/programs.ts
import api from './http';

export type DeliveryMode = 'ONLINE' | 'OFFLINE' | 'HYBRID';

export type Program = {
    programId: number;
    code: string;
    name: string;
    description: string;
    durationHours: number;
    deliveryMode: DeliveryMode;
    categoryCode: string;
    languageCode?: string;
    isActive: boolean;
    moduleCount?: number; // Số lượng modules trong program (từ backend)
};

export type CreateProgramDto = {
    code: string;
    name: string;
    description?: string;
    durationHours: number;
    deliveryMode: DeliveryMode;
    categoryCode: string;
    languageCode?: string;
    isActive?: boolean;
};

export type UpdateProgramDto = {
    name?: string;
    description?: string;
    durationHours?: number;
    deliveryMode?: DeliveryMode;
    categoryCode?: string;
    languageCode?: string;
    isActive?: boolean;
};

// API calls
export const getPrograms = () => 
    api.get<Program[]>('/api/programs');

export const getProgramsByCategory = (categoryCode: string) => 
    api.get<Program[]>('/api/programs/lite', { params: { category: categoryCode } });

export const getProgramById = (programId: number) => 
    api.get<Program>(`/api/programs/${programId}`);

export const createProgram = (payload: CreateProgramDto) => 
    api.post<Program>('/api/programs', payload);

export const updateProgram = (programId: number, payload: UpdateProgramDto) => 
    api.put<Program>(`/api/programs/${programId}`, payload);

export const deleteProgram = (programId: number) => 
    api.delete(`/api/programs/${programId}`);
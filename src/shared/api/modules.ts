// src/shared/api/modules.ts
import api from './http';
import type {
    ModuleResponse,
    CreateModuleRequest,
    UpdateModuleRequest,
    ReorderModuleRequest,
    AttachResourceRequest,
    ModuleQueryParams,
} from '../types/module';

// Re-export types for external use
export type {
    ModuleResponse,
    CreateModuleRequest,
    UpdateModuleRequest,
    ReorderModuleRequest,
    AttachResourceRequest,
    ModuleQueryParams,
};

/**
 * Tạo module mới
 * POST /api/modules
 */
export const createModule = (payload: CreateModuleRequest) =>
    api.post<ModuleResponse>('/api/modules', payload);

/**
 * Lấy danh sách modules của một program
 * GET /api/modules?programId={programId}&level={level}&mandatoryOnly={mandatoryOnly}&q={q}
 */
export const getModulesByProgram = (params: ModuleQueryParams) =>
    api.get<ModuleResponse[]>('/api/modules', { params });

/**
 * Lấy chi tiết một module
 * GET /api/modules/{moduleId}
 */
export const getModuleById = (moduleId: number) =>
    api.get<ModuleResponse>(`/api/modules/${moduleId}`);

/**
 * Cập nhật module
 * PUT /api/modules/{moduleId}
 */
export const updateModule = (moduleId: number, payload: UpdateModuleRequest) =>
    api.put<ModuleResponse>(`/api/modules/${moduleId}`, payload);

/**
 * Sắp xếp lại thứ tự module trong program
 * PATCH /api/modules/reorder?programId={programId}&sequenceOrder={sequenceOrder}
 */
export const reorderModule = (
    programId: number,
    sequenceOrder: number,
    payload: ReorderModuleRequest,
) =>
    api.patch<ModuleResponse[]>('/api/modules/reorder', payload, {
        params: { programId, sequenceOrder },
    });

/**
 * Gắn tài liệu học tập vào module
 * PUT /api/modules/{moduleId}/resource
 */
export const attachResource = (moduleId: number, payload: AttachResourceRequest) =>
    api.put<ModuleResponse>(`/api/modules/${moduleId}/resource`, payload);

/**
 * Xóa tài liệu học tập khỏi module
 * DELETE /api/modules/{moduleId}/resource
 */
export const removeResource = (moduleId: number) =>
    api.delete<ModuleResponse>(`/api/modules/${moduleId}/resource`);

/**
 * Xóa MỘT tài liệu cụ thể khỏi module (theo URL)
 * DELETE /api/modules/{moduleId}/resource?url={resourceUrl}
 */
export const removeResourceByUrl = (moduleId: number, resourceUrl: string) =>
    api.delete<ModuleResponse>(`/api/modules/${moduleId}/resource`, {
        params: { url: resourceUrl }
    });


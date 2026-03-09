// src/shared/types/module.ts

export type ModuleLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface ModuleResource {
    url: string;
    fileName?: string;
    fileType?: string; // PDF, DOCX, YOUTUBE, GOOGLE_DRIVE, EXTERNAL_LINK
    fileSize?: number; // bytes
    uploadedAt?: string;
    uploadedBy?: number;
}

export interface ModuleResponse {
    moduleId: number;
    programId: number;
    programCode: string;
    programName: string;
    code: string;
    name: string;
    description?: string;
    sequenceOrder: number;
    semester: number;
    credits: number;
    durationHours: number;
    level: ModuleLevel;
    isMandatory: boolean;
    
    /** @deprecated Giữ để backward compatibility */
    syllabusUrl?: string;
    
    // NEW: Danh sách tài liệu học tập
    resources?: ModuleResource[];
    
    hasSyllabus: boolean;
    notes?: string;
    isActive: boolean;
    deletedAt?: string;
    createdAt: string;
    updatedAt: string;
    createdBy: number;
    updatedBy: number;
}

export interface CreateModuleRequest {
    programId: number;
    code: string;
    name: string;
    description?: string;
    sequenceOrder?: number; // Optional - backend tự động lấy max + 1 nếu không có
    semester?: number; // Optional - backend tự động tính từ sequenceOrder
    credits: number;
    durationHours?: number;
    level?: ModuleLevel;
    isMandatory?: boolean;
    syllabusUrl?: string;
    hasSyllabus?: boolean;
    notes?: string;
}

export interface UpdateModuleRequest {
    code?: string;
    name?: string;
    description?: string;
    credits?: number;
    durationHours?: number;
    level?: ModuleLevel;
    isMandatory?: boolean;
    syllabusUrl?: string;
    hasSyllabus?: boolean;
    notes?: string;
    isActive?: boolean;
}

export interface ReorderModuleRequest {
    newSequenceOrder: number;
}

export interface AttachResourceRequest {
    resourceUrl: string;
}

export interface ModuleQueryParams {
    programId: number;
    level?: string;
    mandatoryOnly?: boolean;
    q?: string; // search query
}


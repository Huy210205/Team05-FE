// src/shared/api/files.ts
import api from './http';

export interface UploadFileResponse {
    url: string;
    fileName: string;
    fileSize: number;
    fileType: string;
}

/**
 * Upload file syllabus lên server
 * POST /api/files/upload/syllabus
 * 
 * Note: API này chưa được implement ở backend.
 * Cần tạo FileController với endpoint POST /api/files/upload/syllabus
 */
export const uploadSyllabusFile = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post<UploadFileResponse>('/api/files/upload/syllabus', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

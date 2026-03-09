// src/shared/api/knowledge.ts
import api from './http';

export interface KnowledgeDocumentDTO {
    docId: number;
    title: string;
    content: string;
    docType: string;
    sourceUrl?: string;
    relatedEntityType?: string;
    relatedEntityId?: number;
    metadata?: Record<string, any>;
    createdByName?: string;
    createdAt: string;
    updatedAt: string;
    chunkCount: number;
}

export interface RAGTestResult {
    query: string;
    sources: Array<{
        docId: number;
        chunkIndex: number;
        title: string;
        similarity: number;
        excerpt: string;
    }>;
    retrievalMs: number;
}

/**
 * Upload knowledge document file (Admin only)
 * POST /api/admin/knowledge/documents
 */
export const uploadKnowledgeDocument = async (
    file: File,
    title?: string,
    docType?: string
): Promise<KnowledgeDocumentDTO> => {
    const formData = new FormData();
    formData.append('file', file);
    
    if (title) {
        formData.append('title', title);
    }
    
    if (docType) {
        formData.append('docType', docType);
    }
    
    const response = await api.post<KnowledgeDocumentDTO>(
        '/api/admin/knowledge/documents',
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );
    
    return response.data;
};

/**
 * Get all knowledge documents (Admin only)
 * GET /api/admin/knowledge/documents
 */
export const getAllKnowledgeDocuments = async (): Promise<KnowledgeDocumentDTO[]> => {
    const response = await api.get<KnowledgeDocumentDTO[]>('/api/admin/knowledge/documents');
    return response.data;
};

/**
 * Get documents by type (Admin only)
 * GET /api/admin/knowledge/documents/type/{docType}
 */
export const getDocumentsByType = async (docType: string): Promise<KnowledgeDocumentDTO[]> => {
    const response = await api.get<KnowledgeDocumentDTO[]>(`/api/admin/knowledge/documents/type/${docType}`);
    return response.data;
};

/**
 * Search knowledge documents (Admin only)
 * GET /api/admin/knowledge/documents/search?query=xxx
 */
export const searchKnowledgeDocuments = async (query: string): Promise<KnowledgeDocumentDTO[]> => {
    const response = await api.get<KnowledgeDocumentDTO[]>('/api/admin/knowledge/documents/search', {
        params: { query },
    });
    return response.data;
};

/**
 * Delete a knowledge document (Admin only)
 * DELETE /api/admin/knowledge/documents/{docId}
 */
export const deleteKnowledgeDocument = async (docId: number): Promise<void> => {
    await api.delete(`/api/admin/knowledge/documents/${docId}`);
};

/**
 * Delete ALL knowledge documents (Admin only)
 * WARNING: This will delete all knowledge documents and embeddings!
 * DELETE /api/admin/knowledge/documents/all
 */
export const deleteAllKnowledgeDocuments = async (): Promise<void> => {
    await api.delete('/api/admin/knowledge/documents/all');
};

/**
 * Reindex all documents (Admin only)
 * POST /api/admin/knowledge/reindex
 */
export const reindexAllDocuments = async (): Promise<void> => {
    await api.post('/api/admin/knowledge/reindex');
};

/**
 * Test RAG retrieval (Admin only)
 * GET /api/admin/knowledge/test-rag?query=xxx&classId=1&moduleId=2
 */
export const testRAG = async (
    query: string,
    classId?: number,
    moduleId?: number
): Promise<RAGTestResult> => {
    const response = await api.get<RAGTestResult>('/api/admin/knowledge/test-rag', {
        params: {
            query,
            classId,
            moduleId,
        },
    });
    return response.data;
};

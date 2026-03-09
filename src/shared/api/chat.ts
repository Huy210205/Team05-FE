// Real Chat API - Non-streaming version
import api from './http';

export interface ChatSessionDTO {
    sessionId: number;
    userId: number;
    title: string;
    context: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export interface ChatMessageResponse {
    messageId?: number;
    sessionId: number;
    role?: 'user' | 'assistant';
    message: string; // Backend uses 'message', not 'content'
    sources?: MessageSource[];
    completionMs?: number;
    timestamp: string; // Backend uses 'timestamp', not 'createdAt'
}

export interface MessageSource {
    docId: number;
    chunkIndex: number;
    title: string;
    similarity: number;
    excerpt: string;
}

export interface ChatRequest {
    message: string;
}

export interface ChatSessionDetailsResponse {
    session: ChatSessionDTO;
    messages: ChatMessageResponse[];
}

/**
 * Create new chat session
 */
export const createChatSession = async (title?: string): Promise<ChatSessionDTO> => {
    const response = await api.post<ChatSessionDTO>('/api/chat/sessions', {
        title: title || 'Hỏi đáp mới',
    });
    return response.data;
};

/**
 * Get all chat sessions for current user
 */
export const getChatSessions = async (): Promise<ChatSessionDTO[]> => {
    const response = await api.get<ChatSessionDTO[]>('/api/chat/sessions');
    return response.data;
};

/**
 * Get session details with messages
 */
export const getChatSessionDetails = async (sessionId: number): Promise<ChatSessionDetailsResponse> => {
    const response = await api.get<ChatSessionDetailsResponse>(`/api/chat/sessions/${sessionId}`);
    return response.data;
};

/**
 * Send message to chat (non-streaming)
 */
export const sendChatMessage = async (sessionId: number, message: string): Promise<ChatMessageResponse> => {
    const response = await api.post<ChatMessageResponse>(`/api/chat/sessions/${sessionId}/messages`, {
        sessionId: sessionId, // Include sessionId in body for backend logging
        message: message,
    });
    return response.data;
};

/**
 * Delete a chat session
 */
export const deleteChatSession = async (sessionId: number): Promise<void> => {
    await api.delete(`/api/chat/sessions/${sessionId}`);
};

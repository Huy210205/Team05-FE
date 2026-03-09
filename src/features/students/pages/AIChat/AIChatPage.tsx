// src/features/students/pages/AIChat/AIChatPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Send,
    Trash2,
    Loader2,
    Bot,
    User,
    SquarePen,
    MessageSquare,
    Paperclip,
    X,
    Upload,
    FileText,
    ArrowLeft,
} from 'lucide-react';
import { createChatSession, getChatSessions, getChatSessionDetails, sendChatMessage, deleteChatSession, type ChatSessionDTO, type ChatMessageResponse, type ChatSessionDetailsResponse } from '@/shared/api/chat';
import type { AIChatMessage } from '@/shared/api/ai-chat';
import { 
    uploadKnowledgeDocument, 
    getAllKnowledgeDocuments, 
    deleteKnowledgeDocument,
    type KnowledgeDocumentDTO 
} from '@/shared/api/knowledge';
import { useUserProfile } from '@/stores/userProfile';
import { useToast } from '@/shared/hooks/useToast';

interface ChatSession {
    id: string;
    title: string;
    lastMessage: string;
    timestamp: string;
}

interface UploadedFile {
    docId: number;
    title: string;
    fileName: string;
    fileSize: number;
    docType: string;
    chunkCount: number;
    createdAt: string;
    createdByName?: string;
}

export default function AIChatPage() {
    const navigate = useNavigate();
    const [messages, setMessages] = useState<AIChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isLoadingSession, setIsLoadingSession] = useState(false);
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [savedFiles, setSavedFiles] = useState<UploadedFile[]>([]);
    const [showFilesSection, setShowFilesSection] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { me: profile } = useUserProfile();
    const toast = useToast();

    const handleBack = () => {
        navigate(-1); // Quay lại trang trước
    };

    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load chat history when component mounts
    useEffect(() => {
        if (profile?.userId && messages.length === 0) {
            loadChatHistory();
        }
    }, [profile?.userId]);

    // Load saved files for admin
    useEffect(() => {
        if (profile && profile.roles.some(r => ['SUPER_ADMIN', 'ACADEMIC_STAFF', 'LECTURER'].includes(r.code))) {
            loadSavedFiles();
        }
    }, [profile]);

    // Focus input when component mounts
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const loadChatHistory = async () => {
        if (!profile?.userId) return;

        setIsLoadingHistory(true);
        try {
            const sessions = await getChatSessions();

            if (sessions.length > 0) {
                // Convert backend sessions to UI format
                const uiSessions: ChatSession[] = sessions.map((s: ChatSessionDTO) => ({
                    id: s.sessionId.toString(),
                    title: s.title,
                    lastMessage: 'Nhấn để xem chi tiết',
                    timestamp: s.updatedAt,
                }));
                setChatSessions(uiSessions);

                // Load the most recent session
                const latestSession = sessions[0];
                setCurrentSessionId(latestSession.sessionId);
                
                // Load messages from the session
                const sessionDetails = await getChatSessionDetails(latestSession.sessionId);
                
                if (sessionDetails.messages && sessionDetails.messages.length > 0) {
                    const uiMessages: AIChatMessage[] = sessionDetails.messages.map((m: ChatMessageResponse) => ({
                        role: m.role === 'user' ? 'user' : 'assistant',
                        content: m.message,
                        timestamp: m.timestamp,
                    }));
                    setMessages(uiMessages);
                } else {
                    setMessages([]);
                }
            } else {
                // Create a new session if no sessions exist
                const newSession = await createChatSession('Trò chuyện mới');
                setCurrentSessionId(newSession.sessionId);
                setChatSessions([{
                    id: newSession.sessionId.toString(),
                    title: newSession.title,
                    lastMessage: '',
                    timestamp: newSession.createdAt,
                }]);
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading || !currentSessionId) return;

        const userMessage = inputValue.trim();
        setInputValue('');

        // Add user message immediately
        const newUserMessage: AIChatMessage = {
            role: 'user',
            content: userMessage,
            timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, newUserMessage]);

        setIsLoading(true);

        try {
            const response = await sendChatMessage(currentSessionId, userMessage);

            // Add assistant response
            const assistantMessage: AIChatMessage = {
                role: 'assistant',
                content: response.message,
                timestamp: response.timestamp,
            };
            setMessages((prev) => [...prev, assistantMessage]);

            // Update session last message
            setChatSessions((prev) =>
                prev.map((s) =>
                    s.id === currentSessionId.toString()
                        ? {
                              ...s,
                              lastMessage: response.message.slice(0, 50) + '...',
                              timestamp: response.timestamp,
                          }
                        : s,
                ),
            );
        } catch (error: any) {
            console.error('Failed to send message:', error);
            toast.error('Lỗi', 'Không thể gửi tin nhắn. Vui lòng thử lại.');

            const errorMessage: AIChatMessage = {
                role: 'assistant',
                content: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.',
                timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearHistory = async () => {
        if (!currentSessionId) return;

        try {
            await deleteChatSession(currentSessionId);
            
            // Create new session
            const newSession = await createChatSession('Trò chuyện mới');
            setCurrentSessionId(newSession.sessionId);
            setMessages([]);
            setChatSessions([{
                id: newSession.sessionId.toString(),
                title: newSession.title,
                lastMessage: '',
                timestamp: newSession.createdAt,
            }]);
            
            setShowClearConfirm(false);
            toast.success('Thành công', 'Đã xóa lịch sử chat');
        } catch (error) {
            console.error('Failed to clear history:', error);
            toast.error('Lỗi', 'Không thể xóa lịch sử chat');
        }
    };

    const handleDeleteSession = async () => {
        if (!sessionToDelete) return;

        try {
            const sessionId = parseInt(sessionToDelete);
            await deleteChatSession(sessionId);
            
            // Remove from sessions list
            setChatSessions((prev) => prev.filter((s) => s.id !== sessionToDelete));
            
            // If deleted session was current session, create new one
            if (currentSessionId === sessionId) {
                const newSession = await createChatSession('Trò chuyện mới');
                setCurrentSessionId(newSession.sessionId);
                setMessages([]);
                setChatSessions((prev) => [
                    {
                        id: newSession.sessionId.toString(),
                        title: newSession.title,
                        lastMessage: '',
                        timestamp: newSession.createdAt,
                    },
                    ...prev,
                ]);
            }
            
            setSessionToDelete(null);
            toast.success('Thành công', 'Đã xóa cuộc trò chuyện');
        } catch (error) {
            console.error('Failed to delete session:', error);
            toast.error('Lỗi', 'Không thể xóa cuộc trò chuyện');
            setSessionToDelete(null);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validFiles = files.filter((file) => {
            const validTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain',           // .txt
                'text/markdown',        // .md
            ];
            const maxSize = 10 * 1024 * 1024; // 10MB

            // Also check file extension
            const extension = file.name.toLowerCase().split('.').pop();
            const validExtensions = ['pdf', 'doc', 'docx', 'txt', 'md'];

            if (!validTypes.includes(file.type) && !validExtensions.includes(extension || '')) {
                toast.error('Lỗi', `File ${file.name} không hợp lệ. Chỉ hỗ trợ PDF, DOC, DOCX, TXT, MD`);
                return false;
            }

            if (file.size > maxSize) {
                toast.error('Lỗi', `File ${file.name} quá lớn. Tối đa 10MB`);
                return false;
            }

            return true;
        });

        setUploadedFiles((prev) => [...prev, ...validFiles]);
        if (e.target) {
            e.target.value = '';
        }
    };

    const handleRemoveFile = (index: number) => {
        setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    /**
     * Load saved knowledge documents from backend
     */
    const loadSavedFiles = async () => {
        try {
            const documents = await getAllKnowledgeDocuments();
            const files: UploadedFile[] = documents.map(doc => ({
                docId: doc.docId,
                title: doc.title,
                fileName: doc.title, // Use title as filename
                fileSize: doc.content?.length || 0, // Estimate size from content length
                docType: doc.docType,
                chunkCount: doc.chunkCount,
                createdAt: doc.createdAt,
                createdByName: doc.createdByName,
            }));
            setSavedFiles(files);
        } catch (error) {
            console.error('Failed to load saved files:', error);
            toast.error('Lỗi', 'Không thể tải danh sách file');
        }
    };

    /**
     * Upload files to backend and save to knowledge base
     */
    const handleSaveFiles = async () => {
        if (uploadedFiles.length === 0) {
            toast.info('Cảnh báo', 'Chưa có file nào để lưu');
            return;
        }

        setIsUploadingFile(true);
        let successCount = 0;
        let errorCount = 0;

        try {
            // Upload each file sequentially
            for (const file of uploadedFiles) {
                try {
                    await uploadKnowledgeDocument(file, file.name, 'GUIDE');
                    successCount++;
                } catch (error) {
                    console.error(`Failed to upload ${file.name}:`, error);
                    errorCount++;
                }
            }

            // Clear uploaded files and reload saved files
            setUploadedFiles([]);
            await loadSavedFiles();

            if (errorCount === 0) {
                toast.success('Thành công', `Đã lưu ${successCount} file vào hệ thống`);
            } else {
                toast.info('Một phần thất bại', `Đã lưu ${successCount} file. ${errorCount} file thất bại.`);
            }
        } catch (error) {
            console.error('Failed to save files:', error);
            toast.error('Lỗi', 'Không thể lưu file');
        } finally {
            setIsUploadingFile(false);
        }
    };

    /**
     * Delete saved file from backend
     */
    const handleDeleteSavedFile = async (docId: number) => {
        try {
            await deleteKnowledgeDocument(docId);
            setSavedFiles((prev) => prev.filter((f) => f.docId !== docId));
            toast.success('Thành công', 'Đã xóa file khỏi hệ thống');
        } catch (error) {
            console.error('Failed to delete file:', error);
            toast.error('Lỗi', 'Không thể xóa file');
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const handleNewChat = async () => {
        try {
            const newSession = await createChatSession('Cuộc trò chuyện mới');
            setCurrentSessionId(newSession.sessionId);
            setMessages([]);
            
            // Add to sessions list
            setChatSessions((prev) => [
                {
                    id: newSession.sessionId.toString(),
                    title: newSession.title,
                    lastMessage: '',
                    timestamp: newSession.createdAt,
                },
                ...prev,
            ]);
            
            inputRef.current?.focus();
            toast.success('Thành công', 'Đã tạo cuộc trò chuyện mới');
        } catch (error) {
            console.error('Failed to create new session:', error);
            toast.error('Lỗi', 'Không thể tạo cuộc trò chuyện mới');
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Top Header - Trợ lý AI (Full Width) */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                            <Bot className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Trợ lý AI</h2>
                            <p className="text-xs text-blue-50">Luôn sẵn sàng hỗ trợ</p>
                        </div>
                    </div>
                    
                    {/* Nút Trở lại */}
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/20 backdrop-blur-sm"
                        aria-label="Quay lại"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Trở lại</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar - Chat History */}
                <div className="w-80 border-r border-gray-200 bg-gradient-to-b from-slate-50 to-white flex flex-col shadow-lg">
                    {/* New Chat Button */}
                    <div className="px-4 pt-4 pb-3 border-b border-gray-200">
                        <button
                            onClick={handleNewChat}
                            className="w-full flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition-all hover:bg-blue-100 hover:border-blue-300 shadow-sm"
                        >
                            <SquarePen className="h-4 w-4" />
                            Cuộc trò chuyện mới
                        </button>
                    </div>

                    {/* Divider with text */}
                    <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Lịch sử trò chuyện</p>
                    </div>

                    {/* Chat Sessions List */}
                    <div className="flex-1 overflow-y-auto p-2">
                        {chatSessions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center px-4">
                                <MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
                                <p className="text-sm text-gray-500">Chưa có cuộc trò chuyện nào</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {chatSessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className={`relative group w-full rounded-lg p-3 transition-colors ${
                                            currentSessionId?.toString() === session.id
                                                ? 'bg-blue-50 border border-blue-200'
                                                : 'hover:bg-gray-50 border border-transparent'
                                        }`}
                                    >
                                        <button
                                            onClick={async () => {
                                                const sessionId = parseInt(session.id);
                                                console.log('🖱️ Clicked session:', sessionId);
                                                setCurrentSessionId(sessionId);
                                                setIsLoadingSession(true);
                                                
                                                // Load messages for this session
                                                try {
                                                    console.log('📚 Loading session details:', sessionId);
                                                    const response = await getChatSessionDetails(sessionId);
                                                    console.log('📥 Backend response:', response);
                                                    console.log('📨 Messages count:', response.messages?.length || 0);
                                                    
                                                    if (response.messages && response.messages.length > 0) {
                                                        const uiMessages: AIChatMessage[] = response.messages.map((m: ChatMessageResponse) => ({
                                                            role: m.role === 'user' ? 'user' : 'assistant',
                                                            content: m.message,
                                                            timestamp: m.timestamp,
                                                        }));
                                                        console.log('✅ Setting messages:', uiMessages.length);
                                                        setMessages(uiMessages);
                                                    } else {
                                                        console.log('⚠️ No messages in this session');
                                                        setMessages([]);
                                                    }
                                                } catch (error) {
                                                    console.error('❌ Failed to load session:', error);
                                                    toast.error('Lỗi', 'Không thể tải tin nhắn');
                                                    setMessages([]);
                                                } finally {
                                                    setIsLoadingSession(false);
                                                }
                                            }}
                                            className="w-full text-left pr-8"
                                        >
                                            <h4 className="text-sm font-medium text-gray-900 mb-1 truncate">
                                                {session.title}
                                            </h4>
                                            <p className="text-xs text-gray-500 truncate">{session.lastMessage}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(session.timestamp).toLocaleDateString('vi-VN')}
                                            </p>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSessionToDelete(session.id);
                                            }}
                                            className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
                                            title="Xóa cuộc trò chuyện"
                                        >
                                            <X className="h-4 w-4 text-red-600" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Files Management Section - Admin Only */}
                    {profile &&
                        profile.roles.some(r => ['SUPER_ADMIN', 'ACADEMIC_STAFF', 'LECTURER'].includes(r.code)) && (
                            <>
                                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                                    <button
                                        onClick={() => setShowFilesSection(!showFilesSection)}
                                        className="w-full flex items-center justify-between text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                                    >
                                        <span>Quản lý File ({savedFiles.length})</span>
                                        <Upload className="h-3.5 w-3.5" />
                                    </button>
                                </div>

                                {showFilesSection && (
                                    <div className="px-2 py-2 border-t border-gray-200 max-h-48 overflow-y-auto">
                                        {savedFiles.length === 0 ? (
                                            <p className="text-xs text-gray-400 text-center py-4">Chưa có file nào</p>
                                        ) : (
                                            <div className="space-y-1">
                                                {savedFiles.map((file) => (
                                                    <div
                                                        key={file.docId}
                                                        className="flex items-center gap-2 p-2 rounded bg-gray-50 hover:bg-gray-100 group"
                                                    >
                                                        <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-medium text-gray-700 truncate">
                                                                {file.title}
                                                            </p>
                                                            <p className="text-xs text-gray-400">
                                                                {formatFileSize(file.fileSize)} • {file.chunkCount} chunks
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteSavedFile(file.docId)}
                                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded"
                                                        >
                                                            <X className="h-3 w-3 text-red-500" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                    {/* Sidebar Footer */}
                    <div className="p-4 border-t border-gray-200 bg-white">
                        <button
                            onClick={() => setShowClearConfirm(true)}
                            disabled={messages.length === 0}
                            className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Trash2 className="h-4 w-4" />
                            Xóa lịch sử chat
                        </button>
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col">
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-white">
                        <div className="max-w-4xl mx-auto space-y-6 h-full">
                            {(isLoadingHistory || isLoadingSession) ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                    <span className="ml-3 text-gray-600">Tải tin nhắn...</span>
                                </div>
                            ) : messages.length === 0 ? (
                                <div
                                    className="flex flex-col items-center justify-center h-full text-center px-6"
                                    style={{ paddingTop: '10vh' }}
                                >
                                    <Bot className="h-32 w-32 text-blue-600 mb-8" />
                                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                                        Xin chào! Tôi là trợ lý AI của bạn.
                                    </h2>
                                    <p className="text-xl text-gray-600 max-w-2xl leading-relaxed">
                                        Tôi có thể giúp bạn với thông tin về lớp học, lịch học, điểm số, bài tập và
                                        nhiều hơn nữa. Hãy bắt đầu bằng cách đặt một câu hỏi!
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {messages.map((message, index) => (
                                        <div
                                            key={index}
                                            className={`flex gap-4 ${
                                                message.role === 'user' ? 'justify-end' : 'justify-start'
                                            }`}
                                        >
                                            {message.role === 'assistant' && (
                                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                                                    <Bot className="h-6 w-6" />
                                                </div>
                                            )}

                                            <div
                                                className={`max-w-[70%] rounded-2xl px-5 py-3 ${
                                                    message.role === 'user'
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                                                }`}
                                            >
                                                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                                    {message.content}
                                                </p>
                                                <p
                                                    className={`mt-2 text-xs ${
                                                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                                                    }`}
                                                >
                                                    {new Date(message.timestamp).toLocaleTimeString('vi-VN', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>

                                            {message.role === 'user' && (
                                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-700 text-white">
                                                    <User className="h-6 w-6" />
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {isLoading && (
                                        <div className="flex gap-4 justify-start">
                                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                                                <Bot className="h-6 w-6" />
                                            </div>
                                            <div className="flex items-center gap-2 rounded-2xl bg-white px-5 py-4 shadow-sm border border-gray-200">
                                                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></div>
                                                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></div>
                                                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="border-t border-gray-200 bg-white p-6 shadow-lg">
                        <div className="max-w-5xl mx-auto">
                            {/* Uploaded Files Display */}
                            {uploadedFiles.length > 0 && (
                                <div className="mb-3 flex flex-wrap gap-2">
                                    {uploadedFiles.map((file, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm border border-blue-200"
                                        >
                                            <Paperclip className="h-3.5 w-3.5" />
                                            <span className="max-w-[200px] truncate">{file.name}</span>
                                            <span className="text-xs text-blue-500">({formatFileSize(file.size)})</span>
                                            <button
                                                onClick={() => handleRemoveFile(index)}
                                                className="hover:text-blue-900 transition-colors"
                                                aria-label="Xóa file"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                    {/* Save Files Button - Admin Only */}
                                    {profile &&
                                        profile.roles.some(r => ['SUPER_ADMIN', 'ACADEMIC_STAFF', 'LECTURER'].includes(r.code)) && (
                                            <button
                                                onClick={handleSaveFiles}
                                                disabled={isUploadingFile}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                            >
                                                {isUploadingFile ? (
                                                    <>
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        Đang lưu...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="h-3.5 w-3.5" />
                                                        Lưu file
                                                    </>
                                                )}
                                            </button>
                                        )}
                                </div>
                            )}

                            <div className="flex gap-3 items-end">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    onChange={handleFileSelect}
                                    accept=".pdf,.doc,.docx,.txt,.md"
                                    multiple
                                    className="hidden"
                                    aria-label="Upload file"
                                />
                                {/* File Upload Button - Admin Only */}
                                {profile &&
                                    profile.roles.some(r => ['SUPER_ADMIN', 'ACADEMIC_STAFF', 'LECTURER'].includes(r.code)) && (
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border-2 border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300 transition-all"
                                            title="Đính kèm file (PDF, DOC, DOCX, TXT, MD)"
                                            aria-label="Đính kèm file"
                                        >
                                            <Paperclip className="h-5 w-5" />
                                        </button>
                                    )}
                                <textarea
                                    ref={inputRef}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder="Nhập câu hỏi của bạn..."
                                    disabled={isLoading}
                                    rows={1}
                                    className="flex-1 resize-none rounded-xl border-2 border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    style={{ minHeight: '48px', maxHeight: '120px' }}
                                    onInput={(e) => {
                                        const target = e.target as HTMLTextAreaElement;
                                        target.style.height = 'auto';
                                        target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                                    }}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={isLoading || !inputValue.trim()}
                                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white transition-all hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md hover:shadow-lg"
                                    aria-label="Gửi tin nhắn"
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <Send className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Delete Session Confirmation Modal */}
                {sessionToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="w-[90%] max-w-md rounded-xl bg-white p-6 shadow-2xl">
                            <div className="mb-4">
                                <h4 className="text-lg font-semibold text-gray-900">
                                    Xóa cuộc trò chuyện?
                                </h4>
                                <p className="mt-2 text-sm text-gray-600">
                                    Cuộc trò chuyện này và tất cả tin nhắn trong đó sẽ bị xóa vĩnh viễn.
                                </p>
                                <p className="mt-1 text-xs text-red-600 font-medium">
                                    Hành động này không thể hoàn tác.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSessionToDelete(null)}
                                    className="flex-1 rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleDeleteSession}
                                    className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    Xóa
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Clear History Confirmation Modal */}
                {showClearConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="w-[90%] max-w-md rounded-xl bg-white p-6 shadow-2xl">
                            <div className="mb-4">
                                <h4 className="text-lg font-semibold text-gray-900">
                                    Bạn có chắc chắn muốn xóa không?
                                </h4>
                                <p className="mt-2 text-sm text-gray-600">
                                    Toàn bộ lịch sử trò chuyện sẽ bị xóa vĩnh viễn.
                                </p>
                                <p className="mt-1 text-xs text-red-600 font-medium">
                                    Hành động này không thể hoàn tác.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowClearConfirm(false)}
                                    className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    Không
                                </button>
                                <button
                                    onClick={handleClearHistory}
                                    className="flex-1 rounded-lg bg-gray-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                >
                                    Xóa
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

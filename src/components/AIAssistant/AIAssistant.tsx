import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Trash2, Loader2, Bot, User, Maximize2, MessageSquare, Paperclip, Upload, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createChatSession, getChatSessionDetails, sendChatMessage, deleteChatSession, type ChatMessageResponse } from '@/shared/api/chat';
import { 
    uploadKnowledgeDocument, 
    getAllKnowledgeDocuments, 
    deleteKnowledgeDocument,
    type KnowledgeDocumentDTO 
} from '@/shared/api/knowledge';
import { useUserProfile } from '@/stores/userProfile';
import { useToast } from '@/shared/hooks/useToast';

// Type adapter for compatibility with existing UI
type AIChatMessage = {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
};

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

interface AIAssistantProps {
    className?: string;
}

export default function AIAssistant({ className = '' }: AIAssistantProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [messages, setMessages] = useState<AIChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [savedFiles, setSavedFiles] = useState<UploadedFile[]>([]);
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    const [showFilesSection, setShowFilesSection] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { me: profile } = useUserProfile();
    const toast = useToast();
    const navigate = useNavigate();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && profile?.userId && !currentSessionId) {
            initializeSession();
        }
    }, [isOpen, profile?.userId]);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    // Listen for custom event from admin header button
    useEffect(() => {
        const handleOpenAIAssistant = () => {
            if (isOpen) {
                // If already open, close it with animation
                handleClose();
            } else {
                // If closed, open it
                setIsOpen(true);
                setIsExiting(false);
            }
        };

        window.addEventListener('openAIAssistant', handleOpenAIAssistant);

        return () => {
            window.removeEventListener('openAIAssistant', handleOpenAIAssistant);
        };
    }, [isOpen]);

    const initializeSession = async () => {
        if (!profile?.userId) return;

        setIsLoadingHistory(true);
        try {
            // Create new session for this chat
            const session = await createChatSession('Trò chuyện với AI');
            setCurrentSessionId(session.sessionId);
            
            // Load session details (should be empty initially)
            const details = await getChatSessionDetails(session.sessionId);
            const formattedMessages: AIChatMessage[] = (details.messages || []).map((msg: ChatMessageResponse) => ({
                role: msg.role || 'assistant',
                content: msg.message,
                timestamp: msg.timestamp,
            }));
            setMessages(formattedMessages);
        } catch (error) {
            console.error('Failed to initialize session:', error);
            toast.error('Lỗi', 'Không thể khởi tạo phiên chat');
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading || !currentSessionId) {
            return;
        }

        const userMessage = inputValue.trim();
        setInputValue('');

        const newUserMessage: AIChatMessage = {
            role: 'user',
            content: userMessage,
            timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, newUserMessage]);

        setIsLoading(true);

        try {
            // Call real backend API
            const response = await sendChatMessage(currentSessionId, userMessage);

            const assistantMessage: AIChatMessage = {
                role: 'assistant',
                content: response.message, // Backend returns 'message'
                timestamp: response.timestamp, // Backend returns 'timestamp'
            };
            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Failed to send message:', error);
            toast.error('Lỗi', 'Không thể gửi tin nhắn');

            const errorMessage: AIChatMessage = {
                role: 'assistant',
                content: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật',
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
            // Delete current session
            await deleteChatSession(currentSessionId);
            
            // Create new session
            const session = await createChatSession('Trò chuyện với AI');
            setCurrentSessionId(session.sessionId);
            setMessages([]);
            setShowClearConfirm(false);
            toast.success('Thành công', 'Đã xóa lịch sử chat');
        } catch (error) {
            console.error('Failed to clear history:', error);
            toast.error('Lỗi', 'Không thể xóa lịch sử chat');
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
            e.target.value = ''; // Reset input
        }
    };

    const handleRemoveFile = (index: number) => {
        setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    /**
     * Load saved files from backend
     */
    const loadSavedFiles = async () => {
        try {
            const documents = await getAllKnowledgeDocuments();
            const files: UploadedFile[] = documents.map(doc => ({
                docId: doc.docId,
                title: doc.title,
                fileName: doc.title,
                fileSize: doc.content?.length || 0,
                docType: doc.docType,
                chunkCount: doc.chunkCount,
                createdAt: doc.createdAt,
                createdByName: doc.createdByName,
            }));
            setSavedFiles(files);
        } catch (error) {
            console.error('Failed to load files:', error);
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

            // Show result
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

    // Load saved files on mount (admin only)
    useEffect(() => {
        if (isOpen && profile && profile.roles.some(r => 
            ['SUPER_ADMIN', 'ACADEMIC_STAFF', 'LECTURER'].includes(r.code)
        )) {
            loadSavedFiles();
        }
    }, [isOpen, profile]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            setIsOpen(false);
            setIsExiting(false);
        }, 300); // Match animation duration
    };

    const handleExpandToFullscreen = () => {
        navigate('/student/ai-chat');
    };

    return (
        <div className={`fixed z-50 ${className}`}>
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
                    aria-label="Mở trợ lý AI"
                >
                    <Bot className="h-6 w-6" />
                    <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
                        <div className="whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-sm text-white shadow-lg">
                            <span className="underline">Trợ lý AI</span>
                            <div className="absolute -bottom-1 right-4 h-2 w-2 rotate-45 bg-gray-900"></div>
                        </div>
                    </div>
                </button>
            )}

            {isOpen && (
                <div
                    className={`flex h-[600px] w-[380px] flex-col rounded-2xl bg-white shadow-2xl border-2 border-gray-300 ${
                        isExiting
                            ? 'animate-out slide-out-to-right duration-300'
                            : 'animate-in slide-in-from-right duration-300'
                    }`}
                >
                    <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-4 text-white">
                        <button
                            onClick={handleExpandToFullscreen}
                            className="flex items-center gap-3 hover:opacity-90 transition-opacity group"
                            aria-label="Mở rộng toàn màn hình"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                                <Bot className="h-6 w-6" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-lg group-hover:underline">Trợ lý AI</h3>
                                <p className="text-xs text-blue-100">Luôn sẵn sàng hỗ trợ bạn</p>
                            </div>
                        </button>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleExpandToFullscreen}
                                className="rounded-lg p-2 transition-colors hover:bg-white/20"
                                title="Mở rộng toàn màn hình"
                                aria-label="Mở rộng toàn màn hình"
                            >
                                <Maximize2 className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setShowClearConfirm(true)}
                                className="rounded-lg p-2 transition-colors hover:bg-white/20 disabled:opacity-50"
                                disabled={messages.length === 0}
                                title="Xóa lịch sử chat"
                                aria-label="Xóa lịch sử chat"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                                onClick={handleClose}
                                className="rounded-lg p-2 transition-colors hover:bg-white/20"
                                aria-label="Đóng"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Files Management Section - Admin Only */}
                    {profile &&
                        profile.roles.some(r => ['SUPER_ADMIN', 'ACADEMIC_STAFF', 'LECTURER'].includes(r.code)) && (
                            <div className="border-b border-gray-200 bg-white">
                                <button
                                    onClick={() => setShowFilesSection(!showFilesSection)}
                                    className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-blue-600" />
                                        Quản lý File ({savedFiles.length})
                                    </span>
                                    <Upload className="h-4 w-4" />
                                </button>

                                {showFilesSection && (
                                    <div className="px-3 py-2 border-t border-gray-200 max-h-32 overflow-y-auto bg-gray-50">
                                        {savedFiles.length === 0 ? (
                                            <p className="text-xs text-gray-400 text-center py-2">Chưa có file nào</p>
                                        ) : (
                                            <div className="space-y-1">
                                                {savedFiles.map((file) => (
                                                    <div
                                                        key={file.docId}
                                                        className="flex items-center gap-2 p-2 rounded bg-white hover:bg-gray-50 group border border-gray-200"
                                                    >
                                                        <FileText className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
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
                                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-opacity"
                                                        >
                                                            <X className="h-3 w-3 text-red-500" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {isLoadingHistory ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center px-4">
                                <Bot className="h-16 w-16 text-blue-600 mb-4" />
                                <h4 className="text-lg font-semibold text-gray-900 mb-2">Xin chào!</h4>
                                <p className="text-sm text-gray-600">Tôi có thể giúp gì cho bạn?</p>
                            </div>
                        ) : (
                            <>
                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {message.role === 'assistant' && (
                                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                                                <Bot className="h-5 w-5" />
                                            </div>
                                        )}
                                        <div
                                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                                                message.role === 'user'
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                                            }`}
                                        >
                                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                            <p
                                                className={`mt-1 text-xs ${
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
                                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-700 text-white">
                                                <User className="h-5 w-5" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex gap-3 justify-start">
                                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                                            <Bot className="h-5 w-5" />
                                        </div>
                                        <div className="flex items-center gap-1 rounded-2xl bg-white px-4 py-3 shadow-sm border border-gray-200">
                                            <div
                                                className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                                                style={{ animationDelay: '0ms' }}
                                            ></div>
                                            <div
                                                className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                                                style={{ animationDelay: '150ms' }}
                                            ></div>
                                            <div
                                                className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                                                style={{ animationDelay: '300ms' }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    <div className="border-t border-gray-200 p-4 bg-white rounded-b-2xl">
                        {/* Uploaded Files Display */}
                        {uploadedFiles.length > 0 && (
                            <div className="mb-3 space-y-2">
                                <div className="flex flex-wrap gap-2">
                                    {uploadedFiles.map((file, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm border border-blue-200"
                                        >
                                            <Paperclip className="h-3.5 w-3.5" />
                                            <span className="max-w-[150px] truncate">{file.name}</span>
                                            <button
                                                onClick={() => handleRemoveFile(index)}
                                                className="hover:text-blue-900 transition-colors"
                                                aria-label="Xóa file"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {/* Save Files Button - Admin Only */}
                                {profile &&
                                    profile.roles.some(r => ['SUPER_ADMIN', 'ACADEMIC_STAFF', 'LECTURER'].includes(r.code)) && (
                                        <button
                                            onClick={handleSaveFiles}
                                            disabled={isUploadingFile}
                                            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        >
                                            {isUploadingFile ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Đang lưu file...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="h-4 w-4" />
                                                    Lưu {uploadedFiles.length} file vào hệ thống
                                                </>
                                            )}
                                        </button>
                                    )}
                            </div>
                        )}

                        <div className="flex gap-2 items-end">
                            <input
                                ref={fileInputRef}
                                type="file"
                                onChange={handleFileSelect}
                                accept=".pdf,.doc,.docx,.txt,.md"
                                multiple
                                className="hidden"
                                aria-label="Upload file"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                                title="Đính kèm file (PDF, DOC, DOCX, TXT, MD)"
                                aria-label="Đính kèm file"
                            >
                                <Paperclip className="h-5 w-5" />
                            </button>
                            <textarea
                                ref={inputRef as any}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Nhập câu hỏi..."
                                disabled={isLoading}
                                rows={1}
                                className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none max-h-32 overflow-y-auto"
                                style={{
                                    minHeight: '40px',
                                    height: 'auto',
                                }}
                                onInput={(e) => {
                                    const target = e.target as HTMLTextAreaElement;
                                    target.style.height = 'auto';
                                    target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                                }}
                                aria-label="Nhập tin nhắn"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={isLoading || !inputValue.trim()}
                                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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

                    {showClearConfirm && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl">
                            <div className="w-[90%] max-w-sm rounded-xl bg-white p-6 shadow-2xl">
                                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                    Bạn có chắc chắn muốn xóa không?
                                </h4>
                                <p className="text-sm text-gray-600 mb-1">
                                    Toàn bộ lịch sử trò chuyện sẽ bị xóa vĩnh viễn.
                                </p>
                                <p className="text-xs text-red-600 font-medium mb-4">
                                    Hành động này không thể hoàn tác.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowClearConfirm(false)}
                                        className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                                    >
                                        Không
                                    </button>
                                    <button
                                        onClick={handleClearHistory}
                                        className="flex-1 rounded-lg bg-gray-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-600 transition-colors"
                                    >
                                        Xóa
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

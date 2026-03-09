import React, { useState, useRef } from 'react';
import { Upload, Image, Trash2, Eye, X } from 'lucide-react';

interface BackgroundImageManagerProps {
    currentImage: string | null;
    onImageChange: (imageUrl: string | null) => void;
}

const BackgroundImageManager: React.FC<BackgroundImageManagerProps> = ({
    currentImage,
    onImageChange
}) => {
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Vui lòng chọn file ảnh hợp lệ');
                return;
            }

            // Validate file size (max 20MB)
            if (file.size > 20 * 1024 * 1024) {
                alert('Kích thước file không được vượt quá 20MB');
                return;
            }

            setIsUploading(true);
            
            // Convert to base64 for preview and storage
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setPreviewImage(result);
                onImageChange(result);
                setIsUploading(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setPreviewImage(null);
        onImageChange(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const displayImage = previewImage || currentImage;

    return (
        <div className="space-y-4">
            <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Ảnh nền trang chủ</h4>
                <p className="text-xs text-gray-500 mb-4">
                    Tải lên ảnh nền tùy chỉnh cho trang chủ. Hỗ trợ định dạng JPG, PNG, GIF (tối đa 20MB)
                </p>
            </div>

            {/* Upload Area */}
            <div className="space-y-4">
                {/* Upload Button */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleUploadClick}
                        disabled={isUploading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isUploading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Đang tải lên...
                            </>
                        ) : (
                            <>
                                <Upload size={16} />
                                Chọn ảnh
                            </>
                        )}
                    </button>

                    {displayImage && (
                        <button
                            onClick={handleRemoveImage}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                        >
                            <Trash2 size={16} />
                            Xóa ảnh
                        </button>
                    )}
                </div>

                {/* Hidden File Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {/* Image Preview */}
                {displayImage && (
                    <div className="space-y-3">
                        <div className="relative">
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <img
                                    src={displayImage}
                                    alt="Background preview"
                                    className="w-full h-48 object-cover"
                                />
                            </div>
                            <div className="absolute top-2 right-2">
                                <button
                                    onClick={() => window.open(displayImage, '_blank')}
                                    className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors"
                                    title="Xem ảnh gốc"
                                >
                                    <Eye size={16} />
                                </button>
                            </div>
                        </div>
                        
                        <div className="text-xs text-gray-500 text-center">
                            Xem trước ảnh nền sẽ hiển thị trên trang chủ
                        </div>
                    </div>
                )}

                {/* No Image State */}
                {!displayImage && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <Image size={48} className="mx-auto text-gray-400 mb-3" />
                        <p className="text-sm text-gray-500 mb-2">Chưa có ảnh nền</p>
                        <p className="text-xs text-gray-400">
                            Nhấn "Chọn ảnh" để tải lên ảnh nền cho trang chủ
                        </p>
                    </div>
                )}
            </div>

            {/* Image Info */}
            {displayImage && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Image size={16} />
                        <span>Ảnh nền đã được tải lên</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Ảnh sẽ được áp dụng làm nền cho trang chủ sau khi lưu cài đặt
                    </p>
                </div>
            )}
        </div>
    );
};

export default BackgroundImageManager;

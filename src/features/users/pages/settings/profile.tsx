import React, { useState } from 'react';
import { User, Mail, Phone, User2, Upload, Image as ImageIcon } from 'lucide-react';
import { useUserProfile } from '../../../../stores/userProfile';
import { roleDisplay } from '../../../../utils/roleLabel';

interface ProfileData {
    fullName: string;
    email: string;
    phone: string;
    bio: string;
    avatar?: string;
}

interface ProfileProps {
    formData: ProfileData;
    onInputChange: (field: string, value: string) => void;
    onSave: () => void;
    isSaving?: boolean;
}

const Profile: React.FC<ProfileProps> = ({ formData, onInputChange, onSave, isSaving = false }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(formData.avatar || null);
    const [avatarError, setAvatarError] = useState<string>("");

    // Load avatar from localStorage on mount
    React.useEffect(() => {
        if (formData.avatar) {
            setPreviewUrl(formData.avatar);
        }
    }, [formData.avatar]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (max 20MB)
        if (file.size > 20 * 1024 * 1024) {
            setAvatarError("Kích thước file không được vượt quá 20MB");
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setAvatarError("Chỉ được chọn file ảnh");
            return;
        }

        setAvatarError("");
        setSelectedFile(file);

        // Convert file to base64 and save to localStorage
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target?.result as string;
            setPreviewUrl(base64);
            onInputChange('avatar', base64);
        };
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setAvatarError("");
        onInputChange('avatar', '');
    };
    const { me, loading } = useUserProfile();
    const mainRole = me?.roles?.[0];

    return (
        <div className="space-y-4">
            {/* Personal Information */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Thông tin cá nhân</h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Cập nhật thông tin hồ sơ và chi tiết liên hệ của bạn
                    </p>
                </div>

                {/* User Info Card */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-4">
                        {formData.avatar ? (
                            <img
                                src={formData.avatar}
                                alt={formData.fullName}
                                className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-md"
                            />
                        ) : (
                            <div className="h-12 w-12 rounded-full bg-gray-900 text-white grid place-items-center text-lg font-bold shadow-md">
                                N
                            </div>
                        )}
                        <div className="flex-1">
                            <h4 className="text-lg font-bold text-gray-900 mb-1">{formData.fullName}</h4>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                    {loading ? 'Đang tải...' : (mainRole ? roleDisplay(mainRole) : '—')}
                                </span>
                            </div>
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                                <Mail size={12} className="text-gray-400" />
                                {formData.email}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Avatar Upload Section */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-900 mb-3">
                        Ảnh đại diện
                    </label>
                    <div className="flex items-center gap-4">
                        {/* Avatar Preview */}
                        <div className="relative">
                            {previewUrl || formData.avatar ? (
                                <div className="relative">
                                    <img
                                        src={previewUrl || formData.avatar}
                                        alt="Avatar preview"
                                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                                    />
                                    <button
                                        onClick={removeImage}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                                    >
                                        ×
                                    </button>
                                </div>
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                                    <ImageIcon size={24} className="text-gray-400" />
                                </div>
                            )}
                        </div>

                        {/* Upload Button */}
                        <div className="flex-1">
                            <input
                                type="file"
                                id="avatar-upload"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <label
                                htmlFor="avatar-upload"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
                            >
                                <Upload size={16} />
                                Chọn ảnh từ máy
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                                Tối đa 20MB. Định dạng: JPG, PNG, GIF
                            </p>
                            {avatarError && (
                                <p className="text-xs text-red-600 mt-1">{avatarError}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Họ và tên
                            </label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => onInputChange('fullName', e.target.value)}
                                className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="Nhập họ và tên"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => onInputChange('email', e.target.value)}
                                className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="Nhập email"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Số điện thoại
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => onInputChange('phone', e.target.value)}
                                className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="Nhập số điện thoại"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Giới thiệu bản thân
                        </label>
                        <textarea
                            value={formData.bio}
                            onChange={(e) => onInputChange('bio', e.target.value)}
                            className="w-full h-20 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                            placeholder="Viết một vài dòng giới thiệu về bản thân..."
                        />
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end">
                <button
                    onClick={onSave}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isSaving ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Đang lưu...
                        </>
                    ) : (
                        <>
                            <User size={16} />
                            Lưu thay đổi
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default Profile;


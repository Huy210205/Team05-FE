import React, { useState, useEffect } from 'react';
import { X, Edit, Mail, Phone, MapPin, Upload, Image as ImageIcon } from 'lucide-react';
import type { StudentUI } from '@/shared/types/student-ui';

interface StudentEditProps {
    student: StudentUI;
    onClose?: () => void;
    onSave?: (updatedStudent: StudentUI) => void;
}

const StudentEdit: React.FC<StudentEditProps> = ({ student, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: student.name,
        email: student.email,
        phone: student.phone,
        address: student.address || '',
        dateOfBirth: student.dob || '',
        avatar: student.avatar || '',
    });

    // Load avatar from localStorage on mount
    useEffect(() => {
        const savedAvatar = localStorage.getItem(`student_avatar_${student.id}`);
        if (savedAvatar) {
            setPreviewUrl(savedAvatar);
        }
    }, [student.id]);

    const [previewUrl, setPreviewUrl] = useState<string | null>(student.avatar || null);

    const [errors, setErrors] = useState<{
        name?: string;
        email?: string;
        phone?: string;
        address?: string;
        dateOfBirth?: string;
        avatar?: string;
    }>({});

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        // Clear error when user starts typing
        if (errors[field as keyof typeof errors]) {
            setErrors((prev) => ({
                ...prev,
                [field]: undefined,
            }));
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file size (20MB = 20 * 1024 * 1024 bytes)
            const maxSize = 20 * 1024 * 1024;
            if (file.size > maxSize) {
                setErrors((prev) => ({
                    ...prev,
                    avatar: 'Kích thước file không được vượt quá 20MB',
                }));
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                setErrors((prev) => ({
                    ...prev,
                    avatar: 'Chỉ được chọn file ảnh',
                }));
                return;
            }

            // Convert file to base64 and save to localStorage
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target?.result as string;
                setPreviewUrl(base64);
                // Save to localStorage with student ID
                localStorage.setItem(`student_avatar_${student.id}`, base64);
            };
            reader.readAsDataURL(file);

            // Clear error
            setErrors((prev) => ({
                ...prev,
                avatar: undefined,
            }));
        }
    };

    const removeImage = () => {
        setPreviewUrl(null);
        // Remove from localStorage
        localStorage.removeItem(`student_avatar_${student.id}`);
        setFormData((prev) => ({
            ...prev,
            avatar: '',
        }));
    };

    const validateForm = () => {
        const newErrors: typeof errors = {};

        if (!formData.name || formData.name.trim().length < 2) {
            newErrors.name = 'Họ và tên phải có ít nhất 2 ký tự';
        }

        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }

        if (!formData.phone || !/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Số điện thoại phải có 10-11 chữ số';
        }

        // Date validation: type="date" returns YYYY-MM-DD format or empty string
        // Backend expects YYYY-MM-DD or null, so validation is simpler
        // Ngày sinh và địa chỉ không bắt buộc (đồng bộ với form tạo)
        if (formData.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(formData.dateOfBirth)) {
            newErrors.dateOfBirth = 'Ngày sinh không hợp lệ';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validateForm()) {
            const updatedStudent: StudentUI = {
                ...student,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                dob: formData.dateOfBirth,
                avatar: previewUrl || student.avatar,
            };

            onSave?.(updatedStudent);
            onClose?.();
        }
    };

    return (
        <div className="bg-white rounded-lg w-full">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 grid place-items-center">
                        <Edit size={16} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Chỉnh sửa Hồ sơ Học viên</h2>
                        <p className="text-sm text-gray-500">Cập nhật thông tin học viên {student.name}.</p>
                    </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100" onClick={onClose}>
                    <X size={20} />
                </button>
            </div>

            {/* Form Content */}
            <div className="px-4 py-4">
                {/* Avatar Upload Section */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-900 mb-3">Ảnh đại diện</label>
                    <div className="flex items-center gap-4">
                        {/* Avatar Preview */}
                        <div className="relative">
                            {previewUrl ? (
                                <div className="relative">
                                    <img
                                        src={previewUrl}
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
                            <p className="text-xs text-gray-500 mt-1">Tối đa 20MB. Định dạng: JPG, PNG, GIF</p>
                            {errors.avatar && <p className="text-xs text-red-600 mt-1">{errors.avatar}</p>}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                        {/* Họ và tên */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">Họ và tên</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className={`w-full h-9 px-3 rounded-md border text-sm outline-none focus:ring-2 focus:ring-blue-200 ${
                                    errors.name ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="Nhập họ và tên"
                            />
                            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                        </div>

                        {/* Số điện thoại */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">Số điện thoại</label>
                            <div className="relative">
                                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    className={`w-full h-9 pl-10 pr-3 rounded-md border text-sm outline-none focus:ring-2 focus:ring-blue-200 ${
                                        errors.phone ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Nhập số điện thoại"
                                />
                            </div>
                            {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
                        </div>

                        {/* Địa chỉ */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">Địa chỉ</label>
                            <div className="relative">
                                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    className={`w-full h-9 pl-10 pr-3 rounded-md border text-sm outline-none focus:ring-2 focus:ring-blue-200 ${
                                        errors.address ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Nhập địa chỉ"
                                />
                            </div>
                            {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">Email</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    className={`w-full h-9 pl-10 pr-3 rounded-md border text-sm outline-none focus:ring-2 focus:ring-blue-200 ${
                                        errors.email ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Nhập email"
                                />
                            </div>
                            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                        </div>

                        {/* Ngày sinh */}
                        <div>
                            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-900 mb-2">
                                Ngày sinh
                            </label>
                            <input
                                type="date"
                                id="dateOfBirth"
                                value={formData.dateOfBirth || ''}
                                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                className={`w-full h-9 px-3 rounded-md border text-sm outline-none focus:ring-2 focus:ring-blue-200 ${
                                    errors.dateOfBirth ? 'border-red-300' : 'border-gray-300'
                                }`}
                            />
                            {errors.dateOfBirth && <p className="text-xs text-red-600 mt-1">{errors.dateOfBirth}</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 border-t flex justify-end gap-2">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                    Hủy
                </button>
                <button
                    onClick={handleSave}
                    className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-black"
                >
                    Cập nhật
                </button>
            </div>
        </div>
    );
};

export default StudentEdit;

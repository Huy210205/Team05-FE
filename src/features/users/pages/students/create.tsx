// src/features/users/pages/students/create.tsx
import React, { useState } from 'react';
import { X, Calendar, ChevronDown } from 'lucide-react';
import { createStudent } from '@/shared/api/students';
import type { CreateStudentDto } from '@/shared/types/student';
import { useToast } from '@/shared/hooks/useToast';

interface CreateStudentModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const genders = ['Nam', 'Nữ', 'Khác'] as const;

export default function CreateStudentModal({ open, onClose, onSuccess }: CreateStudentModalProps) {
    const toast = useToast();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        dob: '',
        gender: 'Nam',
        nationalIdNo: '',
        addressLine: '',
        province: '',
        district: '',
        ward: '',
        note: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Họ và tên không được để trống';
        } else if (formData.fullName.trim().length < 2) {
            newErrors.fullName = 'Họ và tên phải có ít nhất 2 ký tự';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email không được để trống';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Số điện thoại không được để trống';
        } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Số điện thoại phải có 10-11 chữ số';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Map gender sang enum UPPERCASE cho khớp BE
    const mapGender = (g: string) => 
        g === 'Nam' ? 'MALE' : g === 'Nữ' ? 'FEMALE' : 'OTHER';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setSubmitting(true);
        try {
            const payload: CreateStudentDto = {
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                dob: formData.dob || null,
                gender: formData.gender ? mapGender(formData.gender) : null,
                nationalIdNo: formData.nationalIdNo || null,
                addressLine: formData.addressLine || null,
                province: formData.province || null,
                district: formData.district || null,
                ward: formData.ward || null,
                note: formData.note || null
            };

            await createStudent(payload);
            
            toast.success('Tạo thành công!', `Học viên ${formData.fullName} đã được thêm vào hệ thống`);
            
            // Reset form
            setFormData({
                fullName: '',
                email: '',
                phone: '',
                dob: '',
                gender: 'Nam',
                nationalIdNo: '',
                addressLine: '',
                province: '',
                district: '',
                ward: '',
                note: ''
            });
            setErrors({});
            
            onSuccess();
            onClose();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi tạo học viên';
            
            // Kiểm tra nếu lỗi liên quan đến email trùng (có thể là 400 hoặc các status khác)
            const isEmailConflict = errorMessage.toLowerCase().includes('email') && 
                (errorMessage.includes('đã được sử dụng') || errorMessage.includes('đã tồn tại'));
            
            if (error.response?.status === 400 || isEmailConflict) {
                if (isEmailConflict) {
                    // Hiển thị message từ backend (đã có email cụ thể)
                    setErrors(prev => ({ ...prev, email: errorMessage }));
                    toast.error('Email đã tồn tại', errorMessage);
                } else {
                    // Các lỗi validation khác
                    setErrors({});
                    toast.error('Dữ liệu không hợp lệ', errorMessage);
                }
            } else {
                toast.error('Tạo thất bại', errorMessage);
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black/50" onClick={onClose} />
            <div className="fixed inset-0 flex items-start justify-center pt-12 px-4">
                <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl relative flex flex-col max-h-[85vh] overflow-auto">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Tạo Học viên mới</h2>
                            <p className="text-sm text-[#717182] mt-1">
                                Nhập thông tin để tạo hồ sơ học viên mới.
                            </p>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600" onClick={onClose}>
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 overflow-y-auto">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Basic Information */}
                            <fieldset>
                                <legend className="text-sm font-medium text-[#717182] mb-4">
                                    Thông tin cơ bản
                                </legend>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                                    <div>
                                        <label htmlFor="fullName" className="block text-sm font-medium mb-1">
                                            Họ và tên *
                                        </label>
                                        <input
                                            type="text"
                                            id="fullName"
                                            value={formData.fullName}
                                            onChange={(e) => handleInputChange('fullName', e.target.value)}
                                            className={`w-full bg-[#f3f3f5] border-transparent rounded-lg p-2.5 text-sm placeholder:text-[#717182] focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                                                errors.fullName ? 'border-2 border-red-500' : ''
                                            }`}
                                            placeholder="Họ và tên"
                                        />
                                        {errors.fullName && (
                                            <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium mb-1">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            className={`w-full bg-[#f3f3f5] border-transparent rounded-lg p-2.5 text-sm placeholder:text-[#717182] focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                                                errors.email ? 'border-2 border-red-500' : ''
                                            }`}
                                            placeholder="Email"
                                        />
                                        {errors.email && (
                                            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-medium mb-1">
                                            Số điện thoại *
                                        </label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            value={formData.phone}
                                            onChange={(e) => handleInputChange('phone', e.target.value)}
                                            className={`w-full bg-[#f3f3f5] border-transparent rounded-lg p-2.5 text-sm placeholder:text-[#717182] focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                                                errors.phone ? 'border-2 border-red-500' : ''
                                            }`}
                                            placeholder="Số điện thoại"
                                        />
                                        {errors.phone && (
                                            <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <label htmlFor="dob" className="block text-sm font-medium mb-1">
                                            Ngày sinh
                                        </label>
                                        <input
                                            type="date"
                                            id="dob"
                                            value={formData.dob}
                                            onChange={(e) => handleInputChange('dob', e.target.value)}
                                            className="w-full bg-[#f3f3f5] border-transparent rounded-lg p-2.5 text-sm placeholder:text-[#717182] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        />
                                        <Calendar className="w-3.5 h-3.5 absolute right-3 top-9 text-gray-400 pointer-events-none" />
                                    </div>
                                    <div className="relative">
                                        <label htmlFor="gender" className="block text-sm font-medium mb-1">
                                            Giới tính
                                        </label>
                                        <select
                                            id="gender"
                                            value={formData.gender}
                                            onChange={(e) => handleInputChange('gender', e.target.value)}
                                            className="appearance-none w-full bg-[#f3f3f5] border-transparent rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        >
                                            {genders.map((gender) => (
                                                <option key={gender} value={gender}>
                                                    {gender}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="w-4 h-4 absolute right-3 top-9 opacity-50 pointer-events-none" />
                                    </div>
                                    <div>
                                        <label htmlFor="nationalIdNo" className="block text-sm font-medium mb-1">
                                            Số CMND/CCCD
                                        </label>
                                        <input
                                            type="text"
                                            id="nationalIdNo"
                                            value={formData.nationalIdNo}
                                            onChange={(e) => handleInputChange('nationalIdNo', e.target.value)}
                                            className="w-full bg-[#f3f3f5] border-transparent rounded-lg p-2.5 text-sm placeholder:text-[#717182] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            placeholder="Số CMND/CCCD"
                                        />
                                    </div>
                                </div>
                            </fieldset>

                            {/* Address */}
                            <fieldset>
                                <legend className="text-sm font-medium text-[#717182] mb-4">
                                    Địa chỉ & thông tin khác
                                </legend>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="addressLine" className="block text-sm font-medium mb-1">
                                            Địa chỉ
                                        </label>
                                        <input
                                            type="text"
                                            id="addressLine"
                                            value={formData.addressLine}
                                            onChange={(e) => handleInputChange('addressLine', e.target.value)}
                                            className="w-full bg-[#f3f3f5] border-transparent rounded-lg p-2.5 text-sm placeholder:text-[#717182] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            placeholder="Số nhà, tên đường..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                                        <div>
                                            <label htmlFor="province" className="block text-sm font-medium mb-1">
                                                Tỉnh/Thành phố
                                            </label>
                                            <input
                                                type="text"
                                                id="province"
                                                value={formData.province}
                                                onChange={(e) => handleInputChange('province', e.target.value)}
                                                className="w-full bg-[#f3f3f5] border-transparent rounded-lg p-2.5 text-sm placeholder:text-[#717182] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                placeholder="VD: TP. Hồ Chí Minh"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="district" className="block text-sm font-medium mb-1">
                                                Quận/Huyện
                                            </label>
                                            <input
                                                type="text"
                                                id="district"
                                                value={formData.district}
                                                onChange={(e) => handleInputChange('district', e.target.value)}
                                                className="w-full bg-[#f3f3f5] border-transparent rounded-lg p-2.5 text-sm placeholder:text-[#717182] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                placeholder="VD: Quận 1"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="ward" className="block text-sm font-medium mb-1">
                                                Phường/Xã
                                            </label>
                                            <input
                                                type="text"
                                                id="ward"
                                                value={formData.ward}
                                                onChange={(e) => handleInputChange('ward', e.target.value)}
                                                className="w-full bg-[#f3f3f5] border-transparent rounded-lg p-2.5 text-sm placeholder:text-[#717182] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                placeholder="VD: Phường Bến Nghé"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="note" className="block text-sm font-medium mb-1">
                                            Ghi chú
                                        </label>
                                        <textarea
                                            id="note"
                                            value={formData.note}
                                            onChange={(e) => handleInputChange('note', e.target.value)}
                                            rows={3}
                                            className="w-full bg-[#f3f3f5] border-transparent rounded-lg p-2.5 text-sm placeholder:text-[#717182] focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                                            placeholder="Ghi chú về học viên..."
                                        />
                                    </div>
                                </div>
                            </fieldset>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-200 mt-auto flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-6 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="px-6 py-2 text-sm font-medium text-white bg-[#030213] rounded-lg hover:bg-black disabled:opacity-50"
                        >
                            {submitting ? 'Đang tạo...' : 'Tạo Học viên'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

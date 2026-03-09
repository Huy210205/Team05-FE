import React from 'react';
import { BookOpen, X } from 'lucide-react';
import type { Program } from '../../../../shared/api/programs';
import { MAIN_CATEGORIES } from '../../../../shared/constants/categories';
import { getDeliveryModeOptions } from '../../../../shared/constants/deliveryModes';

interface ProgramFormProps {
    open?: boolean;
    editing?: Program | null;
    onSubmit: (formData: any) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
}

const ProgramForm: React.FC<ProgramFormProps> = ({ 
    open = true,
    editing, 
    onSubmit, 
    onCancel, 
    isSubmitting = false 
}) => {
    if (!open) return null;

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget as HTMLFormElement);
                
                // Get and validate form data
                const categoryCode = form.get('categoryCode') as string;
                const deliveryMode = form.get('deliveryMode') as string;
                const durationHoursStr = form.get('durationHours') as string;
                
                // Validation
                if (!categoryCode || categoryCode === '') {
                    alert('Vui lòng chọn danh mục');
                    return;
                }
                
                if (!deliveryMode || deliveryMode === '') {
                    alert('Vui lòng chọn hình thức học');
                    return;
                }
                
                const durationHours = parseInt(durationHoursStr);
                if (isNaN(durationHours) || durationHours <= 0) {
                    alert('Thời gian học (giờ) phải là số dương');
                    return;
                }
                
                const description = form.get('description') as string;
                
                // Build form data, excluding undefined fields
                const formData: any = {
                    code: form.get('code') as string,
                    name: form.get('name') as string,
                    categoryCode: categoryCode,
                    languageCode: form.get('languageCode') as string || 'vi',
                    durationHours: durationHours,
                    deliveryMode: deliveryMode as 'ONLINE' | 'OFFLINE' | 'HYBRID',
                    // Keep existing isActive value when editing, default to true when creating
                    isActive: editing ? editing.isActive : true,
                };
                
                // Only add description if it's not empty
                if (description && description.trim() !== '') {
                    formData.description = description.trim();
                }
                onSubmit(formData);
            }}
        >
            <div className="px-4 py-3 border-b flex items-center justify-between">
                <div className="font-medium">{editing ? 'Chỉnh sửa Chương trình' : 'Tạo Chương trình mới'}</div>
                <button
                    type="button"
                    className="h-8 w-8 rounded hover:bg-gray-100"
                    onClick={onCancel}
                >
                    <X size={16} />
                </button>
            </div>

            <div className="p-4 space-y-6">
                {/* Thông tin cơ bản */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <div className="h-5 w-5 rounded-lg bg-blue-50 text-blue-600 grid place-items-center">
                            <BookOpen size={12} />
                        </div>
                        <h3 className="text-xs font-medium text-gray-900">Thông tin cơ bản</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Mã chương trình *</label>
                            <input
                                name="code"
                                defaultValue={editing?.code}
                                required
                                disabled={!!editing}
                                className={`w-full h-8 rounded-md border px-2 text-xs border-gray-300 ${editing ? 'bg-gray-100' : ''}`}
                                placeholder="CNTT-2024"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Tên chương trình *</label>
                            <input
                                name="name"
                                defaultValue={editing?.name}
                                required
                                className="w-full h-8 rounded-md border px-2 text-xs border-gray-300"
                                placeholder="Công nghệ Thông tin"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Danh mục *</label>
                            <select
                                name="categoryCode"
                                defaultValue={editing?.categoryCode || ''}
                                required
                                className="w-full h-8 rounded-md border px-2 text-xs border-gray-300"
                            >
                                <option value="">-- Chọn danh mục --</option>
                                {MAIN_CATEGORIES.map((category) => (
                                    <option key={category.value} value={category.value}>
                                        {category.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Thời gian (giờ) *</label>
                            <input
                                name="durationHours"
                                defaultValue={editing?.durationHours}
                                required
                                type="number"
                                min="1"
                                className="w-full h-8 rounded-md border px-2 text-xs border-gray-300"
                                placeholder="480"
                            />
                            <div className="text-xs text-gray-500 mt-1">Nhập số giờ (VD: 480)</div>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Hình thức học *</label>
                            <select
                                name="deliveryMode"
                                defaultValue={editing?.deliveryMode || ''}
                                required
                                className="w-full h-8 rounded-md border px-2 text-xs"
                            >
                                <option value="">-- Chọn hình thức học --</option>
                                {getDeliveryModeOptions().map((mode) => (
                                    <option key={mode.value} value={mode.value}>
                                        {mode.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Ngôn ngữ</label>
                            <select
                                name="languageCode"
                                defaultValue={editing?.languageCode ?? 'vi'}
                                className="w-full h-8 rounded-md border px-2 text-xs"
                            >
                                <option value="vi">Tiếng Việt</option>
                                <option value="en">English</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Mô tả</label>
                        <textarea
                            name="description"
                            defaultValue={editing?.description || ''}
                            className="w-full h-16 rounded-md border px-2 py-1 text-xs resize-none"
                            placeholder="Mô tả chi tiết về chương trình đào tạo..."
                        />
                    </div>
                </div>
            </div>

            <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
                <button 
                    type="button" 
                    className="h-9 px-3 rounded-md border bg-white hover:bg-gray-50" 
                    onClick={onCancel}
                >
                    Hủy
                </button>
                <button
                    type="submit"
                    className="h-9 px-3 rounded-md bg-gray-900 text-white hover:bg-black disabled:opacity-50 flex items-center gap-2"
                    disabled={isSubmitting}
                >
                    {isSubmitting && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {isSubmitting
                        ? (editing ? 'Đang cập nhật...' : 'Đang tạo...')
                        : (editing ? 'Lưu thay đổi' : 'Tạo Chương trình')
                    }
                </button>
            </div>
        </form>
    );
};

export default ProgramForm;


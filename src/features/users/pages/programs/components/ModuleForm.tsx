import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { Program as ProgramDto } from '@/shared/api/programs';
import type { ModuleResponse } from '@/shared/types/module';

type Module = ModuleResponse;

interface ModuleFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<Module>) => void;
    onCancel: () => void;
    editing?: Module | null;
    isSubmitting?: boolean;
    programs: ProgramDto[];
}

const ModuleForm: React.FC<ModuleFormProps> = ({
    open,
    onClose,
    onSubmit,
    onCancel,
    editing,
    isSubmitting = false,
    programs,
}) => {
    const [formData, setFormData] = useState<Partial<Module>>({
        programId: undefined as unknown as number,
        name: '',
        code: '',
        credits: 0,
        durationHours: 0,
        level: 'Beginner',
        sequenceOrder: 1,
        isMandatory: true,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (editing) {
            setFormData({
                programId: editing.programId,
                name: editing.name,
                code: editing.code,
                credits: editing.credits,
                durationHours: editing.durationHours,
                level: editing.level,
                sequenceOrder: editing.sequenceOrder,
                isMandatory: editing.isMandatory ?? true,
            });
        } else {
            setFormData({
                programId: undefined as unknown as number,
                name: '',
                code: '',
                credits: 0,
                durationHours: 0,
                level: 'Beginner',
                sequenceOrder: 1,
                isMandatory: true,
            });
        }
        setErrors({});
    }, [editing, open]);

    if (!open) return null;

    const handleChange = (field: keyof Module, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name?.trim()) {
            newErrors.name = 'Tên module là bắt buộc';
        }
        if (!formData.code?.trim()) {
            newErrors.code = 'Mã module là bắt buộc';
        }
        // Chỉ validate programId và sequenceOrder khi tạo mới
        if (!editing) {
            if (!formData.programId) {
                newErrors.programId = 'Vui lòng chọn chương trình';
            }
            if (!formData.sequenceOrder || formData.sequenceOrder <= 0) {
                newErrors.sequenceOrder = 'Thứ tự phải là số dương';
            }
        }
        if (!formData.credits || formData.credits <= 0) {
            newErrors.credits = 'Số tín chỉ phải lớn hơn 0';
        }
        if (!formData.durationHours || formData.durationHours <= 0) {
            newErrors.durationHours = 'Thời lượng (giờ) phải lớn hơn 0';
        } else if (formData.durationHours > 20) {
            newErrors.durationHours = 'Mỗi module không được vượt quá 20 giờ';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
        }
    };

    return (
        <div>
            <div className="px-4 py-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div>
                        <div className="font-medium">
                            {editing ? 'Chỉnh sửa Module / Học phần' : 'Tạo Module / Học phần mới'}
                        </div>
                        <div className="text-xs text-gray-500">
                            {editing ? 'Cập nhật thông tin module' : 'Nhập thông tin để tạo module học tập mới'}
                        </div>
                    </div>
                </div>
                <button
                    className="h-8 w-8 rounded hover:bg-gray-100 flex items-center justify-center"
                    onClick={onClose}
                    disabled={isSubmitting}
                >
                    <X size={16} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* Chương trình đào tạo - READ ONLY khi edit */}
                {editing && (
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-600">
                            Chương trình đào tạo
                        </label>
                        <input
                            type="text"
                            value={programs.find((p) => p.programId === formData.programId)?.name || ''}
                            className="w-full px-3 py-2 border rounded-md text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
                            disabled
                            readOnly
                        />
                    </div>
                )}

                {/* Chương trình đào tạo - EDITABLE khi tạo mới */}
                {!editing && (
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Chương trình đào tạo <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.programId ?? ''}
                            onChange={(e) => handleChange('programId', Number(e.target.value))}
                            className={`w-full h-10 px-3 border rounded-md text-sm ${errors.programId ? 'border-red-500' : ''}`}
                            disabled={isSubmitting}
                        >
                            <option value="" disabled>
                                Chọn chương trình
                            </option>
                            {programs.map((p) => (
                                <option key={p.programId} value={p.programId}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                        {errors.programId && <p className="text-xs text-red-500 mt-1">{errors.programId}</p>}
                    </div>
                )}

                {/* Tên Module */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Tên Module <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-200 outline-none ${
                            errors.name ? 'border-red-500' : ''
                        }`}
                        placeholder="Ví dụ: Lập trình Java Cơ bản"
                        disabled={isSubmitting}
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                {/* Mã Module */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Mã Module <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.code || ''}
                        onChange={(e) => handleChange('code', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-200 outline-none ${
                            errors.code ? 'border-red-500' : ''
                        }`}
                        placeholder="Ví dụ: JAVA101"
                        disabled={isSubmitting || !!editing}
                    />
                    {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
                    {editing && <p className="text-xs text-gray-500 mt-1">Mã module không thể thay đổi</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Số tín chỉ */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Số tín chỉ <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={formData.credits || 0}
                            onChange={(e) => handleChange('credits', parseInt(e.target.value) || 0)}
                            className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-200 outline-none ${
                                errors.credits ? 'border-red-500' : ''
                            }`}
                            placeholder="0"
                            min="0"
                            disabled={isSubmitting}
                        />
                        {errors.credits && <p className="text-xs text-red-500 mt-1">{errors.credits}</p>}
                    </div>

                    {/* Thời lượng (giờ) */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Thời lượng (giờ) <span className="text-red-500">*</span>{' '}
                            <span className="text-gray-400 text-xs">(tối đa 20h)</span>
                        </label>
                        <input
                            type="number"
                            value={formData.durationHours || 0}
                            onChange={(e) => handleChange('durationHours', parseInt(e.target.value) || 0)}
                            className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-200 outline-none ${
                                errors.durationHours ? 'border-red-500' : ''
                            }`}
                            placeholder="0"
                            min={1}
                            max={20}
                            disabled={isSubmitting}
                        />
                        {errors.durationHours && <p className="text-xs text-red-500 mt-1">{errors.durationHours}</p>}
                    </div>
                </div>

                {/* Cấp độ & Thứ tự */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Cấp độ</label>
                        <select
                            value={formData.level || 'Beginner'}
                            onChange={(e) => handleChange('level', e.target.value as Module['level'])}
                            className="w-full h-10 px-3 border rounded-md text-sm"
                            disabled={isSubmitting}
                        >
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                        </select>
                    </div>

                    {/* Thứ tự - READ ONLY khi edit, EDITABLE khi tạo mới */}
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-600">
                            Thứ tự {!editing && <span className="text-red-500">*</span>}
                        </label>
                        <input
                            type="number"
                            value={formData.sequenceOrder || 1}
                            onChange={(e) => handleChange('sequenceOrder', parseInt(e.target.value) || 1)}
                            className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-200 outline-none ${
                                editing ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : ''
                            } ${errors.sequenceOrder ? 'border-red-500' : ''}`}
                            placeholder="1"
                            min={1}
                            disabled={isSubmitting || !!editing}
                            readOnly={!!editing}
                        />
                        {errors.sequenceOrder && <p className="text-xs text-red-500 mt-1">{errors.sequenceOrder}</p>}
                    </div>
                </div>

                {/* Môn học bắt buộc */}
                <div className="flex items-center gap-3 p-3 border rounded-md bg-gray-50">
                    <input
                        type="checkbox"
                        id="isMandatory"
                        checked={formData.isMandatory ?? true}
                        onChange={(e) => handleChange('isMandatory', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                        disabled={isSubmitting}
                    />
                    <label htmlFor="isMandatory" className="text-sm font-medium cursor-pointer select-none">
                        Môn học bắt buộc
                    </label>
                    <span className="text-xs text-gray-500 ml-auto">
                        {formData.isMandatory ? '(Bắt buộc)' : '(Tự chọn)'}
                    </span>
                </div>

                {/* Preview: Học kỳ - Hiển thị dựa trên Thứ tự */}
                <div className="p-3 border rounded-md bg-gray-50 text-sm">
                    <span className="font-medium text-gray-900">Học kỳ:</span>{' '}
                    <span className="text-gray-700">
                        Học kỳ {Math.floor(((formData.sequenceOrder || 1) - 1) / 6) + 1}
                    </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        disabled={isSubmitting}
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                {editing ? 'Cập nhật' : 'Tạo mới'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ModuleForm;

import React from 'react';
import { BookOpen, Clock, X, FolderOpen } from 'lucide-react';
import type { Program } from '../../../../shared/api/programs';
import type { ModuleResponse } from '../../../../shared/types/module';
import { getCategoryLabel } from '../../../../shared/constants/categories';
import { getDeliveryModeLabel } from '../../../../shared/constants/deliveryModes';

type Module = ModuleResponse;

interface ProgramViewProps {
    open?: boolean;
    onClose?: () => void;
    program: Program;
    modules: Module[];
}

const ProgramView: React.FC<ProgramViewProps> = ({ open = true, onClose, program, modules }) => {
    if (!open) return null;
    const programModules = modules
        .filter((m) => m.programId === program.programId)
        .sort((a, b) => a.sequenceOrder - b.sequenceOrder);

    return (
        <div>
            <div className="px-4 py-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 grid place-items-center text-white">
                        <BookOpen size={16} />
                    </div>
                    <div>
                        <div className="font-medium">Chi tiết Chương trình: {program.name}</div>
                        <div className="text-xs text-gray-500">
                            Xem thông tin chi tiết về chương trình đào tạo và danh sách module.
                        </div>
                    </div>
                </div>
                <button
                    className="h-8 w-8 rounded hover:bg-gray-100 flex items-center justify-center"
                    onClick={onClose}
                >
                    <X size={16} />
                </button>
            </div>

            <div className="p-4 space-y-6">
                {/* Program Details */}
                <div>
                    <h3 className="text-sm font-medium mb-3">Thông tin chương trình</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Mã chương trình</label>
                            <div className="text-sm font-medium">{program.code}</div>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Tên chương trình</label>
                            <div className="text-sm font-medium">{program.name}</div>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Thời gian</label>
                            <div className="text-sm">{program.durationHours} giờ</div>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Hình thức học</label>
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                                {getDeliveryModeLabel(program.deliveryMode)}
                            </span>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Danh mục</label>
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                                {getCategoryLabel(program.categoryCode)}
                            </span>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Trạng thái</label>
                            <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                    program.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'
                                }`}
                            >
                                {program.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                            </span>
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="block text-xs text-gray-500 mb-1">Mô tả</label>
                        <div className="text-sm text-gray-700">{program.description || 'Không có mô tả'}</div>
                    </div>
                </div>

                {/* Module List */}
                <div>
                    <h3 className="text-sm font-medium mb-3">Danh sách Module ({programModules.length})</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                        {programModules.map((module) => (
                            <div key={module.moduleId} className="flex items-center gap-3 p-3 border rounded-lg">
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 grid place-items-center text-white flex-shrink-0">
                                    <div className="text-white font-bold text-xs">{module.sequenceOrder}</div>
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium">{module.name}</div>
                                    <div className="text-xs text-gray-500">Mã: {module.code}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">
                                            {module.credits} tín chỉ
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">
                                            <Clock size={10} className="inline mr-1" />
                                            {module.durationHours}h
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs">
                                            HK {module.semester}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                            module.isActive
                                                ? 'bg-green-50 text-green-700'
                                                : 'bg-gray-50 text-gray-700'
                                        }`}
                                    >
                                        {module.isActive ? 'Hoạt động' : 'Tạm dừng'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
                <button className="h-9 px-3 rounded-md border bg-white hover:bg-gray-50" onClick={onClose}>
                    Đóng
                </button>
            </div>
        </div>
    );
};

export default ProgramView;

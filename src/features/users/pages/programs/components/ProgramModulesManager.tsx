import React, { useState, useEffect } from 'react';
import { GripVertical, X, BookOpen, Search, Plus } from 'lucide-react';
import type { ModuleResponse } from '@/shared/types/module';
import type { Program as ProgramType } from '@/shared/api/programs';
import { reorderModule } from '@/shared/api/modules';
import { useToast } from '@/shared/hooks/useToast';

type Module = ModuleResponse;
type Program = ProgramType;

interface ProgramModulesManagerProps {
    open: boolean;
    onClose: () => void;
    program: Program;
    allModules: Module[]; // All available modules
    programModules: Module[]; // Modules currently in program
    onSave: (moduleIds: string[]) => void;
}

const ProgramModulesManager: React.FC<ProgramModulesManagerProps> = ({
    open,
    onClose,
    program,
    allModules,
    programModules: initialProgramModules,
    onSave,
}) => {
    const toast = useToast();
    const [programModules, setProgramModules] = useState<Module[]>(initialProgramModules);
    const [searchQuery, setSearchQuery] = useState('');
    const [draggedItem, setDraggedItem] = useState<Module | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [isReordering, setIsReordering] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    // Update programModules when initialProgramModules changes
    useEffect(() => {
        setProgramModules(initialProgramModules);
    }, [initialProgramModules]);

    if (!open) return null;

    // Sort modules by sequenceOrder to display in correct order
    const sortedProgramModules = [...programModules].sort((a, b) => a.sequenceOrder - b.sequenceOrder);

    // Filter modules that are not in program yet
    const availableModules = allModules.filter((m) => !programModules.find((pm) => pm.moduleId === m.moduleId));

    // Filter by search query
    const filteredAvailableModules = availableModules.filter(
        (m) =>
            m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.code.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    // Calculate summary
    const totalCredits = programModules.reduce((sum, m) => sum + m.credits, 0);
    const totalModules = programModules.length;
    const estimatedMonths = Math.ceil(programModules.length * 1.5); // rough estimate

    // Drag & Drop handlers for reordering
    const handleDragStart = (e: React.DragEvent, module: Module) => {
        setDraggedItem(module);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (!draggedItem || isReordering) return;

        // Sử dụng sortedProgramModules để tính index đúng
        const sortedModules = [...programModules].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
        const currentIndex = sortedModules.findIndex((m) => m.moduleId === draggedItem.moduleId);
        
        if (currentIndex === -1 || currentIndex === dropIndex) {
            setDraggedItem(null);
            setDragOverIndex(null);
            return;
        }

        // Kiểm tra xem module có cùng học kỳ không
        const targetModule = sortedModules[dropIndex];
        if (draggedItem.semester !== targetModule.semester) {
            toast.error('Không thể sắp xếp', 'Không thể đổi module khác học kỳ');
            setDraggedItem(null);
            setDragOverIndex(null);
            return;
        }

        // Gọi API reorder
        try {
            setIsReordering(true);
            setErrorMessage(''); // Xóa error message cũ
            
            // API yêu cầu: programId, currentSequenceOrder, newSequenceOrder
            const programId = draggedItem.programId;
            const currentSequenceOrder = draggedItem.sequenceOrder;
            const newSequenceOrder = sortedModules[dropIndex].sequenceOrder;

            const response = await reorderModule(programId, currentSequenceOrder, {
                newSequenceOrder,
            });

            // Cập nhật lại danh sách modules từ response
            setProgramModules(response.data);
            
            // Hiển thị thông báo thành công
            toast.success('Sắp xếp thành công!', `Module "${draggedItem.name}" đã được di chuyển`);
        } catch (error) {
            toast.error('Lỗi sắp xếp', 'Có lỗi xảy ra khi sắp xếp module. Vui lòng thử lại!');
        } finally {
            setIsReordering(false);
            setDraggedItem(null);
            setDragOverIndex(null);
        }
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setDragOverIndex(null);
    };

    // Add module from available list
    const handleAddModule = (module: Module) => {
        setProgramModules([...programModules, module]);
    };

    // Remove module from program
    const handleRemoveModule = (moduleId: number) => {
        setProgramModules(programModules.filter((m) => m.moduleId !== moduleId));
    };

    return (
        <div className="fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black/30" onClick={onClose} />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-6xl h-[90vh] rounded-lg bg-white shadow-lg border flex flex-col">
                    {/* Header */}
                    <div className="px-6 py-4 border-b flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">{program.name}</h2>
                            <p className="text-sm text-gray-500">Sắp xếp và quản lý modules trong chương trình</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Error Message */}
                    {errorMessage && (
                        <div className="mx-6 mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                            <p className="text-sm text-red-700 font-medium">{errorMessage}</p>
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 overflow-hidden flex">
                        {/* Left: Modules trong chương trình */}
                        <div className="flex-1 border-r flex flex-col">
                            <div className="px-4 py-3 border-b">
                                <h3 className="font-semibold text-sm mb-1">Modules trong chương trình</h3>
                                <p className="text-xs text-gray-500">
                                    Kéo thả để sắp xếp thứ tự • {totalModules} modules • {totalCredits} tín chỉ
                                </p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 relative">
                                {isReordering && (
                                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                                        <div className="text-sm text-gray-600">Đang sắp xếp lại...</div>
                                    </div>
                                )}
                                {programModules.length === 0 ? (
                                    <div className="text-center text-gray-400 py-12">
                                        <BookOpen size={48} className="mx-auto mb-3 opacity-50" />
                                        <p className="text-sm">Chưa có module nào</p>
                                        <p className="text-xs mt-1">Thêm module từ ngân hàng bên phải</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {sortedProgramModules.map((module, index) => (
                                            <div
                                                key={module.moduleId}
                                                draggable={!isReordering}
                                                onDragStart={(e) => handleDragStart(e, module)}
                                                onDragOver={(e) => handleDragOver(e, index)}
                                                onDragLeave={handleDragLeave}
                                                onDrop={(e) => handleDrop(e, index)}
                                                onDragEnd={handleDragEnd}
                                                className={`
                                                    flex items-center gap-3 p-3 bg-white border rounded-lg
                                                    transition-all
                                                    ${!isReordering ? 'cursor-move hover:shadow-md' : 'cursor-not-allowed opacity-60'}
                                                    ${dragOverIndex === index ? 'border-purple-500 bg-purple-50' : ''}
                                                    ${draggedItem?.moduleId === module.moduleId ? 'opacity-50' : ''}
                                                `}
                                            >
                                                <GripVertical size={20} className="text-gray-400" />
                                                <div className="w-10 h-10 rounded bg-blue-500 flex items-center justify-center flex-shrink-0">
                                                    <div className="text-white font-bold text-xs">{module.sequenceOrder}</div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm">{module.name}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {module.code} • {module.credits} tín chỉ • HK {module.semester}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveModule(module.moduleId)}
                                                    className="p-1.5 hover:bg-red-50 rounded text-red-500"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Summary */}
                            <div className="px-4 py-3 border-t bg-green-50">
                                <div className="text-sm font-semibold text-green-800 mb-2">✓ Thông tin tổng hợp</div>
                                <div className="grid grid-cols-3 gap-4 text-xs">
                                    <div>
                                        <div className="text-gray-600">Tổng số tín chỉ:</div>
                                        <div className="font-semibold">{totalCredits}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-600">Tổng số modules:</div>
                                        <div className="font-semibold">{totalModules}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-600">Thời lượng dự kiến:</div>
                                        <div className="font-semibold">{estimatedMonths} tháng</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Ngân hàng Modules */}
                        <div className="w-80 flex flex-col">
                            <div className="px-4 py-3 border-b">
                                <h3 className="font-semibold text-sm mb-1">Ngân hàng Modules</h3>
                                <p className="text-xs text-gray-500">Click để thêm vào chương trình</p>
                            </div>

                            {/* Search */}
                            <div className="px-4 py-3 border-b">
                                <div className="relative">
                                    <Search
                                        size={16}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Tìm kiếm module..."
                                        className="w-full h-9 pl-9 pr-3 rounded-md border text-sm outline-none focus:ring-2 focus:ring-purple-200"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4">
                                {filteredAvailableModules.length === 0 ? (
                                    <div className="text-center text-gray-400 py-12">
                                        <p className="text-sm">Không có module khả dụng</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {filteredAvailableModules.map((module) => (
                                            <button
                                                key={module.moduleId}
                                                onClick={() => handleAddModule(module)}
                                                className="w-full flex items-center gap-3 p-3 bg-white border rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
                                            >
                                                <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                                                    <BookOpen size={20} className="text-gray-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm">{module.name}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {module.code} • {module.credits} tín chỉ
                                                    </div>
                                                </div>
                                                <Plus size={16} className="text-purple-500" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProgramModulesManager;

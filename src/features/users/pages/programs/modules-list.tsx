import { Clock, GraduationCap, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import ProgramActions from './components/actions';
import type { Program as ProgramDto } from '@/shared/api/programs';
import type { ModuleResponse } from '@/shared/types/module';

type Module = ModuleResponse;

interface ModulesListProps {
    modules: Module[];
    programs: ProgramDto[];
    onView: (module: Module) => void;
    onEdit: (module: Module) => void;
    onDelete: (module: Module) => void;
    onCreate: () => void;
    currentPage: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onProgramFilterChange?: (programId: number | null) => void;
}

const ModulesList: React.FC<ModulesListProps> = ({
    modules,
    programs,
    onView,
    onEdit,
    onDelete,
    onCreate,
    currentPage,
    itemsPerPage,
    onPageChange,
    onProgramFilterChange,
}) => {
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('Tất cả');
    const [programFilter, setProgramFilter] = useState('Tất cả');

    // Debug: Log modules khi component nhận props mới
    useEffect(() => {
    }, [modules]);
    
    const handleProgramFilterChange = (value: string) => {
        setProgramFilter(value);
        // Gọi callback để fetch lại modules từ API
        if (onProgramFilterChange) {
            const programId = value === 'Tất cả' ? null : Number(value);
            onProgramFilterChange(programId);
        }
    };

    // Hàm chuyển đổi level sang tiếng Việt
    const getLevelLabel = (level: string) => {
        const levelMap: { [key: string]: string } = {
            'Beginner': 'Cơ bản',
            'Intermediate': 'Trung cấp',
            'Advanced': 'Nâng cao'
        };
        return levelMap[level] || level;
    };

    const filtered = useMemo(() => {
        let result = modules.filter(
            (m) =>
                m.name.toLowerCase().includes(query.toLowerCase()) ||
                m.code.toLowerCase().includes(query.toLowerCase()) ||
                m.programName.toLowerCase().includes(query.toLowerCase()),
        );

        if (statusFilter !== 'Tất cả') {
            if (statusFilter === 'Hoạt động') {
                result = result.filter((m) => m.isActive);
            } else if (statusFilter === 'Tạm dừng') {
                result = result.filter((m) => !m.isActive);
            }
        }

        // Program filter đã được xử lý bằng API, không cần filter client-side nữa

        return result;
    }, [modules, query, statusFilter]);

    // Pagination logic
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedModules = filtered.slice(startIndex, endIndex);

    return (
        <section className="rounded-2xl border border-gray-200 bg-white">
            {/* Header card */}
            <div className="px-3 py-3 border-b flex items-start gap-2">
                <div>
                    <div className="text-sm font-medium">Danh sách Module</div>
                    <div className="text-xs text-gray-500">
                        Quản lý tất cả module học trong hệ thống ({
                            programs.reduce((sum, p) => sum + (p.moduleCount || 0), 0)
                        } module)
                    </div>
                </div>
                <div className="ml-auto">
                    <button
                        onClick={onCreate}
                        className="inline-flex items-center gap-1.5 rounded-md bg-gray-900 text-white text-sm px-3 py-2 hover:bg-black"
                    >
                        <span>Tạo module mới</span>
                    </button>
                </div>
            </div>

            <div className="px-3 py-2 border-b flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex gap-2 w-full md:max-w-xl">
                    <div className="flex-1 relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full h-9 pl-10 pr-3 rounded-md border text-sm outline-none focus:ring-2 focus:ring-gray-200"
                            placeholder="Tìm kiếm module..."
                        />
                    </div>
                    <select
                        value={programFilter}
                        onChange={(e) => {
                            handleProgramFilterChange(e.target.value);
                        }}
                        className="h-9 rounded-md border px-3 text-sm"
                    >
                        <option value="Tất cả">Tất cả chương trình</option>
                        {programs.map((p) => (
                            <option key={p.programId} value={String(p.programId)}>
                                {p.name} {p.moduleCount !== undefined ? `(${p.moduleCount})` : ''}
                            </option>
                        ))}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-9 rounded-md border px-3 text-sm"
                    >
                        <option value="Tất cả">Tất cả trạng thái</option>
                        <option value="Hoạt động">Hoạt động</option>
                        <option value="Tạm dừng">Tạm dừng</option>
                    </select>
                </div>
            </div>

            {/* Header columns - hidden on mobile, shown on desktop */}
            <div className="hidden md:grid px-3 py-2 pr-12 border-b text-xs text-gray-500 grid-cols-12 gap-3">
                <div className="col-span-3">Module</div>
                <div className="col-span-3">Chương trình</div>
                <div className="col-span-1 text-center">Thứ tự</div>
                <div className="col-span-2 text-center">Học kỳ</div>
                <div className="col-span-1 text-center pl-3">Tín chỉ</div>
                <div className="col-span-1 text-center pl-1">Thời lượng</div>
                <div className="col-span-1 text-center">Trạng thái</div>
            </div>

            <div className="divide-y">
                {paginatedModules.map((module) => (
                    <div
                        key={module.moduleId}
                        className="px-3 py-3 pr-12 grid grid-cols-12 gap-3 items-center border-t first:border-t-0 relative"
                    >
                        <div className="col-span-12 md:col-span-3">
                            <div className="flex items-start gap-3">
                                <div>
                                    <div className="text-sm font-medium">{module.name}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-2">
                                        <span>Mã: {module.code} • {getLevelLabel(module.level)}</span>
                                        <span
                                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                                module.isMandatory
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-blue-100 text-blue-700'
                                            }`}
                                        >
                                            {module.isMandatory ? 'Bắt buộc' : 'Tự chọn'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-span-12 md:col-span-3 text-sm">{module.programName}</div>
                        <div className="col-span-4 md:col-span-1 text-sm text-center">{module.sequenceOrder}</div>
                        <div className="col-span-4 md:col-span-2 flex justify-center">
                            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs">
                                Học kỳ {module.semester}
                            </span>
                        </div>
                        <div className="col-span-2 md:col-span-1 text-sm text-center pl-3">
                            <GraduationCap size={14} className="inline text-gray-500 mr-1" />
                            {module.credits}
                        </div>
                        <div className="col-span-2 md:col-span-1 text-sm text-center pl-1">
                            <Clock size={14} className="inline text-gray-500 mr-1" />
                            {module.durationHours}h
                        </div>
                        <div className="col-span-6 md:col-span-1 flex justify-center">
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
                        <div className="col-span-6 md:col-span-1">
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-40">
                                <ProgramActions
                                    onView={() => onView(module)}
                                    onEdit={() => onEdit(module)}
                                    onDelete={() => onDelete(module)}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-3 py-3 border-t flex items-center justify-between text-sm text-gray-500">
                    <div>
                        Hiển thị {startIndex + 1} - {Math.min(endIndex, filtered.length)} trong số {filtered.length} kết
                        quả
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="h-8 px-3 rounded-md border bg-white hover:bg-gray-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Trước
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => onPageChange(page)}
                                className={`h-8 px-3 rounded-md text-sm ${
                                    currentPage === page ? 'bg-gray-900 text-white' : 'border bg-white hover:bg-gray-50'
                                }`}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="h-8 px-3 rounded-md border bg-white hover:bg-gray-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Sau
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
};

export default ModulesList;

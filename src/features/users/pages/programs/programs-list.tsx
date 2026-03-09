import { Clock, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import ProgramActions from './components/actions';
import type { Program as ProgramDto } from '../../../../shared/api/programs';
import { getCategoryLabel, MAIN_CATEGORIES } from '../../../../shared/constants/categories';
import { getDeliveryModeLabel } from '../../../../shared/constants/deliveryModes';

type Program = ProgramDto;

interface ProgramsListProps {
    programs: Program[];
    onView: (program: Program) => void;
    onCreate: () => void;
    onManageModules: (program: Program) => void;
    onEdit: (program: Program) => void;
    onDelete: (program: Program) => void;
    currentPage: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

const ProgramsList: React.FC<ProgramsListProps> = ({
    programs,
    onView,
    onCreate,
    onManageModules,
    onEdit,
    onDelete,
    currentPage,
    itemsPerPage,
    onPageChange,
}) => {
    const [query, setQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('Tất cả');
    const [statusFilter, setStatusFilter] = useState('Tất cả');

    const filtered = useMemo(() => {
        let result = programs.filter(
            (p) =>
                p.name.toLowerCase().includes(query.toLowerCase()) ||
                (p.description && p.description.toLowerCase().includes(query.toLowerCase())) ||
                p.categoryCode.toLowerCase().includes(query.toLowerCase()),
        );

        if (categoryFilter !== 'Tất cả') {
            result = result.filter((p) => getCategoryLabel(p.categoryCode) === categoryFilter);
        }

        if (statusFilter !== 'Tất cả') {
            if (statusFilter === 'Đang hoạt động') {
                result = result.filter((p) => p.isActive === true);
            } else {
                result = result.filter((p) => p.isActive === false);
            }
        }

        return result;
    }, [programs, query, categoryFilter, statusFilter]);

    // Pagination logic
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedPrograms = filtered.slice(startIndex, endIndex);

    return (
        <section className="rounded-2xl border border-gray-200 bg-white">
            {/* Header card */}
            <div className="px-3 py-3 border-b flex items-start gap-2">
                <div>
                    <div className="text-sm font-medium">Danh sách Chương trình</div>
                    <div className="text-xs text-gray-500">
                        Quản lý tất cả chương trình đào tạo trong hệ thống ({programs.length} chương trình)
                    </div>
                </div>
                <div className="ml-auto">
                    <button
                        onClick={onCreate}
                        className="inline-flex items-center gap-1.5 rounded-md bg-gray-900 text-white text-sm px-3 py-2 hover:bg-black"
                    >
                        <span>Tạo chương trình mới</span>
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
                            placeholder="Tìm kiếm chương trình..."
                        />
                    </div>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="h-9 rounded-md border px-3 text-sm"
                    >
                        <option value="Tất cả">Tất cả danh mục</option>
                        {MAIN_CATEGORIES.map((category) => (
                            <option key={category.value} value={category.label}>
                                {category.label}
                            </option>
                        ))}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-9 rounded-md border px-3 text-sm"
                    >
                        <option value="Tất cả">Tất cả trạng thái</option>
                        <option value="Đang hoạt động">Đang hoạt động</option>
                        <option value="Tạm dừng">Tạm dừng</option>
                        <option value="Hoàn thành">Hoàn thành</option>
                    </select>
                </div>
            </div>

            {/* Header columns */}
            <div className="px-3 py-2 border-b text-xs text-gray-500 grid grid-cols-8 gap-3 items-center">
                <div className="col-span-4">Chương trình</div>
                <div className="col-span-2">Tổng thời lượng</div>
                <div className="col-span-1">Trạng thái</div>
                <div className="col-span-1"></div>
            </div>

            <div className="divide-y">
                {paginatedPrograms.map((program) => (
                    <div
                        key={program.programId}
                        className="px-3 py-3 pr-12 grid grid-cols-8 gap-3 items-center border-t first:border-t-0 relative"
                    >
                        <div className="col-span-12 md:col-span-4">
                            <div className="flex items-start gap-3">
                                <div>
                                    <div className="text-sm font-medium">{program.name}</div>
                                    <div className="text-xs text-gray-500">
                                        {program.description || 'Không có mô tả'}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">
                                            {getCategoryLabel(program.categoryCode)}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs">
                                            {getDeliveryModeLabel(program.deliveryMode)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-span-12 md:col-span-2 flex items-center gap-1 text-sm pl-7">
                            <Clock size={14} className="text-gray-500" />
                            <span>{program.durationHours} giờ</span>
                        </div>
                        <div className="col-span-6 md:col-span-1">
                            <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                    program.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'
                                }`}
                            >
                                {program.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                            </span>
                        </div>
                        <div className="col-span-6 md:col-span-1">
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-40">
                                <ProgramActions
                                    onView={() => onView(program)}
                                    onEdit={() => onEdit(program)}
                                    onManageModules={() => onManageModules(program)}
                                    onDelete={() => onDelete(program)}
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

export default ProgramsList;

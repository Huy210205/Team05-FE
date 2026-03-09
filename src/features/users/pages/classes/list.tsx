import { Calendar, MapPin } from 'lucide-react';

interface ClassListProps {
    classes: any[];
    statusFilter: string;
    query: string;
    setOpenAssignInstructor: (classItem: any) => void;
    onEdit?: (classItem: any) => void;
    onManageStudents?: (classItem: any) => void;
    onRowClick?: (classItem: any) => void;
    totalClasses: number;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const ClassList: React.FC<ClassListProps> = ({
    classes,
    onRowClick,
    totalClasses,
    currentPage,
    totalPages,
    onPageChange,
}) => {
    // no local state needed here currently

    return (
        <>
            <section className="rounded-2xl border border-gray-200 bg-white">
                <div className="px-3 py-3 border-b flex items-start gap-2">
                    <div>
                        <div className="text-sm font-medium">Danh sách Lớp học</div>
                        <div className="text-xs text-gray-500">
                            Quản lý tất cả lớp học trong hệ thống ({totalClasses} kết quả)
                        </div>
                    </div>
                </div>

                {classes.length > 0 && (
                    <div className="px-3 py-2 border-b text-xs text-gray-500 grid grid-cols-10 gap-3">
                        <div className="col-span-2">Lớp học</div>
                        <div className="col-span-2">Trung tâm</div>
                        <div className="col-span-2">Thời gian</div>
                        <div className="col-span-2">Chương trình</div>
                        <div className="col-span-1">Phòng học</div>
                        <div className="col-span-1">Trạng thái</div>
                    </div>
                )}

                <div className="divide-y">
                    {classes.length === 0 ? (
                        <div className="px-3 py-12 text-center">
                            <div className="text-sm text-gray-500">Chưa có lớp học</div>
                        </div>
                    ) : (
                        classes.map((c) => (
                        <div
                            key={c.id}
                            className="px-3 py-3 grid grid-cols-10 gap-3 items-center border-t first:border-t-0 cursor-pointer hover:bg-gray-50"
                            onClick={() => onRowClick?.(c)}
                        >
                            <div className="col-span-12 md:col-span-2">
                                <div className="flex items-start gap-3">
                                    <div>
                                        <div className="text-sm font-medium">{c.name}</div>
                                        <div className="text-xs text-gray-500">{c.description}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-12 md:col-span-2">
                                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">
                                    {c.centerName || 'Chưa có'}
                                </span>
                            </div>
                            <div className="col-span-12 md:col-span-2">
                                <div className="flex items-center gap-1 text-sm">
                                    <Calendar size={14} className="text-gray-500" />
                                    {c.startDate}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Calendar size={12} className="text-gray-400" />
                                    {c.schedule}
                                </div>
                            </div>
                            <div className="col-span-12 md:col-span-2">
                                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">
                                    {c.program}
                                </span>
                            </div>
                            <div className="col-span-6 md:col-span-1 text-sm flex items-center gap-1 pl-4">
                                <MapPin size={14} className="text-gray-500" />
                                {c.location}
                            </div>
                            <div className="col-span-6 md:col-span-1 pl-4">
                                <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                        c.status === 'Đang học'
                                            ? 'bg-green-50 text-green-700'
                                            : c.status === 'Chuẩn bị'
                                              ? 'bg-blue-50 text-blue-700'
                                              : c.status === 'Hoàn thành'
                                                ? 'bg-green-50 text-green-700'
                                                : 'bg-gray-50 text-gray-700'
                                    }`}
                                >
                                    {c.status}
                                </span>
                            </div>
                        </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {classes.length > 0 && (
                <div className="px-3 py-3 border-t flex items-center justify-between text-sm text-gray-500">
                    <div>
                        Hiển thị {(currentPage - 1) * 6 + 1} - {Math.min(currentPage * 6, totalClasses)} trong số{' '}
                        {totalClasses} kết quả
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="h-8 px-3 rounded-md border bg-white hover:bg-gray-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => onPageChange(page)}
                                className={`h-8 px-3 rounded-md text-sm ${
                                    page === currentPage ? 'bg-gray-900 text-white' : 'border bg-white hover:bg-gray-50'
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
                            Next
                        </button>
                    </div>
                </div>
                )}
            </section>
        </>
    );
};

export default ClassList;

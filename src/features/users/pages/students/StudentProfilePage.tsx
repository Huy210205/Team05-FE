import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import StudentSearch from './search';
import StudentList from './list';
import StudentView from './view';
import StudentEdit from './edit';
import CreateStudentModal from './create';
import ChangeStatusModal from './components/ChangeStatusModal';
import ConfirmDialog from '@/shared/components/ConfirmDialog';
import ImportStudentsModal from './components/ImportStudentsModal';
import {
    listStudents,
    getStudentById,
    updateStudent,
    deleteStudent,
    searchStudents,
    exportStudents,
} from '@/shared/api/students';
import { listClasses, getClassStudents } from '@/shared/api/classes';
import { getPrograms } from '@/shared/api/programs';
import { useCenterSelection, useEnsureCenterLoaded } from '@/stores/centerSelection';
import type { StudentDto, UpdateStudentDto } from '@/shared/types/student';
import type { StudentUI } from '@/shared/types/student-ui';
import { useToast } from '@/shared/hooks/useToast';

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[60]">
            <div className="fixed inset-0 bg-black/50" onClick={onClose} />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl border max-h-[90vh] overflow-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}

function StatusModal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[60]">
            <div className="fixed inset-0 bg-black/50" onClick={onClose} />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <div className="w-96 max-w-sm">{children}</div>
            </div>
        </div>
    );
}

export default function StudentProfilePage() {
    // Ensure center is loaded from localStorage
    useEnsureCenterLoaded();

    // Get selected center from global store
    const globalSelectedCenterId = useCenterSelection((s) => s.selectedCenterId);

    // Check query params for auto-open modal
    const [searchParams, setSearchParams] = useSearchParams();

    const toast = useToast();
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái');
    const [programFilter, setProgramFilter] = useState('Tất cả chương trình');
    const [openView, setOpenView] = useState<StudentUI | null>(null);
    const [openEdit, setOpenEdit] = useState<StudentUI | null>(null);
    const [openCreate, setOpenCreate] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<StudentUI | null>(null);
    const [openChangeStatus, setOpenChangeStatus] = useState<StudentUI | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const studentsPerPage = 8;

    const [students, setStudents] = useState<StudentUI[]>([]);
    const [openImport, setOpenImport] = useState(false);
    const [exportConfirm, setExportConfirm] = useState(false);
    const [enrollmentMap, setEnrollmentMap] = useState<Map<number, any>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    // Always default to empty array to avoid undefined access in child components
    const [programs, setPrograms] = useState<Array<{ programId: number; name: string }>>([]);

    // Load tất cả enrollments một lần để tối ưu
    const loadAllEnrollments = async () => {
        try {
            // Fetch classes with optional center filter
            const classesParams = globalSelectedCenterId ? { centerId: globalSelectedCenterId } : undefined;
            const classesResponse = await listClasses(classesParams);
            const classes = classesResponse.data;
            const map = new Map<number, Array<{ className: string; programName: string }>>();

            // Load enrollments của tất cả classes - không filter theo status để hiển thị tất cả lớp
            for (const classItem of classes) {
                try {
                    const enrollmentsResponse = await getClassStudents(classItem.classId, {
                        page: 0,
                        size: 1000,
                    });

                    // Handle both Page<T> and direct array response
                    let enrollments;
                    if (Array.isArray(enrollmentsResponse.data)) {
                        enrollments = enrollmentsResponse.data;
                    } else if (enrollmentsResponse.data.content) {
                        enrollments = enrollmentsResponse.data.content;
                    } else {
                        enrollments = [];
                    }

                    // Map student ID -> array of classes
                    if (Array.isArray(enrollments)) {
                        enrollments.forEach((enrollment: any) => {
                            if (!map.has(enrollment.studentId)) {
                                map.set(enrollment.studentId, []);
                            }
                            map.get(enrollment.studentId)!.push({
                                className: classItem.name,
                                programName: classItem.programName,
                            });
                        });
                    }
                } catch (error) {
                    // Skip if can't access this class
                }
            }

            setEnrollmentMap(map);
            return map; // Return the map để sử dụng ngay
        } catch (error) {
            return new Map();
        }
    };

    // Helper function: Convert StudentDto từ BE sang StudentUI type của FE
    const mapStudentDtoToStudent = (
        dto: StudentDto,
        enrollMap?: Map<number, Array<{ className: string; programName: string }>>,
    ): StudentUI => {
        // Sử dụng map được truyền vào hoặc map hiện tại
        const mapToUse = enrollMap || enrollmentMap;

        // Lấy thông tin lớp học từ enrollment map
        const enrollmentInfo = mapToUse.get(dto.studentId) || [];

        // Convert to StudentEnrollment format
        const enrollments = enrollmentInfo.map((info) => ({
            classId: 0, // We don't have classId here, but it's not used in list view
            className: info.className,
            programName: info.programName,
            status: 'ACTIVE', // Default, actual status would come from enrollment data
        }));

        return {
            id: dto.studentId.toString(),
            studentId: `SV${String(dto.studentId).padStart(3, '0')}`,
            name: dto.fullName,
            email: dto.email,
            phone: dto.phone,
            initial: dto.fullName
                .split(' ')
                .map((n) => n[0])
                .join(''),
            enrollments: enrollments, // Use enrollments instead of classes
            registrationDate: dto.createdAt.split('T')[0],
            status: (dto.overallStatus === 'PENDING'
                ? 'Đang chờ'
                : dto.overallStatus === 'ACTIVE'
                  ? 'Đang học'
                  : dto.overallStatus === 'DROPPED'
                    ? 'Nghỉ học'
                    : 'Tốt nghiệp') as StudentUI['status'],
            avatar: loadStudentAvatar(dto.studentId.toString()),
            dob: dto.dob || null,
            address: dto.addressLine || null,
            gender: dto.gender || null,
            nationalIdNo: dto.nationalIdNo || null,
        };
    };

    // Load students from API (hoặc search nếu có keyword)
    const fetchStudents = async (
        keyword?: string,
        enrollMap?: Map<number, Array<{ className: string; programName: string }>>,
    ) => {
        try {
            let response;
            if (keyword && keyword.trim()) {
                // Nếu có keyword → gọi API search
                response = await searchStudents(keyword.trim());
            } else {
                // Nếu không có keyword → load all
                response = await listStudents();
            }
            // Map students với enrollment info
            const studentsData = response.data.map((dto) => mapStudentDtoToStudent(dto, enrollMap));
            setStudents(studentsData);
        } catch (error) {
        }
    };

    // Load programs
    const loadPrograms = async () => {
        try {
            const response = await getPrograms();
            const programList = response.data.map((p) => ({
                programId: p.programId,
                name: p.name,
            }));
            setPrograms(programList);
        } catch (error) {
        }
    };

    // Load enrollments và students on mount
    useEffect(() => {
        const initData = async () => {
            setIsLoading(true);
            await loadPrograms(); // Load programs
            const enrollMap = await loadAllEnrollments(); // Load enrollments và lấy map (filtered by center)
            // Giờ load students với enrollment map mới
            await fetchStudents(undefined, enrollMap);
            setIsLoading(false);
        };
        initData();
    }, [globalSelectedCenterId]); // Refetch when center changes

    // Auto-open create modal if ?action=create is present
    useEffect(() => {
        if (searchParams.get('action') === 'create') {
            setOpenCreate(true);
            // Remove query param after opening modal
            setSearchParams({});
        }
    }, [searchParams, setSearchParams]);

    // Tự động tìm kiếm khi thay đổi query (debounce)
    useEffect(() => {
        const handler = setTimeout(() => {
            if (enrollmentMap.size > 0) {
                fetchStudents(query);
                setCurrentPage(1);
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [query, enrollmentMap]);

    // Function to load avatar from localStorage
    const loadStudentAvatar = (studentId: string) => {
        return localStorage.getItem(`student_avatar_${studentId}`) || '';
    };

    const handleView = async (student: StudentUI) => {
        try {
            // Load full student details from API
            const response = await getStudentById(parseInt(student.id));
            const fullStudent = mapStudentDtoToStudent(response.data);
            setOpenView(fullStudent);
        } catch (error) {
            // Fallback to showing current student data
            setOpenView(student);
        }
    };

    const handleEdit = (student: StudentUI) => {
        setOpenEdit(student);
    };

    const handleSaveEdit = async (updatedStudent: StudentUI) => {
        try {
            // Prepare update payload (only 5 fields allowed)
            const updatePayload: UpdateStudentDto = {
                fullName: updatedStudent.name,
                email: updatedStudent.email,
                phone: updatedStudent.phone,
                dob: updatedStudent.dob || null,
                addressLine: updatedStudent.address || null,
            };

            // Call API to update
            await updateStudent(parseInt(updatedStudent.id), updatePayload);

            toast.success('Cập nhật thành công!', `Thông tin học viên ${updatedStudent.name} đã được cập nhật`);

            // Reload all data
            await reloadAllData();
            setOpenEdit(null);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin học viên';
            toast.error('Cập nhật thất bại', errorMessage);
        }
    };

    const handleCreate = () => {
        setOpenCreate(true);
    };

    const handleImport = () => {
        setOpenImport(true);
    };

    const handleExport = () => {
        setExportConfirm(true);
    };

    // Helper: Convert frontend status to backend status
    const mapStatusToBackend = (frontendStatus: string): string | undefined => {
        switch (frontendStatus) {
            case 'Đang chờ':
                return 'PENDING';
            case 'Đang học':
                return 'ACTIVE';
            case 'Nghỉ học':
                return 'DROPPED';
            case 'Tốt nghiệp':
                return 'GRADUATED';
            case 'Tất cả trạng thái':
                return undefined;
            default:
                return undefined;
        }
    };

    const confirmExport = async () => {
        try {
            // Lấy backend status từ filter
            const backendStatus = mapStatusToBackend(statusFilter);

            const response = await exportStudents(backendStatus);
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            // Đặt tên file theo status filter
            const fileName = backendStatus ? `students_${backendStatus.toLowerCase()}.xlsx` : 'students_all.xlsx';
            a.download = fileName;

            a.click();
            URL.revokeObjectURL(url);

            const statusText = statusFilter === 'Tất cả trạng thái' ? 'tất cả' : statusFilter.toLowerCase();
            toast.success('Xuất file thành công', `Đã tải danh sách học viên ${statusText} dưới dạng file Excel`);
            setExportConfirm(false);
        } catch (err) {
            toast.error('Lỗi xuất file', 'Không thể tải file Excel');
            setExportConfirm(false);
        }
    };

    const handleMenuToggle = (id: string) => {
        setOpenMenuId(openMenuId === id ? null : id);
    };

    const handleDeleteStudent = (student: StudentUI) => {
        setDeleteConfirm(student);
    };

    const reloadAllData = async () => {
        setIsLoading(true);
        await loadAllEnrollments();
        await fetchStudents();
        setIsLoading(false);
    };

    const confirmDeleteStudent = async () => {
        if (!deleteConfirm) return;

        try {
            // Call API to soft delete student (sẽ tự động đổi status sang INACTIVE)
            await deleteStudent(parseInt(deleteConfirm.id));

            toast.success('Xóa thành công!', `Học viên ${deleteConfirm.name} đã được xóa khỏi hệ thống`);

            // Reload all data
            await reloadAllData();
            setDeleteConfirm(null);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || 'Có lỗi xảy ra khi xóa học viên';
            toast.error('Xóa thất bại', errorMessage);
        }
    };

    const handleChangeStatus = (student: StudentUI) => {
        setOpenChangeStatus(student);
    };

    const handleSaveStatusChange = async (studentId: string, newStatus: StudentUI['status']) => {
        const student = students.find((s) => s.id === studentId);
        if (student) {
            toast.success(
                'Cập nhật trạng thái thành công!',
                `Trạng thái học viên ${student.name} đã được đổi sang ${newStatus}`,
            );
        }

        // Reload all data to get updated status
        await reloadAllData();
        setOpenChangeStatus(null);
    };

    // Filter students client-side (chỉ filter theo status, query đã filter từ BE)
    const filteredStudents = students.filter((student) => {
        const matchesStatus = statusFilter === 'Tất cả trạng thái' || student.status === statusFilter;
        // TODO: Add program filter back by checking enrollments array
        const matchesProgram =
            programFilter === 'Tất cả chương trình' || student.enrollments.some((e) => e.programName === programFilter);

        return matchesStatus && matchesProgram;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
    const startIndex = (currentPage - 1) * studentsPerPage;
    const endIndex = startIndex + studentsPerPage;
    const currentStudents = filteredStudents.slice(startIndex, endIndex);

    // Reset to first page when status/program filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, programFilter]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div>
                        <h1 className="text-lg font-semibold">Hồ sơ Học viên</h1>
                        <p className="text-xs text-gray-500">Quản lý thông tin và hồ sơ học viên</p>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <StudentSearch
                query={query}
                onQueryChange={setQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                programFilter={programFilter}
                onProgramFilterChange={setProgramFilter}
                programs={programs}
                onCreate={handleCreate}
                onImport={handleImport}
                onExport={handleExport}
            />

            {/* Students List */}
            {isLoading ? (
                <div className="bg-white rounded-lg border p-8 text-center">
                    <div className="text-gray-500">Đang tải danh sách học viên...</div>
                </div>
            ) : (
                <StudentList
                    students={currentStudents}
                    totalStudents={filteredStudents.length}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onView={handleView}
                    onEdit={handleEdit}
                    onChangeStatus={handleChangeStatus}
                    onDelete={handleDeleteStudent}
                    openMenuId={openMenuId}
                    onMenuToggle={handleMenuToggle}
                    onPageChange={handlePageChange}
                />
            )}

            {/* View Modal */}
            <Modal open={!!openView} onClose={() => setOpenView(null)}>
                {openView && <StudentView student={openView} onClose={() => setOpenView(null)} />}
            </Modal>

            {/* Edit Modal */}
            <Modal open={!!openEdit} onClose={() => setOpenEdit(null)}>
                {openEdit && (
                    <StudentEdit student={openEdit} onClose={() => setOpenEdit(null)} onSave={handleSaveEdit} />
                )}
            </Modal>

            {/* Create Modal */}
            <CreateStudentModal
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                onSuccess={async () => {
                    await fetchStudents();
                }}
            />

            {/* Import Students Modal */}
            <ImportStudentsModal
                open={openImport}
                onClose={() => setOpenImport(false)}
                onSuccess={async () => {
                    setOpenImport(false);
                    await fetchStudents();
                }}
            />

            {/* Change Status Modal */}
            <StatusModal open={!!openChangeStatus} onClose={() => setOpenChangeStatus(null)}>
                {openChangeStatus && (
                    <ChangeStatusModal
                        student={openChangeStatus}
                        onClose={() => setOpenChangeStatus(null)}
                        onSave={handleSaveStatusChange}
                    />
                )}
            </StatusModal>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={confirmDeleteStudent}
                title="Xác nhận xóa học viên"
                description={`Bạn có chắc chắn muốn xóa học viên "${deleteConfirm?.name}" khỏi hệ thống? Hành động này không thể hoàn tác.`}
                confirmText="Xóa"
                cancelText="Hủy"
                variant="danger"
            />

            {/* Export Confirmation Dialog */}
            <ConfirmDialog
                open={exportConfirm}
                onClose={() => setExportConfirm(false)}
                onConfirm={confirmExport}
                title="Xác nhận xuất danh sách"
                description={
                    statusFilter === 'Tất cả trạng thái'
                        ? 'Bạn có muốn tải xuống danh sách TẤT CẢ học viên ra file Excel? File sẽ chứa đầy đủ thông tin của các học viên hiện tại.'
                        : `Bạn có muốn tải xuống danh sách học viên đang ở trạng thái "${statusFilter}" ra file Excel? Chỉ những học viên có trạng thái này sẽ được xuất.`
                }
                confirmText="Xuất file"
                cancelText="Hủy"
                variant="primary"
            />
        </div>
    );
}

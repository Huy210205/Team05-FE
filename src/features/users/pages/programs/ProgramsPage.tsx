import React, { useState, useEffect } from 'react';

// Import components
import ProgramsList from './programs-list';
import ModulesList from './modules-list';
import ProgramForm from './form';
import ProgramView from './view';
import ModuleDetailModal from './components/ModuleDetailModal';
import ModuleForm from './components/ModuleForm';
import ProgramModulesManager from './components/ProgramModulesManager';

// Import hooks
import { useToast } from '../../../../shared/hooks/useToast';

// Import API and types
import {
    getPrograms,
    createProgram,
    updateProgram,
    deleteProgram,
    type Program as ProgramDto,
    type CreateProgramDto,
    type UpdateProgramDto,
} from '../../../../shared/api/programs';

import {
    getModulesByProgram,
    createModule,
    updateModule,
    type CreateModuleRequest,
    type UpdateModuleRequest,
} from '../../../../shared/api/modules';

import type { ModuleResponse } from '../../../../shared/types/module';

type Program = ProgramDto;
type Module = ModuleResponse;

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black/30" onClick={onClose} />
            <div className="fixed inset-0 flex items-start justify-center pt-12 px-4">
                <div className="w-full max-w-3xl rounded-lg bg-white shadow-lg border max-h-[85vh] overflow-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default function ProgramsPage() {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<'programs' | 'modules'>('programs');
    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState<Program | null>(null);
    const [openView, setOpenView] = useState<Program | null>(null);
    const [openModuleDetail, setOpenModuleDetail] = useState<Module | null>(null);
    const [openModuleCreate, setOpenModuleCreate] = useState(false);
    const [openModuleEdit, setOpenModuleEdit] = useState<Module | null>(null);
    const [openModulesManager, setOpenModulesManager] = useState<Program | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [programs, setPrograms] = useState<Program[]>([]);
    const [modules, setModules] = useState<Module[]>([]);

    // Fetch programs from API
    const fetchPrograms = async () => {
        try {
            const response = await getPrograms();
            setPrograms(response.data);
        } catch (error) {
        }
    };

    // Fetch modules for selected program or all programs
    const fetchModules = async (programId?: number) => {
        try {
            if (programId) {
                // Fetch modules for specific program
                const response = await getModulesByProgram({ programId });
                setModules(response.data);
            } else {
                // Fetch modules for ALL programs
                if (programs.length === 0) {
                    setModules([]);
                    return;
                }
                // Call API for each program and merge results
                const allModulesPromises = programs.map(program => 
                    getModulesByProgram({ programId: program.programId })
                );
                
                const allModulesResponses = await Promise.all(allModulesPromises);
                const allModules = allModulesResponses.flatMap(response => response.data);
                setModules(allModules);
            }
        } catch (error) {
            setModules([]);
        }
    };

    useEffect(() => {
        fetchPrograms();
    }, []);

    // Fetch modules when switching to modules tab or when programs are loaded
    useEffect(() => {
        if (activeTab === 'modules' && programs.length > 0) {
            fetchModules();
        }
    }, [activeTab, programs]);

    // Reset pagination when switching tabs
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    const handleSubmit = async (formData: any) => {
        try {
            setIsSubmitting(true);

            // Create new program
            const createData: CreateProgramDto = {
                code: formData.code,
                name: formData.name,
                description: formData.description,
                durationHours: formData.durationHours,
                deliveryMode: formData.deliveryMode,
                categoryCode: formData.categoryCode,
                languageCode: formData.languageCode || 'vi',
                isActive: formData.isActive ?? true,
            };
            await createProgram(createData);

            // Refresh programs list
            await fetchPrograms();
            setOpenCreate(false);
            
            // Show success toast
            toast.success('Tạo thành công!', `Chương trình ${formData.name} đã được thêm vào hệ thống`);
        } catch (error: any) {
            // Show error toast with specific error messages
            if (error.response?.status === 400) {
                const apiError = error.response.data;
                toast.error('Dữ liệu không hợp lệ', apiError.message || 'Vui lòng kiểm tra lại thông tin');
            } else if (error.response?.status === 409) {
                toast.error('Trùng lặp dữ liệu', 'Mã chương trình hoặc tên đã tồn tại trong hệ thống');
            } else {
                const errorMessage = error.response?.data?.message || error.message || 'Không thể kết nối đến server';
                toast.error('Lỗi hệ thống', errorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleView = async (program: Program) => {
        setOpenView(program);
        // Fetch modules for this program when opening view modal
        await fetchModules(program.programId);
    };

    const handleCreate = () => {
        setOpenCreate(true);
    };

    const handleCancel = () => {
        setOpenCreate(false);
        setOpenEdit(null);
        setOpenView(null);
    };

    // Edit program
    const handleEdit = (program: Program) => {
        setOpenEdit(program);
    };

    const handleUpdateProgram = async (formData: any) => {
        if (!openEdit) return;

        try {
            setIsSubmitting(true);

            const updateData: UpdateProgramDto = {
                name: formData.name,
                description: formData.description,
                durationHours: formData.durationHours,
                deliveryMode: formData.deliveryMode,
                categoryCode: formData.categoryCode,
                languageCode: formData.languageCode || 'vi',
                isActive: formData.isActive ?? true,
            };

            await updateProgram(openEdit.programId, updateData);

            // Refresh programs list
            await fetchPrograms();
            setOpenEdit(null);

            toast.success('Cập nhật thành công!', `Chương trình ${formData.name} đã được cập nhật`);
        } catch (error: any) {
            if (error.response?.status === 400) {
                toast.error('Dữ liệu không hợp lệ', error.response.data.message || 'Vui lòng kiểm tra lại thông tin');
            } else if (error.response?.status === 403) {
                toast.error('Không có quyền', 'Bạn không có quyền chỉnh sửa chương trình');
            } else if (error.response?.status === 404) {
                toast.error('Không tìm thấy', 'Chương trình không tồn tại');
            } else {
                toast.error('Lỗi hệ thống', error.response?.data?.message || error.message || 'Không thể cập nhật chương trình');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete program
    const handleDelete = async (program: Program) => {
        try {
            await deleteProgram(program.programId);

            // Refresh programs list
            await fetchPrograms();

            toast.success('Xóa thành công!', `Chương trình ${program.name} đã được xóa`);
        } catch (error: any) {
            if (error.response?.status === 403) {
                toast.error('Không có quyền', 'Bạn không có quyền xóa chương trình');
            } else if (error.response?.status === 404) {
                toast.error('Không tìm thấy', 'Chương trình không tồn tại');
            } else if (error.response?.status === 409) {
                toast.error('Không thể xóa', 'Chương trình đang được sử dụng');
            } else if (error.response?.status === 400) {
                const message = error.response?.data?.message || 'Yêu cầu không hợp lệ';
                toast.error('Xóa thất bại', message);
            } else {
                toast.error('Lỗi hệ thống', error.response?.data?.message || error.message || 'Không thể xóa chương trình');
            }
        }
    };

    // Program modules manager
    const handleManageModules = async (program: Program) => {
        // Load modules cho program này trước khi mở manager
        await fetchModules(program.programId);
        setOpenModulesManager(program);
    };

    const handleSaveModulesOrder = async (moduleIds: string[]) => {
        // Không cần gọi API ở đây vì đã reorder bằng API trong ProgramModulesManager
        // Chỉ cần reload lại modules
        if (openModulesManager) {
            await fetchModules(openModulesManager.programId);
        }
    };

    // Module handlers
    const handleModuleCreate = () => {
        setOpenModuleEdit(null);
        setOpenModuleCreate(true);
    };

    const handleModuleEdit = (module: Module) => {
        setOpenModuleEdit(module);
        setOpenModuleCreate(true);
    };

    const handleModuleDelete = async (module: Module) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa module "${module.name}" không?`)) {
            try {
                // Soft delete by setting isActive to false
                await updateModule(module.moduleId, { isActive: false });
                // Refresh modules list
                await fetchModules();
                toast.success('Xóa thành công!', `Module ${module.name} đã được xóa`);
            } catch (error: any) {
                const errorMessage = error.response?.data?.message || error.message || 'Không thể kết nối đến server';
                toast.error('Lỗi hệ thống', errorMessage);
            }
        }
    };

    const handleModuleSubmit = async (formData: any) => {
        try {
            setIsSubmitting(true);

            if (openModuleEdit) {
                // Update existing module
                const updateData: UpdateModuleRequest = {
                    code: formData.code,
                    name: formData.name,
                    description: formData.description,
                    credits: formData.credits,
                    durationHours: formData.durationHours,
                    level: formData.level,
                    isMandatory: formData.isMandatory ?? true,
                    syllabusUrl: formData.syllabusUrl,
                    hasSyllabus: formData.hasSyllabus,
                    notes: formData.notes,
                    isActive: formData.isActive ?? true,
                };
                await updateModule(openModuleEdit.moduleId, updateData);
                
                // Refresh modules list
                await fetchModules();
                setOpenModuleCreate(false);
                setOpenModuleEdit(null);
                
                toast.success('Cập nhật thành công!', `Module ${formData.name} đã được cập nhật`);
            } else {
                // Create new module
                const createData: CreateModuleRequest = {
                    programId: formData.programId,
                    code: formData.code,
                    name: formData.name,
                    description: formData.description,
                    sequenceOrder: formData.sequenceOrder,
                    credits: formData.credits,
                    durationHours: formData.durationHours,
                    level: formData.level,
                    isMandatory: formData.isMandatory ?? true,
                    syllabusUrl: formData.syllabusUrl,
                    hasSyllabus: formData.hasSyllabus,
                    notes: formData.notes,
                };
                await createModule(createData);
                
                // Refresh modules list
                await fetchModules();
                setOpenModuleCreate(false);
                setOpenModuleEdit(null);
                
                toast.success('Tạo thành công!', `Module ${formData.name} đã được thêm vào hệ thống`);
            }
        } catch (error: any) {
            // Show error toast with specific error messages
            if (error.response?.status === 400) {
                const apiError = error.response.data;
                toast.error('Dữ liệu không hợp lệ', apiError.message || 'Vui lòng kiểm tra lại thông tin');
            } else if (error.response?.status === 409) {
                toast.error('Trùng lặp dữ liệu', 'Mã module hoặc tên đã tồn tại trong hệ thống');
            } else {
                const errorMessage = error.response?.data?.message || error.message || 'Không thể kết nối đến server';
                toast.error('Lỗi hệ thống', errorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleModuleCancel = () => {
        setOpenModuleCreate(false);
        setOpenModuleEdit(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div>
                        <h1 className="text-lg font-semibold">Quản lý Chương trình & Module</h1>
                        <p className="text-xs text-gray-500">Quản lý chương trình đào tạo và module học</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setActiveTab('programs')}
                    className={`px-4 h-9 rounded-full text-sm inline-flex items-center gap-2 ${
                        activeTab === 'programs' ? 'bg-gray-900 text-white' : 'bg-white border'
                    }`}
                >
                    Chương trình
                </button>
                <button
                    onClick={() => setActiveTab('modules')}
                    className={`px-4 h-9 rounded-full text-sm inline-flex items-center gap-2 ${
                        activeTab === 'modules' ? 'bg-gray-900 text-white' : 'bg-white border'
                    }`}
                >
                    Module
                </button>
            </div>

            {/* Tab content */}
            {activeTab === 'programs' && (
                <ProgramsList
                    programs={programs}
                    onView={handleView}
                    onCreate={handleCreate}
                    onManageModules={handleManageModules}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                />
            )}

            {activeTab === 'modules' && (
                <ModulesList
                    modules={modules}
                    programs={programs}
                    onView={(module) => setOpenModuleDetail(module)}
                    onEdit={handleModuleEdit}
                    onDelete={handleModuleDelete}
                    onCreate={handleModuleCreate}
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onProgramFilterChange={(programId) => {
                        fetchModules(programId ?? undefined);
                    }}
                />
            )}

            {/* Modals */}
            <Modal open={openCreate} onClose={handleCancel}>
                <ProgramForm
                    open={openCreate}
                    editing={null}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    isSubmitting={isSubmitting}
                />
            </Modal>

            <Modal open={!!openEdit} onClose={handleCancel}>
                {openEdit && (
                    <ProgramForm
                        open={!!openEdit}
                        editing={openEdit}
                        onSubmit={handleUpdateProgram}
                        onCancel={handleCancel}
                        isSubmitting={isSubmitting}
                    />
                )}
            </Modal>

            <Modal open={!!openView} onClose={() => setOpenView(null)}>
                {openView && (
                    <ProgramView
                        open={!!openView}
                        onClose={() => setOpenView(null)}
                        program={openView}
                        modules={modules}
                    />
                )}
            </Modal>

            {/* Module Detail Modal */}
            {openModuleDetail && (
                <ModuleDetailModal
                    open={!!openModuleDetail}
                    onClose={() => setOpenModuleDetail(null)}
                    module={openModuleDetail}
                />
            )}

            {/* Module Form Modal */}
            <Modal open={openModuleCreate} onClose={handleModuleCancel}>
                <ModuleForm
                    open={openModuleCreate}
                    onClose={handleModuleCancel}
                    editing={openModuleEdit}
                    onSubmit={handleModuleSubmit}
                    onCancel={handleModuleCancel}
                    isSubmitting={isSubmitting}
                    programs={programs}
                />
            </Modal>

            {/* Program Modules Manager Modal */}
            {openModulesManager && (
                <ProgramModulesManager
                    open={!!openModulesManager}
                    onClose={() => setOpenModulesManager(null)}
                    program={openModulesManager}
                    allModules={modules}
                    programModules={modules.filter((m) => m.programId === openModulesManager.programId)}
                    onSave={handleSaveModulesOrder}
                />
            )}
        </div>
    );
}

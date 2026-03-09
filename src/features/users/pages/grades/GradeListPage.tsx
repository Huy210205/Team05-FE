import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Eye, Trash2, Download, Filter, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    getGradeEntries,
    deleteGradeEntry,
    exportGrades,
    getStudentGrades,
    type GradeEntryResponse,
    type StudentGradesResponse,
} from '@/shared/api/grade-entries';
import { getMyLecturerClasses } from '@/shared/api/classes';
import { getModulesByProgram } from '@/shared/api/modules';
import type { ModuleResponse } from '@/shared/api/modules';
import { toast } from 'sonner';
import ImportGradesModal from './components/ImportGradesModal';

interface ClassOption {
    classId: number;
    className: string;
    programId: number;
    programName: string;
}

interface SemesterOption {
    semester: number;
}

interface ModuleOption {
    moduleId: number;
    moduleName: string;
    semester: number;
}

export function GradeListPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [gradeEntries, setGradeEntries] = useState<GradeEntryResponse[]>([]);
    const [allClasses, setAllClasses] = useState<ClassOption[]>([]);
    const [allModules, setAllModules] = useState<ModuleResponse[]>([]);
    const [semesters, setSemesters] = useState<SemesterOption[]>([]);
    const [modules, setModules] = useState<ModuleOption[]>([]);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deletingEntry, setDeletingEntry] = useState<GradeEntryResponse | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);

    // Filter state
    const [selectedClass, setSelectedClass] = useState<number | null>(null);
    const [selectedProgram, setSelectedProgram] = useState<number | null>(null);
    const [selectedProgramName, setSelectedProgramName] = useState<string>('');
    const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
    const [selectedModule, setSelectedModule] = useState<number | null>(null);
    const [selectedEntryDate, setSelectedEntryDate] = useState<string | null>(null);

    // Load classes khi mount
    useEffect(() => {
        loadClasses();
    }, []);

    // Khi chọn lớp, load chương trình và modules
    useEffect(() => {
        if (selectedClass && allClasses.length > 0) {
            const selectedClassData = allClasses.find((c) => c.classId === selectedClass);
            if (selectedClassData) {
                setSelectedProgram(selectedClassData.programId);
                setSelectedProgramName(selectedClassData.programName || 'N/A');
                if (selectedClassData.programId && selectedClassData.programId > 0) {
                    loadModulesForProgram(selectedClassData.programId);
                } else {
                    setAllModules([]);
                    setSemesters([]);
                }
            }
        } else {
            setSelectedProgram(null);
            setSelectedProgramName('');
            setAllModules([]);
            setSemesters([]);
            setModules([]);
            setSelectedSemester(null);
            setSelectedModule(null);
            setGradeEntries([]);
        }
    }, [selectedClass, allClasses]);

    // Khi có modules, extract unique semesters
    useEffect(() => {
        if (allModules.length > 0) {
            const uniqueSemesters = Array.from(
                new Set(allModules.map((m) => m.semester).filter((s) => s != null && s > 0)),
            )
                .sort((a, b) => a - b)
                .map((semester) => ({ semester }));
            setSemesters(uniqueSemesters);
        } else {
            setSemesters([]);
        }
    }, [allModules]);

    // Khi chọn semester, load modules từ API
    useEffect(() => {
        setSelectedModule(null);
        setSelectedEntryDate(null);
        if (!selectedClass || !selectedSemester) {
            setModules([]);
            setGradeEntries([]);
        } else {
            loadModulesForSemester(selectedClass, selectedSemester);
        }
    }, [selectedSemester, selectedClass]);

    // Load grade entries khi có filter
    useEffect(() => {
        if (selectedClass && selectedModule) {
            loadGradeEntries();
        } else {
            setGradeEntries([]);
            setSelectedEntryDate(null);
        }
    }, [selectedClass, selectedModule]);

    const loadClasses = async () => {
        try {
            const response = await getMyLecturerClasses();
            const classOptions: ClassOption[] = response.data.map((c: any) => ({
                classId: c.classId,
                className: c.name,
                programId: c.programId || 0,
                programName: c.programName || 'N/A',
            }));
            setAllClasses(classOptions);
        } catch (error) {
            toast.error('Không thể tải danh sách lớp');
        }
    };

    const loadModulesForProgram = async (programId: number) => {
        try {
            if (!programId || programId === 0) {
                setAllModules([]);
                return;
            }
            const response = await getModulesByProgram({ programId });
            setAllModules(response.data);
        } catch (error) {
            toast.error('Không thể tải danh sách module');
            setAllModules([]);
        }
    };

    const loadModulesForSemester = async (classId: number, semester: number) => {
        try {
            const response = await getStudentGrades(classId, semester);
            if (response.modules) {
                const moduleOptions: ModuleOption[] = response.modules.map((m) => ({
                    moduleId: m.moduleId,
                    moduleName: m.name || m.moduleName || 'N/A',
                    semester: m.semester || semester,
                }));
                setModules(moduleOptions);
            }
        } catch (error) {
            toast.error('Không thể tải danh sách module');
            setModules([]);
        }
    };

    const loadGradeEntries = async () => {
        if (!selectedClass) return;

        try {
            setLoading(true);
            const data = await getGradeEntries(selectedClass, selectedModule || undefined);
            setGradeEntries(data);
        } catch (err) {
            toast.error('Không thể tải danh sách đợt nhập điểm');
        } finally {
            setLoading(false);
        }
    };

    const handleGradeClick = (moduleId: number) => {
        // Find existing entry by module
        const entry = gradeEntries.find((e) => e.moduleId === moduleId);
        if (entry) {
            navigate(`/grades/${entry.gradeEntryId}`);
        } else {
            // Navigate to create new entry page
            if (selectedClass && selectedSemester) {
                navigate(`/grades/new?classId=${selectedClass}&moduleId=${moduleId}&semester=${selectedSemester}`);
            } else {
                toast.error('Vui lòng chọn lớp và học kỳ trước');
            }
        }
    };

    const handleDeleteClick = (entry: GradeEntryResponse) => {
        setDeletingEntry(entry);
        setShowDeleteDialog(true);
    };

    const handleDelete = async () => {
        if (!deletingEntry) return;

        try {
            setDeleting(true);
            await deleteGradeEntry(deletingEntry.classId, deletingEntry.moduleId, deletingEntry.entryDate);
            toast.success('Đã xóa đợt nhập điểm thành công');
            await loadGradeEntries();
        } catch (err) {
            toast.error('Không thể xóa đợt nhập điểm. Vui lòng thử lại.');
        } finally {
            setDeleting(false);
            setShowDeleteDialog(false);
            setDeletingEntry(null);
        }
    };

    const handleExport = async () => {
        if (!selectedClass || !selectedSemester || !selectedModule) {
            toast.error('Vui lòng chọn lớp, học kỳ và module để xuất file');
            return;
        }

        if (!selectedEntryDate) {
            toast.error('Vui lòng chọn ngày chấm điểm để xuất file');
            return;
        }

        try {
            setExporting(true);
            await exportGrades(selectedClass, selectedSemester, selectedModule, selectedEntryDate);
            toast.success('Xuất file Excel thành công');
        } catch (err) {
            toast.error('Không thể xuất file Excel. Vui lòng thử lại.');
        } finally {
            setExporting(false);
        }
    };

    // Lấy danh sách entryDate unique từ gradeEntries
    const availableEntryDates = Array.from(
        new Set(gradeEntries.map((entry) => entry.entryDate).filter((date) => date))
    ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (loading && !selectedClass) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-gray-500">Đang tải...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Quản lý điểm số</h1>
                    <p className="text-gray-500">Chỉ chấm các module đã gắn vào Chương trình</p>
                </div>
            </div>

            {/* Filter Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Bộ lọc
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        {/* Class Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Lớp học</label>
                            <Select
                                value={selectedClass?.toString() || ''}
                                onValueChange={(value) => setSelectedClass(value ? parseInt(value) : null)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn lớp" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allClasses.map((cls) => (
                                        <SelectItem key={cls.classId} value={cls.classId.toString()}>
                                            {cls.className}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Semester Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Học kỳ</label>
                            <Select
                                value={selectedSemester?.toString() || ''}
                                onValueChange={(value) => setSelectedSemester(value ? parseInt(value) : null)}
                            >
                                <SelectTrigger disabled={!selectedClass || semesters.length === 0}>
                                    <SelectValue placeholder="Chọn học kỳ" />
                                </SelectTrigger>
                                <SelectContent>
                                    {semesters.map((sem) => (
                                        <SelectItem key={sem.semester} value={sem.semester.toString()}>
                                            Học kỳ {sem.semester}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Module Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Module</label>
                            <Select
                                value={selectedModule?.toString() || ''}
                                onValueChange={(value) => {
                                    setSelectedModule(value ? parseInt(value) : null);
                                    setSelectedEntryDate(null);
                                }}
                            >
                                <SelectTrigger disabled={!selectedClass || !selectedSemester || modules.length === 0}>
                                    <SelectValue placeholder="Chọn module" />
                                </SelectTrigger>
                                <SelectContent>
                                    {modules.map((mod) => (
                                        <SelectItem key={mod.moduleId} value={mod.moduleId.toString()}>
                                            {mod.moduleName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Entry Date Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Ngày chấm điểm <span className="text-red-500">*</span>
                            </label>
                            <Select
                                value={selectedEntryDate || ''}
                                onValueChange={(value) => setSelectedEntryDate(value || null)}
                            >
                                <SelectTrigger disabled={!selectedModule || availableEntryDates.length === 0}>
                                    <SelectValue placeholder="Chọn ngày chấm điểm" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableEntryDates.map((date) => (
                                        <SelectItem key={date} value={date}>
                                            {new Date(date).toLocaleDateString('vi-VN')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Export Button */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Xuất file</label>
                            <Button
                                onClick={handleExport}
                                disabled={
                                    !selectedClass ||
                                    !selectedSemester ||
                                    !selectedModule ||
                                    !selectedEntryDate ||
                                    exporting
                                }
                                className="w-full gap-2"
                                variant="outline"
                            >
                                <Download className="h-4 w-4" />
                                {exporting ? 'Đang xuất...' : 'Xuất Excel'}
                            </Button>
                        </div>

                        {/* Import Button */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nhập file</label>
                            <Button
                                onClick={() => {
                                    if (!selectedClass || !selectedSemester || !selectedModule || !selectedEntryDate) {
                                        toast.error('Vui lòng chọn lớp, học kỳ, module và ngày chấm điểm để nhập file');
                                        return;
                                    }
                                    setShowImportModal(true);
                                }}
                                disabled={
                                    !selectedClass ||
                                    !selectedSemester ||
                                    !selectedModule ||
                                    !selectedEntryDate
                                }
                                className="w-full gap-2"
                                variant="outline"
                            >
                                <Upload className="h-4 w-4" />
                                Nhập Excel
                            </Button>
                        </div>
            </div>

                    {/* Program Info */}
                    {selectedProgramName && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-md">
                            <p className="text-sm text-blue-800">
                                <span className="font-medium">Chương trình:</span> {selectedProgramName}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Grade Entries Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>
                                {selectedClass
                                    ? `Bảng điểm ${allClasses.find((c) => c.classId === selectedClass)?.className || ''}`
                                    : 'Bảng điểm'}
                            </CardTitle>
                            <CardDescription>
                                {selectedSemester
                                    ? `Học kỳ ${selectedSemester}${selectedModule ? ` - Module đã chọn` : ' - Tất cả modules'}`
                                    : 'Danh sách các bảng điểm theo module'}
                            </CardDescription>
                        </div>
                        {gradeEntries.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="destructive" size="sm" className="gap-2">
                                        <Trash2 className="h-4 w-4" />
                                        Xóa đợt nhập điểm
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {gradeEntries.map((entry) => (
                                        <DropdownMenuItem
                                            key={entry.gradeEntryId}
                                            onClick={() => handleDeleteClick(entry)}
                                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Xóa: {entry.moduleName}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {!selectedClass ? (
                        <div className="text-center py-12 text-gray-500">
                            Vui lòng chọn lớp học để xem danh sách bảng điểm
                        </div>
                    ) : !selectedSemester ? (
                        <div className="text-center py-12 text-gray-500">
                            Vui lòng chọn học kỳ để xem danh sách bảng điểm
                        </div>
                    ) : !selectedModule ? (
                        <div className="text-center py-12 text-gray-500">
                            Vui lòng chọn module để xem danh sách bảng điểm
                        </div>
                    ) : modules.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            {loading ? 'Đang tải...' : 'Không có module nào trong học kỳ này'}
                        </div>
                    ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">#</TableHead>
                                <TableHead>Module</TableHead>
                                <TableHead>Ngày chấm</TableHead>
                                <TableHead>Người chấm</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                                {modules
                                    .filter((mod) => mod.moduleId === selectedModule)
                                    .map((mod, index) => {
                                const entry = gradeEntries.find((e) => e.moduleId === mod.moduleId);
                                return (
                                    <TableRow key={mod.moduleId}>
                                        <TableCell className="font-medium">{index + 1}</TableCell>
                                        <TableCell>
                                            <div>
                                                        <p className="font-medium">{mod.moduleName}</p>
                                                        <p className="text-sm text-gray-500">
                                                            Học kỳ {mod.semester}
                                                        </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                                    {entry
                                                        ? new Date(entry.entryDate).toLocaleDateString('vi-VN')
                                                        : '—'}
                                        </TableCell>
                                        <TableCell>{entry ? entry.createdByName : '—'}</TableCell>
                                        <TableCell>
                                                    {entry ? (
                                                        <Badge className="bg-green-100 text-green-800">
                                                            Đã nhập điểm
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-gray-500">
                                                            Chưa nhập điểm
                                                        </Badge>
                                                    )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleGradeClick(mod.moduleId)}
                                                    className="gap-1"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                            {entry ? 'Sửa điểm' : 'Chấm điểm'}
                                                </Button>
                                                {entry && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                                onClick={() =>
                                                                    navigate(`/grades/${entry.gradeEntryId}/view`)
                                                                }
                                                        className="gap-1"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        Xem
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận xóa đợt nhập điểm</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn xóa đợt nhập điểm{' '}
                            <strong>{deletingEntry?.moduleName}</strong> không? Hành động này sẽ xóa toàn bộ điểm đã
                            nhập và không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>
                            Hủy
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? 'Đang xóa...' : 'Xóa'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Import Grades Modal */}
            {selectedClass && selectedModule && selectedEntryDate && (
                <ImportGradesModal
                    open={showImportModal}
                    onClose={() => setShowImportModal(false)}
                    onSuccess={async () => {
                        await loadGradeEntries();
                        setShowImportModal(false);
                        toast.success('Import điểm thành công');
                    }}
                    classId={selectedClass}
                    moduleId={selectedModule}
                    entryDate={selectedEntryDate}
                />
            )}
        </div>
    );
}

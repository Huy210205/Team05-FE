import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createExamResult, type StudentScoreInput } from '@/shared/api/exams';
import { createGradeEntry, type CreateGradeEntryRequest } from '@/shared/api/grade-entries';
import { getClassById, getMyLecturerClasses, type ClassDto } from '@/shared/api/classes';
import { getModulesByProgram } from '@/shared/api/modules';
import { getClassStudents } from '@/shared/api/classes';
import type { EnrollmentResponse } from '@/shared/types/classes';
import { toast } from 'sonner';

interface CreateExamResultModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

interface Module {
    moduleId: number;
    name: string;
    sequenceOrder: number;
}

interface Student {
    studentId: number;
    studentCode: string;
    fullName: string;
}

interface ScoreRow extends Student {
    theoryScore: string;
    practicalScore: string;
    note: string;
}

const CreateExamResultModal: React.FC<CreateExamResultModalProps> = ({ onClose, onSuccess }) => {
    const [classes, setClasses] = useState<ClassDto[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [selectedClassName, setSelectedClassName] = useState<string>('');
    const [programName, setProgramName] = useState<string>('');
    const [modules, setModules] = useState<Module[]>([]);

    const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
    const [selectedModule, setSelectedModule] = useState<number | null>(null);
    const [selectedModuleName, setSelectedModuleName] = useState<string>('');
    const [examDate, setExamDate] = useState<string>('');
    const [scoreRows, setScoreRows] = useState<ScoreRow[]>([]);

    const [submitting, setSubmitting] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [loadingClasses, setLoadingClasses] = useState(false);

    // Load classes when modal opens
    useEffect(() => {
        loadClasses();
        // Set current date as default
        const today = new Date().toISOString().split('T')[0];
        setExamDate(today);
    }, []);

    // Load class info and modules when class is selected
    useEffect(() => {
        if (selectedClassId) {
            loadClassInfo();
        } else {
            // Reset when class is deselected
            setSelectedClassName('');
            setProgramName('');
            setModules([]);
            setSelectedSemester(null);
            setSelectedModule(null);
            setSelectedModuleName('');
            setScoreRows([]);
        }
    }, [selectedClassId]);

    // Load students when module selected
    useEffect(() => {
        if (selectedModule && selectedClassId) {
            loadStudents();
        }
    }, [selectedModule, selectedClassId]);

    const loadClasses = async () => {
        try {
            setLoadingClasses(true);
            const response = await getMyLecturerClasses();
            setClasses(response.data);
        } catch (error) {
            toast.error('Không thể tải danh sách lớp');
        } finally {
            setLoadingClasses(false);
        }
    };

    const loadClassInfo = async () => {
        if (!selectedClassId) return;
        
        try {
            const response = await getClassById(selectedClassId);
            const classData = response.data;
            setSelectedClassName(classData.name || '');
            setProgramName(classData.programName || 'N/A');

            // Load modules from program
            const modulesResponse = await getModulesByProgram({ programId: classData.programId });
            setModules(modulesResponse.data);
        } catch (error) {
            toast.error('Không thể tải thông tin lớp');
        }
    };

    const loadStudents = async () => {
        if (!selectedClassId) return;
        
        try {
            setLoadingStudents(true);
            // Load ALL students (not filtering by status) - similar to ManageStudentsModal
            const response = await getClassStudents(selectedClassId, {
                page: 0,
                size: 1000,
            });
            // Handle Spring Page response structure
            let enrollments: EnrollmentResponse[] = [];
            if (response.data) {
                if (Array.isArray(response.data)) {
                    // If it's already an array
                    enrollments = response.data;
                } else if (response.data.content && Array.isArray(response.data.content)) {
                    // If it's a Spring Page object with content property
                    enrollments = response.data.content;
                } else {
                }
            }

            // Filter to only ACTIVE enrollments (students currently studying)
            const activeEnrollments = enrollments.filter((e) => e.status === 'ACTIVE');
            if (activeEnrollments.length === 0) {
                if (enrollments.length === 0) {
                    toast.warning('Lớp này chưa có học viên nào');
                } else {
                    toast.warning(`Lớp này có ${enrollments.length} học viên nhưng không có học viên nào đang học (ACTIVE)`);
                }
                setScoreRows([]);
                return;
            }

            // Initialize score rows
            const rows: ScoreRow[] = activeEnrollments.map((enrollment) => {
                const studentId = enrollment.studentId;
                if (!studentId) {
                    return null;
                }
                
                // Format studentCode: SV + 3 digits (e.g., SV009, SV005)
                // EnrollmentResponse doesn't have studentCode, so generate it from studentId
                const formattedCode = `SV${String(studentId).padStart(3, '0')}`;
                // EnrollmentResponse has studentName field
                const studentName = enrollment.studentName || `Student ${studentId}`;
                
                return {
                    studentId: studentId,
                    studentCode: formattedCode,
                    fullName: studentName,
                    theoryScore: '',
                    practicalScore: '',
                    note: '',
                };
            }).filter((row): row is ScoreRow => row !== null);
            setScoreRows(rows);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Không thể tải danh sách học viên. Vui lòng thử lại.');
            setScoreRows([]);
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleScoreChange = (studentId: number, field: 'theoryScore' | 'practicalScore' | 'note', value: string) => {
        setScoreRows((prev) => prev.map((row) => (row.studentId === studentId ? { ...row, [field]: value } : row)));
    };

    const handleSubmit = async () => {
        // Validation
        if (!selectedClassId) {
            toast.error('Vui lòng chọn lớp');
            return;
        }
        
        if (!selectedModule || !examDate) {
            toast.error('Vui lòng chọn module và ngày thi');
            return;
        }

        // Validate scores
        const gradeRecords: Array<{ studentId: number; theoryScore: number; practiceScore: number }> = [];
        for (const row of scoreRows) {
            const theory = parseFloat(row.theoryScore);
            const practical = parseFloat(row.practicalScore);

            if (isNaN(theory) || isNaN(practical)) {
                toast.error(`Vui lòng nhập đầy đủ điểm cho ${row.fullName}`);
                return;
            }

            if (theory < 0 || theory > 10 || practical < 0 || practical > 10) {
                toast.error(`Điểm phải từ 0 đến 10 cho ${row.fullName}`);
                return;
            }

            // Backend và frontend đều làm việc với thang điểm 0-10
            // Không cần chuyển đổi
            gradeRecords.push({
                studentId: row.studentId,
                theoryScore: theory,
                practiceScore: practical,
            });
        }

        try {
            setSubmitting(true);
            
            // Use new API
            const createRequest: CreateGradeEntryRequest = {
                classId: selectedClassId,
                moduleId: selectedModule,
                semester: selectedSemester || undefined,
                entryDate: examDate,
                gradeRecords: gradeRecords,
            };
            
            await createGradeEntry(createRequest);
            toast.success('Nhập điểm thành công');
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể nhập điểm');
        } finally {
            setSubmitting(false);
        }
    };

    // Calculate semesters
    const semesters = Array.from(new Set(modules.map((m) => Math.ceil(m.sequenceOrder / 6)))).sort((a, b) => a - b);

    // Filter modules by semester
    const filteredModules = selectedSemester
        ? modules.filter((m) => Math.ceil(m.sequenceOrder / 6) === selectedSemester)
        : [];

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nhập điểm</DialogTitle>
                    <DialogDescription>
                        Nhập điểm lý thuyết và thực hành cho học viên trong lớp đã chọn
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Form Section */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Lớp *</Label>
                            <Select
                                value={selectedClassId?.toString() || ''}
                                onValueChange={(val) => {
                                    const classId = parseInt(val);
                                    const selectedClass = classes.find(c => c.classId === classId);
                                    setSelectedClassId(classId);
                                    setSelectedClassName(selectedClass ? `${selectedClass.name} (${selectedClass.programName})` : '');
                                    setSelectedSemester(null);
                                    setSelectedModule(null);
                                    setSelectedModuleName('');
                                    setScoreRows([]);
                                }}
                            >
                                <SelectTrigger disabled={loadingClasses}>
                                    <SelectValue placeholder="Chọn lớp">
                                        {selectedClassName || 'Chọn lớp'}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map((c) => (
                                        <SelectItem key={c.classId} value={c.classId.toString()}>
                                            {c.name} ({c.programName})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Chương trình</Label>
                            <Input value={programName} disabled />
                        </div>

                        <div>
                            <Label>Kỳ học</Label>
                            <Select
                                value={selectedSemester?.toString() || ''}
                                onValueChange={(val) => {
                                    setSelectedSemester(parseInt(val));
                                    setSelectedModule(null);
                                    setSelectedModuleName('');
                                    setScoreRows([]);
                                }}
                            >
                                <SelectTrigger disabled={!selectedClassId}>
                                    <SelectValue placeholder="Chọn kỳ học">
                                        {selectedSemester ? `Kỳ ${selectedSemester}` : 'Chọn kỳ học'}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {semesters.map((sem) => (
                                        <SelectItem key={sem} value={sem.toString()}>
                                            Kỳ {sem}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Module</Label>
                            <Select
                                value={selectedModule?.toString() || ''}
                                onValueChange={(val) => {
                                    const moduleId = parseInt(val);
                                    const selectedModuleData = filteredModules.find(m => m.moduleId === moduleId);
                                    setSelectedModule(moduleId);
                                    setSelectedModuleName(selectedModuleData?.name || '');
                                    setScoreRows([]);
                                }}
                            >
                                <SelectTrigger disabled={!selectedSemester || !selectedClassId}>
                                    <SelectValue placeholder="Chọn module">
                                        {selectedModuleName || 'Chọn module'}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredModules.map((m) => (
                                        <SelectItem key={m.moduleId} value={m.moduleId.toString()}>
                                            {m.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Ngày thi</Label>
                            <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
                        </div>
                    </div>

                    {/* Student Scores Table */}
                    {selectedModule && loadingStudents && (
                        <div className="text-center py-8 text-gray-500">
                            <p>Đang tải danh sách học viên...</p>
                        </div>
                    )}

                    {selectedModule && !loadingStudents && scoreRows.length > 0 && (
                        <div>
                            <Label className="mb-2 block">Danh sách học viên ({scoreRows.length} học viên)</Label>
                            <div className="mb-2 p-3 bg-blue-50 rounded text-sm text-blue-700">
                                <strong>Công thức tính điểm:</strong> Điểm tổng = Lý thuyết × 30% + Thực hành × 70% |{' '}
                                <strong>Đạt:</strong> ≥ 5.0 điểm
                            </div>
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">STT</TableHead>
                                            <TableHead>Mã HV</TableHead>
                                            <TableHead>Họ và tên</TableHead>
                                            <TableHead className="w-[120px]">Điểm LT (0-10)</TableHead>
                                            <TableHead className="w-[120px]">Điểm TH (0-10)</TableHead>
                                            <TableHead className="w-[200px]">Ghi chú</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {scoreRows.map((row, index) => (
                                            <TableRow key={row.studentId}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>{row.studentCode}</TableCell>
                                                <TableCell>{row.fullName}</TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max="10"
                                                        step="0.1"
                                                        value={row.theoryScore}
                                                        onChange={(e) =>
                                                            handleScoreChange(
                                                                row.studentId,
                                                                'theoryScore',
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="0-10"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max="10"
                                                        step="0.1"
                                                        value={row.practicalScore}
                                                        onChange={(e) =>
                                                            handleScoreChange(
                                                                row.studentId,
                                                                'practicalScore',
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="0-10"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        value={row.note}
                                                        onChange={(e) =>
                                                            handleScoreChange(row.studentId, 'note', e.target.value)
                                                        }
                                                        placeholder="Ghi chú..."
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onClose} disabled={submitting}>
                            Hủy
                        </Button>
                        <Button onClick={handleSubmit} disabled={submitting || !selectedClassId || !selectedModule}>
                            {submitting ? 'Đang lưu...' : 'Lưu điểm'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CreateExamResultModal;

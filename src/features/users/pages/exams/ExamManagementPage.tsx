import React, { useState, useEffect } from 'react';
import { Plus, Filter, Edit, Trash2, Download, Upload, Calendar, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    getExamResultsByClass,
    getExamResultsByClassAndModule,
    deleteExamResult,
    updateExamResult,
    type ExamResultResponse,
} from '@/shared/api/exams';
import {
    deleteGradeEntry,
    updateGradeRecords,
    getStudentGrades,
    getGradeEntries,
    exportGrades,
    type UpdateGradeRecordsRequest,
    type StudentGradesResponse,
    type GradeRecordResponse,
    type GradeEntryResponse,
} from '@/shared/api/grade-entries';
import { getMyLecturerClasses } from '@/shared/api/classes';
import { getModulesByProgram } from '@/shared/api/modules';
import type { ModuleResponse } from '@/shared/api/modules';
import { getClassStudents } from '@/shared/api/classes';
import { toast } from 'sonner';
import CreateExamResultModal from './CreateExamResultModal';
import ImportExamGradesModal from './components/ImportExamGradesModal';

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

const ExamManagementPage: React.FC = () => {
    const [examResults, setExamResults] = useState<ExamResultResponse[]>([]);
    const [filteredResults, setFilteredResults] = useState<ExamResultResponse[]>([]);
    const [allClasses, setAllClasses] = useState<ClassOption[]>([]);
    const [allModules, setAllModules] = useState<ModuleResponse[]>([]);
    const [semesters, setSemesters] = useState<SemesterOption[]>([]);
    const [modules, setModules] = useState<ModuleOption[]>([]);

    // Grade entries (đợt nhập điểm) - hiển thị khi chọn kì
    const [gradeEntries, setGradeEntries] = useState<GradeEntryResponse[]>([]);
    const [filteredEntries, setFilteredEntries] = useState<GradeEntryResponse[]>([]);

    // Filter state
    const [selectedClass, setSelectedClass] = useState<number | null>(null);
    const [selectedProgram, setSelectedProgram] = useState<number | null>(null);
    const [selectedProgramName, setSelectedProgramName] = useState<string>('');
    const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
    const [selectedModule, setSelectedModule] = useState<number | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');

    // Modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    
    // Entry detail dialog state - hiển thị điểm khi click vào card
    const [showEntryDetailDialog, setShowEntryDetailDialog] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<GradeEntryResponse | null>(null);

    // Edit state - track which row is being edited
    const [editingRow, setEditingRow] = useState<{
        examResultId: number;
        studentId: number;
    } | null>(null);
    const [editingScores, setEditingScores] = useState<{
        theoryScore: string;
        practicalScore: string;
        note: string;
    } | null>(null);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [studentsMap, setStudentsMap] = useState<Map<number, { studentCode: string; fullName: string }>>(new Map());
    
    // Import state
    const [importEntryDate, setImportEntryDate] = useState<string>('');
    const [exporting, setExporting] = useState(false);

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
            setSelectedDate('');
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

    // Khi chọn semester, reset module và date, load grade entries
    useEffect(() => {
        // Reset module và date khi semester thay đổi
        setSelectedModule(null);
        setSelectedDate('');
        
        if (selectedClass && selectedSemester) {
            // Load tất cả grade entries cho semester này (không filter module)
            loadGradeEntries(selectedClass, undefined);
        } else {
            setGradeEntries([]);
            setFilteredEntries([]);
            setModules([]);
        }
    }, [selectedSemester, selectedClass]);

    // Khi selectedModule thay đổi, reload grade entries với filter
    useEffect(() => {
        if (selectedClass && selectedSemester && selectedModule) {
            loadGradeEntries(selectedClass, selectedModule);
        }
    }, [selectedModule]);

    // Load exam results chỉ khi chọn ngày (cho table view)
    useEffect(() => {
        if (selectedClass && selectedSemester && selectedModule && selectedDate) {
            loadStudentGradesForTableView(selectedClass, selectedSemester, selectedModule, selectedDate);
        } else {
            // Không clear examResults vì có thể đang dùng cho dialog
            if (!showEntryDetailDialog) {
                setExamResults([]);
                setFilteredResults([]);
            }
        }
    }, [selectedClass, selectedSemester, selectedModule, selectedDate]);

    // Filter grade entries khi thay đổi module filter
    useEffect(() => {
        applyEntryFilters();
    }, [gradeEntries, selectedModule]);

    // Filter exam results khi thay đổi date filter
    useEffect(() => {
        applyFilters();
    }, [examResults, selectedDate]);

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

    /**
     * Load students để lấy studentCode
     * Chỉ lấy học viên ACTIVE để đảm bảo consistency
     */
    const loadStudentsForClass = async (classId: number) => {
        try {
            const response = await getClassStudents(classId, {
                status: 'ACTIVE',
                page: 0,
                size: 1000,
            });
            const students = response.data?.content || response.data || [];
            // Filter to only ACTIVE enrollments if status filter didn't work
            const activeStudents = Array.isArray(students) 
                ? students.filter((s: any) => s.status === 'ACTIVE')
                : [];
            
            const map = new Map<number, { studentCode: string; fullName: string }>();
            activeStudents.forEach((s: any) => {
                const studentId = s.studentId;
                if (!studentId) return; // Skip invalid entries
                const studentCode = s.studentCode || `SV${String(studentId).padStart(3, '0')}`;
                const fullName = s.studentName || s.fullName || s.name || `Student ${studentId}`;
                map.set(studentId, { studentCode, fullName });
            });
            setStudentsMap(map);
        } catch (error) {
            // Không show error vì không critical
        }
    };

    /**
     * Load danh sách grade entries (đợt nhập điểm) cho class và optional moduleId
     * Sẽ hiển thị dạng cards khi chỉ chọn semester (chưa chọn ngày)
     */
    const loadGradeEntries = async (classId: number, moduleId?: number) => {
        try {
            setLoading(true);
            const entries = await getGradeEntries(classId, moduleId, undefined);
            setGradeEntries(entries);
            
            // Nếu không có moduleId filter, extract unique modules từ entries
            if (!moduleId && entries.length > 0) {
                const uniqueModulesMap = new Map<number, ModuleOption>();
                entries.forEach((entry) => {
                    if (!uniqueModulesMap.has(entry.moduleId)) {
                        // Tìm semester từ allModules
                        const moduleData = allModules.find(m => m.moduleId === entry.moduleId);
                        uniqueModulesMap.set(entry.moduleId, {
                            moduleId: entry.moduleId,
                            moduleName: entry.moduleName,
                            semester: moduleData?.semester || selectedSemester || 1,
                        });
                    }
                });
                const moduleOptions = Array.from(uniqueModulesMap.values());
                setModules(moduleOptions);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể tải danh sách đợt nhập điểm');
            setGradeEntries([]);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Filter grade entries theo module (nếu có)
     */
    const applyEntryFilters = () => {
        let filtered = [...gradeEntries];

        // Filter by module nếu đã chọn
        if (selectedModule) {
            filtered = filtered.filter((entry) => entry.moduleId === selectedModule);
        }

        setFilteredEntries(filtered);
    };

    /**
     * Load student grades cho table view khi chọn ngày
     */
    const loadStudentGradesForTableView = async (classId: number, semester: number, moduleId: number, entryDate: string) => {
        try {
            setLoading(true);
            
            // Load students để lấy studentCode
            await loadStudentsForClass(classId);
            
            const response = await getStudentGrades(classId, semester, moduleId);
            
            if (response.gradeRecords) {
                // Filter chỉ lấy records có entryDate khớp
                const recordsForDate = response.gradeRecords.filter(
                    (record: GradeRecordResponse) => record.entryDate === entryDate
                );

                if (recordsForDate.length > 0) {
                    // Map thành ExamResultResponse format
                    const mappedResults: ExamResultResponse[] = [{
                        examResultId: 0,
                        classId: response.classId,
                        className: response.className,
                        moduleId: response.moduleId || moduleId,
                        moduleName: '', // Sẽ lấy từ allModules
                        examDate: entryDate,
                        createdBy: 0,
                        creatorName: '',
                        createdAt: '',
                        updatedAt: '',
                        studentScores: recordsForDate.map((record: GradeRecordResponse) => {
                            const studentInfo = studentsMap.get(record.studentId);
                            return {
                                studentId: record.studentId,
                                studentCode: studentInfo?.studentCode || record.studentEmail?.split('@')[0] || `SV${String(record.studentId).padStart(3, '0')}`,
                                fullName: record.studentName,
                                theoryScore: record.theoryScore != null ? record.theoryScore : 0,
                                practicalScore: record.practiceScore != null ? record.practiceScore : 0,
                                finalScore: record.finalScore != null ? record.finalScore : 0,
                                status: record.passStatus as 'PASS' | 'FAIL',
                                note: undefined,
                            };
                        }),
                    }];
                    
                    // Lấy moduleName từ allModules
                    const moduleData = allModules.find((m) => m.moduleId === moduleId);
                    if (moduleData) {
                        mappedResults.forEach((result) => {
                            (result as any).moduleName = moduleData.name;
                        });
                    }
                    
                    setExamResults(mappedResults);
                    setFilteredResults(mappedResults);
                } else {
                    setExamResults([]);
                    setFilteredResults([]);
                }
            } else {
                setExamResults([]);
                setFilteredResults([]);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể tải danh sách điểm');
            setExamResults([]);
            setFilteredResults([]);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Load student grades từ API mới
     * - Nếu chưa có moduleId: API trả về danh sách modules
     * - Nếu có moduleId: API trả về danh sách điểm của học viên
     */
    const loadStudentGrades = async (classId: number, semester: number, moduleId?: number) => {
        try {
            setLoading(true);
            
            // Load students để lấy studentCode
            await loadStudentsForClass(classId);
            
            const response = await getStudentGrades(classId, semester, moduleId);
            
            // Nếu chưa có moduleId, API trả về danh sách modules
            if (!moduleId) {
                if (response.modules && response.modules.length > 0) {
                    // Cập nhật danh sách modules từ API
                    // Backend trả về ModuleResponse với field 'name', không phải 'moduleName'
                    const moduleOptions: ModuleOption[] = response.modules.map((m: any) => ({
                        moduleId: m.moduleId,
                        moduleName: m.moduleName || m.name, // Hỗ trợ cả 2 format
                        semester: m.semester || semester,
                    }));
                    setModules(moduleOptions);
                } else {
                    // Không có modules, set rỗng
                    setModules([]);
                }
                setExamResults([]);
                setFilteredResults([]);
                return;
            }
            
            // Nếu có moduleId, API trả về gradeRecords
            if (moduleId && response.gradeRecords) {
                // Lọc bỏ các records không có entryDate hợp lệ
                const validRecords = response.gradeRecords.filter(
                    (record: GradeRecordResponse) => 
                        record.entryDate && 
                        record.entryDate.trim() !== '' &&
                        record.entryDate !== null &&
                        record.entryDate !== undefined
                );

                // Group gradeRecords theo entryDate (chỉ các records có entryDate hợp lệ)
                const recordsByDate = new Map<string, GradeRecordResponse[]>();
                validRecords.forEach((record: GradeRecordResponse) => {
                    const entryDate = record.entryDate!; // Đã được filter ở trên nên không null
                    if (!recordsByDate.has(entryDate)) {
                        recordsByDate.set(entryDate, []);
                    }
                    recordsByDate.get(entryDate)!.push(record);
                });

                // Map mỗi entryDate thành một ExamResultResponse
                const mappedResults: ExamResultResponse[] = Array.from(recordsByDate.entries()).map(([entryDate, records]) => {
                    return {
                        examResultId: 0, // API không trả về examResultId, dùng 0 tạm thời
                        classId: response.classId,
                        className: response.className,
                        moduleId: response.moduleId || moduleId,
                        moduleName: '', // Sẽ lấy từ allModules
                        examDate: entryDate, // Lấy từ entryDate của gradeRecord
                        createdBy: 0,
                        creatorName: '',
                        createdAt: '',
                        updatedAt: '',
                        studentScores: records.map((record: GradeRecordResponse) => {
                            const studentInfo = studentsMap.get(record.studentId);
                            // Backend và frontend đều làm việc với thang điểm 0-10
                            // Không cần chuyển đổi
                            const theoryScore = record.theoryScore != null ? record.theoryScore : 0;
                            const practiceScore = record.practiceScore != null ? record.practiceScore : 0;
                            const finalScore = record.finalScore != null ? record.finalScore : 0;
                            // Pass status được tính từ backend dựa trên thang 0-10 (>= 5 là PASS)
                            const passStatus = record.passStatus as 'PASS' | 'FAIL';
                            return {
                                studentId: record.studentId,
                                studentCode: studentInfo?.studentCode || record.studentEmail?.split('@')[0] || `SV${String(record.studentId).padStart(3, '0')}`,
                                fullName: record.studentName,
                                theoryScore: theoryScore,
                                practicalScore: practiceScore,
                                finalScore: finalScore,
                                status: passStatus,
                                note: undefined,
                            };
                        }),
                    };
                });
                
                // Lấy moduleName từ allModules và set cho tất cả results
                const moduleData = allModules.find((m) => m.moduleId === moduleId);
                if (moduleData) {
                    mappedResults.forEach((result) => {
                        (result as any).moduleName = moduleData.name;
                    });
                }
                
                setExamResults(mappedResults);
            } else {
                setExamResults([]);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể tải danh sách điểm');
            setExamResults([]);
            setFilteredResults([]);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        // Nếu dialog đang mở, không filter (dialog có data riêng)
        if (showEntryDetailDialog) {
            return;
        }
        
        // Chỉ hiển thị kết quả khi đã chọn cả module và ngày (cho table view)
        if (!selectedModule || !selectedDate) {
            setFilteredResults([]);
            return;
        }

        let filtered = [...examResults];

        // Filter by module (should already be filtered by API, but double check)
        filtered = filtered.filter((r) => r.moduleId === selectedModule);

        // Filter by exam date (bắt buộc)
        filtered = filtered.filter((r) => r.examDate === selectedDate);

        setFilteredResults(filtered);
    };

    /**
     * Xử lý khi click vào card grade entry - hiển thị dialog với danh sách điểm
     */
    const handleEntryClick = async (entry: GradeEntryResponse) => {
        try {
            setLoading(true);
            setSelectedEntry(entry);
            
            // Load students trước và đợi hoàn thành
            if (selectedClass) {
                await loadStudentsForClass(selectedClass);
            }
            
            // Load điểm của đợt này với moduleId của entry
            if (selectedSemester && selectedClass) {
                const response = await getStudentGrades(selectedClass, selectedSemester, entry.moduleId);
                if (response.gradeRecords && response.gradeRecords.length > 0) {
                    // Filter chỉ lấy records có entryDate khớp với entry được click
                    const recordsForThisEntry = response.gradeRecords.filter(
                        (record: GradeRecordResponse) => record.entryDate === entry.entryDate
                    );
                    if (recordsForThisEntry.length > 0) {
                        // Map thành ExamResultResponse format
                        const mappedResults: ExamResultResponse[] = [{
                            examResultId: entry.gradeEntryId,
                            classId: entry.classId,
                            className: entry.className,
                            moduleId: entry.moduleId,
                            moduleName: entry.moduleName,
                            examDate: entry.entryDate,
                            createdBy: entry.createdBy,
                            creatorName: entry.createdByName,
                            createdAt: entry.createdAt,
                            updatedAt: entry.updatedAt,
                            studentScores: recordsForThisEntry.map((record: GradeRecordResponse) => {
                                const studentInfo = studentsMap.get(record.studentId);
                                return {
                                    studentId: record.studentId,
                                    studentCode: studentInfo?.studentCode || record.studentEmail?.split('@')[0] || `SV${String(record.studentId).padStart(3, '0')}`,
                                    fullName: record.studentName,
                                    theoryScore: record.theoryScore != null ? record.theoryScore : 0,
                                    practicalScore: record.practiceScore != null ? record.practiceScore : 0,
                                    finalScore: record.finalScore != null ? record.finalScore : 0,
                                    status: record.passStatus as 'PASS' | 'FAIL',
                                    note: undefined,
                                };
                            }),
                        }];
                        setExamResults(mappedResults);
                        setFilteredResults(mappedResults);
                        
                        // Mở dialog sau khi set state
                        setShowEntryDetailDialog(true);
                    } else {
                        setExamResults([]);
                        setFilteredResults([]);
                        // Vẫn mở dialog để hiển thị "Chưa có điểm"
                        setShowEntryDetailDialog(true);
                    }
                } else {
                    setExamResults([]);
                    setFilteredResults([]);
                    // Vẫn mở dialog để hiển thị "Chưa có điểm"
                    setShowEntryDetailDialog(true);
                }
            } else {
                // Nếu không có semester/class, vẫn mở dialog
                setShowEntryDetailDialog(true);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể tải chi tiết đợt nhập điểm');
            setExamResults([]);
            setFilteredResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (examResult: ExamResultResponse) => {
        if (!confirm('Bạn có chắc chắn muốn xóa đợt nhập điểm này?')) {
            return;
        }

        try {
            // Get entryDate từ grade entry mới nhất
            let entryDate = examResult.examDate;
            if (!entryDate) {
                try {
                    const gradeEntries = await getGradeEntries(examResult.classId, examResult.moduleId);
                    if (gradeEntries.length > 0) {
                        entryDate = gradeEntries[0].entryDate;
                    } else {
                        toast.error('Không tìm thấy đợt nhập điểm để xóa');
                        return;
                    }
                } catch (error) {
                    toast.error('Không thể lấy thông tin đợt nhập điểm');
                    return;
                }
            }

            await deleteGradeEntry(examResult.classId, examResult.moduleId, entryDate);
            toast.success('Xóa đợt nhập điểm thành công');

            // Reload data using new API
            if (selectedClass && selectedSemester) {
                if (selectedModule) {
                    loadStudentGrades(selectedClass, selectedSemester, selectedModule);
                } else {
                    loadStudentGrades(selectedClass, selectedSemester);
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể xóa đợt nhập điểm');
        }
    };

    const handleDeleteAll = async () => {
        if (filteredResults.length === 0) return;

        // Get unique entries by classId, moduleId, entryDate
        const uniqueEntries = new Map<string, { classId: number; moduleId: number; entryDate: string }>();
        
        filteredResults.forEach((result) => {
            const key = `${result.classId}-${result.moduleId}-${result.examDate}`;
            if (!uniqueEntries.has(key)) {
                uniqueEntries.set(key, {
                    classId: result.classId,
                    moduleId: result.moduleId,
                    entryDate: result.examDate,
                });
            }
        });

        try {
            setDeleting(true);
            
            // Delete all entries in parallel using new API
            await Promise.all(
                Array.from(uniqueEntries.values()).map((entry) =>
                    deleteGradeEntry(entry.classId, entry.moduleId, entry.entryDate)
                )
            );
            
            toast.success(`Đã xóa ${uniqueEntries.size} đợt nhập điểm thành công`);
            setShowDeleteDialog(false);

            // Reload data using new API
            if (selectedClass && selectedSemester) {
                if (selectedModule) {
                    loadStudentGrades(selectedClass, selectedSemester, selectedModule);
                } else {
                    loadStudentGrades(selectedClass, selectedSemester);
                }
            }
        } catch (error) {
            toast.error('Không thể xóa đợt nhập điểm');
        } finally {
            setDeleting(false);
        }
    };

    const handleStartEdit = (examResult: ExamResultResponse, studentId: number) => {
        const score = examResult.studentScores.find((s) => s.studentId === studentId);
        if (score) {
            setEditingRow({ examResultId: examResult.examResultId, studentId });
            setEditingScores({
                theoryScore: score.theoryScore.toString(),
                practicalScore: score.practicalScore.toString(),
                note: score.note || '',
            });
        }
    };

    const handleCancelEdit = () => {
        setEditingRow(null);
        setEditingScores(null);
    };

    const handleSaveEdit = async () => {
        if (!editingRow || !editingScores) return;

        const theory = parseFloat(editingScores.theoryScore);
        const practical = parseFloat(editingScores.practicalScore);

        if (isNaN(theory) || isNaN(practical)) {
            toast.error('Vui lòng nhập đầy đủ điểm');
            return;
        }

        if (theory < 0 || theory > 10 || practical < 0 || practical > 10) {
            toast.error('Điểm phải từ 0 đến 10');
            return;
        }

        try {
            setSaving(true);
            const examResult = filteredResults.find((r) => r.examResultId === editingRow.examResultId);
            if (!examResult) return;

            // Prepare grade records for new API - chỉ gửi học viên đang được edit
            // Backend sẽ chỉ update học viên trong request, không xóa học viên khác
            const gradeRecords = [{
                studentId: editingRow.studentId,
                theoryScore: theory,
                practiceScore: practical,
            }];

            // Get semester from selected module or find from allModules
            let semester = selectedSemester;
            if (!semester) {
                const moduleData = allModules.find((m) => m.moduleId === examResult.moduleId);
                semester = moduleData?.semester || 1; // Fallback to 1 if not available
            }

            // Get entryDate from grade entry mới nhất (vì API getStudentGrades không trả về entryDate)
            let entryDate = examResult.examDate;
            if (!entryDate) {
                try {
                    const gradeEntries = await getGradeEntries(examResult.classId, examResult.moduleId);
                    if (gradeEntries.length > 0) {
                        // Lấy entryDate từ entry mới nhất
                        entryDate = gradeEntries[0].entryDate;
                    } else {
                        // Fallback to today if no entries
                        entryDate = new Date().toISOString().split('T')[0];
                    }
                } catch (error) {
                    // Fallback to today if error
                    entryDate = new Date().toISOString().split('T')[0];
                }
            }

            // Use new API to update grade records
            const updateRequest: UpdateGradeRecordsRequest = {
                classId: examResult.classId,
                moduleId: examResult.moduleId,
                semester: semester,
                entryDate: entryDate,
                gradeRecords: gradeRecords,
            };
            const response = await updateGradeRecords(updateRequest);
            toast.success('Cập nhật điểm thành công');
            setEditingRow(null);
            setEditingScores(null);

            // Reload data
            if (selectedClass && selectedSemester) {
                // Nếu đang mở dialog entry detail, reload cho entry đó
                if (showEntryDetailDialog && selectedEntry) {
                    await handleEntryClick(selectedEntry);
                }
                // Nếu đang xem table view (đã chọn ngày), reload table
                else if (selectedModule && selectedDate) {
                    loadStudentGrades(selectedClass, selectedSemester, selectedModule);
                }
                // Reload entries list
                loadGradeEntries(selectedClass, selectedModule || undefined);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể cập nhật điểm');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateSuccess = () => {
        setShowCreateModal(false);
        // Reload entries list
        if (selectedClass && selectedSemester) {
            loadGradeEntries(selectedClass, selectedModule || undefined);
            // Nếu đang xem table, reload table
            if (selectedModule && selectedDate) {
                loadStudentGrades(selectedClass, selectedSemester, selectedModule);
            }
        }
    };

    const handleExport = async () => {
        if (!selectedClass || !selectedSemester || !selectedModule || !selectedDate) {
            toast.error('Vui lòng chọn đầy đủ thông tin để export');
            return;
        }

        try {
            setExporting(true);
            await exportGrades(selectedClass, selectedSemester, selectedModule, selectedDate);
            toast.success('Export điểm thành công');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể export điểm');
        } finally {
            setExporting(false);
        }
    };

    const handleImportSuccess = () => {
        // Reload entries list
        if (selectedClass && selectedSemester) {
            loadGradeEntries(selectedClass, selectedModule || undefined);
            // Nếu đang xem table, reload table
            if (selectedModule && selectedDate) {
                loadStudentGrades(selectedClass, selectedSemester, selectedModule);
            }
        }
    };


    // Get unique exam dates for filter (từ examDate = entryDate)
    // Lọc bỏ các giá trị rỗng và đảm bảo format đúng (ISO date: YYYY-MM-DD)
    const uniqueDates = Array.from(
        new Set(
            examResults
                .map((r) => r.examDate)
                .filter((date): date is string => {
                    // Chỉ lấy các date hợp lệ (không rỗng, không null/undefined)
                    if (!date || typeof date !== 'string' || date.trim() === '') {
                        return false;
                    }
                    // Kiểm tra format ISO date (YYYY-MM-DD)
                    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
                    return isoDateRegex.test(date.trim());
                })
        )
    ).sort(); // Sắp xếp theo thứ tự tăng dần

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Quản lý Điểm thi</h1>
                    <p className="text-sm text-gray-500">Tạo và quản lý các đợt nhập điểm cho học viên</p>
                </div>
                <div className="flex gap-2">
                    {selectedClass && selectedSemester && selectedModule && (
                        <Button
                            variant="outline"
                            onClick={() => setShowImportModal(true)}
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Import
                        </Button>
                    )}
                    {selectedClass && selectedSemester && selectedModule && selectedDate && (
                        <Button
                            variant="outline"
                            onClick={handleExport}
                            disabled={exporting}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            {exporting ? 'Đang export...' : 'Export'}
                        </Button>
                    )}
                    <Button onClick={() => setShowCreateModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nhập điểm
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex items-center gap-4">
                    <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="flex flex-wrap items-center gap-3 flex-1">
                        {/* Chọn lớp */}
                        <div className="min-w-[180px] flex-1">
                            <Select
                                value={selectedClass?.toString() || ''}
                                onValueChange={(val) => {
                                    const classId = parseInt(val);
                                    setSelectedClass(classId);
                                    setSelectedSemester(null);
                                    setSelectedModule(null);
                                    setSelectedDate('');
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn lớp">
                                        {selectedClass
                                            ? allClasses.find((c) => c.classId === selectedClass)?.className || 'Chọn lớp'
                                            : 'Chọn lớp'}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {allClasses.map((c) => (
                                        <SelectItem key={c.classId} value={c.classId.toString()}>
                                            {c.className}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Chương trình */}
                        {selectedClass && selectedProgramName && (
                            <div className="min-w-[200px] flex-1 flex items-center justify-center px-3 py-2 border rounded-md bg-gray-50">
                                <span className="text-sm text-gray-700 text-center">
                                    <span className="font-medium">Chương trình:</span> {selectedProgramName}
                                </span>
                            </div>
                        )}
                        {selectedClass && !selectedProgramName && (
                            <div className="min-w-[200px] flex-1 flex items-center justify-center px-3 py-2 border rounded-md bg-gray-50">
                                <span className="text-sm text-gray-500 italic">Đang tải...</span>
                            </div>
                        )}

                        {/* Chọn kì */}
                        {selectedClass && semesters.length > 0 && (
                            <div className="min-w-[150px] flex-1">
                                <Select
                                    value={selectedSemester?.toString() || ''}
                                    onValueChange={(val) => {
                                        const semester = parseInt(val);
                                        setSelectedSemester(semester);
                                        setSelectedModule(null);
                                        setSelectedDate('');
                                    }}
                                >
                                    <SelectTrigger className="text-center">
                                        <SelectValue placeholder="Chọn kì">
                                            {selectedSemester ? `Kì ${selectedSemester}` : 'Chọn kì'}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {semesters.map((s) => (
                                            <SelectItem key={s.semester} value={s.semester.toString()}>
                                                Kì {s.semester}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {selectedClass && semesters.length === 0 && allModules.length === 0 && (
                            <div className="min-w-[150px] flex-1 flex items-center justify-center px-3 py-2 border rounded-md bg-gray-50">
                                <span className="text-sm text-gray-500 italic">Đang tải...</span>
                            </div>
                        )}
                        {selectedClass && semesters.length === 0 && allModules.length > 0 && (
                            <div className="min-w-[150px] flex-1 flex items-center justify-center px-3 py-2 border rounded-md bg-gray-50">
                                <span className="text-sm text-gray-500 italic">Không có kì học</span>
                            </div>
                        )}

                        {/* Chọn module */}
                        {selectedSemester && modules.length > 0 && (
                            <div className="min-w-[200px] flex-1">
                                <Select
                                    value={selectedModule?.toString() || ''}
                                    onValueChange={(val) => {
                                        setSelectedModule(val ? parseInt(val) : null);
                                        setSelectedDate('');
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tất cả modules">
                                            {selectedModule
                                                ? (modules.find((m) => m.moduleId === selectedModule)?.moduleName || 'Tất cả modules')
                                                : 'Tất cả modules'}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Tất cả modules</SelectItem>
                                        {modules.map((m) => (
                                            <SelectItem key={m.moduleId} value={m.moduleId.toString()}>
                                                {m.moduleName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Chọn ngày thi - optional để xem table view */}
                        {selectedSemester && filteredEntries.length > 0 && (
                            <div className="min-w-[180px] flex-1">
                                <Select
                                    value={selectedDate || ''}
                                    onValueChange={(val) => setSelectedDate(val || '')}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn ngày (optional)">
                                            {selectedDate ? (() => {
                                                try {
                                                    const dateObj = new Date(selectedDate + 'T00:00:00');
                                                    return dateObj.toLocaleDateString('vi-VN', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit',
                                                    });
                                                } catch {
                                                    return selectedDate;
                                                }
                                            })() : 'Chọn ngày (optional)'}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Không chọn (xem cards)</SelectItem>
                                        {Array.from(new Set(filteredEntries.map(e => e.entryDate))).sort().map((date) => {
                                            try {
                                                const dateObj = new Date(date + 'T00:00:00');
                                                const formattedDate = dateObj.toLocaleDateString('vi-VN', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                });
                                                return (
                                                    <SelectItem key={date} value={date}>
                                                        {formattedDate}
                                                    </SelectItem>
                                                );
                                            } catch (error) {
                                                return (
                                                    <SelectItem key={date} value={date}>
                                                        {date}
                                                    </SelectItem>
                                                );
                                            }
                                        })}
                                </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* Content Area - hiển thị cards hoặc table tùy theo filter */}
            {!selectedClass ? (
                <Card className="p-8 text-center text-gray-500">
                    <p>Vui lòng chọn lớp để xem danh sách điểm thi</p>
                </Card>
            ) : !selectedSemester ? (
                <Card className="p-8 text-center text-gray-500">
                    <p>Vui lòng chọn kì để xem danh sách điểm thi</p>
                </Card>
            ) : selectedDate ? (
                // TABLE VIEW - Khi đã chọn ngày, hiển thị bảng điểm như cũ
                loading ? (
                    <Card className="p-8 text-center">
                        <p>Đang tải...</p>
                    </Card>
                ) : filteredResults.length === 0 ? (
                    <Card className="p-8 text-center text-gray-500">
                        <p>Chưa có điểm thi nào</p>
                    </Card>
                ) : (
                    <Card>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">
                                    Danh sách điểm thi ({filteredResults.reduce((sum, r) => sum + r.studentScores.length, 0)} học viên)
                                </h3>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setShowDeleteDialog(true)}
                                    className="gap-2"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Xóa đợt nhập điểm
                                </Button>
                            </div>
                            <div className="border rounded-lg overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">STT</TableHead>
                                            <TableHead>Mã HV</TableHead>
                                            <TableHead>Họ và tên</TableHead>
                                            <TableHead className="text-center">Điểm LT</TableHead>
                                            <TableHead className="text-center">Điểm TH</TableHead>
                                            <TableHead className="text-center">Điểm tổng</TableHead>
                                            <TableHead className="text-center">Kết quả</TableHead>
                                            <TableHead>Ghi chú</TableHead>
                                            <TableHead className="text-right">Thao tác</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredResults.flatMap((result, resultIndex) =>
                                            result.studentScores.map((score, scoreIndex) => {
                                                const globalIndex = filteredResults
                                                    .slice(0, resultIndex)
                                                    .reduce((sum, r) => sum + r.studentScores.length, 0) + scoreIndex + 1;
                                                
                                                const isEditing = editingRow?.examResultId === result.examResultId && editingRow?.studentId === score.studentId;
                                                const uniqueKey = `table-${resultIndex}-${result.examDate}-${score.studentId}`;
                                                
                                                return (
                                                    <TableRow key={uniqueKey}>
                                                        <TableCell>{globalIndex}</TableCell>
                                                        <TableCell>{score.studentCode}</TableCell>
                                                        <TableCell>{score.fullName}</TableCell>
                                                        <TableCell className="text-center">
                                                            {isEditing && editingScores ? (
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    max="10"
                                                                    step="0.1"
                                                                    value={editingScores.theoryScore}
                                                                    onChange={(e) =>
                                                                        setEditingScores({
                                                                            ...editingScores,
                                                                            theoryScore: e.target.value,
                                                                        })
                                                                    }
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            e.preventDefault();
                                                                            handleSaveEdit();
                                                                        } else if (e.key === 'Escape') {
                                                                            handleCancelEdit();
                                                                        }
                                                                    }}
                                                                    className="w-20 text-center"
                                                                    autoFocus
                                                                />
                                                            ) : (
                                                                score.theoryScore
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {isEditing && editingScores ? (
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    max="10"
                                                                    step="0.1"
                                                                    value={editingScores.practicalScore}
                                                                    onChange={(e) =>
                                                                        setEditingScores({
                                                                            ...editingScores,
                                                                            practicalScore: e.target.value,
                                                                        })
                                                                    }
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            e.preventDefault();
                                                                            handleSaveEdit();
                                                                        } else if (e.key === 'Escape') {
                                                                            handleCancelEdit();
                                                                        }
                                                                    }}
                                                                    className="w-20 text-center"
                                                                />
                                                            ) : (
                                                                score.practicalScore
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-center font-medium">
                                                            {score.finalScore}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge
                                                                variant={score.status === 'PASS' ? 'success' : 'destructive'}
                                                                className={
                                                                    score.status === 'PASS'
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : 'bg-red-100 text-red-800'
                                                                }
                                                            >
                                                                {score.status === 'PASS' ? 'Đạt' : 'Không đạt'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-gray-600">
                                                            {isEditing && editingScores ? (
                                                                <Input
                                                                    type="text"
                                                                    value={editingScores.note}
                                                                    onChange={(e) =>
                                                                        setEditingScores({
                                                                            ...editingScores,
                                                                            note: e.target.value,
                                                                        })
                                                                    }
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            handleSaveEdit();
                                                                        } else if (e.key === 'Escape') {
                                                                            handleCancelEdit();
                                                                        }
                                                                    }}
                                                                    onBlur={handleSaveEdit}
                                                                    className="w-full"
                                                                    placeholder="Ghi chú"
                                                                />
                                                            ) : (
                                                                score.note || '-'
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                {isEditing ? (
                                                                    <>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={handleSaveEdit}
                                                                            disabled={saving}
                                                                            title="Lưu"
                                                                        >
                                                                            {saving ? 'Đang lưu...' : 'Lưu'}
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={handleCancelEdit}
                                                                            disabled={saving}
                                                                            title="Hủy"
                                                                        >
                                                                            Hủy
                                                                        </Button>
                                                                    </>
                                                                ) : (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleStartEdit(result, score.studentId)}
                                                                        title="Chỉnh sửa điểm"
                                                                    >
                                                                        <Edit className="w-4 h-4" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </Card>
                )
            ) : (
                // CARDS VIEW - Khi chưa chọn ngày, hiển thị cards các đợt nhập điểm
                loading ? (
                    <Card className="p-8 text-center">
                        <p>Đang tải...</p>
                    </Card>
                ) : filteredEntries.length === 0 ? (
                    <Card className="p-8 text-center text-gray-500">
                        <p>Chưa có đợt nhập điểm nào</p>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                            Danh sách đợt nhập điểm ({filteredEntries.length} đợt)
                        </h3>
                        <div className="space-y-3">
                            {filteredEntries.map((entry) => {
                                // Tính số lượng pass/fail
                                const passCount = entry.passCount || 0;
                                const failCount = entry.failCount || 0;
                                
                                return (
                                    <Card
                                        key={entry.gradeEntryId}
                                        className="p-3 hover:shadow-md transition-shadow cursor-pointer border hover:border-blue-400"
                                        onClick={() => handleEntryClick(entry)}
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            {/* Left: Semester badge */}
                                            <div className="flex-shrink-0">
                                                <div className="bg-purple-50 text-purple-600 px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5">
                                                    <BookOpen className="w-3.5 h-3.5" />
                                                    Học kỳ {entry.semester}
                                                </div>
                                            </div>

                                            {/* Center: Module info and metadata */}
                                            <div className="flex-1 space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className="w-4 h-4 text-blue-600" />
                                                    <h4 className="font-semibold text-sm">
                                                        {entry.moduleName}
                                                    </h4>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-gray-600">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        <span>
                                                            {(() => {
                                                                try {
                                                                    const dateObj = new Date(entry.entryDate + 'T00:00:00');
                                                                    return dateObj.toLocaleDateString('vi-VN', {
                                                                        day: '2-digit',
                                                                        month: '2-digit',
                                                                        year: 'numeric',
                                                                    });
                                                                } catch {
                                                                    return entry.entryDate;
                                                                }
                                                            })()}
                                                        </span>
                                                    </div>
                                                    <span className="text-gray-400">•</span>
                                                    <span>{entry.createdByName}</span>
                                                </div>
                                            </div>

                                            {/* Right: Pass/Fail counts */}
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {/* Pass button */}
                                                <div className="bg-green-100/40 rounded-lg px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded-full border-2 border-green-500 bg-white flex items-center justify-center flex-shrink-0">
                                                            <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                                                            </svg>
                                                        </div>
                                                        <div className="flex flex-col items-start -space-y-0.5">
                                                            <div className="text-lg font-bold text-green-500 leading-none">{passCount}</div>
                                                            <div className="text-[11px] text-green-500 font-medium">Pass</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Fail button */}
                                                <div className="bg-red-100/40 rounded-lg px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded-full border-2 border-red-500 bg-white flex items-center justify-center flex-shrink-0">
                                                            <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                                                            </svg>
                                                        </div>
                                                        <div className="flex flex-col items-start -space-y-0.5">
                                                            <div className="text-lg font-bold text-red-500 leading-none">{failCount}</div>
                                                            <div className="text-[11px] text-red-500 font-medium">Fail</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Menu button */}
                                                <button className="p-1.5 hover:bg-gray-100 rounded" onClick={(e) => e.stopPropagation()}>
                                                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )
            )}

            {/* Modals */}
            {showCreateModal && (
                <CreateExamResultModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleCreateSuccess}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận xóa đợt nhập điểm</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn xóa tất cả các đợt nhập điểm đang hiển thị không? 
                            Hành động này sẽ xóa toàn bộ điểm đã nhập và không thể hoàn tác.
                            {filteredResults.length > 0 && (
                                <span className="block mt-2 font-medium">
                                    Số lượng đợt nhập điểm sẽ bị xóa: {Array.from(new Set(filteredResults.map((r) => r.examResultId))).length}
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>
                            Hủy
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteAll} disabled={deleting}>
                            {deleting ? 'Đang xóa...' : 'Xóa'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Entry Detail Dialog - hiển thị điểm khi click vào card */}
            <Dialog open={showEntryDetailDialog} onOpenChange={setShowEntryDetailDialog}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedEntry ? `Điểm thi: ${selectedEntry.moduleName}` : 'Chi tiết đợt nhập điểm'}
                        </DialogTitle>
                        {selectedEntry && (
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                                <span>Ngày thi: {(() => {
                                    try {
                                        const dateObj = new Date(selectedEntry.entryDate + 'T00:00:00');
                                        return dateObj.toLocaleDateString('vi-VN', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                        });
                                    } catch {
                                        return selectedEntry.entryDate;
                                    }
                                })()}</span>
                                <span>•</span>
                                <span>Lớp: {selectedEntry.className}</span>
                            </div>
                        )}
                    </DialogHeader>

                    {loading ? (
                        <div className="p-8 text-center">
                            <p>Đang tải...</p>
                        </div>
                    ) : !filteredResults || filteredResults.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <p>Chưa có điểm thi nào</p>
                            <p className="text-xs mt-2">Debug: filteredResults = {JSON.stringify(filteredResults?.length || 0)}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium">
                                    Tổng số học viên: {filteredResults.reduce((sum, r) => sum + r.studentScores.length, 0)}
                                </h4>
                                {selectedEntry && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={async () => {
                                            if (confirm('Bạn có chắc chắn muốn xóa đợt nhập điểm này?')) {
                                                try {
                                                    await deleteGradeEntry(
                                                        selectedEntry.classId,
                                                        selectedEntry.moduleId,
                                                        selectedEntry.entryDate
                                                    );
                                                    toast.success('Xóa đợt nhập điểm thành công');
                                                    setShowEntryDetailDialog(false);
                                                    // Reload entries
                                                    if (selectedClass && selectedSemester) {
                                                        loadGradeEntries(selectedClass, selectedModule || undefined);
                                                    }
                                                } catch (error: any) {
                                                    toast.error(error.response?.data?.message || 'Không thể xóa đợt nhập điểm');
                                                }
                                            }
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Xóa đợt này
                                    </Button>
                                )}
                            </div>
                            
                            <div className="border rounded-lg overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">STT</TableHead>
                                            <TableHead>Mã HV</TableHead>
                                            <TableHead>Họ và tên</TableHead>
                                            <TableHead className="text-center">Điểm LT</TableHead>
                                            <TableHead className="text-center">Điểm TH</TableHead>
                                            <TableHead className="text-center">Điểm tổng</TableHead>
                                            <TableHead className="text-center">Kết quả</TableHead>
                                            <TableHead>Ghi chú</TableHead>
                                            <TableHead className="text-right">Thao tác</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredResults.flatMap((result, resultIndex) =>
                                            result.studentScores.map((score, scoreIndex) => {
                                                const globalIndex = filteredResults
                                                    .slice(0, resultIndex)
                                                    .reduce((sum, r) => sum + r.studentScores.length, 0) + scoreIndex + 1;
                                                
                                                const isEditing = editingRow?.examResultId === result.examResultId && editingRow?.studentId === score.studentId;
                                                const uniqueKey = `dialog-${resultIndex}-${result.examDate}-${score.studentId}`;
                                                
                                                return (
                                                    <TableRow key={uniqueKey}>
                                                        <TableCell>{globalIndex}</TableCell>
                                                        <TableCell>{score.studentCode}</TableCell>
                                                        <TableCell>{score.fullName}</TableCell>
                                                        <TableCell className="text-center">
                                                            {isEditing && editingScores ? (
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    max="10"
                                                                    step="0.1"
                                                                    value={editingScores.theoryScore}
                                                                    onChange={(e) =>
                                                                        setEditingScores({
                                                                            ...editingScores,
                                                                            theoryScore: e.target.value,
                                                                        })
                                                                    }
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            e.preventDefault();
                                                                            handleSaveEdit();
                                                                        } else if (e.key === 'Escape') {
                                                                            handleCancelEdit();
                                                                        }
                                                                    }}
                                                                    className="w-20 text-center"
                                                                    autoFocus
                                                                />
                                                            ) : (
                                                                score.theoryScore
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {isEditing && editingScores ? (
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    max="10"
                                                                    step="0.1"
                                                                    value={editingScores.practicalScore}
                                                                    onChange={(e) =>
                                                                        setEditingScores({
                                                                            ...editingScores,
                                                                            practicalScore: e.target.value,
                                                                        })
                                                                    }
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            e.preventDefault();
                                                                            handleSaveEdit();
                                                                        } else if (e.key === 'Escape') {
                                                                            handleCancelEdit();
                                                                        }
                                                                    }}
                                                                    className="w-20 text-center"
                                                                />
                                                            ) : (
                                                                score.practicalScore
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-center font-medium">
                                                            {score.finalScore}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge
                                                                variant={score.status === 'PASS' ? 'success' : 'destructive'}
                                                                className={
                                                                    score.status === 'PASS'
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : 'bg-red-100 text-red-800'
                                                                }
                                                            >
                                                                {score.status === 'PASS' ? 'Đạt' : 'Không đạt'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-gray-600">
                                                            {score.note || '-'}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                {isEditing ? (
                                                                    <>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={handleSaveEdit}
                                                                            disabled={saving}
                                                                            title="Lưu"
                                                                        >
                                                                            {saving ? 'Đang lưu...' : 'Lưu'}
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={handleCancelEdit}
                                                                            disabled={saving}
                                                                            title="Hủy"
                                                                        >
                                                                            Hủy
                                                                        </Button>
                                                                    </>
                                                                ) : (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleStartEdit(result, score.studentId)}
                                                                        title="Chỉnh sửa điểm"
                                                                    >
                                                                        <Edit className="w-4 h-4" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowEntryDetailDialog(false);
                                setSelectedEntry(null);
                            }}
                        >
                            Đóng
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Import Modal with Preview and Edit */}
            {selectedClass && selectedModule && (
                <ImportExamGradesModal
                    open={showImportModal}
                    onClose={() => {
                        setShowImportModal(false);
                        setImportEntryDate('');
                    }}
                    onSuccess={handleImportSuccess}
                    classId={selectedClass}
                    moduleId={selectedModule}
                    entryDate={importEntryDate}
                    setEntryDate={setImportEntryDate}
                />
            )}
        </div>
    );
};

export default ExamManagementPage;

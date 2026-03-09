import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { getGradeEntryDetail, updateGradeRecords, deleteGradeEntry } from '@/shared/api/grades.mock';
import type { GradeEntryDetail } from '@/shared/types/grades';
import { toast } from 'sonner';
import ImportGradesModal from './components/ImportGradesModal';

interface GradeInput {
    gradeRecordId: number;
    theoryScore: string;
    practiceScore: string;
}

export function GradeEntryPage() {
    const { gradeEntryId } = useParams<{ gradeEntryId: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [gradeEntry, setGradeEntry] = useState<GradeEntryDetail | null>(null);
    const [gradeInputs, setGradeInputs] = useState<Record<number, GradeInput>>({});
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [openImport, setOpenImport] = useState(false);

    useEffect(() => {
        loadGradeEntry();
    }, [gradeEntryId]);

    const loadGradeEntry = async () => {
        if (!gradeEntryId) return;

        try {
            setLoading(true);
            setError(null);
            const data = await getGradeEntryDetail(parseInt(gradeEntryId));
            setGradeEntry(data);

            // Initialize grade inputs
            const inputs: Record<number, GradeInput> = {};
            data.gradeRecords.forEach((record) => {
                inputs[record.gradeRecordId] = {
                    gradeRecordId: record.gradeRecordId,
                    theoryScore: record.theoryScore !== null ? String(record.theoryScore) : '',
                    practiceScore: record.practiceScore !== null ? String(record.practiceScore) : '',
                };
            });
            setGradeInputs(inputs);
        } catch (err) {
            setError('Không thể tải dữ liệu điểm. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleScoreChange = (gradeRecordId: number, field: 'theoryScore' | 'practiceScore', value: string) => {
        // Allow empty or valid numbers 0-100
        if (value === '' || (/^\d+$/.test(value) && parseInt(value) >= 0 && parseInt(value) <= 100)) {
            setGradeInputs((prev) => ({
                ...prev,
                [gradeRecordId]: {
                    ...prev[gradeRecordId],
                    [field]: value,
                },
            }));
        }
    };

    const calculateFinalScore = (theoryScore: string, practiceScore: string): number | null => {
        if (theoryScore === '' || practiceScore === '') return null;
        const theory = parseFloat(theoryScore);
        const practice = parseFloat(practiceScore);
        return Math.round((theory * 0.3 + practice * 0.7) * 100) / 100;
    };

    const getPassStatus = (finalScore: number | null): 'PASS' | 'FAIL' | null => {
        if (finalScore === null) return null;
        return finalScore >= 50 ? 'PASS' : 'FAIL';
    };

    const handleSave = async () => {
        if (!gradeEntryId) return;

        try {
            setSaving(true);
            setError(null);
            setSuccessMessage(null);

            const updates = Object.values(gradeInputs).map((input) => ({
                gradeRecordId: input.gradeRecordId,
                theoryScore: input.theoryScore !== '' ? parseFloat(input.theoryScore) : null,
                practiceScore: input.practiceScore !== '' ? parseFloat(input.practiceScore) : null,
            }));

            await updateGradeRecords(parseInt(gradeEntryId), updates);
            setSuccessMessage('✅ Đã lưu điểm thành công!');

            // Reload data to show updated values
            await loadGradeEntry();

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError('Không thể lưu điểm. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!gradeEntry) return;

        try {
            setDeleting(true);
            setError(null);
            await deleteGradeEntry(gradeEntry.classId, gradeEntry.moduleId, gradeEntry.entryDate);
            toast.success('Đã xóa đợt nhập điểm thành công');
            navigate('/grades');
        } catch (err) {
            setError('Không thể xóa đợt nhập điểm. Vui lòng thử lại.');
        } finally {
            setDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-gray-500">Đang tải...</div>
            </div>
        );
    }

    if (!gradeEntry) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-red-500">Không tìm thấy bảng điểm</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/grades')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Chấm điểm học sinh</h1>
                        <p className="text-gray-500">
                            {gradeEntry.className} - {gradeEntry.moduleName}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => setOpenImport(true)} className="gap-2">
                        <Upload className="h-4 w-4" />
                        Import từ Excel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => setShowDeleteDialog(true)}
                        disabled={deleting}
                        className="gap-2"
                    >
                        <Trash2 className="h-4 w-4" />
                        Xóa đợt nhập điểm
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="gap-2">
                        <Save className="h-4 w-4" />
                        {saving ? 'Đang lưu...' : 'Lưu điểm'}
                    </Button>
                </div>
            </div>

            {/* Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Thông tin bảng điểm</CardTitle>
                    <CardDescription>
                        Nhập điểm lý thuyết (0-100) và thực hành (0-100). Điểm tổng và kết quả sẽ tự động tính.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500">Ngày chấm:</span>
                            <p className="font-medium">{new Date(gradeEntry.entryDate).toLocaleDateString('vi-VN')}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Người chấm:</span>
                            <p className="font-medium">{gradeEntry.createdByName}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Số học sinh đã chấm:</span>
                            <p className="font-medium">
                                {gradeEntry.gradedStudents} / {gradeEntry.totalStudents}
                            </p>
                        </div>
                    </div>
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Công thức tính:</strong> Điểm tổng = Lý thuyết × 30% + Thực hành × 70% |
                            <strong> Đạt:</strong> ≥ 50 điểm
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

            {/* Messages */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {successMessage && (
                <Alert className="border-green-500 bg-green-50">
                    <AlertCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-600">{successMessage}</AlertDescription>
                </Alert>
            )}

            {/* Grade Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">#</TableHead>
                                <TableHead className="w-64">Học sinh</TableHead>
                                <TableHead className="w-32">Lý thuyết</TableHead>
                                <TableHead className="w-32">Thực hành</TableHead>
                                <TableHead className="w-32">Điểm tổng</TableHead>
                                <TableHead className="w-32">Kết quả</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {gradeEntry.gradeRecords.map((record, index) => {
                                const input = gradeInputs[record.gradeRecordId];
                                const finalScore = calculateFinalScore(
                                    input?.theoryScore || '',
                                    input?.practiceScore || '',
                                );
                                const passStatus = getPassStatus(finalScore);

                                return (
                                    <TableRow key={record.gradeRecordId}>
                                        <TableCell className="font-medium">{index + 1}</TableCell>
                                        <TableCell>{record.studentName}</TableCell>
                                        <TableCell>
                                            <Input
                                                type="text"
                                                placeholder="0-100"
                                                value={input?.theoryScore || ''}
                                                onChange={(e) =>
                                                    handleScoreChange(
                                                        record.gradeRecordId,
                                                        'theoryScore',
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-20"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="text"
                                                placeholder="0-100"
                                                value={input?.practiceScore || ''}
                                                onChange={(e) =>
                                                    handleScoreChange(
                                                        record.gradeRecordId,
                                                        'practiceScore',
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-20"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-semibold text-blue-600">
                                                {finalScore !== null ? finalScore.toFixed(2) : '--'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {passStatus === 'PASS' && (
                                                <Badge className="bg-green-100 text-green-800">Đạt</Badge>
                                            )}
                                            {passStatus === 'FAIL' && (
                                                <Badge className="bg-red-100 text-red-800">Không đạt</Badge>
                                            )}
                                            {passStatus === null && (
                                                <Badge variant="outline" className="text-gray-500">
                                                    Chưa chấm
                                                </Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận xóa đợt nhập điểm</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn xóa đợt nhập điểm này không? Hành động này sẽ xóa toàn bộ điểm đã nhập
                            và không thể hoàn tác.
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
            {gradeEntry && (
                <ImportGradesModal
                    open={openImport}
                    onClose={() => setOpenImport(false)}
                    onSuccess={async () => {
                        await loadGradeEntry();
                        setOpenImport(false);
                    }}
                    classId={gradeEntry.classId}
                    moduleId={gradeEntry.moduleId}
                    entryDate={gradeEntry.entryDate}
                />
            )}
        </div>
    );
}

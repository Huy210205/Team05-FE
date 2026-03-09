import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { updateExamResult, type StudentScoreInput, type ExamResultResponse } from '@/shared/api/exams';
import { toast } from 'sonner';

interface EditExamResultModalProps {
    examResult: ExamResultResponse;
    onClose: () => void;
    onSuccess: () => void;
}

interface ScoreRow {
    studentId: number;
    studentCode: string;
    fullName: string;
    theoryScore: string;
    practicalScore: string;
    note: string;
}

const EditExamResultModal: React.FC<EditExamResultModalProps> = ({ examResult, onClose, onSuccess }) => {
    const [examDate, setExamDate] = useState<string>(examResult.examDate);
    const [scoreRows, setScoreRows] = useState<ScoreRow[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Initialize score rows from exam result
    useEffect(() => {
        const rows: ScoreRow[] = examResult.studentScores.map((score) => ({
            studentId: score.studentId,
            studentCode: score.studentCode,
            fullName: score.fullName,
            theoryScore: score.theoryScore.toString(),
            practicalScore: score.practicalScore.toString(),
            note: score.note || '',
        }));
        setScoreRows(rows);
    }, [examResult]);

    const handleScoreChange = (studentId: number, field: 'theoryScore' | 'practicalScore' | 'note', value: string) => {
        setScoreRows((prev) => prev.map((row) => (row.studentId === studentId ? { ...row, [field]: value } : row)));
    };

    const handleSubmit = async () => {
        // Validation
        if (!examDate) {
            toast.error('Vui lòng chọn ngày thi');
            return;
        }

        // Validate scores
        const studentScores: StudentScoreInput[] = [];
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

            studentScores.push({
                studentId: row.studentId,
                theoryScore: theory,
                practicalScore: practical,
                note: row.note || undefined,
            });
        }

        try {
            setSubmitting(true);
            await updateExamResult(examResult.examResultId, {
                examDate,
                studentScores,
            });
            toast.success('Cập nhật điểm thành công');
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể cập nhật điểm');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Cập nhật điểm</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Info Section */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Lớp</Label>
                            <Input value={examResult.className} disabled />
                        </div>
                        <div>
                            <Label>Module</Label>
                            <Input value={examResult.moduleName} disabled />
                        </div>
                        <div>
                            <Label>Ngày thi</Label>
                            <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
                        </div>
                        <div>
                            <Label>Người tạo</Label>
                            <Input value={examResult.creatorName} disabled />
                        </div>
                    </div>

                    {/* Student Scores Table */}
                    {scoreRows.length > 0 && (
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
                        <Button onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Đang lưu...' : 'Cập nhật điểm'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default EditExamResultModal;


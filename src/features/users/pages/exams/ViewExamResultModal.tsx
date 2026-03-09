import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { ExamResultResponse } from '@/shared/api/exams';

interface ViewExamResultModalProps {
    examResult: ExamResultResponse;
    onClose: () => void;
}

const ViewExamResultModal: React.FC<ViewExamResultModalProps> = ({ examResult, onClose }) => {
    const passCount = examResult.studentScores.filter((s) => s.status === 'PASS').length;
    const failCount = examResult.studentScores.filter((s) => s.status === 'FAIL').length;

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Chi tiết đợt nhập điểm</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Info Section */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                            <p className="text-sm text-gray-500">Lớp</p>
                            <p className="font-medium">{examResult.className}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Module</p>
                            <p className="font-medium">{examResult.moduleName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Ngày thi</p>
                            <p className="font-medium">{new Date(examResult.examDate).toLocaleDateString('vi-VN')}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Người tạo</p>
                            <p className="font-medium">{examResult.creatorName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Ngày tạo</p>
                            <p className="font-medium">{new Date(examResult.createdAt).toLocaleDateString('vi-VN')}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Thống kê</p>
                            <div className="flex gap-2 mt-1">
                                <Badge variant="success" className="bg-green-100 text-green-800">
                                    Đạt: {passCount}
                                </Badge>
                                <Badge variant="destructive" className="bg-red-100 text-red-800">
                                    Không đạt: {failCount}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Student Scores Table */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Danh sách điểm thi ({examResult.studentScores.length} học viên)</h3>
                        <div className="border rounded-lg">
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
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {examResult.studentScores.map((score, index) => (
                                        <TableRow key={score.studentId}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{score.studentCode}</TableCell>
                                            <TableCell>{score.fullName}</TableCell>
                                            <TableCell className="text-center">{score.theoryScore}</TableCell>
                                            <TableCell className="text-center">{score.practicalScore}</TableCell>
                                            <TableCell className="text-center font-medium">{score.finalScore}</TableCell>
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
                                            <TableCell className="text-gray-600">{score.note || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ViewExamResultModal;


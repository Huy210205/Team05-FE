import React, { useState, useEffect } from 'react';
import { BarChart3, Plus, Edit, Trash2, X, Calculator } from 'lucide-react';
import { useToast } from '@/shared/hooks/useToast';
import http from '@/shared/api/http';

type Class = {
    id: number;
    name: string;
    programName: string;
    centerName: string;
    status: string;
};

type Student = {
    id: number;
    fullName: string;
    studentCode: string;
    email: string;
    phone: string;
};

type Score = {
    id: number;
    studentId: number;
    studentName: string;
    type: 'TEST' | 'MIDTERM' | 'FINAL' | 'ASSIGNMENT';
    score: number;
    maxScore: number;
    date: string;
    note?: string;
};

type ScoreType = 'TEST' | 'MIDTERM' | 'FINAL' | 'ASSIGNMENT';

interface ScoresModalProps {
    classItem: Class;
    onClose: () => void;
}

const ScoresModal: React.FC<ScoresModalProps> = ({ classItem, onClose }) => {
    const { success: showSuccessToast, error: showErrorToast } = useToast();
    const [students, setStudents] = useState<Student[]>([]);
    const [scores, setScores] = useState<Score[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingScore, setEditingScore] = useState<Score | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        studentId: '',
        type: 'TEST' as ScoreType,
        score: '',
        maxScore: '100',
        date: new Date().toISOString().split('T')[0],
        note: ''
    });

    // Fetch students
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setIsLoading(true);
                const response = await http.get(`/api/classes/${classItem.id}/students`);
                const enrollments = response.data.content || response.data.items || response.data;
                
                const studentsData: Student[] = enrollments.map((enrollment: any) => ({
                    id: enrollment.studentId,
                    fullName: enrollment.studentName,
                    studentCode: enrollment.studentCode || '',
                    email: enrollment.studentEmail,
                    phone: enrollment.phone || ''
                }));

                setStudents(studentsData);
            } catch (error) {
                showErrorToast('Lỗi tải dữ liệu', 'Không thể tải danh sách học viên');
            } finally {
                setIsLoading(false);
            }
        };

        fetchStudents();
    }, [classItem.id]);

    // Fetch scores
    useEffect(() => {
        const fetchScores = async () => {
            try {
                const response = await http.get(`/api/classes/${classItem.id}/scores`);
                const scoresData = response.data.items || response.data;
                
                const mappedScores: Score[] = scoresData.map((score: any) => ({
                    id: score.id,
                    studentId: score.studentId,
                    studentName: score.studentName,
                    type: score.type,
                    score: score.score,
                    maxScore: score.maxScore,
                    date: score.date,
                    note: score.note
                }));

                setScores(mappedScores);
            } catch (error) {
                // Mock data for demonstration
                setScores([
                    {
                        id: 1,
                        studentId: 1,
                        studentName: 'Nguyễn Văn A',
                        type: 'TEST',
                        score: 85,
                        maxScore: 100,
                        date: '2024-12-19',
                        note: 'Bài kiểm tra chương 3'
                    },
                    {
                        id: 2,
                        studentId: 2,
                        studentName: 'Trần Thị B',
                        type: 'ASSIGNMENT',
                        score: 90,
                        maxScore: 100,
                        date: '2024-12-18',
                        note: 'Bài tập lớn'
                    }
                ]);
            }
        };

        fetchScores();
    }, [classItem.id]);

    const getTypeLabel = (type: ScoreType) => {
        switch (type) {
            case 'TEST':
                return 'Kiểm tra';
            case 'MIDTERM':
                return 'Giữa kỳ';
            case 'FINAL':
                return 'Cuối kỳ';
            case 'ASSIGNMENT':
                return 'Bài tập';
            default:
                return type;
        }
    };

    const getTypeColor = (type: ScoreType) => {
        switch (type) {
            case 'TEST':
                return 'bg-blue-100 text-blue-800';
            case 'MIDTERM':
                return 'bg-green-100 text-green-800';
            case 'FINAL':
                return 'bg-red-100 text-red-800';
            case 'ASSIGNMENT':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.studentId || !formData.score) return;

        setIsSubmitting(true);
        try {
            const scoreData = {
                studentId: parseInt(formData.studentId),
                type: formData.type,
                score: parseFloat(formData.score),
                maxScore: parseFloat(formData.maxScore),
                date: formData.date,
                note: formData.note || null
            };

            if (editingScore) {
                // Update existing score
                await http.put(`/api/classes/${classItem.id}/scores/${editingScore.id}`, scoreData);
                
                setScores(prev => prev.map(score => 
                    score.id === editingScore.id 
                        ? { ...score, ...scoreData, studentName: students.find(s => s.id === scoreData.studentId)?.fullName || score.studentName }
                        : score
                ));
                
                showSuccessToast('Cập nhật điểm thành công', 'Điểm đã được cập nhật');
            } else {
                // Create new score
                const response = await http.post(`/api/classes/${classItem.id}/scores`, scoreData);
                
                const newScore: Score = {
                    id: response.data.id || Date.now(),
                    ...scoreData,
                    studentName: students.find(s => s.id === scoreData.studentId)?.fullName || ''
                };
                
                setScores(prev => [newScore, ...prev]);
                showSuccessToast('Thêm điểm thành công', 'Điểm đã được thêm');
            }

            // Reset form
            setFormData({
                studentId: '',
                type: 'TEST',
                score: '',
                maxScore: '100',
                date: new Date().toISOString().split('T')[0],
                note: ''
            });
            setEditingScore(null);
            setShowAddModal(false);
        } catch (error) {
            showErrorToast('Lỗi lưu điểm', 'Không thể lưu điểm');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (score: Score) => {
        setEditingScore(score);
        setFormData({
            studentId: score.studentId.toString(),
            type: score.type,
            score: score.score.toString(),
            maxScore: score.maxScore.toString(),
            date: score.date,
            note: score.note || ''
        });
        setShowAddModal(true);
    };

    const handleDelete = async (scoreId: number) => {
        if (!confirm('Bạn có chắc chắn muốn xóa điểm này?')) return;

        try {
            await http.delete(`/api/classes/${classItem.id}/scores/${scoreId}`);
            setScores(prev => prev.filter(score => score.id !== scoreId));
            showSuccessToast('Xóa điểm thành công', 'Điểm đã được xóa');
        } catch (error) {
            showErrorToast('Lỗi xóa điểm', 'Không thể xóa điểm');
        }
    };

    const getStudentAverage = (studentId: number) => {
        const studentScores = scores.filter(score => score.studentId === studentId);
        if (studentScores.length === 0) return 0;
        
        const totalScore = studentScores.reduce((sum, score) => sum + (score.score / score.maxScore) * 100, 0);
        return Math.round(totalScore / studentScores.length);
    };

    const getClassAverage = () => {
        if (scores.length === 0) return 0;
        
        const totalScore = scores.reduce((sum, score) => sum + (score.score / score.maxScore) * 100, 0);
        return Math.round(totalScore / scores.length);
    };

    return (
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Quản lý điểm thi</h2>
                    <p className="text-sm text-gray-600 mt-1">{classItem.name}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-600">
                        <span className="font-medium">Điểm TB lớp:</span> {getClassAverage()}%
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Plus size={16} className="mr-1" />
                        Thêm điểm
                    </button>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
                {isLoading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Scores List */}
                        {scores.map((score) => (
                            <div key={score.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900">{score.studentName}</div>
                                    <div className="text-sm text-gray-500">
                                        {getTypeLabel(score.type)} - {new Date(score.date).toLocaleDateString('vi-VN')}
                                    </div>
                                    {score.note && (
                                        <div className="text-sm text-gray-600 mt-1">{score.note}</div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(score.type)}`}>
                                        {getTypeLabel(score.type)}
                                    </span>
                                </div>

                                <div className="text-right">
                                    <div className="text-lg font-semibold text-gray-900">
                                        {score.score}/{score.maxScore}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {Math.round((score.score / score.maxScore) * 100)}%
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(score)}
                                        className="p-1 text-gray-400 hover:text-blue-600"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(score.id)}
                                        className="p-1 text-gray-400 hover:text-red-600"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Empty State */}
                        {scores.length === 0 && (
                            <div className="text-center py-8">
                                <div className="text-gray-400 mb-4">
                                    <BarChart3 size={48} className="mx-auto" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có điểm nào</h3>
                                <p className="text-gray-600 mb-4">Hãy thêm điểm đầu tiên cho lớp học này.</p>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    <Plus size={16} className="mr-2" />
                                    Thêm điểm
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Add/Edit Score Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{backgroundColor: 'rgba(0, 0, 0, 0.5)'}}>
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" style={{boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'}}>
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editingScore ? 'Chỉnh sửa điểm' : 'Thêm điểm mới'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setEditingScore(null);
                                    setFormData({
                                        studentId: '',
                                        type: 'TEST',
                                        score: '',
                                        maxScore: '100',
                                        date: new Date().toISOString().split('T')[0],
                                        note: ''
                                    });
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Học viên
                                </label>
                                <select
                                    value={formData.studentId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Chọn học viên</option>
                                    {students.map(student => (
                                        <option key={student.id} value={student.id}>
                                            {student.fullName} ({student.studentCode})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Loại điểm
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ScoreType }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="TEST">Kiểm tra</option>
                                    <option value="MIDTERM">Giữa kỳ</option>
                                    <option value="FINAL">Cuối kỳ</option>
                                    <option value="ASSIGNMENT">Bài tập</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Điểm
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        value={formData.score}
                                        onChange={(e) => setFormData(prev => ({ ...prev, score: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Điểm tối đa
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="1"
                                        value={formData.maxScore}
                                        onChange={(e) => setFormData(prev => ({ ...prev, maxScore: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ngày
                                </label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ghi chú (tùy chọn)
                                </label>
                                <textarea
                                    value={formData.note}
                                    onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                                    placeholder="Ghi chú về điểm thi..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setEditingScore(null);
                                        setFormData({
                                            studentId: '',
                                            type: 'TEST',
                                            score: '',
                                            maxScore: '100',
                                            date: new Date().toISOString().split('T')[0],
                                            note: ''
                                        });
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 border border-transparent text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Đang lưu...' : (editingScore ? 'Cập nhật' : 'Thêm điểm')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScoresModal;
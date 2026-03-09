
import { Trophy, Loader2, BarChart3 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { type GradeRecordResponse } from '@/shared/api/grade-entries';
import { useToast } from '@/shared/hooks/useToast';
import { useUserProfile } from '@/stores/userProfile';
import api from '@/shared/api/http';

export default function MyGradesPage() {
    const [grades, setGrades] = useState<GradeRecordResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedClass, setSelectedClass] = useState<string>('ALL');
    const toast = useToast();
    const { me } = useUserProfile();

    useEffect(() => {
        loadGrades();
    }, [me]);

    // Auto-select month/year from first grade record when data is loaded
    useEffect(() => {
        if (grades.length > 0) {
            // Find the newest grade date
            const sortedGrades = [...grades].sort((a, b) => {
                const dateA = a.entryDate ? new Date(a.entryDate).getTime() : 0;
                const dateB = b.entryDate ? new Date(b.entryDate).getTime() : 0;
                return dateB - dateA;
            });
            
            if (sortedGrades[0]?.entryDate) {
                const date = new Date(sortedGrades[0].entryDate);
                setSelectedYear(date.getFullYear());
                setSelectedMonth(date.getMonth() + 1);
            }
        }
    }, [grades]);

    const loadGrades = async () => {
        if (!me) return;
        
        try {
            setLoading(true);
            // Gọi API mới /api/grade-entries/my-grades
            const response = await api.get<GradeRecordResponse[]>('/api/grade-entries/my-grades');
            setGrades(response.data || []);
        } catch (error: any) {
            if (error?.response?.status !== 404) {
                toast.error('Không thể tải điểm: ' + (error?.response?.data?.message || error?.message));
            }
            setGrades([]);
        } finally {
            setLoading(false);
        }
    };

    // Filter grades by month/year and class
    const filteredGrades = useMemo(() => {
        return grades.filter(grade => {
            // Filter by class
            if (selectedClass !== 'ALL' && grade.className !== selectedClass) {
                return false;
            }
            
            // Filter by month/year if entryDate exists
            if (grade.entryDate) {
                const date = new Date(grade.entryDate);
                return date.getMonth() + 1 === selectedMonth && date.getFullYear() === selectedYear;
            }
            
            return true;
        });
    }, [grades, selectedMonth, selectedYear, selectedClass]);

    // Generate month/year options
    const months = Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: `Tháng ${i + 1}`
    }));

    // Generate years dynamically from actual grade data
    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        
        if (!grades || grades.length === 0) {
            // Fallback to current year if no data
            return [{ value: currentYear, label: `${currentYear}` }];
        }
        
        // Extract unique years from entry dates (consistent with filter logic)
        const yearSet = new Set<number>();
        grades.forEach(grade => {
            if (grade.entryDate) {
                const year = new Date(grade.entryDate).getFullYear();
                yearSet.add(year);
            }
        });
        
        // If no valid dates found, add current year
        if (yearSet.size === 0) {
            yearSet.add(currentYear);
        }
        
        // Convert to sorted array (newest first)
        const sortedYears = Array.from(yearSet).sort((a, b) => b - a);
        return sortedYears.map(year => ({ value: year, label: `${year}` }));
    }, [grades]);

    // Get unique class names from grades
    const classOptions = ['ALL', ...Array.from(new Set(grades.map(g => g.className).filter(Boolean)))];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-purple-700" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Điểm của tôi</h1>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-base font-semibold text-gray-900">Bảng điểm</h4>
                            <p className="text-sm text-gray-500 mt-1">
                                Danh sách điểm thi của bạn
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600">Lớp học:</span>
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                            >
                                <option value="ALL">Tất cả lớp</option>
                                {classOptions.filter(c => c !== 'ALL').map(className => (
                                    <option key={className} value={className}>{className}</option>
                                ))}
                            </select>
                            <span className="text-sm text-gray-600">Tháng:</span>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                            >
                                {months.map(month => (
                                    <option key={month.value} value={month.value}>{month.label}</option>
                                ))}
                            </select>
                            <span className="text-sm text-gray-600">Năm:</span>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                            >
                                {years.map(year => (
                                    <option key={year.value} value={year.value}>{year.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">
                        <Loader2 className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                        Đang tải điểm...
                    </div>
                ) : grades.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <BarChart3 size={40} className="mx-auto mb-3 text-gray-300" />
                        <p>Chưa có điểm thi nào</p>
                    </div>
                ) : (
                    <>
                        {filteredGrades.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <BarChart3 size={40} className="mx-auto mb-3 text-gray-300" />
                                <p>Không có điểm thi trong tháng {selectedMonth}/{selectedYear}</p>
                                <p className="text-xs text-gray-400 mt-1">Thử chọn tháng/năm hoặc lớp khác</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="text-left py-3 px-6 font-medium text-gray-700">Lớp học</th>
                                            <th className="text-left py-3 px-6 font-medium text-gray-700">Module</th>
                                            <th className="text-left py-3 px-6 font-medium text-gray-700">Học kỳ</th>
                                            <th className="text-center py-3 px-6 font-medium text-gray-700">Lý thuyết</th>
                                            <th className="text-center py-3 px-6 font-medium text-gray-700">Thực hành</th>
                                            <th className="text-center py-3 px-6 font-medium text-gray-700">Tổng kết</th>
                                            <th className="text-center py-3 px-6 font-medium text-gray-700">Kết quả</th>
                                            <th className="text-left py-3 px-6 font-medium text-gray-700">Ngày thi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filteredGrades.map((grade, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="py-3 px-6 text-gray-900">
                                                    {grade.className || '-'}
                                                </td>
                                                <td className="py-3 px-6 text-gray-900">
                                                    <div className="font-medium">{grade.moduleName || '-'}</div>
                                                    {grade.moduleCode && (
                                                        <div className="text-xs text-gray-500">{grade.moduleCode}</div>
                                                    )}
                                                </td>
                                                <td className="py-3 px-6 text-gray-600">
                                                    {grade.semester ? `Học kỳ ${grade.semester}` : '-'}
                                                </td>
                                                <td className="py-3 px-6 text-center text-gray-900">
                                                    {grade.theoryScore.toFixed(1)}
                                                </td>
                                                <td className="py-3 px-6 text-center text-gray-900">
                                                    {grade.practiceScore.toFixed(1)}
                                                </td>
                                                <td className="py-3 px-6 text-center font-semibold text-gray-900">
                                                    {grade.finalScore.toFixed(1)}
                                                </td>
                                                <td className="py-3 px-6 text-center">
                                                    <span
                                                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                                            grade.passStatus === 'PASS'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}
                                                    >
                                                        {grade.passStatus === 'PASS' ? 'Đạt' : 'Chưa đạt'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-6 text-gray-600">
                                                    {grade.entryDate || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

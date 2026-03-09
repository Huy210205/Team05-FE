import React, { useEffect, useState } from 'react';
import { AlertTriangle, Eye, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCenterSelection } from '@/stores/centerSelection';
import { studentWarningsApi } from '@/shared/api/student-warnings';
import type { StudentWarning as APIStudentWarning } from '@/shared/api/student-warnings';

// Kiểu dữ liệu cho một cảnh báo học viên (mở rộng từ API)
interface StudentWarning extends APIStudentWarning {
    actionLabel?: string; // Nhãn nút hành động (tùy chọn)
}

interface Props {
    onCountChange?: (count: number) => void;
}

// Map severity -> style màu nền viền
const severityStyles: Record<string, string> = {
    HIGH: 'bg-red-50 border-red-100',
    MEDIUM: 'bg-amber-50 border-amber-100',
    LOW: 'bg-blue-50 border-blue-100',
};

const severityBar: Record<string, string> = {
    HIGH: 'bg-gradient-to-b from-red-400 to-red-600',
    MEDIUM: 'bg-gradient-to-b from-amber-400 to-amber-600',
    LOW: 'bg-gradient-to-b from-blue-400 to-blue-600',
};

// Map severity -> action label
const severityActionLabel: Record<string, string> = {
    HIGH: 'Liên hệ ngay',
    MEDIUM: 'Nhắc nhở',
    LOW: 'Theo dõi',
};

export default function StudentWarnings({ onCountChange }: Props) {
    const navigate = useNavigate();
    const selectedCenterId = useCenterSelection((s) => s.selectedCenterId);
    const [warnings, setWarnings] = useState<StudentWarning[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch warnings từ API
    useEffect(() => {
        const fetchWarnings = async () => {
            try {
                setLoading(true);
                const response = await studentWarningsApi.getStudentWarnings(selectedCenterId);
                // Map warnings với action label
                const mappedWarnings = response.warnings.map((w) => ({
                    ...w,
                    actionLabel: severityActionLabel[w.severity] || 'Xem chi tiết',
                }));
                setWarnings(mappedWarnings);
                onCountChange?.(response.totalCount);
            } catch (error) {
            } finally {
                setLoading(false);
            }
        };

        fetchWarnings();
    }, [selectedCenterId]); // Remove onCountChange from deps to prevent unnecessary re-fetches

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 flex items-center justify-between border-b">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 text-white grid place-items-center shadow-md">
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Cảnh báo học viên</h2>
                        <p className="text-xs text-gray-500">Các học viên cần được theo dõi / can thiệp sớm</p>
                    </div>
                    {warnings.length > 0 && (
                        <span className="ml-2 text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700">
                            {warnings.length} cần xử lý
                        </span>
                    )}
                </div>
                <button
                    onClick={() => navigate('/students')}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                    Xem tất cả <Eye size={16} />
                </button>
            </div>
            <div className="divide-y divide-gray-100">
                {loading ? (
                    <div className="px-6 py-10 text-center text-sm text-gray-500">Đang tải...</div>
                ) : warnings.length === 0 ? (
                    <div className="px-6 py-10 text-center text-sm text-gray-500">Chưa có cảnh báo nào.</div>
                ) : (
                    warnings.map((w) => (
                        <div
                            key={`${w.studentId}-${w.classCode}`}
                            onClick={() => navigate(`/students/${w.studentId}`)}
                            className={`relative flex flex-col sm:flex-row gap-4 px-6 py-5 cursor-pointer group ${severityStyles[w.severity]}`}
                        >
                            {/* Thanh dọc màu severity */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-md" style={{}}>
                                <div className={`h-full w-full rounded-r ${severityBar[w.severity]}`}></div>
                            </div>
                            <div className="flex-1 min-w-0 pl-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold text-gray-900 line-clamp-1">{w.name}</span>
                                    <span className="text-xs text-gray-500">#{w.code}</span>
                                </div>
                                <div className="text-xs font-medium text-red-600 mb-1">{w.reason}</div>
                                <div className="text-xs text-gray-600 mb-2">{w.detail}</div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span className="inline-flex items-center gap-1">
                                        <MessageCircle size={12} className="text-gray-400" />
                                        {w.program} - {w.classCode}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-start sm:items-center justify-end">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/students/${w.studentId}`);
                                    }}
                                    className={`text-xs font-semibold px-4 py-2 rounded-md shadow-sm transition-colors
                      ${w.severity === 'HIGH' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                      ${w.severity === 'MEDIUM' ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}
                      ${w.severity === 'LOW' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}
                    `}
                                >
                                    {w.actionLabel}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

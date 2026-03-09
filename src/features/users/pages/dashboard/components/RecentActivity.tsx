import React, { useState, useEffect } from 'react';
import { FileText, Clock, ChevronRight, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getJournalsByTeacher } from '@/shared/api/journals';
import type { JournalResponse } from '@/shared/types/journal';
import { useUserProfile } from '@/stores/userProfile';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

// Mapping for journal types display
const JOURNAL_TYPE_DISPLAY: Record<string, { label: string; color: string }> = {
    PROGRESS: { label: 'Tiến độ', color: 'bg-blue-100 text-blue-700' },
    ANNOUNCEMENT: { label: 'Thông báo', color: 'bg-green-100 text-green-700' },
    ISSUE: { label: 'Vấn đề', color: 'bg-red-100 text-red-700' },
    NOTE: { label: 'Ghi chú', color: 'bg-yellow-100 text-yellow-700' },
    OTHER: { label: 'Khác', color: 'bg-gray-100 text-gray-700' },
};

export default function RecentActivity() {
    const navigate = useNavigate();
    const { me } = useUserProfile();
    const [activities, setActivities] = useState<JournalResponse[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadRecentActivities = async () => {
            if (!me?.userId) return;

            setLoading(true);
            try {
                const journals = await getJournalsByTeacher(me.userId);
                // Sort by date and time, take latest 4
                const sorted = journals.sort((a, b) => {
                    const dateTimeA = new Date(`${a.journalDate}T${a.journalTime}`);
                    const dateTimeB = new Date(`${b.journalDate}T${b.journalTime}`);
                    return dateTimeB.getTime() - dateTimeA.getTime();
                });
                setActivities(sorted.slice(0, 4));
            } catch (err) {
                setActivities([]);
            } finally {
                setLoading(false);
            }
        };

        loadRecentActivities();
    }, [me]);

    const formatDateTime = (dateStr: string, timeStr: string) => {
        try {
            const date = new Date(`${dateStr}T${timeStr}`);
            return format(date, 'dd/MM/yyyy HH:mm', { locale: vi });
        } catch {
            return dateStr;
        }
    };

    const getRelativeTime = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffHours / 24);

            if (diffHours < 1) return 'Vừa xong';
            if (diffHours < 24) return `${diffHours} giờ trước`;
            if (diffDays === 1) return '1 ngày trước';
            return `${diffDays} ngày trước`;
        } catch {
            return '';
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 grid place-items-center text-white shadow-lg">
                        <TrendingUp size={18} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Hoạt động gần đây</h2>
                        <p className="text-sm text-gray-500">Nhật ký và sự kiện mới nhất</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/classes')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
                >
                    Xem tất cả
                    <ChevronRight size={16} />
                </button>
            </div>

            <div className="divide-y divide-gray-100">
                {loading && (
                    <div className="p-8 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                        Đang tải...
                    </div>
                )}

                {!loading && activities.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        <FileText size={32} className="mx-auto mb-2 text-gray-300" />
                        <p>Chưa có hoạt động nào gần đây</p>
                    </div>
                )}

                {!loading &&
                    activities.map((activity) => {
                        const typeInfo = JOURNAL_TYPE_DISPLAY[activity.journalType] || JOURNAL_TYPE_DISPLAY.OTHER;
                        return (
                            <div
                                key={activity.journalId}
                                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                                onClick={() => navigate('/classes')}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 grid place-items-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                        <FileText size={18} className="text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-medium px-2 py-1 rounded ${typeInfo.color}`}>
                                                {typeInfo.label}
                                            </span>
                                            {activity.className && (
                                                <span className="text-xs text-gray-500">• {activity.className}</span>
                                            )}
                                        </div>
                                        <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                            {activity.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{activity.content}</p>
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {formatDateTime(activity.journalDate, activity.journalTime)}
                                            </span>
                                            <span>{getRelativeTime(activity.journalDate)}</span>
                                        </div>
                                    </div>
                                    <ChevronRight
                                        size={16}
                                        className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0"
                                    />
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}

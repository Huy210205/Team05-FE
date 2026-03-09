import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Users,
    BarChart3,
    ChevronDown,
    Check,
    Clock,
} from 'lucide-react';
import { useUserProfile } from '@/stores/userProfile';
import { getTeacherAttendanceSchedules, getClassAttendanceSessions, type AttendanceSchedule } from '@/shared/api/attendance';
import { listClasses, type StudyTime } from '@/shared/api/classes';

// Helper functions
function getMonday(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
}

function getFirstDayOfMonth(d: Date): Date {
    const date = new Date(d.getFullYear(), d.getMonth(), 1);
    date.setHours(0, 0, 0, 0);
    return date;
}

function getLastDayOfMonth(d: Date): Date {
    const date = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    date.setHours(23, 59, 59, 999);
    return date;
}

function formatDate(date: Date): string {
    // Use local timezone instead of UTC to avoid date shifts
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Không cần mock data nữa - dùng API trực tiếp

type ViewMode = 'day' | 'week' | 'month';

type SessionWithTime = AttendanceSchedule & {
    studyTime?: StudyTime | null;
    sessionId?: number | null; // Session ID if attendance already taken
};

// Time slot mapping
const TIME_SLOTS = {
    MORNING: { start: 8, end: 11, label: '8:00 - 11:00' },
    AFTERNOON: { start: 14, end: 17, label: '14:00 - 17:00' },
    EVENING: { start: 18, end: 21, label: '18:00 - 21:00' },
} as const;

export default function AttendancePage() {
    const { me } = useUserProfile();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isLecturer = me?.roles?.some((r) => r.code === 'LECTURER');
    // Initialize currentDate from URL params or default to today
    const [currentDate, setCurrentDate] = useState<Date>(() => {
        const dateParam = searchParams.get('date');
        if (dateParam) {
            // Parse date string (YYYY-MM-DD) to Date object
            const [year, month, day] = dateParam.split('-').map(Number);
            return new Date(year, month - 1, day);
        }
        return new Date();
    });
    // Initialize viewMode from URL params or default to 'month'
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        const viewParam = searchParams.get('view');
        return (viewParam === 'day' || viewParam === 'week' || viewParam === 'month') ? viewParam : 'month';
    });
    const [activeTab, setActiveTab] = useState<'schedule' | 'history' | 'stats'>('schedule');
    const [sessions, setSessions] = useState<SessionWithTime[]>([]);
    const [loading, setLoading] = useState(false);
    const classStudyTimeMapRef = useRef<Map<number, StudyTime | null>>(new Map());
    const [classesLoaded, setClassesLoaded] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Fetch classes info to get studyTime
    useEffect(() => {
        if (!isLecturer) return;

        const fetchClassesInfo = async () => {
            try {
                const response = await listClasses();
                const studyTimeMap = new Map<number, StudyTime | null>();
                response.data.forEach((cls) => {
                    studyTimeMap.set(cls.classId, cls.studyTime);
                });
                classStudyTimeMapRef.current = studyTimeMap;
                setClassesLoaded(true);
            } catch (error) {
                setClassesLoaded(true); // Still proceed even if failed
            }
        };

        fetchClassesInfo();
    }, [isLecturer]);

    // Fetch schedule khi ngày/tuần/tháng thay đổi
    useEffect(() => {
        if (!isLecturer || !me?.userId || !classesLoaded) return; // Wait for classes to load

        const fetchSchedule = async () => {
            setLoading(true);
            try {
                let from: string, to: string;

                if (viewMode === 'day') {
                    from = to = formatDate(currentDate);
                } else if (viewMode === 'week') {
                    const monday = getMonday(currentDate);
                    const sunday = new Date(monday);
                    sunday.setDate(monday.getDate() + 6);
                    from = formatDate(monday);
                    to = formatDate(sunday);
                } else {
                    // month - query for entire calendar display range (including prev/next month days)
                    const year = currentDate.getFullYear();
                    const month = currentDate.getMonth();
                    const firstDay = new Date(year, month, 1);
                    const firstDayOfWeek = firstDay.getDay();
                    const daysFromPrevMonth = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
                    const startDate = new Date(year, month, 1 - daysFromPrevMonth);
                    const endDate = new Date(startDate);
                    endDate.setDate(startDate.getDate() + 41); // 42 days total
                    
                    from = formatDate(startDate);
                    to = formatDate(endDate);
                }

                const response = await getTeacherAttendanceSchedules(me.userId, from, to);
                
                // Fetch session IDs for classes that have TAKEN status
                const uniqueClassIds = [...new Set(response.data.map(s => s.classId))];
                const sessionIdMap = new Map<string, number>(); // key: classId-date, value: sessionId
                
                await Promise.all(
                    uniqueClassIds.map(async (classId) => {
                        try {
                            const sessionsResponse = await getClassAttendanceSessions(classId);
                            sessionsResponse.data.forEach(session => {
                                const key = `${classId}-${session.attendanceDate}`;
                                sessionIdMap.set(key, session.sessionId);
                            });
                        } catch (error) {
                        }
                    })
                );
                
                // Enrich sessions with studyTime and sessionId
                const enrichedSessions: SessionWithTime[] = response.data.map((session) => {
                    const sessionKey = `${session.classId}-${session.attendanceDate}`;
                    return {
                        ...session,
                        studyTime: classStudyTimeMapRef.current.get(session.classId),
                        sessionId: sessionIdMap.get(sessionKey) || null,
                    };
                });
                setSessions(enrichedSessions);
            } catch (error) {
                setSessions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, [currentDate, viewMode, isLecturer, me?.userId, classesLoaded, refreshTrigger]);

    // Update currentDate when date param changes in URL
    useEffect(() => {
        const dateParam = searchParams.get('date');
        if (dateParam) {
            const [year, month, day] = dateParam.split('-').map(Number);
            const urlDate = new Date(year, month - 1, day);
            // Only update if different to avoid infinite loops
            if (urlDate.toDateString() !== currentDate.toDateString()) {
                setCurrentDate(urlDate);
            }
        }
    }, [searchParams, currentDate]);

    // Auto-refresh when returning to this page (e.g., after editing attendance in another tab)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                // Force refresh by incrementing trigger
                setRefreshTrigger(prev => prev + 1);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    const handleNavigate = (offset: number) => {
        const newDate = new Date(currentDate);
        if (viewMode === 'day') {
            newDate.setDate(currentDate.getDate() + offset);
        } else if (viewMode === 'week') {
            newDate.setDate(currentDate.getDate() + offset * 7);
        } else {
            newDate.setMonth(currentDate.getMonth() + offset);
        }
        setCurrentDate(newDate);
        // Update URL to reflect date change
        const params = new URLSearchParams(searchParams);
        params.set('date', formatDate(newDate));
        navigate(`/attendance?${params.toString()}`, { replace: true });
    };

    const handleToday = () => {
        const today = new Date();
        setCurrentDate(today);
        // Update URL to reflect date change
        const params = new URLSearchParams(searchParams);
        params.set('date', formatDate(today));
        navigate(`/attendance?${params.toString()}`, { replace: true });
    };

    // Get calendar days for the month
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // First day of month
        const firstDay = new Date(year, month, 1);
        // Last day of month
        const lastDay = new Date(year, month + 1, 0);
        
        // Get day of week for first day (0 = Sunday, 1 = Monday, etc.)
        const firstDayOfWeek = firstDay.getDay();
        
        // Calculate how many days from previous month to show
        const daysFromPrevMonth = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Start from Monday
        
        // Start date (might be from previous month)
        const startDate = new Date(year, month, 1 - daysFromPrevMonth);
        
        // Generate 42 days (6 weeks) to fill the calendar
        const days = [];
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            days.push(date);
        }
        
        return days;
    }, [currentDate]);

    // Get week days for week view
    const weekDays = useMemo(() => {
        const monday = getMonday(currentDate);
        return Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d;
        });
    }, [currentDate]);

    // Format display title based on view mode
    const displayTitle = useMemo(() => {
        if (viewMode === 'day') {
            return currentDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } else if (viewMode === 'week') {
            const monday = weekDays[0];
            const sunday = weekDays[6];
            return `${monday.getDate()}/${monday.getMonth() + 1} - ${sunday.getDate()}/${sunday.getMonth() + 1}/${sunday.getFullYear()}`;
        } else {
            return `Tháng ${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;
        }
    }, [viewMode, currentDate, weekDays]);

    // Group sessions by date
    const sessionsByDate = useMemo(() => {
        const grouped = new Map<string, SessionWithTime[]>();
        sessions.forEach((session) => {
            const dateKey = session.attendanceDate;
            if (!grouped.has(dateKey)) {
                grouped.set(dateKey, []);
            }
            grouped.get(dateKey)!.push(session);
        });
        return grouped;
    }, [sessions]);

    if (!isLecturer) {
        return (
            <div className="p-6">
                <div className="text-sm text-gray-600">Mục này chỉ dành cho tài khoản Giảng viên.</div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Page header */}
            <div className="bg-white rounded-xl border p-6">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-green-600 flex items-center justify-center text-white">
                        <CalendarIcon size={24} />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold">Quản lý Điểm danh</h1>
                        <p className="text-sm text-gray-600">Điểm danh học viên và thống kê chuyên cần</p>
                    </div>
                </div>
            </div>

            {/* Tab navigation */}
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border w-fit">
                <button
                    onClick={() => setActiveTab('schedule')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
                        activeTab === 'schedule'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    <CalendarIcon size={16} />
                    <span>Lịch học</span>
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
                        activeTab === 'history'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    <Users size={16} />
                    <span>Lịch sử điểm danh</span>
                </button>
                <button
                    onClick={() => setActiveTab('stats')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
                        activeTab === 'stats' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    <BarChart3 size={16} />
                    <span>Thống kê Chuyên cần</span>
                </button>
            </div>

            {/* Schedule tab content */}
            {activeTab === 'schedule' && (
                <div className="space-y-4">
                    {/* View mode selector + Navigation */}
                    <div className="flex items-center justify-between gap-4">
                        {/* View mode buttons */}
                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => {
                                    setViewMode('day');
                                    // Update URL to reflect view mode change
                                    const params = new URLSearchParams(searchParams);
                                    params.set('view', 'day');
                                    navigate(`/attendance?${params.toString()}`, { replace: true });
                                }}
                                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                                    viewMode === 'day'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Ngày
                            </button>
                            <button
                                onClick={() => {
                                    setViewMode('week');
                                    // Update URL to reflect view mode change
                                    const params = new URLSearchParams(searchParams);
                                    params.set('view', 'week');
                                    navigate(`/attendance?${params.toString()}`, { replace: true });
                                }}
                                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                                    viewMode === 'week'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Tuần
                            </button>
                            <button
                                onClick={() => {
                                    setViewMode('month');
                                    // Update URL to reflect view mode change
                                    const params = new URLSearchParams(searchParams);
                                    params.set('view', 'month');
                                    navigate(`/attendance?${params.toString()}`, { replace: true });
                                }}
                                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                                    viewMode === 'month'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Tháng
                            </button>
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleToday}
                                className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                                Hôm nay
                            </button>
                        <button
                            className="h-8 w-8 rounded-md border bg-white hover:bg-gray-50 flex items-center justify-center"
                                onClick={() => handleNavigate(-1)}
                                title={viewMode === 'day' ? 'Ngày trước' : viewMode === 'week' ? 'Tuần trước' : 'Tháng trước'}
                        >
                            <ChevronLeft size={16} />
                        </button>
                            <div className="px-3 py-1 text-sm font-medium min-w-[180px] text-center">
                                {displayTitle}
                        </div>
                        <button
                            className="h-8 w-8 rounded-md border bg-white hover:bg-gray-50 flex items-center justify-center"
                                onClick={() => handleNavigate(1)}
                                title={viewMode === 'day' ? 'Ngày sau' : viewMode === 'week' ? 'Tuần sau' : 'Tháng sau'}
                        >
                            <ChevronRight size={16} />
                        </button>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-6 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-green-500"></div>
                            <span className="text-gray-600">Đã điểm danh</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                            <span className="text-gray-600">Chưa điểm danh</span>
                        </div>
                    </div>

                    {loading && <div className="text-center text-sm text-gray-500 py-4">Đang tải lịch học...</div>}

                    {/* DAY VIEW */}
                    {!loading && viewMode === 'day' && (
                        <div className="bg-white border rounded-lg p-4">
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {currentDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </h3>
                            </div>
                            {sessions.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">Không có buổi học nào trong ngày này</div>
                            ) : (
                                <div className="space-y-2">
                                    {sessions.map((session, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                const params = new URLSearchParams({
                                                    classId: session.classId.toString(),
                                                    className: session.className,
                                                    date: session.attendanceDate,
                                                    viewMode: viewMode, // Pass current view mode
                                                });
                                                if (session.sessionId) {
                                                    params.set('sessionId', session.sessionId.toString());
                                                }
                                                navigate(`/attendance/take?${params.toString()}`);
                                            }}
                                            className={`w-full p-4 rounded-lg border-2 text-left hover:shadow-md transition-all ${
                                                session.sessionStatus === 'TAKEN'
                                                    ? 'bg-green-50 border-green-300 hover:bg-green-100'
                                                    : 'bg-orange-50 border-orange-300 hover:bg-orange-100'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-semibold text-gray-900 text-base">{session.className}</div>
                                                    <div className="text-sm mt-1">
                                                        <span
                                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                                session.sessionStatus === 'TAKEN'
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : 'bg-orange-100 text-orange-700'
                                                            }`}
                                                        >
                                                            {session.sessionStatus === 'TAKEN' ? (
                                                                <>
                                                                    <Check size={12} />
                                                                    Đã điểm danh
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Clock size={12} />
                                                                    Chưa điểm danh
                                                                </>
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                                <ChevronDown size={20} className="text-gray-400 rotate-[-90deg]" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                                </div>
                    )}

                    {/* WEEK VIEW */}
                    {!loading && viewMode === 'week' && (
                        <div className="flex gap-4">
                            {/* Main calendar - Time Grid */}
                            <div className="flex-1 bg-white border rounded-lg overflow-hidden">
                                {/* Week header with dates */}
                                <div className="grid grid-cols-8 border-b bg-gray-50 sticky top-0 z-10">
                                    {/* Time column header */}
                                    <div className="px-2 py-3 text-xs text-gray-500 border-r">GMT+7</div>
                                    
                                    {/* Day headers */}
                                    {weekDays.map((day, idx) => {
                                        const isToday = day.toDateString() === new Date().toDateString();
                                        const dayName = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][idx];
                                        
                                    return (
                                            <div
                                                key={idx}
                                                className={`px-2 py-3 text-center border-l ${
                                                    isToday ? 'bg-blue-50' : ''
                                                }`}
                                            >
                                                <div className="text-xs text-gray-600 font-medium">{dayName}</div>
                                                <div
                                                    className={`text-sm font-semibold mt-1 ${
                                                        isToday
                                                            ? 'bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center mx-auto'
                                                            : 'text-gray-900'
                                                    }`}
                                                >
                                                    {day.getDate()}
                                                </div>
                                                <div className="text-[10px] text-gray-500 mt-0.5">
                                                    {day.toLocaleDateString('vi-VN', { month: 'numeric' })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                                {/* Time slots - 3 khung giờ */}
                                <div className="overflow-auto max-h-[600px]">
                                    {(['MORNING', 'AFTERNOON', 'EVENING'] as const).map((timeSlot) => {
                                        const slot = TIME_SLOTS[timeSlot];
                                        
                                        return (
                                            <div key={timeSlot} className="grid grid-cols-8 border-b min-h-[100px]">
                                                {/* Time label */}
                                                <div className="px-2 py-3 text-xs text-gray-500 border-r bg-gray-50">
                                                    <div className="font-semibold text-gray-700 mb-1">
                                                        {timeSlot === 'MORNING' ? 'Sáng' : timeSlot === 'AFTERNOON' ? 'Chiều' : 'Tối'}
                                                    </div>
                                                    <div>{slot.label}</div>
                                    </div>
                                                
                                                {/* Day columns */}
                                                {weekDays.map((day, dayIdx) => {
                                                    const dateStr = formatDate(day);
                                                    const daySessions = sessionsByDate.get(dateStr) || [];
                                                    // Filter sessions for this time slot
                                                    const slotSessions = daySessions.filter(
                                                        (session) => session.studyTime === timeSlot
                                                    );
                                                    const isToday = day.toDateString() === new Date().toDateString();

                                        return (
                                                        <div
                                                            key={dayIdx}
                                                            className={`border-l p-2 relative ${
                                                                isToday ? 'bg-blue-50/30' : ''
                                                            }`}
                                                        >
                                                            {/* Display sessions for this time slot */}
                                                            {slotSessions.length > 0 ? (
                                                                <div className="space-y-1">
                                                                    {slotSessions.map((session, sIdx) => (
                                                    <button
                                                                            key={sIdx}
                                                        onClick={() => {
                                                            const params = new URLSearchParams({
                                                                classId: session.classId.toString(),
                                                                className: session.className,
                                                                                    date: session.attendanceDate,
                                                                                    viewMode: viewMode, // Pass current view mode
                                                                                });
                                                                                if (session.sessionId) {
                                                                                    params.set('sessionId', session.sessionId.toString());
                                                                                }
                                                            navigate(`/attendance/take?${params.toString()}`);
                                                        }}
                                                                            className={`w-full text-left px-2 py-2 rounded text-xs transition-all ${
                                                                                session.sessionStatus === 'TAKEN'
                                                                                    ? 'bg-green-500 text-white hover:bg-green-600 shadow-sm'
                                                                                    : 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm'
                                                                            }`}
                                                                        >
                                                                            <div className="font-medium truncate mb-1">
                                                            {session.className}
                                                        </div>
                                                                            <div className="text-[10px] opacity-90 flex items-center gap-1">
                                                                                {session.sessionStatus === 'TAKEN' ? (
                                                                                    <>
                                                                                        <Check size={10} />
                                                                                        Đã điểm danh
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <Clock size={10} />
                                                                                        Chưa điểm danh
                                                                                    </>
                                                                                )}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                                            ) : null}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Mini Calendar Sidebar */}
                            <div className="w-64 flex-shrink-0">
                                <div className="bg-white border rounded-lg p-4">
                                    {/* Mini calendar header */}
                                    <div className="flex items-center justify-between mb-4">
                                        <button
                                            onClick={() => handleNavigate(-1)}
                                            className="p-1 hover:bg-gray-100 rounded"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <div className="text-sm font-semibold">
                                            Tháng {currentDate.getMonth() + 1}-{currentDate.getFullYear()}
                                        </div>
                                        <button
                                            onClick={() => handleNavigate(1)}
                                            className="p-1 hover:bg-gray-100 rounded"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>

                                    {/* Mini calendar days header */}
                                    <div className="grid grid-cols-7 gap-1 mb-2">
                                        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
                                            <div key={day} className="text-center text-xs font-medium text-gray-500">
                                                {day}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Mini calendar dates */}
                                    <div className="grid grid-cols-7 gap-1">
                                        {calendarDays.slice(0, 35).map((date, idx) => {
                                            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                                            const isToday = date.toDateString() === new Date().toDateString();
                                            const isInCurrentWeek = weekDays.some(
                                                (d) => d.toDateString() === date.toDateString()
                                            );
                                            const dateStr = formatDate(date);
                                            const hasSession = sessionsByDate.has(dateStr);

                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => setCurrentDate(new Date(date))}
                                                    className={`
                                                        aspect-square flex items-center justify-center text-xs rounded-full
                                                        transition-colors relative
                                                        ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                                                        ${isToday ? 'bg-blue-600 text-white font-bold' : ''}
                                                        ${isInCurrentWeek && !isToday ? 'bg-blue-100 font-semibold' : ''}
                                                        ${!isToday && !isInCurrentWeek ? 'hover:bg-gray-100' : ''}
                                                    `}
                                                >
                                                    {date.getDate()}
                                                    {hasSession && !isToday && (
                                                        <span className="absolute bottom-0.5 w-1 h-1 bg-green-500 rounded-full"></span>
                                                    )}
                                                </button>
                                        );
                                    })}
                                </div>

                                    {/* Legend */}
                                    <div className="mt-4 pt-4 border-t space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                                            <span>Hôm nay</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <div className="w-3 h-3 rounded-full bg-blue-100"></div>
                                            <span>Tuần hiện tại</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                            <span>Đã điểm danh</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                            <span>Chưa điểm danh</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MONTH VIEW - Calendar Grid */}
                    {!loading && viewMode === 'month' && (
                        <div className="bg-white border rounded-lg overflow-hidden">
                            {/* Calendar Header - Days of week */}
                            <div className="grid grid-cols-7 bg-gray-50 border-b">
                                {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'].map((day) => (
                                    <div key={day} className="px-2 py-3 text-center text-xs font-semibold text-gray-700 border-l first:border-l-0">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Days */}
                            <div className="grid grid-cols-7">
                                {calendarDays.map((date, idx) => {
                                    const dateStr = formatDate(date);
                                    const daySessions = sessionsByDate.get(dateStr) || [];
                                    const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                                    const isToday =
                                        date.toDateString() === new Date().toDateString();

                                        return (
                                        <div
                                            key={idx}
                                            className={`min-h-[100px] p-2 border-l border-b first:border-l-0 ${
                                                !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                                            }`}
                                        >
                                            {/* Date number */}
                                            <div className="flex items-center justify-between mb-1">
                                                <span
                                                    className={`text-sm font-medium ${
                                                        isToday
                                                            ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center'
                                                            : !isCurrentMonth
                                                            ? 'text-gray-400'
                                                            : 'text-gray-900'
                                                    }`}
                                                >
                                                    {date.getDate()}
                                                </span>
                                            </div>

                                            {/* Sessions for this day */}
                                            <div className="space-y-1">
                                                {daySessions.map((session, sIdx) => (
                                                    <button
                                                        key={sIdx}
                                                        onClick={() => {
                                                            const params = new URLSearchParams({
                                                                classId: session.classId.toString(),
                                                                className: session.className,
                                                                date: session.attendanceDate,
                                                                viewMode: viewMode, // Pass current view mode
                                                            });
                                                            if (session.sessionId) {
                                                                params.set('sessionId', session.sessionId.toString());
                                                            }
                                                            navigate(`/attendance/take?${params.toString()}`);
                                                        }}
                                                        className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                                                            session.sessionStatus === 'TAKEN'
                                                                ? 'bg-green-100 border border-green-300 text-green-800 hover:bg-green-200'
                                                                : 'bg-orange-100 border border-orange-300 text-orange-800 hover:bg-orange-200'
                                                        }`}
                                                    >
                                                        <div className="font-medium truncate">{session.className}</div>
                                                        <div className="text-[10px] mt-0.5">
                                                            {session.sessionStatus === 'TAKEN' ? '✓ Đã điểm danh' : '○ Chưa'}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                            </div>
                                        );
                                    })}
                                </div>
                        </div>
                    )}
                </div>
            )}

            {/* History tab placeholder */}
            {activeTab === 'history' && (
                <div className="bg-white border rounded-lg p-6">
                    <p className="text-sm text-gray-600">Lịch sử điểm danh sẽ được cập nhật sau</p>
                </div>
            )}

            {/* Stats tab placeholder */}
            {activeTab === 'stats' && (
                <div className="bg-white border rounded-lg p-6">
                    <p className="text-sm text-gray-600">Thống kê chuyên cần sẽ được cập nhật sau</p>
                </div>
            )}
        </div>
    );
}

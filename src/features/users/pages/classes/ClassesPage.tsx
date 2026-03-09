import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
    Search,
    X,
    ChevronDown,
    Check,
    Edit,
    Trash2,
    Star,
    MoreVertical,
    Calendar,
    ClipboardList,
    Users,
    Grid3X3,
    List,
    ArrowLeft,
    BookOpen,
    UserPlus,
    FileText,
    History,
    Pause,
    Play,
    Clock,
} from 'lucide-react';
import ClassList from '@/features/users/pages/classes/list.tsx';
import ManageStudentsModal from '@/features/users/pages/classes/components/ManageStudentsModal';
import AttendanceHistoryTab from '@/features/users/pages/classes/components/AttendanceHistoryTab';
import ClassLogTab from '@/features/users/pages/classes/components/journals/ClassLogTab';
import AssignInstructorModal from '@/features/users/pages/classes/components/AssignInstructorModal';
import ConfirmDialog from '@/shared/components/ConfirmDialog';
import { useToast } from '@/shared/hooks/useToast';
import { useUserProfile } from '@/stores/userProfile';
import { useCenterSelection, useEnsureCenterLoaded } from '@/stores/centerSelection';
import CenterSwitcher from '@/features/users/pages/dashboard/components/CenterSwitcher';
import http from '@/shared/api/http';
import { getModulesByProgram, type ModuleResponse } from '@/shared/api/modules';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    listClasses,
    createClass,
    updateClass,
    getProgramsLite,
    type ClassDto,
    type ProgramLiteDto,
    type StudyDay,
    type StudyTime,
    type ClassStatus,
} from '@/shared/api/classes';
import { getCentersLite } from '@/shared/api/centers';
import { getClassStudents } from '@/shared/api/classes';
import type { CenterLiteDto } from '@/shared/types/centers';

type Instructor = {
    id: string;
    name: string;
    initial: string;
    avatar?: string;
};

// Map ClassDto to UI Class type
type Class = {
    id: string;
    name: string;
    description: string;
    program: string;
    programId: number;
    startDate: string;
    endDate?: string;
    schedule: string;
    location: string;
    students: number;
    maxStudents: number;
    instructors: Instructor[];
    status: 'Chuẩn bị' | 'Đang học' | 'Hoàn thành' | 'Tạm dừng';
    studyDays?: StudyDay[];
    studyTime?: StudyTime;
    centerName?: string;
};

// Helper function to map API status to UI status
const mapStatusToUI = (status: ClassStatus): Class['status'] => {
    const statusMap: Record<ClassStatus, Class['status']> = {
        PLANNED: 'Chuẩn bị',
        ONGOING: 'Đang học',
        FINISHED: 'Hoàn thành',
        CANCELLED: 'Tạm dừng',
    };
    return statusMap[status];
};

// Helper function to calculate status from dates
const calculateStatusFromDates = (startDate?: string, endDate?: string): ClassStatus => {
    if (!startDate || !endDate) {
        return 'PLANNED';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (today < start) {
        return 'PLANNED';
    } else if (today > end) {
        return 'FINISHED';
    } else {
        return 'ONGOING';
    }
};

// Helper function to format schedule from API data
const formatSchedule = (studyDays?: StudyDay[] | null, studyTime?: StudyTime | null): string => {
    if (!studyDays || studyDays.length === 0) return '';

    const dayMap: Record<StudyDay, string> = {
        MONDAY: 'Thứ 2',
        TUESDAY: 'Thứ 3',
        WEDNESDAY: 'Thứ 4',
        THURSDAY: 'Thứ 5',
        FRIDAY: 'Thứ 6',
        SATURDAY: 'Thứ 7',
        SUNDAY: 'CN',
    };

    const timeMap: Record<StudyTime, string> = {
        MORNING: '08:00-11:00',
        AFTERNOON: '14:00-17:00',
        EVENING: '18:00-21:00',
    };

    const days = studyDays.map((d) => dayMap[d]).join(', ');
    const time = studyTime ? timeMap[studyTime] : '';

    return time ? `${days} - ${time}` : days;
};

// Helper function to map ClassDto to UI Class
const mapClassDtoToUI = (dto: ClassDto): Class => {
    return {
        id: String(dto.classId),
        name: dto.name,
        description: dto.description || '',
        program: dto.programName,
        programId: dto.programId,
        startDate: dto.startDate || '',
        endDate: dto.endDate || '',
        schedule: formatSchedule(dto.studyDays, dto.studyTime),
        location: dto.room || '',
        students: 0, // TODO: Get from enrollment API
        maxStudents: dto.capacity || 0,
        instructors: [], // TODO: Get from lecturer API
        status: mapStatusToUI(dto.status),
        studyDays: dto.studyDays || undefined,
        studyTime: dto.studyTime || undefined,
        centerName: dto.centerName,
    };
};

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black/30" onClick={onClose} />
            <div className="fixed inset-0 flex items-start justify-center pt-12 px-4">
                <div className="w-full max-w-2xl rounded-lg bg-white shadow-lg border max-h-[85vh] overflow-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}

// MultiSelect component for days and time selection
function MultiSelect({
    options,
    selectedValues,
    onChange,
    placeholder,
    name,
    error,
    maxSelection,
}: {
    options: string[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
    placeholder: string;
    name: string;
    error?: string;
    maxSelection?: number;
}) {
    const [isOpen, setIsOpen] = useState(false);

    const handleToggle = (value: string) => {
        if (selectedValues.includes(value)) {
            onChange(selectedValues.filter((v) => v !== value));
        } else {
            // Check max selection limit
            if (maxSelection && selectedValues.length >= maxSelection) {
                return; // Don't add more if limit reached
            }
            onChange([...selectedValues, value]);
        }
    };

    const formatDisplayValue = (values: string[]) => {
        if (values.length === 0) return placeholder;
        if (values.length === 1) return values[0];
        if (values.length <= 3) return values.join(', ');
        return `${values.length} mục đã chọn`;
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-9 rounded-md border px-3 text-sm text-left flex items-center justify-between ${
                    error ? 'border-red-500' : 'border-gray-300'
                }`}
            >
                <span className={selectedValues.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
                    {formatDisplayValue(selectedValues)}
                </span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-auto">
                    {options.map((option) => {
                        const isSelected = selectedValues.includes(option);
                        const isDisabled = !isSelected && maxSelection && selectedValues.length >= maxSelection;

                        return (
                            <label
                                key={option}
                                className={`flex items-center gap-2 px-3 py-2 ${
                                    isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggle(option)}
                                    disabled={isDisabled}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                                />
                                <span className="text-sm text-gray-900">{option}</span>
                                {isSelected && <Check size={16} className="text-blue-600 ml-auto" />}
                            </label>
                        );
                    })}
                </div>
            )}

            {error && <div className="text-xs text-red-600 mt-1">{error}</div>}

            {/* Hidden input for form submission */}
            <input type="hidden" name={name} value={selectedValues.join(',')} />
        </div>
    );
}

export default function ClassesPage() {
    // Ensure center is loaded from localStorage
    useEnsureCenterLoaded();

    // Get selected center from global store
    const globalSelectedCenterId = useCenterSelection((s) => s.selectedCenterId);

    const location = useLocation();
    const toast = useToast();
    const { me: userProfile } = useUserProfile();
    const isLecturer = userProfile?.roles?.some((r) => r.code === 'LECTURER');

    // Check query params for auto-open modal
    const [searchParams, setSearchParams] = useSearchParams();

    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái');
    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState<Class | null>(null);
    // ManageStudents now renders inline in Students tab; keep state only if needed elsewhere
    const [openAssignInstructor, setOpenAssignInstructor] = useState<Class | null>(null);
    const [pauseConfirm, setPauseConfirm] = useState<Class | null>(null);
    const [resumeConfirm, setResumeConfirm] = useState<Class | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<Class | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const classesPerPage = 6;
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [view, setView] = useState<'list' | 'detail'>('list');
    const [selectedClass, setSelectedClass] = useState<Class | null>(null);
    const [modules, setModules] = useState<ModuleResponse[]>([]);
    const [modulesLoading, setModulesLoading] = useState(false);

    // Soft color themes for class cards + corresponding text accents
    const cardThemes = [
        {
            bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
            border: 'border-blue-200',
            textHeading: 'text-blue-700',
            textLabel: 'text-blue-600',
            ring: 'ring-blue-200',
            tileBg: 'bg-blue-50/70',
        },
        {
            bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
            border: 'border-purple-200',
            textHeading: 'text-purple-700',
            textLabel: 'text-purple-600',
            ring: 'ring-purple-200',
            tileBg: 'bg-purple-50/70',
        },
        {
            bg: 'bg-gradient-to-br from-green-50 to-green-100',
            border: 'border-green-200',
            textHeading: 'text-green-700',
            textLabel: 'text-green-600',
            ring: 'ring-green-200',
            tileBg: 'bg-green-50/70',
        },
        {
            bg: 'bg-gradient-to-br from-amber-50 to-amber-100',
            border: 'border-amber-200',
            textHeading: 'text-amber-700',
            textLabel: 'text-amber-600',
            ring: 'ring-amber-200',
            tileBg: 'bg-amber-50/70',
        },
        {
            bg: 'bg-gradient-to-br from-pink-50 to-pink-100',
            border: 'border-pink-200',
            textHeading: 'text-pink-700',
            textLabel: 'text-pink-600',
            ring: 'ring-pink-200',
            tileBg: 'bg-pink-50/70',
        },
        {
            bg: 'bg-gradient-to-br from-cyan-50 to-cyan-100',
            border: 'border-cyan-200',
            textHeading: 'text-cyan-700',
            textLabel: 'text-cyan-600',
            ring: 'ring-cyan-200',
            tileBg: 'bg-cyan-50/70',
        },
    ];

    // Stable theming based on class id or name to keep colors consistent across pages/filters
    const getCardThemeByKey = (key: string) => {
        const str = key || '';
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (hash * 31 + str.charCodeAt(i)) | 0;
        }
        const idx = Math.abs(hash) % cardThemes.length;
        return cardThemes[idx];
    };

    const handleUpdateInstructors = (classId: string, updatedInstructors: Instructor[]) => {
        setClasses((prev) =>
            prev.map((cls) => (cls.id === classId ? { ...cls, instructors: updatedInstructors } : cls)),
        );
        // Also keep selectedClass in sync if it's the one being updated
        setSelectedClass((prev) =>
            prev && prev.id === classId ? ({ ...prev, instructors: updatedInstructors } as Class) : prev,
        );
    };

    // State for classes and programs
    const [classes, setClasses] = useState<Class[]>([]);
    const [programs, setPrograms] = useState<ProgramLiteDto[]>([]);
    const [centers, setCenters] = useState<CenterLiteDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Check if user has GLOBAL scope (can select center)
    const hasGlobalScope = !userProfile?.centerId;

    // Confirm pause class
    const confirmPause = async () => {
        if (!pauseConfirm) return;
        try {
            const UpdateClassRequest = {
                status: 'CANCELLED' as const,
            };
            const response = await updateClass(Number(pauseConfirm.id), UpdateClassRequest);
            const updatedClass = mapClassDtoToUI(response.data);
            setClasses((prev) => prev.map((c) => (c.id === pauseConfirm.id ? updatedClass : c)));
            if (selectedClass?.id === pauseConfirm.id) {
                setSelectedClass(updatedClass);
            }
            toast.success('Tạm dừng thành công!', `Lớp học đã được tạm dừng`);
        } catch (err) {
            toast.error('Lỗi tạm dừng lớp học');
        } finally {
            setPauseConfirm(null);
        }
    };

    // Confirm resume class
    const confirmResume = async () => {
        if (!resumeConfirm) return;
        try {
            const calculatedStatus = calculateStatusFromDates(resumeConfirm.startDate, resumeConfirm.endDate);
            const response = await updateClass(Number(resumeConfirm.id), { status: calculatedStatus });
            const updatedClass = mapClassDtoToUI(response.data);
            setClasses((prev) => prev.map((c) => (c.id === resumeConfirm.id ? updatedClass : c)));
            if (selectedClass?.id === resumeConfirm.id) {
                setSelectedClass(updatedClass);
            }
            toast.success('Khôi phục thành công!', `Lớp học đã được khôi phục`);
        } catch (err) {
            toast.error('Lỗi khôi phục lớp học');
        } finally {
            setResumeConfirm(null);
        }
    };

    // Confirm delete class
    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        try {
            const { deleteClass } = await import('@/shared/api/classes');
            await deleteClass(Number(deleteConfirm.id));
            setClasses((prev) => prev.filter((c) => c.id !== deleteConfirm.id));
            if (selectedClass?.id === deleteConfirm.id) {
                setView('list');
                setSelectedClass(null);
            }
            toast.success('Xóa thành công!', `Lớp học "${deleteConfirm.name}" đã được xóa`);
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || 'Không thể xóa lớp học';
            toast.error('Lỗi xóa lớp học', errorMessage);
        } finally {
            setDeleteConfirm(null);
        }
    };

    // Auto-open create modal if ?action=create is present
    useEffect(() => {
        if (searchParams.get('action') === 'create') {
            setOpenCreate(true);
            // Remove query param after opening modal
            setSearchParams({});
        }
    }, [searchParams, setSearchParams]);

    // Fetch classes and programs from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);

                // Fetch classes with optional center filter
                const classesParams = globalSelectedCenterId ? { centerId: globalSelectedCenterId } : undefined;
                const [classesRes, programsRes] = await Promise.all([listClasses(classesParams), getProgramsLite()]);

                const mappedClasses = classesRes.data.map(mapClassDtoToUI);
                setClasses(mappedClasses);
                setPrograms(programsRes.data);

                // Only fetch centers if user has GLOBAL scope
                if (hasGlobalScope) {
                    try {
                        const centersRes = await getCentersLite();
                        setCenters(centersRes.data);
                    } catch (error: any) {
                        // Bỏ qua lỗi 403 - user không có quyền truy cập centers
                        if (error?.response?.status !== 403) {
                        }
                    }
                }

                // Fetch student counts and instructors for all classes in parallel
                const studentCountPromises = mappedClasses.map(async (cls) => {
                    try {
                        const res = await getClassStudents(parseInt(cls.id, 10), {
                            status: 'ACTIVE',
                            page: 0,
                            size: 1,
                        });
                        let activeCount = 0;
                        const data: any = res.data;
                        if (data && typeof data.totalElements === 'number') {
                            activeCount = data.totalElements;
                        } else if (data && Array.isArray(data)) {
                            activeCount = data.filter((e: any) => e.status === 'ACTIVE').length;
                        } else if (data && Array.isArray(data.content) && typeof data.totalElements === 'number') {
                            activeCount = data.totalElements;
                        }
                        return { classId: cls.id, studentCount: activeCount };
                    } catch (e) {
                        return { classId: cls.id, studentCount: 0 };
                    }
                });

                const instructorPromises = mappedClasses.map(async (cls) => {
                    try {
                        const res = await http.get(`/api/classes/${cls.id}/lecturers`);
                        const apiData: any[] = res.data.items || [];
                        const instructors: Instructor[] = apiData
                            .filter((item) => item.active)
                            .map((item) => ({
                                id: item.assignmentId.toString(),
                                name: item.lecturer.fullName,
                                initial: item.lecturer.fullName.charAt(0).toUpperCase(),
                                avatar: item.lecturer.avatarUrl || undefined,
                            }));
                        return { classId: cls.id, instructors };
                    } catch (e) {
                        return { classId: cls.id, instructors: [] };
                    }
                });

                const [studentCounts, instructorData] = await Promise.all([
                    Promise.all(studentCountPromises),
                    Promise.all(instructorPromises),
                ]);

                // Update classes with student counts and instructors
                setClasses((prev) =>
                    prev.map((cls) => {
                        const countData = studentCounts.find((sc) => sc.classId === cls.id);
                        const instructorInfo = instructorData.find((id) => id.classId === cls.id);
                        return {
                            ...cls,
                            students: countData ? countData.studentCount : cls.students,
                            instructors: instructorInfo ? instructorInfo.instructors : cls.instructors,
                        };
                    }),
                );
            } catch (error) {
                toast.error('Lỗi tải dữ liệu', 'Không thể tải danh sách lớp học');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [hasGlobalScope, globalSelectedCenterId]); // Refetch when center changes

    // Reset view to 'list' when navigating to this page (including clicking sidebar menu)
    // location.key changes every time user navigates, even to the same path
    useEffect(() => {
        setView('list');
        setSelectedClass(null);
    }, [location.key]); // Runs every time navigation happens

    // Filter classes based on search and status
    const filteredClasses = classes.filter((c) => {
        const matchesSearch =
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.description.toLowerCase().includes(query.toLowerCase());
        const matchesStatus = statusFilter === 'Tất cả trạng thái' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Calculate pagination
    const totalPages = Math.ceil(filteredClasses.length / classesPerPage);
    const startIndex = (currentPage - 1) * classesPerPage;
    const endIndex = startIndex + classesPerPage;
    const currentClasses = filteredClasses.slice(startIndex, endIndex);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [query, statusFilter]);

    // Fetch assigned instructors when opening class detail
    useEffect(() => {
        const fetchAssignedInstructors = async (classId: string) => {
            try {
                const res = await http.get(`/api/classes/${classId}/lecturers`);
                const items = Array.isArray(res.data?.items) ? res.data.items : [];
                const mapped: Instructor[] = items.map((item: any) => ({
                    id: String(item.lecturer?.id ?? item.assignmentId ?? ''),
                    name: String(item.lecturer?.fullName ?? ''),
                    initial: String((item.lecturer?.fullName || ' ')[0]).toUpperCase(),
                    avatar: item.lecturer?.avatarUrl ?? undefined,
                }));
                handleUpdateInstructors(classId, mapped);
            } catch (e) {
                // Do not toast-spam; show a gentle message once when detail opens
                toast.error?.('Không tải được giảng viên', 'Vui lòng thử lại sau');
            }
        };

        if (selectedClass?.id) {
            // Always refresh on open to reflect latest assignments
            fetchAssignedInstructors(selectedClass.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClass?.id]);

    // Fetch and sync ACTIVE student count to the header when opening detail
    const fetchActiveStudentCount = async (classId: string) => {
        try {
            const res = await getClassStudents(parseInt(classId, 10), { status: 'ACTIVE', page: 0, size: 1 });
            let activeCount = 0;
            const data: any = res.data;
            if (data && typeof data.totalElements === 'number') {
                activeCount = data.totalElements;
            } else if (data && Array.isArray(data)) {
                activeCount = data.filter((e: any) => e.status === 'ACTIVE').length;
            } else if (data && Array.isArray(data.content) && typeof data.totalElements === 'number') {
                activeCount = data.totalElements;
            }

            // Update both selectedClass and classes list
            setSelectedClass((prev) => (prev && prev.id === classId ? { ...prev, students: activeCount } : prev));
            setClasses((prev) => prev.map((c) => (c.id === classId ? { ...c, students: activeCount } : c)));
        } catch (e) {
        }
    };

    useEffect(() => {
        if (selectedClass?.id) {
            fetchActiveStudentCount(selectedClass.id);
        }
    }, [selectedClass?.id]);

    // Fetch modules when selectedClass changes
    useEffect(() => {
        const fetchModules = async () => {
            if (!selectedClass?.programId) {
                setModules([]);
                return;
            }

            try {
                setModulesLoading(true);
                const response = await getModulesByProgram({ programId: selectedClass.programId });
                setModules(response.data || []);
            } catch (error) {
                toast.error?.('Không thể tải danh sách modules');
                setModules([]);
            } finally {
                setModulesLoading(false);
            }
        };

        fetchModules();
    }, [selectedClass?.programId]);

    // AssignInstructorModal function removed - using component instead

    function CreateEditForm({ editing }: { editing?: Class | null }) {
        const [errors, setErrors] = useState<{
            name?: string;
            program?: string;
            startDate?: string;
            schedule?: string;
            location?: string;
            maxStudents?: string;
        }>({});

        // Parse existing schedule for editing
        const parseSchedule = (schedule: string) => {
            if (!schedule) return { days: [], times: [] };
            const [days, times] = schedule.split(' - ');
            return {
                days: days ? days.split(', ').filter((day) => day.trim()) : [],
                times: times ? [times].filter((time) => time.trim()) : [],
            };
        };

        const initialSchedule = editing ? parseSchedule(editing.schedule) : { days: [], times: [] };
        const [selectedDays, setSelectedDays] = useState<string[]>(initialSchedule.days);
        const [selectedTime, setSelectedTime] = useState<string>(initialSchedule.times[0] || '');

        // Options for days and times
        const dayOptions = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];

        const timeOptions = ['08:00-11:00', '14:00-17:00', '18:00-21:00'];

        return (
            <form
                onSubmit={async (e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget as HTMLFormElement);

                    const programId = Number(form.get('programId'));

                    const newErrors: typeof errors = {};

                    const name = String(form.get('name') || '');
                    const startDate = String(form.get('startDate') || '');
                    const endDate = String(form.get('endDate') || '');
                    const room = String(form.get('location') || '');
                    const capacity = Number(form.get('maxStudents') || 0);
                    // Status không còn được chọn từ form nữa - chỉ cho phép set CANCELLED khi cần

                    // Validation
                    if (!name || name.trim().length < 3) {
                        newErrors.name = 'Tên lớp học tối thiểu 3 ký tự';
                    }
                    // Chỉ validate programId khi tạo mới (không validate khi edit)
                    if (!editing && (!programId || isNaN(programId))) {
                        newErrors.program = 'Vui lòng chọn chương trình';
                    }

                    // Chỉ validate startDate và endDate khi TẠO MỚI (không validate khi edit vì bị disabled)
                    if (!editing) {
                        if (!startDate) {
                            newErrors.startDate = 'Vui lòng chọn ngày bắt đầu';
                        }

                        // Validate endDate phải lớn hơn startDate và thời gian hiện tại
                        if (endDate) {
                            const start = new Date(startDate);
                            const end = new Date(endDate);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);

                            if (end <= start) {
                                newErrors.startDate = 'Ngày kết thúc phải lớn hơn ngày bắt đầu';
                            }

                            if (end < today) {
                                newErrors.startDate = 'Ngày kết thúc phải lớn hơn thời gian hiện tại';
                            }
                        }
                    }

                    if (selectedDays.length === 0 || !selectedTime) {
                        newErrors.schedule = 'Vui lòng chọn đầy đủ ngày và giờ học';
                    }

                    // Validate: Tối đa 2 ngày học
                    if (selectedDays.length > 2) {
                        newErrors.schedule = 'Chỉ được chọn tối đa 2 ngày học trong tuần';
                    }

                    // Validate study days based on start/end date (only if < 7 days)
                    // Khi edit: lấy startDate và endDate từ editing object
                    const validationStartDate = editing ? editing.startDate : startDate;
                    const validationEndDate = editing ? editing.endDate : endDate;

                    if (validationStartDate && validationEndDate && selectedDays.length > 0) {
                        const start = new Date(validationStartDate);
                        const end = new Date(validationEndDate);
                        const diffTime = Math.abs(end.getTime() - start.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        // Only validate if duration < 7 days
                        if (diffDays < 7) {
                            const startDayOfWeek = start.getDay(); // 0 = CN, 1 = T2, ..., 6 = T7
                            const endDayOfWeek = end.getDay();

                            const dayNumberMap: Record<string, number> = {
                                CN: 0,
                                'Thứ 2': 1,
                                'Thứ 3': 2,
                                'Thứ 4': 3,
                                'Thứ 5': 4,
                                'Thứ 6': 5,
                                'Thứ 7': 6,
                            };

                            const invalidDays = selectedDays.filter((day) => {
                                const dayNum = dayNumberMap[day];
                                // Check if day is within start-end range
                                if (startDayOfWeek <= endDayOfWeek) {
                                    // Normal case: e.g., Thứ 4 -> CN (3 -> 0)
                                    return dayNum < startDayOfWeek || dayNum > endDayOfWeek;
                                } else {
                                    // Wrap around week: e.g., Thứ 6 -> Thứ 2 (5 -> 1)
                                    return dayNum < startDayOfWeek && dayNum > endDayOfWeek;
                                }
                            });

                            if (invalidDays.length > 0) {
                                const dayNames = dayOptions;
                                const startDayName = dayNames[startDayOfWeek === 0 ? 6 : startDayOfWeek - 1];
                                const endDayName = dayNames[endDayOfWeek === 0 ? 6 : endDayOfWeek - 1];
                                newErrors.schedule = `Lớp học < 7 ngày. Chỉ chọn ngày từ ${startDayName} đến ${endDayName}`;
                            }
                        }
                    }

                    if (!room || room.trim().length < 2) {
                        newErrors.location = 'Phòng học tối thiểu 2 ký tự';
                    }
                    if (!capacity || capacity < 1) {
                        newErrors.maxStudents = 'Sĩ số tối đa phải lớn hơn 0';
                    }

                    setErrors(newErrors);
                    if (Object.keys(newErrors).length > 0) return;

                    // Map UI days to API StudyDay
                    const dayMap: Record<string, StudyDay> = {
                        'Thứ 2': 'MONDAY',
                        'Thứ 3': 'TUESDAY',
                        'Thứ 4': 'WEDNESDAY',
                        'Thứ 5': 'THURSDAY',
                        'Thứ 6': 'FRIDAY',
                        'Thứ 7': 'SATURDAY',
                        CN: 'SUNDAY',
                    };

                    // Map UI time to API StudyTime
                    const timeMap: Record<string, StudyTime> = {
                        '08:00-11:00': 'MORNING',
                        '14:00-17:00': 'AFTERNOON',
                        '18:00-21:00': 'EVENING',
                    };

                    const studyDays = selectedDays.map((d) => dayMap[d]).filter(Boolean);
                    const studyTime = timeMap[selectedTime];

                    try {
                        if (editing) {
                            // Update existing class
                            const description = String(form.get('description') || '');

                            // Build payload - KHÔNG gửi programId vì backend không cho phép update program
                            const updatePayload: any = {
                                name, // Chỉ name là required
                            };

                            if (description.trim()) updatePayload.description = description.trim();
                            // Khi edit: startDate và endDate bị disabled nên lấy từ editing object
                            if (editing.startDate) updatePayload.startDate = editing.startDate;
                            if (editing.endDate) updatePayload.endDate = editing.endDate;
                            if (room.trim()) updatePayload.room = room.trim();
                            if (capacity > 0) updatePayload.capacity = capacity;

                            // Status chỉ cho phép set CANCELLED (tạm dừng) khi cần
                            // Các status khác (PLANNED, ONGOING, FINISHED) sẽ tự động tính từ ngày
                            // Bây giờ chỉ set status nếu user muốn tạm dừng class
                            // Không có checkbox "Tạm dừng" nên không set gì cả

                            if (studyDays.length > 0) updatePayload.studyDays = studyDays;
                            if (studyTime) updatePayload.studyTime = studyTime;

                            const response = await updateClass(Number(editing.id), updatePayload);
                            const updatedClass = mapClassDtoToUI(response.data);

                            setClasses((prev) => prev.map((x) => (x.id === editing.id ? updatedClass : x)));
                            setOpenEdit(null);

                            toast.success('Cập nhật thành công!', `Lớp học ${name} đã được cập nhật`);
                        } else {
                            // Create new class
                            const description = String(form.get('description') || '');
                            const centerIdFromForm = form.get('centerId');

                            // Build payload - only include fields with actual values
                            const createPayload: any = {
                                programId,
                                name,
                            };

                            // Add centerId based on user scope
                            if (hasGlobalScope) {
                                // GLOBAL scope: use selected center from dropdown
                                if (centerIdFromForm) {
                                    createPayload.centerId = Number(centerIdFromForm);
                                }
                            } else {
                                // CENTER scope: use user's centerId (backend will also validate this)
                                if (userProfile?.centerId) {
                                    createPayload.centerId = userProfile.centerId;
                                }
                            }

                            if (description.trim()) createPayload.description = description.trim();
                            if (startDate) createPayload.startDate = startDate;
                            if (endDate) createPayload.endDate = endDate;
                            if (room.trim()) createPayload.room = room.trim();
                            if (capacity > 0) createPayload.capacity = capacity;
                            if (studyDays.length > 0) createPayload.studyDays = studyDays;
                            if (studyTime) createPayload.studyTime = studyTime;

                            const response = await createClass(createPayload);
                            const newClass = mapClassDtoToUI(response.data);

                            setClasses((prev) => [newClass, ...prev]);
                            setOpenCreate(false);

                            toast.success('Tạo thành công!', `Lớp học ${name} đã được thêm vào hệ thống`);
                        }
                    } catch (error: any) {

                        const errorMessage =
                            error.response?.data?.message ||
                            error.response?.data?.error ||
                            error.message ||
                            'Có lỗi xảy ra khi lưu lớp học';

                        if (error.response?.status === 400) {
                            toast.error('Dữ liệu không hợp lệ', errorMessage);
                        } else if (error.response?.status === 409) {
                            toast.error('Trùng lặp dữ liệu', 'Tên lớp học đã tồn tại trong hệ thống');
                        } else if (error.response?.status === 500) {
                            toast.error('Lỗi hệ thống', 'Vui lòng kiểm tra lại thông tin hoặc liên hệ quản trị viên');
                        } else {
                            toast.error('Lỗi', errorMessage);
                        }
                    }
                }}
            >
                <div className="px-4 py-3 border-b flex items-center justify-between">
                    <div>
                        <div className="font-medium">{editing ? 'Chỉnh sửa Lớp học' : 'Tạo lớp học mới'}</div>
                        {editing && (
                            <div className="text-xs text-gray-500">Cập nhật thông tin lớp học {editing.name}.</div>
                        )}
                    </div>
                    <button
                        type="button"
                        className="h-8 w-8 rounded hover:bg-gray-100 flex items-center justify-center"
                        onClick={() => (editing ? setOpenEdit(null) : setOpenCreate(false))}
                    >
                        <X size={16} />
                    </button>
                </div>
                <div className="p-4 space-y-4">
                    <div>
                        <h3 className="text-sm font-medium mb-3">Thông tin cơ bản</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Tên lớp học *</label>
                                <input
                                    name="name"
                                    defaultValue={editing?.name}
                                    required
                                    className={`w-full h-9 rounded-md border px-3 text-sm ${errors.name ? 'border-red-500' : ''}`}
                                    placeholder="Lập trình Java Cơ bản - K15"
                                />
                                {errors.name && <div className="text-xs text-red-600 mt-1">{errors.name}</div>}
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Chương trình học *</label>
                                {editing ? (
                                    // EDIT MODE: Read-only, cannot change program
                                    <>
                                        <input
                                            type="text"
                                            value={editing.program}
                                            readOnly
                                            className="w-full h-9 rounded-md border px-3 text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Không thể thay đổi chương trình sau khi tạo lớp
                                        </p>
                                    </>
                                ) : (
                                    // CREATE MODE: Dropdown
                                    <>
                                        <select
                                            name="programId"
                                            required
                                            className={`w-full h-9 rounded-md border px-2 text-sm ${errors.program ? 'border-red-500' : ''}`}
                                        >
                                            <option value="">Chọn chương trình</option>
                                            {programs.map((program) => (
                                                <option key={program.programId} value={program.programId}>
                                                    {program.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.program && (
                                            <div className="text-xs text-red-600 mt-1">{errors.program}</div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Center Field: 
                                - When CREATING: GLOBAL users see dropdown, CENTER users see read-only
                                - When EDITING: Always read-only (cannot change center after creation)
                            */}
                            {editing ? (
                                // EDIT MODE: Always show read-only center
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Trung tâm</label>
                                    <input
                                        type="text"
                                        value={editing.centerName || ''}
                                        readOnly
                                        className="w-full h-9 rounded-md border px-3 text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Không thể thay đổi trung tâm sau khi tạo lớp
                                    </p>
                                </div>
                            ) : hasGlobalScope ? (
                                // CREATE MODE - GLOBAL: Show dropdown
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Trung tâm *</label>
                                    <select
                                        name="centerId"
                                        required
                                        className="w-full h-9 rounded-md border px-2 text-sm"
                                    >
                                        <option value="">Chọn trung tâm</option>
                                        {centers.map((center) => (
                                            <option key={center.centerId} value={center.centerId}>
                                                {center.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                // CREATE MODE - CENTER: Show read-only with user's center
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Trung tâm</label>
                                    <input
                                        type="text"
                                        value={userProfile?.centerName || ''}
                                        readOnly
                                        className="w-full h-9 rounded-md border px-3 text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
                                    />
                                    <input type="hidden" name="centerId" value={userProfile?.centerId || ''} />
                                </div>
                            )}

                            <div className="md:col-span-2">
                                <label className="block text-xs text-gray-600 mb-1">Mô tả</label>
                                <textarea
                                    name="description"
                                    defaultValue={editing?.description}
                                    className="w-full h-20 rounded-md border px-3 py-2 text-sm"
                                    placeholder="Khóa học Java dành cho người mới bắt đầu"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Ngày bắt đầu *</label>
                                <input
                                    name="startDate"
                                    type="date"
                                    defaultValue={editing?.startDate}
                                    required
                                    disabled={!!editing}
                                    className={`w-full h-9 rounded-md border px-3 text-sm ${
                                        errors.startDate ? 'border-red-500' : ''
                                    } ${editing ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : ''}`}
                                />
                                {editing && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Không thể thay đổi ngày bắt đầu sau khi tạo lớp
                                    </p>
                                )}
                                {errors.startDate && (
                                    <div className="text-xs text-red-600 mt-1">{errors.startDate}</div>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Ngày kết thúc</label>
                                <input
                                    name="endDate"
                                    type="date"
                                    defaultValue={editing?.endDate}
                                    disabled={!!editing}
                                    className={`w-full h-9 rounded-md border px-3 text-sm ${
                                        editing ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : ''
                                    }`}
                                />
                                {editing && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Không thể thay đổi ngày kết thúc sau khi tạo lớp
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Ngày học * (tối đa 2 ngày)</label>
                                <MultiSelect
                                    options={dayOptions}
                                    selectedValues={selectedDays}
                                    onChange={setSelectedDays}
                                    placeholder="Chọn ngày học"
                                    name="scheduleDays"
                                    error={errors.schedule}
                                    maxSelection={2}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Giờ học *</label>
                                <select
                                    name="scheduleTime"
                                    value={selectedTime}
                                    onChange={(e) => setSelectedTime(e.target.value)}
                                    className={`w-full h-9 rounded-md border px-3 text-sm ${errors.schedule ? 'border-red-500' : 'border-gray-300'}`}
                                >
                                    <option value="">Chọn giờ học</option>
                                    {timeOptions.map((time) => (
                                        <option key={time} value={time}>
                                            {time}
                                        </option>
                                    ))}
                                </select>
                                {errors.schedule && <div className="text-xs text-red-600 mt-1">{errors.schedule}</div>}
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Phòng học *</label>
                                <input
                                    name="location"
                                    defaultValue={editing?.location}
                                    required
                                    className={`w-full h-9 rounded-md border px-3 text-sm ${errors.location ? 'border-red-500' : ''}`}
                                    placeholder="Phòng A101"
                                />
                                {errors.location && <div className="text-xs text-red-600 mt-1">{errors.location}</div>}
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Sĩ số tối đa *</label>
                                <input
                                    name="maxStudents"
                                    type="number"
                                    defaultValue={editing?.maxStudents ?? 30}
                                    required
                                    className={`w-full h-9 rounded-md border px-3 text-sm ${errors.maxStudents ? 'border-red-500' : ''}`}
                                />
                                {errors.maxStudents && (
                                    <div className="text-xs text-red-600 mt-1">{errors.maxStudents}</div>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">
                                    {editing?.status === 'Tạm dừng' ? 'Đang tạm dừng' : 'Trạng thái'}
                                </label>
                                {editing?.status === 'Tạm dừng' ? (
                                    <div className="text-sm text-gray-500 italic">
                                        Trạng thái được tính tự động từ ngày bắt đầu và kết thúc
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-500 italic">
                                        Được tính tự động từ ngày bắt đầu và kết thúc
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
                    <button
                        type="button"
                        className="h-9 px-3 rounded-md border bg-white hover:bg-gray-50"
                        onClick={() => (editing ? setOpenEdit(null) : setOpenCreate(false))}
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        className="h-9 px-3 rounded-md bg-gray-900 text-white hover:bg-black transition-all duration-300"
                    >
                        {editing ? 'Cập nhật' : 'Tạo lớp học'}
                    </button>
                </div>
            </form>
        );
    }

    // Render Class Detail View with Tabs
    if (view === 'detail' && selectedClass) {
        return (
            <div className="space-y-6">
                {/* Back button */}
                <button
                    onClick={() => {
                        setView('list');
                        setSelectedClass(null);
                    }}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={16} />
                    <span>Quay lại danh sách lớp</span>
                </button>

                {/* Class Header */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedClass.name}</h1>
                            <p className="text-sm text-gray-500">{selectedClass.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge
                                variant={
                                    selectedClass.status === 'Đang học'
                                        ? 'primary'
                                        : selectedClass.status === 'Chuẩn bị'
                                          ? 'secondary'
                                          : selectedClass.status === 'Hoàn thành'
                                            ? 'success'
                                            : 'destructive'
                                }
                            >
                                {selectedClass.status}
                            </Badge>
                            {selectedClass.status !== 'Hoàn thành' &&
                                (selectedClass.status === 'Tạm dừng' ? (
                                    <button
                                        onClick={() => setResumeConfirm(selectedClass)}
                                        className="px-2 py-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 rounded-md transition-colors flex items-center gap-1"
                                        title="Khôi phục lớp học"
                                    >
                                        <Play size={12} />
                                        <span>Khôi phục</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setPauseConfirm(selectedClass)}
                                        className="px-2 py-1 text-xs bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-md transition-colors flex items-center gap-1"
                                        title="Tạm dừng lớp học"
                                    >
                                        <Pause size={12} />
                                        <span>Tạm dừng</span>
                                    </button>
                                ))}
                            <button
                                onClick={() => setOpenEdit(selectedClass)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Chỉnh sửa lớp học"
                            >
                                <Edit size={16} className="text-gray-600" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 rounded-lg bg-gray-50/80 border p-4 shadow-sm">
                            <Users className="text-gray-400" size={20} />
                            <div>
                                <p className="text-xs text-gray-500">Học viên</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {selectedClass.students} / {selectedClass.maxStudents}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-lg bg-gray-50/80 border p-4 shadow-sm">
                            <Calendar className="text-gray-400" size={20} />
                            <div>
                                <p className="text-xs text-gray-500">Lịch học</p>
                                <p className="text-sm font-medium text-gray-900">{selectedClass.schedule}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-lg bg-gray-50/80 border p-4 shadow-sm">
                            <ClipboardList className="text-gray-400" size={20} />
                            <div>
                                <p className="text-xs text-gray-500">Chương trình</p>
                                <p className="text-sm font-medium text-gray-900">{selectedClass.program}</p>
                            </div>
                        </div>
                    </div>

                    {/* Instructors */}
                    {selectedClass.instructors && selectedClass.instructors.length > 0 && (
                        <div className="mt-4 flex items-center gap-3">
                            <span className="text-sm text-gray-500">Giảng viên:</span>
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                    {selectedClass.instructors.slice(0, 5).map((instructor, idx) => (
                                        <div
                                            key={idx}
                                            className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-white flex items-center justify-center text-xs text-white font-medium"
                                            title={instructor.name}
                                        >
                                            {instructor.name.charAt(0).toUpperCase()}
                                        </div>
                                    ))}
                                </div>
                                {selectedClass.instructors.length > 5 && (
                                    <span className="text-sm text-gray-500">
                                        +{selectedClass.instructors.length - 5} người khác
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-6 bg-gray-50 p-1 rounded-lg">
                        <TabsTrigger
                            value="overview"
                            className="flex items-center gap-2 h-9 rounded-md text-gray-700 hover:bg-gray-100 data-[state=active]:bg-gray-900 data-[state=active]:text-white"
                        >
                            <BookOpen size={16} />
                            <span>Tổng quan</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="students"
                            className="flex items-center gap-2 h-9 rounded-md text-gray-700 hover:bg-gray-100 data-[state=active]:bg-gray-900 data-[state=active]:text-white"
                        >
                            <Users size={16} />
                            <span>Học viên</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="logs"
                            className="flex items-center gap-2 h-9 rounded-md text-gray-700 hover:bg-gray-100 data-[state=active]:bg-gray-900 data-[state=active]:text-white"
                        >
                            <History size={16} />
                            <span>Lịch sử điểm danh</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="instructors"
                            className="flex items-center gap-2 h-9 rounded-md text-gray-700 hover:bg-gray-100 data-[state=active]:bg-gray-900 data-[state=active]:text-white"
                        >
                            <UserPlus size={16} />
                            <span>Giảng viên</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="modules"
                            className="flex items-center gap-2 h-9 rounded-md text-gray-700 hover:bg-gray-100 data-[state=active]:bg-gray-900 data-[state=active]:text-white"
                        >
                            <ClipboardList size={16} />
                            <span>Modules</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="journal"
                            className="flex items-center gap-2 h-9 rounded-md text-gray-700 hover:bg-gray-100 data-[state=active]:bg-gray-900 data-[state=active]:text-white"
                        >
                            <FileText size={16} />
                            <span>Nhật ký lớp học</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-4 mt-6">
                        <div className="bg-white rounded-lg border p-6 shadow-sm">
                            <h3 className="font-semibold text-lg mb-4">Thông tin chi tiết</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="rounded-md bg-gray-50/70 border p-3 shadow-sm">
                                    <label className="text-sm text-gray-500">Ngày bắt đầu</label>
                                    <p className="text-sm font-medium">{selectedClass.startDate}</p>
                                </div>
                                <div className="rounded-md bg-gray-50/70 border p-3 shadow-sm">
                                    <label className="text-sm text-gray-500">Ngày kết thúc</label>
                                    <p className="text-sm font-medium">{selectedClass.endDate || 'Chưa xác định'}</p>
                                </div>
                                <div className="rounded-md bg-gray-50/70 border p-3 shadow-sm">
                                    <label className="text-sm text-gray-500">Địa điểm</label>
                                    <p className="text-sm font-medium">{selectedClass.location}</p>
                                </div>
                                <div className="rounded-md bg-gray-50/70 border p-3 shadow-sm">
                                    <label className="text-sm text-gray-500">Trung tâm</label>
                                    <p className="text-sm font-medium">{selectedClass.centerName || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Progress */}
                            <div className="mt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-500">Tiến độ lớp học</span>
                                    <span className="text-sm font-medium">
                                        {Math.round((selectedClass.students / selectedClass.maxStudents) * 100)}%
                                    </span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                                        style={{
                                            width: `${Math.min(100, (selectedClass.students / selectedClass.maxStudents) * 100)}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Students Tab (inline list + add) */}
                    <TabsContent value="students" className="space-y-4 mt-6">
                        <div className="bg-white rounded-lg border shadow-sm">
                            <ManageStudentsModal
                                classItem={selectedClass as any}
                                inlineMode
                                readOnly={isLecturer}
                                onStudentsChanged={() => {
                                    if (selectedClass?.id) {
                                        fetchActiveStudentCount(selectedClass.id);
                                    }
                                }}
                            />
                        </div>
                    </TabsContent>

                    {/* Instructors Tab */}
                    <TabsContent value="instructors" className="space-y-4 mt-6">
                        <div className="bg-white rounded-lg border p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-lg">Danh sách giảng viên</h3>
                                {!isLecturer && (
                                    <button
                                        onClick={() => setOpenAssignInstructor(selectedClass)}
                                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                        + Phân công giảng viên
                                    </button>
                                )}
                            </div>
                            <div className="space-y-3">
                                {selectedClass.instructors.map((instructor, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50/60"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                                            {instructor.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{instructor.name}</p>
                                            <p className="text-xs text-gray-500">ID: {instructor.id}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Modules Tab */}
                    <TabsContent value="modules" className="space-y-4 mt-6">
                        <div className="bg-white rounded-lg border shadow-sm">
                            <div className="p-4 border-b">
                                <h3 className="font-semibold text-base">Modules học tập</h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    Danh sách các module trong chương trình {selectedClass?.program}
                                </p>
                            </div>

                            {modulesLoading ? (
                                <div className="p-6 text-center text-gray-500">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                    <p className="text-sm">Đang tải modules...</p>
                                </div>
                            ) : modules.length === 0 ? (
                                <div className="p-6 text-center text-gray-500">
                                    <BookOpen size={32} className="mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm">Chương trình chưa có module nào</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {modules.map((module, index) => (
                                        <div key={module.moduleId} className="p-3 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-start gap-3">
                                                {/* Module Number */}
                                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                                                    {module.sequenceOrder || index + 1}
                                                </div>

                                                {/* Module Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1">
                                                            <h4 className="font-medium text-sm text-gray-900">
                                                                {module.name}
                                                            </h4>
                                                            <p className="text-xs text-gray-500 mb-1.5">
                                                                Mã: {module.code}
                                                            </p>
                                                            {module.description && (
                                                                <p className="text-xs text-gray-600 mb-2">
                                                                    {module.description}
                                                                </p>
                                                            )}

                                                            {/* Module Metadata */}
                                                            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                                                <div className="flex items-center gap-1">
                                                                    <Calendar size={12} />
                                                                    <span>Học kỳ {module.semester}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <ClipboardList size={12} />
                                                                    <span>{module.credits} tín chỉ</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Clock size={12} />
                                                                    <span>{module.durationHours}h</span>
                                                                </div>
                                                                <span
                                                                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${
                                                                        module.level === 'Beginner'
                                                                            ? 'bg-green-100 text-green-700'
                                                                            : module.level === 'Intermediate'
                                                                              ? 'bg-yellow-100 text-yellow-700'
                                                                              : 'bg-red-100 text-red-700'
                                                                    }`}
                                                                >
                                                                    {module.level}
                                                                </span>
                                                                {module.isMandatory && (
                                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                                                                        Bắt buộc
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Resources */}
                                                            {module.resources && module.resources.length > 0 && (
                                                                <div className="mt-2 space-y-0.5">
                                                                    <p className="text-xs font-medium text-gray-700">
                                                                        Tài liệu:
                                                                    </p>
                                                                    {module.resources.map((resource, idx) => (
                                                                        <a
                                                                            key={idx}
                                                                            href={resource.url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                                                        >
                                                                            <FileText size={11} />
                                                                            <span>
                                                                                {resource.fileName || 'Tài liệu'}
                                                                            </span>
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Journal Tab */}
                    <TabsContent value="journal" className="space-y-4 mt-6">
                        <div className="bg-white rounded-lg border p-6 shadow-sm">
                            <h3 className="font-semibold text-lg mb-4">Nhật ký lớp học</h3>
                            <ClassLogTab
                                selectedClass={{
                                    classId: parseInt((selectedClass as any).id),
                                    name: selectedClass.name,
                                    programName: (selectedClass as any).program,
                                    centerName: (selectedClass as any).centerName || '',
                                    status: selectedClass.status,
                                }}
                                classes={[
                                    {
                                        classId: parseInt((selectedClass as any).id),
                                        name: selectedClass.name,
                                        programName: (selectedClass as any).program,
                                        centerName: (selectedClass as any).centerName || '',
                                        status: selectedClass.status,
                                    },
                                ]}
                                readOnly={false}
                            />
                        </div>
                    </TabsContent>

                    {/* Attendance History Tab */}
                    <TabsContent value="logs" className="space-y-4 mt-6">
                        <div className="bg-white rounded-lg border p-6 shadow-sm">
                            <AttendanceHistoryTab classId={parseInt(selectedClass.id)} />
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Modals within detail view to keep context */}
                <Modal open={!!openEdit} onClose={() => setOpenEdit(null)}>
                    {openEdit && <CreateEditForm editing={openEdit} />}
                </Modal>
                {/* ManageStudents now inline in Students tab; modal removed */}
                <Modal open={!!openAssignInstructor} onClose={() => setOpenAssignInstructor(null)}>
                    {openAssignInstructor && (
                        <AssignInstructorModal
                            classItem={openAssignInstructor as any}
                            onClose={() => setOpenAssignInstructor(null)}
                            onUpdateInstructors={handleUpdateInstructors}
                            readOnly={isLecturer}
                        />
                    )}
                </Modal>

                {/* Pause Confirmation Dialog - within detail view */}
                <ConfirmDialog
                    open={!!pauseConfirm}
                    onClose={() => setPauseConfirm(null)}
                    onConfirm={confirmPause}
                    title="Xác nhận tạm dừng lớp học"
                    description={`Bạn có chắc chắn muốn tạm dừng lớp học "${pauseConfirm?.name}"? Lớp học sẽ không hoạt động cho đến khi được khôi phục.`}
                    confirmText="Tạm dừng"
                    cancelText="Hủy"
                    variant="danger"
                />

                {/* Resume Confirmation Dialog - within detail view */}
                <ConfirmDialog
                    open={!!resumeConfirm}
                    onClose={() => setResumeConfirm(null)}
                    onConfirm={confirmResume}
                    title="Xác nhận khôi phục lớp học"
                    description={`Bạn có chắc chắn muốn khôi phục lớp học "${resumeConfirm?.name}"? Lớp học sẽ quay lại trạng thái hoạt động.`}
                    confirmText="Khôi phục"
                    cancelText="Hủy"
                    variant="primary"
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div>
                        <h1 className="text-lg font-semibold">Quản lý Lớp học</h1>
                        <p className="text-xs text-gray-500">Quản lý thông tin lớp học và danh sách học viên</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Center Switcher - chỉ hiển thị cho user có GLOBAL scope */}
                    {hasGlobalScope && <CenterSwitcher />}
                    {!isLecturer && (
                        <button
                            onClick={() => setOpenCreate(true)}
                            className="inline-flex items-center gap-2 rounded-md bg-black text-white text-sm px-4 py-2 hover:bg-gray-800 transition-all duration-300"
                        >
                            + Thêm Mới
                        </button>
                    )}
                </div>
            </div>

            {/* Search, Filter and View Toggle */}
            <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full h-9 pl-10 pr-3 rounded-md border text-sm outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="Tìm kiếm lớp học..."
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-9 rounded-md border px-3 text-sm"
                >
                    <option>Tất cả trạng thái</option>
                    <option>Chuẩn bị</option>
                    <option>Đang học</option>
                    <option>Hoàn thành</option>
                    <option>Tạm dừng</option>
                </select>

                {/* View Toggle */}
                <div className="flex items-center gap-1 border rounded-md p-1">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded transition-all ${
                            viewMode === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'
                        }`}
                        title="Grid View"
                    >
                        <Grid3X3 size={16} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded transition-all ${
                            viewMode === 'list' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'
                        }`}
                        title="List View"
                    >
                        <List size={16} />
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {isLoading ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
                    <div className="text-sm text-gray-500">Đang tải dữ liệu...</div>
                </div>
            ) : viewMode === 'list' ? (
                /* Table List View */
                <ClassList
                    classes={currentClasses}
                    query={query}
                    statusFilter={statusFilter}
                    setOpenAssignInstructor={setOpenAssignInstructor}
                    onEdit={setOpenEdit}
                    // no external manage students modal; handled inline in Students tab
                    onRowClick={(c) => {
                        setSelectedClass(c);
                        setView('detail');
                    }}
                    totalClasses={filteredClasses.length}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            ) : (
                /* Kanban Grid View */
                <div className="space-y-4 bg-gray-50/80 p-2 md:p-3 rounded-xl">
                    {currentClasses.length === 0 ? (
                        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
                            <div className="text-sm text-gray-500">Chưa có lớp học</div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {currentClasses.map((classItem, idx) => {
                                    const theme = getCardThemeByKey(
                                        String((classItem as any).id ?? (classItem as any).name ?? idx),
                                    );
                                    return (
                                        <div
                                            key={classItem.id}
                                            className={`rounded-lg border ${theme.border} ${theme.bg} shadow-sm hover:shadow-lg active:shadow-sm active:scale-[0.98] transition-all duration-200 overflow-hidden cursor-pointer`}
                                            onClick={() => {
                                                setSelectedClass(classItem);
                                                setView('detail');
                                            }}
                                        >
                                            {/* Card Header */}
                                            <div className="p-4 space-y-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-semibold text-sm line-clamp-1">
                                                                {classItem.name}
                                                            </h3>
                                                            <button
                                                                className="text-gray-400 hover:text-yellow-500 transition-colors"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                }}
                                                            >
                                                                <Star size={14} />
                                                            </button>
                                                        </div>
                                                        <p className="text-xs text-gray-500">Cập nhật 3 giờ trước</p>
                                                    </div>

                                                    {/* Dropdown Menu */}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button
                                                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                }}
                                                            >
                                                                <MoreVertical size={16} className="text-gray-500" />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-40">
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setOpenEdit(classItem);
                                                                }}
                                                                className="flex items-center gap-2 cursor-pointer"
                                                            >
                                                                <Edit size={14} />
                                                                <span>Chỉnh sửa</span>
                                                            </DropdownMenuItem>
                                                            {classItem.status !== 'Hoàn thành' &&
                                                                (classItem.status === 'Tạm dừng' ? (
                                                                    <DropdownMenuItem
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setResumeConfirm(classItem);
                                                                        }}
                                                                        className="flex items-center gap-2 cursor-pointer text-green-600"
                                                                    >
                                                                        <Check size={14} />
                                                                        <span>Khôi phục</span>
                                                                    </DropdownMenuItem>
                                                                ) : (
                                                                    <DropdownMenuItem
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setPauseConfirm(classItem);
                                                                        }}
                                                                        className="flex items-center gap-2 cursor-pointer text-orange-600"
                                                                    >
                                                                        <X size={14} />
                                                                        <span>Tạm dừng</span>
                                                                    </DropdownMenuItem>
                                                                ))}
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDeleteConfirm(classItem);
                                                                }}
                                                                className="flex items-center gap-2 cursor-pointer text-red-600"
                                                            >
                                                                <Trash2 size={14} />
                                                                <span>Xóa</span>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                {/* Status Badge */}
                                                <Badge
                                                    variant={
                                                        classItem.status === 'Đang học'
                                                            ? 'primary'
                                                            : classItem.status === 'Chuẩn bị'
                                                              ? 'secondary'
                                                              : classItem.status === 'Hoàn thành'
                                                                ? 'success'
                                                                : 'destructive'
                                                    }
                                                    className="text-xs"
                                                >
                                                    {classItem.status}
                                                </Badge>

                                                {/* Description */}
                                                <p className="text-xs text-gray-600 line-clamp-2 min-h-[32px]">
                                                    {classItem.description || 'Không có mô tả'}
                                                </p>

                                                {/* Progress */}
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-gray-500">Học viên</span>
                                                        <span className="font-medium">
                                                            {classItem.students} / {classItem.maxStudents}
                                                        </span>
                                                    </div>
                                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                                                            style={{
                                                                width: `${Math.min(100, (classItem.students / classItem.maxStudents) * 100)}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Meta Info */}
                                                <div className="space-y-2 pt-2 border-t border-gray-100">
                                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                                        <Calendar size={12} className="text-gray-400" />
                                                        <span>{classItem.startDate}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                                        <ClipboardList size={12} className="text-gray-400" />
                                                        <span className="line-clamp-1">{classItem.program}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                                        <Users size={12} className="text-gray-400" />
                                                        <span>{classItem.instructors?.length || 0} giảng viên</span>
                                                    </div>
                                                </div>

                                                {/* Instructors */}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 pt-4">
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Trước
                                    </button>
                                    <span className="text-sm text-gray-600">
                                        Trang {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Sau
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
            {/* Create Modal */}
            <Modal open={openCreate} onClose={() => setOpenCreate(false)}>
                <CreateEditForm />
            </Modal>

            {/* Edit Modal */}
            <Modal open={!!openEdit} onClose={() => setOpenEdit(null)}>
                {openEdit && <CreateEditForm editing={openEdit} />}
            </Modal>

            {/* Manage Students Modal */}
            {/* Removed obsolete ManageStudents modal at root */}

            {/* Assign Instructor Modal */}
            <Modal open={!!openAssignInstructor} onClose={() => setOpenAssignInstructor(null)}>
                {openAssignInstructor && (
                    <AssignInstructorModal
                        classItem={openAssignInstructor as any}
                        onClose={() => setOpenAssignInstructor(null)}
                        onUpdateInstructors={handleUpdateInstructors}
                        readOnly={isLecturer}
                    />
                )}
            </Modal>

            {/* Pause Confirmation Dialog - for list view */}
            <ConfirmDialog
                open={!!pauseConfirm}
                onClose={() => setPauseConfirm(null)}
                onConfirm={confirmPause}
                title="Xác nhận tạm dừng lớp học"
                description={`Bạn có chắc chắn muốn tạm dừng lớp học "${pauseConfirm?.name}"? Lớp học sẽ không hoạt động cho đến khi được khôi phục.`}
                confirmText="Tạm dừng"
                cancelText="Hủy"
                variant="danger"
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={confirmDelete}
                title="Xác nhận xóa lớp học"
                description={`Bạn có chắc chắn muốn xóa lớp học "${deleteConfirm?.name}"? Hành động này không thể hoàn tác.`}
                confirmText="Xóa"
                cancelText="Hủy"
                variant="danger"
            />

            {/* Resume Confirmation Dialog - for list view */}
            <ConfirmDialog
                open={!!resumeConfirm}
                onClose={() => setResumeConfirm(null)}
                onConfirm={confirmResume}
                title="Xác nhận khôi phục lớp học"
                description={`Bạn có chắc chắn muốn khôi phục lớp học "${resumeConfirm?.name}"? Lớp học sẽ quay lại trạng thái hoạt động.`}
                confirmText="Khôi phục"
                cancelText="Hủy"
                variant="primary"
            />
        </div>
    );
}

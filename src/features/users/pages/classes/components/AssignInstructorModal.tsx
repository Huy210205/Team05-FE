import React, { useState, useEffect } from 'react';
import { X, Plus, GraduationCap, Check, MapPin, Calendar, Clock, AlertCircle } from 'lucide-react';
import http from '@/shared/api/http';
import ConfirmDialog from '@/shared/components/ConfirmDialog';
import { useToast } from '@/shared/hooks/useToast';

type StudyDay = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
type StudyTime = 'MORNING' | 'AFTERNOON' | 'EVENING';

type ClassInstructor = {
    id: string;
    name: string;
    email: string;
    specialization: string;
    initial: string;
    assigned: boolean;
    avatar?: string;
    startDate?: string;
    note?: string;
};

interface APIClassInstructor {
    assignmentId: number;
    classId: number;
    lecturer: {
        id: number;
        fullName: string;
        email: string;
        avatarUrl?: string | null;
    };
    startDate: string;
    endDate?: string | null;
    active: boolean;
    note?: string | null;
    createdAt: string;
    assignedBy: string;
    revokedBy?: string | null;
    canEdit: boolean;
    canRemove: boolean;
}

interface APIAvailableLecturer {
    id: number;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
}

type ClassItem = {
    id: string;
    name: string;
    description: string;
    program: string;
    startDate: string;
    schedule: string;
    location: string;
    students: number;
    maxStudents: number;
    instructors: ClassInstructor[];
    status: 'Chuẩn bị' | 'Đang học' | 'Hoàn thành' | 'Tạm dừng';
    studyDays?: StudyDay[];
    studyTime?: StudyTime;
    centerName?: string;
};

type Instructor = {
    id: string;
    name: string;
    email: string;
    specialization: string;
    initial: string;
    assigned: boolean;
};

type EnrolledClass = {
    classId: number;
    centerName: string;
    name: string;
    studyDays?: StudyDay[];
    studyTime?: StudyTime;
};

interface AssignInstructorModalProps {
    classItem: ClassItem;
    onClose?: () => void;
    onUpdateInstructors?: (classId: string, updatedInstructors: Instructor[]) => void;
    readOnly?: boolean; // when true, hide assign button
}

// Helper functions to format study days and time
const formatStudyDays = (days?: StudyDay[]): string => {
    if (!days || days.length === 0) return 'Chưa có lịch';
    const dayMap: Record<StudyDay, string> = {
        MONDAY: 'Thứ 2',
        TUESDAY: 'Thứ 3',
        WEDNESDAY: 'Thứ 4',
        THURSDAY: 'Thứ 5',
        FRIDAY: 'Thứ 6',
        SATURDAY: 'Thứ 7',
        SUNDAY: 'Chủ nhật',
    };
    return days.map((d) => dayMap[d]).join(', ');
};

const formatStudyTime = (time?: StudyTime): string => {
    if (!time) return '';
    const timeMap: Record<StudyTime, string> = {
        MORNING: 'Sáng (8h-11h)',
        AFTERNOON: 'Chiều (14h-17h)',
        EVENING: 'Tối (18h-21h)',
    };
    return timeMap[time] || time;
};

const AssignInstructorModal: React.FC<AssignInstructorModalProps> = ({ classItem, onClose, onUpdateInstructors, readOnly = false }) => {
    const { success: showSuccessToast, error: showErrorToast } = useToast();
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedInstructors, setSelectedInstructors] = useState<string[]>([]);
    const [instructorDetails, setInstructorDetails] = useState<{ [key: string]: { startDate: string; note: string } }>(
        {},
    );
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [removeConfirm, setRemoveConfirm] = useState<Instructor | null>(null);
    const [isAssigning, setIsAssigning] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);

    // Maximum number of active lecturers allowed per class
    const MAX_ACTIVE_LECTURERS = 3;

    // State to track assigned instructors locally for immediate UI updates
    const [localAssignedInstructors, setLocalAssignedInstructors] = useState<ClassInstructor[]>([]);

    // Fetch assigned instructors from API
    useEffect(() => {
        const fetchAssignedInstructors = async () => {
            try {
                const response = await http.get(`/api/classes/${classItem.id}/lecturers`);
                const apiData: APIClassInstructor[] = response.data.items;

                // Map API data to component format
                const mappedInstructors: ClassInstructor[] = apiData.map((item) => ({
                    id: item.assignmentId.toString(),
                    name: item.lecturer.fullName,
                    email: item.lecturer.email,
                    specialization: '',
                    initial: item.lecturer.fullName.charAt(0).toUpperCase(),
                    assigned: item.active,
                    avatar: item.lecturer.avatarUrl || undefined,
                    startDate: item.startDate,
                    note: item.note || undefined,
                }));

                setAssignedInstructorsFromAPI(mappedInstructors);
                setLocalAssignedInstructors(mappedInstructors);
            } catch (error) {
                setAssignedInstructorsFromAPI([]);
                setLocalAssignedInstructors([]);
            }
        };

        if (classItem.id) {
            fetchAssignedInstructors();
        }
    }, [classItem.id]);

    // State for available instructors (for assignment selection)
    const [instructors, setInstructors] = useState<Instructor[]>([]);

    // State for assigned instructors (from API)
    const [assignedInstructorsFromAPI, setAssignedInstructorsFromAPI] = useState<ClassInstructor[]>([]);

    // State for tracking lecturer's enrolled classes (for conflict checking)
    const [lecturerEnrolledClasses, setLecturerEnrolledClasses] = useState<Record<string, EnrolledClass[]>>({});

    // Function to fetch and refresh available instructors
    const fetchAvailableInstructors = async () => {
        try {
            const response = await http.get(`/api/classes/${classItem.id}/lecturers/available`);
            const apiData: APIAvailableLecturer[] = response.data.items;

            // Map API data to component format
            const mappedInstructors: Instructor[] = apiData.map((item) => ({
                id: item.id.toString(),
                name: item.fullName,
                email: item.email,
                specialization: '',
                initial: item.fullName.charAt(0).toUpperCase(),
                assigned: false,
            }));

            setInstructors(mappedInstructors);
        } catch (error) {
            setInstructors([]);
        }
    };

    // Fetch available instructors for assignment from API on mount
    useEffect(() => {
        if (classItem.id) {
            fetchAvailableInstructors();
        }
    }, [classItem.id]);

    // Fetch enrolled classes for all available instructors when modal opens
    useEffect(() => {
        if (showAssignModal && instructors.length > 0) {
            instructors.forEach((instructor) => {
                if (!lecturerEnrolledClasses[instructor.id]) {
                    fetchLecturerClasses(instructor.id);
                }
            });
        }
    }, [showAssignModal, instructors]);

    // Helper function to get time range from StudyTime enum
    const getTimeRange = (studyTime: string): { start: number; end: number } | null => {
        const timeMap: Record<string, { start: number; end: number }> = {
            MORNING: { start: 8, end: 11 }, // 8h-11h
            AFTERNOON: { start: 14, end: 17 }, // 14h-17h
            EVENING: { start: 18, end: 21 }, // 18h-21h
        };
        return timeMap[studyTime] || null;
    };

    // Check if two time ranges overlap
    const doTimeRangesOverlap = (time1: string, time2: string): boolean => {
        const range1 = getTimeRange(time1);
        const range2 = getTimeRange(time2);

        if (!range1 || !range2) return false;

        // Two ranges overlap if: start1 < end2 AND start2 < end1
        return range1.start < range2.end && range2.start < range1.end;
    };

    // Check if instructor has schedule conflict with the class
    const checkInstructorScheduleConflict = (
        instructorId: string,
    ): { hasConflict: boolean; conflictMessage?: string } => {
        const enrolledClasses = lecturerEnrolledClasses[instructorId];

        if (!enrolledClasses || enrolledClasses.length === 0) {
            return { hasConflict: false };
        }

        if (!classItem.studyDays || !classItem.studyTime) {
            return { hasConflict: false };
        }

        for (const enrolledClass of enrolledClasses) {
            if (!enrolledClass.studyDays || !enrolledClass.studyTime) continue;

            // Check if any day overlaps
            const hasOverlappingDay = classItem.studyDays.some((day) => enrolledClass.studyDays?.includes(day));

            // Check if time ranges overlap (not just exact match)
            const hasTimeConflict = doTimeRangesOverlap(classItem.studyTime, enrolledClass.studyTime);

            if (hasOverlappingDay && hasTimeConflict) {
                return {
                    hasConflict: true,
                    conflictMessage: `Trùng lịch với lớp "${enrolledClass.name}" tại ${enrolledClass.centerName} (${formatStudyDays(enrolledClass.studyDays)} - ${formatStudyTime(enrolledClass.studyTime)})`,
                };
            }
        }

        return { hasConflict: false };
    };

    // Use local state for immediate UI updates
    const assignedInstructors = localAssignedInstructors;
    const filteredInstructors = instructors.filter((i) => {
        // Check if instructor is already assigned to this class
        const isAssignedToClass = assignedInstructorsFromAPI.some((assigned) => assigned.id === i.id);
        return (
            !isAssignedToClass &&
            (searchTerm === '' ||
                i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                i.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    });

    // Sort instructors: assignable first, conflicting last
    const sortedInstructors = [...filteredInstructors].sort((a, b) => {
        const aConflict = checkInstructorScheduleConflict(a.id).hasConflict;
        const bConflict = checkInstructorScheduleConflict(b.id).hasConflict;

        // Non-conflicting instructors come first
        if (aConflict && !bConflict) return 1;
        if (!aConflict && bConflict) return -1;
        return 0;
    });

    // Pagination logic
    const totalPages = Math.ceil(sortedInstructors.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const availableInstructors = sortedInstructors.slice(startIndex, endIndex);

    const handleAssignInstructor = () => {
        // Check if already at maximum capacity
        if (assignedInstructors.length >= MAX_ACTIVE_LECTURERS) {
            showErrorToast(
                'Đã đạt giới hạn giảng viên',
                `Lớp học chỉ được phân công tối đa ${MAX_ACTIVE_LECTURERS} giảng viên active.`,
            );
            return;
        }

        setShowAssignModal(true);
        if (currentPage !== 1) {
            setCurrentPage(1); // Reset to first page when opening modal
        }
    };

    const handlePageChange = (page: number) => {
        if (page !== currentPage) {
            setCurrentPage(page);
        }
    };

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        if (value !== searchTerm) {
            setCurrentPage(1); // Reset to first page when searching
        }
    };

    // Fetch enrolled classes for a lecturer
    const fetchLecturerClasses = async (lecturerId: string) => {
        try {
            const response = await http.get(`/api/lecturers/${lecturerId}/classes`);
            // Backend returns List<ClassResponse> directly, not wrapped in items
            const apiData = Array.isArray(response.data) ? response.data : [];
            const classes: EnrolledClass[] = apiData
                .filter((c: any) => c.classId !== parseInt(classItem.id)) // Exclude current class
                .map((c: any) => ({
                    classId: c.classId,
                    centerName: c.centerName,
                    name: c.name,
                    studyDays: c.studyDays,
                    studyTime: c.studyTime,
                }));

            setLecturerEnrolledClasses((prev) => ({
                ...prev,
                [lecturerId]: classes,
            }));
        } catch (error) {
            setLecturerEnrolledClasses((prev) => ({
                ...prev,
                [lecturerId]: [],
            }));
        }
    };

    const handleSelectInstructor = async (instructorId: string) => {
        const isSelected = selectedInstructors.includes(instructorId);

        // If deselecting, just remove it
        if (isSelected) {
            setSelectedInstructors((prev) => prev.filter((id) => id !== instructorId));
            return;
        }

        // Check for schedule conflict before allowing selection
        const conflictCheck = checkInstructorScheduleConflict(instructorId);
        if (conflictCheck.hasConflict) {
            showErrorToast(
                'Không thể phân công giảng viên',
                conflictCheck.conflictMessage || 'Giảng viên có lịch trùng với lớp học này.',
            );
            return;
        }

        // If selecting, check if we still have available slots
        const remainingSlots = MAX_ACTIVE_LECTURERS - assignedInstructors.length;
        if (selectedInstructors.length >= remainingSlots) {
            showErrorToast(
                'Không thể chọn thêm',
                `Lớp học chỉ còn ${remainingSlots} slot trống. Bạn đã chọn đủ số lượng giảng viên.`,
            );
            return;
        }

        // Fetch lecturer's classes if not already fetched
        if (!lecturerEnrolledClasses[instructorId]) {
            await fetchLecturerClasses(instructorId);
        }

        // Check for schedule conflict
        const conflict = checkInstructorScheduleConflict(instructorId);
        if (conflict.hasConflict) {
            showErrorToast(
                'Xung đột lịch dạy',
                conflict.conflictMessage || 'Giảng viên đã có lịch dạy trùng với lớp này.',
            );
            return;
        }

        setSelectedInstructors((prev) => [...prev, instructorId]);
    };

    const handleConfirmAssign = async () => {
        if (isAssigning) return;

        setIsAssigning(true);

        try {
            // Prepare batch assignment data
            const batchItems = selectedInstructors.map((instructorId) => {
                const instructor = instructors.find((inst) => inst.id === instructorId);
                const details = instructorDetails[instructorId] || { startDate: '', note: '' };
                return {
                    lecturerId: parseInt(instructorId),
                    startDate: details.startDate || new Date().toISOString().split('T')[0],
                    note: details.note || null,
                };
            });

            // Call batch assignment API
            const response = await http.post(`/api/classes/${classItem.id}/lecturers/batch`, {
                items: batchItems,
            });

            if (response.status === 201) {
                const { created, skipped } = response.data;

                if (created > 0) {
                    showSuccessToast('Phân công thành công', `Đã phân công ${created} giảng viên cho lớp học.`);
                }

                if (skipped && skipped.length > 0) {
                    showErrorToast(
                        'Một số giảng viên đã được phân công',
                        `Giảng viên có ID ${skipped.join(', ')} đã được phân công trước đó.`,
                    );
                }

                // Refresh assigned lecturers by calling the GET API again
                const refreshResponse = await http.get(`/api/classes/${classItem.id}/lecturers`);
                const apiData: APIClassInstructor[] = refreshResponse.data.items;

                // Map API data to component format
                const mappedInstructors: ClassInstructor[] = apiData.map((item) => ({
                    id: item.assignmentId.toString(),
                    name: item.lecturer.fullName,
                    email: item.lecturer.email,
                    specialization: '',
                    initial: item.lecturer.fullName.charAt(0).toUpperCase(),
                    assigned: item.active,
                    avatar: item.lecturer.avatarUrl || undefined,
                    startDate: item.startDate,
                    note: item.note || undefined,
                }));

                setAssignedInstructorsFromAPI(mappedInstructors);
                setLocalAssignedInstructors(mappedInstructors);

                // Refresh available lecturers list to remove newly assigned ones
                await fetchAvailableInstructors();

                // Update parent component
                if (onUpdateInstructors) {
                    onUpdateInstructors(classItem.id, mappedInstructors as Instructor[]);
                }

                // Close modal and reset form
                setShowAssignModal(false);
                setSelectedInstructors([]);
                setInstructorDetails({});
                setSearchTerm('');
            }
        } catch (error: any) {
            if (error.response?.status === 409) {
                const errorCode = error.response.data?.code;
                if (errorCode === 'CLASS_MAX_ACTIVE_LECTURERS_EXCEEDED') {
                    showErrorToast('Không thể phân công thêm', 'Lớp học đã đạt số lượng giảng viên tối đa cho phép.');
                } else if (errorCode === 'LECTURER_ALREADY_ASSIGNED') {
                    showErrorToast(
                        'Giảng viên đã được phân công',
                        'Một hoặc nhiều giảng viên đã được phân công cho lớp học này.',
                    );
                } else {
                    showErrorToast(
                        'Lỗi phân công giảng viên',
                        'Có lỗi xảy ra khi phân công giảng viên. Vui lòng thử lại.',
                    );
                }
            } else {
                showErrorToast('Lỗi phân công giảng viên', 'Có lỗi xảy ra khi phân công giảng viên. Vui lòng thử lại.');
            }
        } finally {
            setIsAssigning(false);
        }
    };

    const handleRemoveInstructor = (instructorId: string) => {
        const instructor = assignedInstructorsFromAPI.find((inst) => inst.id === instructorId);
        if (instructor) {
            setRemoveConfirm(instructor);
        }
    };

    const confirmRemoveInstructor = async () => {
        if (!removeConfirm || isRemoving) return;

        setIsRemoving(true);

        try {
            // Call DELETE API to revoke assignment
            await http.delete(`/api/classes/${classItem.id}/lecturers/${removeConfirm.id}`);

            showSuccessToast(
                'Hủy phân công thành công',
                `Đã hủy phân công giảng viên "${removeConfirm.name}" khỏi lớp học.`,
            );

            // Remove from local state immediately for UI update
            const updatedAssignedInstructors = assignedInstructorsFromAPI.filter(
                (instructor) => instructor.id !== removeConfirm.id,
            );

            setLocalAssignedInstructors(updatedAssignedInstructors);
            setAssignedInstructorsFromAPI(updatedAssignedInstructors);

            // Refresh available lecturers list to add back the removed one
            await fetchAvailableInstructors();

            // Update parent component
            if (onUpdateInstructors) {
                onUpdateInstructors(classItem.id, updatedAssignedInstructors as Instructor[]);
            }

            // Clear from instructorDetails if exists
            setInstructorDetails((prev) => {
                const newDetails = { ...prev };
                delete newDetails[removeConfirm.id];
                return newDetails;
            });

            setRemoveConfirm(null);
        } catch (error: any) {
            if (error.response?.status === 404) {
                showErrorToast(
                    'Không tìm thấy phân công',
                    'Phân công giảng viên không tồn tại hoặc đã được hủy trước đó.',
                );
            } else if (error.response?.status === 409) {
                showErrorToast(
                    'Không thể hủy phân công',
                    'Phân công đã được hủy trước đó hoặc không thể hủy do ràng buộc hệ thống.',
                );
            } else {
                showErrorToast('Lỗi hủy phân công', 'Có lỗi xảy ra khi hủy phân công giảng viên. Vui lòng thử lại.');
            }

            setRemoveConfirm(null);
        } finally {
            setIsRemoving(false);
        }
    };

    return (
        <>
            <div className="bg-white rounded-lg max-w-6xl w-full">
                {/* Modal Header */}
                <div className="px-4 py-3 border-b">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 grid place-items-center">
                                <GraduationCap size={16} />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Phân công Giảng viên - {classItem.name}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Xem và quản lý danh sách giảng viên được phân công cho lớp học
                                </p>
                            </div>
                        </div>
                        <button
                            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                            onClick={() => {
                                onClose?.();
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Class Information */}
                    <div className="bg-blue-50 rounded-lg px-4 py-3">
                        <div className="grid grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-blue-600" />
                                <div>
                                    <div className="text-gray-500 text-xs">Trung tâm</div>
                                    <div className="font-medium text-gray-900">{classItem.centerName || 'Chưa có'}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-blue-600" />
                                <div>
                                    <div className="text-gray-500 text-xs">Ngày học</div>
                                    <div className="font-medium text-gray-900">
                                        {formatStudyDays(classItem.studyDays)}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={16} className="text-blue-600" />
                                <div>
                                    <div className="text-gray-500 text-xs">Ca học</div>
                                    <div className="font-medium text-gray-900">
                                        {formatStudyTime(classItem.studyTime) || 'Chưa có'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-blue-600" />
                                <div>
                                    <div className="text-gray-500 text-xs">Phòng học</div>
                                    <div className="font-medium text-gray-900">{classItem.location || 'Chưa có'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Instructor Count and Assign Button */}
                <div className="px-4 py-3 border-b flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Giảng viên: {assignedInstructors.length}/{MAX_ACTIVE_LECTURERS} người
                        {assignedInstructors.length >= MAX_ACTIVE_LECTURERS && (
                            <span className="ml-2 text-amber-600 font-medium">(Đã đạt giới hạn tối đa)</span>
                        )}
                    </div>
                    {!readOnly && (
                        <button
                            onClick={handleAssignInstructor}
                            disabled={assignedInstructors.length >= MAX_ACTIVE_LECTURERS}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                assignedInstructors.length >= MAX_ACTIVE_LECTURERS
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-purple-600 text-white hover:bg-purple-700'
                            }`}
                            title={
                                assignedInstructors.length >= MAX_ACTIVE_LECTURERS
                                    ? `Lớp học đã đạt giới hạn tối đa ${MAX_ACTIVE_LECTURERS} giảng viên`
                                    : 'Phân công giảng viên cho lớp học'
                            }
                        >
                            <Plus size={16} />
                            Phân công giảng viên
                        </button>
                    )}
                </div>

                {/* Instructors List */}
                <div className="max-h-96 overflow-y-auto">
                    <div className="px-6 py-3 border-b bg-gray-50 text-sm font-medium text-gray-700 grid grid-cols-12 gap-6">
                        <div className="col-span-4">Giảng viên</div>
                        <div className="col-span-3">Ngày bắt đầu</div>
                        <div className="col-span-3">Ghi chú</div>
                        <div className="col-span-2">Thao tác</div>
                    </div>

                    <div className="divide-y">
                        {assignedInstructors.map((instructor) => (
                            <div
                                key={instructor.id}
                                className="px-6 py-4 grid grid-cols-12 gap-6 items-center hover:bg-gray-50"
                            >
                                {/* Instructor Info */}
                                <div className="col-span-4 flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-700 grid place-items-center text-sm font-medium">
                                        {instructor.initial}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">{instructor.name}</div>
                                        <div className="text-xs text-gray-500">{instructor.email}</div>
                                    </div>
                                </div>

                                {/* Start Date */}
                                <div className="col-span-3">
                                    <div className="px-3 py-2 text-sm text-gray-900 bg-gray-50 rounded-md min-h-[40px] flex items-center">
                                        {instructor.startDate ? (
                                            <span className="text-gray-900">
                                                {new Date(instructor.startDate).toLocaleDateString('vi-VN')}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 italic">Chưa có ngày bắt đầu</span>
                                        )}
                                    </div>
                                </div>

                                {/* Note */}
                                <div className="col-span-3">
                                    <div className="px-3 py-2 text-sm text-gray-900 bg-gray-50 rounded-md min-h-[40px] flex items-center">
                                        {instructor.note ? (
                                            <span className="text-gray-900">{instructor.note}</span>
                                        ) : (
                                            <span className="text-gray-400 italic">Chưa có ghi chú</span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="col-span-2 flex justify-center">
                                    {!readOnly && (
                                        <button
                                            onClick={() => handleRemoveInstructor(instructor.id)}
                                            className="px-4 py-1.5 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors whitespace-nowrap"
                                        >
                                            Hủy gán
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-4 py-3 border-t flex justify-end">
                    <button
                        onClick={() => {
                            onClose?.();
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                        Đóng
                    </button>
                </div>
            </div>

            {/* Assign Instructor Selection Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg max-w-6xl w-full mx-4">
                        {/* Selection Modal Header */}
                        <div className="px-4 py-3 border-b flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Phân công Giảng viên cho Lớp</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Chọn giảng viên để phân công cho lớp {classItem.name}
                                </p>
                            </div>
                            <button
                                className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                                onClick={() => setShowAssignModal(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Available Instructors */}
                        <div className="px-4 py-3 border-b">
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-sm">
                                    <span className="text-gray-600">
                                        Có {availableInstructors.length} giảng viên có thể phân công
                                    </span>
                                    <span className="ml-3 text-purple-600 font-medium">
                                        • Còn lại {MAX_ACTIVE_LECTURERS - assignedInstructors.length}/
                                        {MAX_ACTIVE_LECTURERS} slot
                                    </span>
                                </div>
                            </div>

                            {/* Search Box */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm giảng viên theo tên hoặc email..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg
                                        className="h-4 w-4 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                    </svg>
                                </div>
                                {searchTerm && (
                                    <button
                                        onClick={() => handleSearchChange('')}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {availableInstructors.length === 0 ? (
                                <div className="px-6 py-8 text-center">
                                    <div className="text-gray-400 mb-2">
                                        <svg
                                            className="mx-auto h-12 w-12"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                            />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 mb-1">
                                        {searchTerm
                                            ? 'Không tìm thấy giảng viên phù hợp'
                                            : 'Không có giảng viên khả dụng'}
                                    </p>
                                    {!searchTerm && (
                                        <div className="mt-3 max-w-md mx-auto">
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-left">
                                                <p className="font-medium text-blue-900 mb-1">💡 Lưu ý:</p>
                                                <ul className="text-blue-700 space-y-1 text-xs">
                                                    <li>
                                                        • Chỉ hiển thị giảng viên thuộc trung tâm{' '}
                                                        <strong>{classItem.centerName}</strong>
                                                    </li>
                                                    <li>
                                                        • Giảng viên phải có vai trò <strong>LECTURER</strong> được gán
                                                        cho trung tâm này
                                                    </li>
                                                    <li>• Nếu vừa gán vai trò, hãy thử đóng và mở lại modal này</li>
                                                </ul>
                                                <p className="mt-2 text-blue-600 font-medium">
                                                    → Vui lòng kiểm tra phần <strong>Quản lý người dùng</strong> để gán
                                                    vai trò LECTURER cho giảng viên tại trung tâm này.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {searchTerm && (
                                        <button
                                            onClick={() => handleSearchChange('')}
                                            className="mt-2 text-sm text-purple-600 hover:text-purple-700"
                                        >
                                            Xóa bộ lọc
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {availableInstructors.map((instructor) => {
                                        const conflictCheck = checkInstructorScheduleConflict(instructor.id);
                                        const hasConflict = conflictCheck.hasConflict;

                                        return (
                                            <div key={instructor.id} className={hasConflict ? 'bg-gray-50' : ''}>
                                                <div className="px-6 py-4 flex items-center gap-6">
                                                    {/* Checkbox */}
                                                    <div className="flex items-center">
                                                        <button
                                                            onClick={() =>
                                                                !hasConflict && handleSelectInstructor(instructor.id)
                                                            }
                                                            disabled={hasConflict}
                                                            className={`h-6 w-6 rounded border-2 flex items-center justify-center transition-colors ${
                                                                hasConflict
                                                                    ? 'bg-gray-200 border-gray-300 cursor-not-allowed'
                                                                    : selectedInstructors.includes(instructor.id)
                                                                      ? 'bg-blue-500 border-blue-500 text-white'
                                                                      : 'border-gray-300 hover:border-blue-400'
                                                            }`}
                                                        >
                                                            {selectedInstructors.includes(instructor.id) &&
                                                                !hasConflict && <Check size={14} />}
                                                            {hasConflict && <X size={14} className="text-gray-500" />}
                                                        </button>
                                                    </div>

                                                    {/* Instructor Info */}
                                                    <div className="flex items-center gap-4 flex-1">
                                                        <div
                                                            className={`h-10 w-10 rounded-full grid place-items-center text-sm font-medium ${
                                                                hasConflict
                                                                    ? 'bg-gray-200 text-gray-500'
                                                                    : 'bg-purple-100 text-purple-700'
                                                            }`}
                                                        >
                                                            {instructor.initial}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div
                                                                className={`text-sm font-medium ${hasConflict ? 'text-gray-500' : 'text-gray-900'}`}
                                                            >
                                                                {instructor.name}
                                                                {hasConflict && (
                                                                    <span className="ml-2 text-xs font-normal text-red-600">
                                                                        (Không thể gán)
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {instructor.email}
                                                            </div>

                                                            {/* Show conflict message */}
                                                            {hasConflict && conflictCheck.conflictMessage && (
                                                                <div className="mt-1 flex items-start gap-1.5 text-xs text-red-600">
                                                                    <AlertCircle
                                                                        size={12}
                                                                        className="mt-0.5 flex-shrink-0"
                                                                    />
                                                                    <span>{conflictCheck.conflictMessage}</span>
                                                                </div>
                                                            )}

                                                            {/* Show lecturer's current classes */}
                                                            {lecturerEnrolledClasses[instructor.id] &&
                                                                lecturerEnrolledClasses[instructor.id].length > 0 && (
                                                                    <div className="mt-2 space-y-1.5">
                                                                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                                                                            <GraduationCap
                                                                                size={12}
                                                                                className="flex-shrink-0"
                                                                            />
                                                                            <span>
                                                                                Đang dạy{' '}
                                                                                {
                                                                                    lecturerEnrolledClasses[
                                                                                        instructor.id
                                                                                    ].length
                                                                                }{' '}
                                                                                lớp khác
                                                                            </span>
                                                                        </div>
                                                                        {lecturerEnrolledClasses[instructor.id].map(
                                                                            (enrolledClass, idx) => {
                                                                                // Check if this class conflicts with the current class
                                                                                const hasOverlappingDay =
                                                                                    classItem.studyDays?.some((day) =>
                                                                                        enrolledClass.studyDays?.includes(
                                                                                            day,
                                                                                        ),
                                                                                    );
                                                                                const hasTimeConflict =
                                                                                    classItem.studyTime &&
                                                                                    enrolledClass.studyTime
                                                                                        ? doTimeRangesOverlap(
                                                                                              classItem.studyTime,
                                                                                              enrolledClass.studyTime,
                                                                                          )
                                                                                        : false;
                                                                                const isConflicting =
                                                                                    hasOverlappingDay &&
                                                                                    hasTimeConflict;

                                                                                return (
                                                                                    <div
                                                                                        key={idx}
                                                                                        className={`text-xs border rounded px-2 py-1.5 ${
                                                                                            isConflicting
                                                                                                ? 'bg-red-50 border-red-300'
                                                                                                : 'bg-white border-gray-300'
                                                                                        }`}
                                                                                    >
                                                                                        <div className="flex items-start gap-1.5">
                                                                                            <MapPin
                                                                                                size={11}
                                                                                                className={`mt-0.5 flex-shrink-0 ${
                                                                                                    isConflicting
                                                                                                        ? 'text-red-600'
                                                                                                        : 'text-gray-600'
                                                                                                }`}
                                                                                            />
                                                                                            <div className="flex-1 min-w-0">
                                                                                                <div className="font-medium text-gray-900 truncate">
                                                                                                    {enrolledClass.name}
                                                                                                </div>
                                                                                                <div className="text-gray-600 mt-0.5">
                                                                                                    {
                                                                                                        enrolledClass.centerName
                                                                                                    }
                                                                                                </div>
                                                                                                <div className="flex items-center gap-2 mt-1 text-gray-500">
                                                                                                    <span className="flex items-center gap-1">
                                                                                                        <Calendar
                                                                                                            size={10}
                                                                                                        />
                                                                                                        {formatStudyDays(
                                                                                                            enrolledClass.studyDays,
                                                                                                        )}
                                                                                                    </span>
                                                                                                    <span>•</span>
                                                                                                    <span className="flex items-center gap-1">
                                                                                                        <Clock
                                                                                                            size={10}
                                                                                                        />
                                                                                                        {formatStudyTime(
                                                                                                            enrolledClass.studyTime,
                                                                                                        )}
                                                                                                    </span>
                                                                                                </div>
                                                                                                {isConflicting && (
                                                                                                    <div className="mt-1 flex items-center gap-1 text-red-600 font-medium">
                                                                                                        <AlertCircle
                                                                                                            size={10}
                                                                                                        />
                                                                                                        <span>
                                                                                                            Trùng lịch
                                                                                                            học
                                                                                                        </span>
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            },
                                                                        )}
                                                                    </div>
                                                                )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Form for selected instructor */}
                                                {selectedInstructors.includes(instructor.id) && (
                                                    <div className="px-6 py-4 bg-gray-50 border-l-4 border-blue-500">
                                                        <div className="grid grid-cols-3 gap-6">
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                    Ngày bắt đầu
                                                                </label>
                                                                <input
                                                                    type="date"
                                                                    value={
                                                                        instructorDetails[instructor.id]?.startDate ||
                                                                        ''
                                                                    }
                                                                    onChange={(e) =>
                                                                        setInstructorDetails((prev) => ({
                                                                            ...prev,
                                                                            [instructor.id]: {
                                                                                ...prev[instructor.id],
                                                                                startDate: e.target.value,
                                                                            },
                                                                        }))
                                                                    }
                                                                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                />
                                                            </div>
                                                            <div className="col-span-2">
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                    Ghi chú
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={instructorDetails[instructor.id]?.note || ''}
                                                                    onChange={(e) =>
                                                                        setInstructorDetails((prev) => ({
                                                                            ...prev,
                                                                            [instructor.id]: {
                                                                                ...prev[instructor.id],
                                                                                note: e.target.value,
                                                                            },
                                                                        }))
                                                                    }
                                                                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                    placeholder="Nhập ghi chú cho giảng viên..."
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-4 py-3 border-t bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-600">
                                        Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredInstructors.length)}{' '}
                                        trong số {filteredInstructors.length} giảng viên
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>

                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`px-3 py-1 text-sm border rounded ${
                                                    currentPage === page
                                                        ? 'bg-purple-600 text-white border-purple-600'
                                                        : 'border-gray-300 hover:bg-gray-100'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        ))}

                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Selection Modal Footer */}
                        <div className="px-4 py-3 border-t flex justify-end gap-2">
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleConfirmAssign}
                                disabled={
                                    selectedInstructors.length === 0 ||
                                    isAssigning ||
                                    selectedInstructors.length > MAX_ACTIVE_LECTURERS - assignedInstructors.length
                                }
                                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                                title={
                                    selectedInstructors.length > MAX_ACTIVE_LECTURERS - assignedInstructors.length
                                        ? `Chỉ còn ${MAX_ACTIVE_LECTURERS - assignedInstructors.length} slot trống`
                                        : ''
                                }
                            >
                                {isAssigning && (
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                )}
                                Phân công {selectedInstructors.length} giảng viên
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Remove Confirmation Dialog */}
            <ConfirmDialog
                open={!!removeConfirm}
                onClose={() => setRemoveConfirm(null)}
                onConfirm={confirmRemoveInstructor}
                title="Xác nhận hủy gán giảng viên"
                description={
                    removeConfirm
                        ? `Bạn có chắc chắn muốn hủy gán giảng viên "${removeConfirm.name}" khỏi lớp học này không?\n\n⚠️ CẢNH BÁO: Thao tác này không thể hoàn tác!`
                        : ''
                }
                confirmText="Xác nhận hủy gán"
                cancelText="Hủy bỏ"
                variant="danger"
            />
        </>
    );
};

export default AssignInstructorModal;

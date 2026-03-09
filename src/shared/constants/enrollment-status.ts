// src/shared/constants/enrollment-status.ts
export const ENROLLMENT_STATUS_LABEL: Record<string, string> = {
    ACTIVE: 'Đang học',
    SUSPENDED: 'Bảo lưu',
    DROPPED: 'Đã nghỉ',
    GRADUATED: 'Tốt nghiệp',
};

export const ENROLLMENT_STATUS_CLASS: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    SUSPENDED: 'bg-amber-100 text-amber-700',
    DROPPED: 'bg-red-100 text-red-700',
    GRADUATED: 'bg-blue-100 text-blue-700',
};

export const ENROLLMENT_STATUS_API: Record<string, string> = {
    'Tất cả trạng thái': '',
    'Đang học': 'ACTIVE',
    'Bảo lưu': 'SUSPENDED',
    'Đã nghỉ': 'DROPPED',
    'Tốt nghiệp': 'GRADUATED',
};

export const ENROLLMENT_STATUS_UI: Record<string, string> = {
    'ACTIVE': 'Đang học',
    'SUSPENDED': 'Bảo lưu',
    'DROPPED': 'Đã nghỉ',
    'GRADUATED': 'Tốt nghiệp',
    '': 'Tất cả trạng thái',
};
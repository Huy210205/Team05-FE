// src/utils/roleLabel.ts
const map: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    TRAINING_MANAGER: 'Quản lý đào tạo',
    CENTER_MANAGER: 'Quản lý Trung tâm',
    ACADEMIC_STAFF: 'Giáo vụ',
    LECTURER: 'Giảng viên',
};

export const roleDisplay = (r: { code: string; scope: string; centerName?: string | null }) => {
    const label = map[r.code] ?? r.code;
    // Nếu KHÔNG phải SUPER_ADMIN hoặc TRAINING_MANAGER thì hiển thị "Vai trò - Tên trung tâm" (nếu có)
    if (r.code !== 'SUPER_ADMIN' && r.code !== 'TRAINING_MANAGER' && r.scope === 'CENTER' && r.centerName) {
        return `${label} - ${r.centerName}`;
    }
    return label;
};
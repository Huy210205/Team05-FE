/**
 * Program categories mapping
 * Maps categoryCode (backend) to display label (frontend)
 */
export const PROGRAM_CATEGORIES = {
    TECHNICAL: 'Kỹ thuật',
    PROGRAMMING: 'Lập trình',
    DESIGN: 'Thiết kế',
    BUSINESS: 'Kinh doanh',
    WEB: 'Web',
    MOBILE: 'Di động',
    DATABASE: 'Cơ sở dữ liệu',
    OTHER: 'Khác',
} as const;

/**
 * Get category label by code
 */
export const getCategoryLabel = (categoryCode: string): string => {
    return PROGRAM_CATEGORIES[categoryCode as keyof typeof PROGRAM_CATEGORIES] || categoryCode;
};

/**
 * Get all category options for dropdown
 */
export const getCategoryOptions = () => {
    return Object.entries(PROGRAM_CATEGORIES).map(([code, label]) => ({
        value: code,
        label,
    }));
};

/**
 * Main categories for program creation form
 */
export const MAIN_CATEGORIES = [
    { value: 'TECHNICAL', label: 'Kỹ thuật' },
    { value: 'PROGRAMMING', label: 'Lập trình' },
    { value: 'DESIGN', label: 'Thiết kế' },
    { value: 'BUSINESS', label: 'Kinh doanh' },
] as const;


/**
 * Delivery modes mapping
 * Maps deliveryMode (backend) to display label (frontend)
 */
export const DELIVERY_MODES = {
    ONLINE: 'Trực tuyến',
    OFFLINE: 'Trực tiếp',
    HYBRID: 'Kết hợp',
    BLENDED: 'Kết hợp',
} as const;

/**
 * Get delivery mode label by code
 */
export const getDeliveryModeLabel = (deliveryMode: string): string => {
    return DELIVERY_MODES[deliveryMode as keyof typeof DELIVERY_MODES] || deliveryMode;
};

/**
 * Get all delivery mode options for dropdown
 */
export const getDeliveryModeOptions = () => {
    return [
        { value: 'ONLINE', label: 'Trực tuyến' },
        { value: 'OFFLINE', label: 'Trực tiếp' },
        { value: 'HYBRID', label: 'Kết hợp' },
    ];
};


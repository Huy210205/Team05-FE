// src/shared/api/notifications.ts
import http from './http';
import type { NotificationItem, NotificationCreateDto } from '@/shared/types/notification';

// Re-export types for backward compatibility
export type { NotificationItem, NotificationCreateDto } from '@/shared/types/notification';

/**
 * API Notifications - Kết nối với backend thật
 */
export const notificationsApi = {
    /**
     * Lấy danh sách thông báo của user hiện tại
     */
    async getMyNotifications(): Promise<NotificationItem[]> {
        const response = await http.get<NotificationItem[]>('/api/notifications');
        return response.data;
    },

    /**
     * Lấy danh sách thông báo chưa đọc
     */
    async getUnreadNotifications(): Promise<NotificationItem[]> {
        const response = await http.get<NotificationItem[]>('/api/notifications/unread');
        return response.data;
    },

    /**
     * Đếm số thông báo chưa đọc
     */
    async getUnreadCount(): Promise<number> {
        const response = await http.get<{ count: number }>('/api/notifications/unread-count');
        return response.data.count;
    },

    /**
     * Đánh dấu một thông báo là đã đọc
     */
    async markAsRead(notificationId: number): Promise<void> {
        await http.patch(`/api/notifications/${notificationId}/read`);
    },

    /**
     * Đánh dấu tất cả thông báo là đã đọc
     */
    async markAllAsRead(): Promise<void> {
        await http.patch('/api/notifications/mark-all-read');
    },

    /**
     * Xóa một thông báo
     */
    async deleteNotification(notificationId: number): Promise<void> {
        await http.delete(`/api/notifications/${notificationId}`);
    },

    /**
     * Tạo thông báo mới (Admin/Manager only)
     */
    async createNotification(data: NotificationCreateDto): Promise<NotificationItem> {
        const response = await http.post<NotificationItem>('/api/notifications', data);
        return response.data;
    },
};

import apiClient from './http';

export interface BroadcastNotificationRequest {
  title: string;
  message: string;
  recipientIds?: number[] | null; // null hoặc empty = gửi tất cả
  severity?: 'INFO' | 'WARNING' | 'ERROR';
}

export interface BroadcastNotificationResponse {
  success: boolean;
  sentCount: number;
  message: string;
}

export const broadcastApi = {
  /**
   * Gửi thông báo broadcast đến nhiều user hoặc tất cả user
   */
  sendBroadcastNotification: async (
    data: BroadcastNotificationRequest
  ): Promise<BroadcastNotificationResponse> => {
    const response = await apiClient.post<BroadcastNotificationResponse>(
      '/api/notifications/broadcast',
      data
    );
    return response.data;
  },
};

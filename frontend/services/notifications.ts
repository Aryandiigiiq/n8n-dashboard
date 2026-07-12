import apiClient from "./api";

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  content: string;
  type: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export const notificationsService = {
  async getNotifications(): Promise<Notification[]> {
    const response = await apiClient.get<Notification[]>("/notifications");
    return response.data;
  },

  async markAsRead(notificationId: number): Promise<Notification> {
    const response = await apiClient.put<Notification>(`/notifications/${notificationId}/read`);
    return response.data;
  },

  async markAllAsRead(): Promise<Notification[]> {
    const response = await apiClient.post<Notification[]>("/notifications/read-all");
    return response.data;
  },

  async createTestNotification(title: string, content: string, type: string = "info"): Promise<Notification> {
    const response = await apiClient.post<Notification>("/notifications/test", null, {
      params: { title, content, type },
    });
    return response.data;
  },
};

import { useState, useEffect, useCallback } from "react";
import { notificationsService, Notification } from "@/services/notifications";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notificationsService.getNotifications();
      setNotifications(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: number) => {
    try {
      setError(null);
      const updated = await notificationsService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? updated : n))
      );
    } catch (err: any) {
      setError(err.message || "Failed to mark notification as read");
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const updatedList = await notificationsService.markAllAsRead();
      setNotifications(updatedList);
    } catch (err: any) {
      setError(err.message || "Failed to mark all as read");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerTestNotification = useCallback(async (title: string, content: string, type: string = "info") => {
    try {
      setError(null);
      const newNotif = await notificationsService.createTestNotification(title, content, type);
      setNotifications((prev) => [newNotif, ...prev]);
      return newNotif;
    } catch (err: any) {
      setError(err.message || "Failed to trigger test notification");
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
    triggerTestNotification,
  };
}

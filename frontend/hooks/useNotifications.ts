import { useState, useEffect, useCallback } from "react";

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  content: string;
  type: string; // "message" | "comment" | "info"
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    // Return empty or seed mock notifications client-side
    setError(null);
  }, []);

  const markAsRead = useCallback(async (id: number) => {
    setError(null);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    setError(null);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true }))
    );
  }, []);

  const triggerTestNotification = useCallback(
    async (title: string, content: string, type: string = "info") => {
      setError(null);
      const newNotif: Notification = {
        id: Date.now(),
        user_id: 1,
        title,
        content,
        type,
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setNotifications((prev) => [newNotif, ...prev]);
      return newNotif;
    },
    []
  );

  useEffect(() => {
    fetchNotifications();
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

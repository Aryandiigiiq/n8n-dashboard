import apiClient from "./api";

export interface Schedule {
  id: number;
  post_id: number;
  account_id: number;
  scheduled_at: string;
  status: string; // pending, publishing, completed, failed
  published_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export const schedulesService = {
  async getSchedules(): Promise<Schedule[]> {
    const response = await apiClient.get<Schedule[]>("/schedules");
    return response.data;
  },

  async reschedule(scheduleId: number, newDate: string): Promise<Schedule> {
    const response = await apiClient.put<Schedule>(`/schedules/${scheduleId}/reschedule`, null, {
      params: { new_date: newDate },
    });
    return response.data;
  },

  async cancelSchedule(scheduleId: number): Promise<void> {
    await apiClient.delete(`/schedules/${scheduleId}`);
  },
};

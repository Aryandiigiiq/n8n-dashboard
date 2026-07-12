import apiClient from "./api";

export interface Post {
  id: number;
  user_id: number;
  title?: string;
  content: string;
  media_urls: string[];
  platforms: string[];
  account_ids: number[];
  status: string; // draft, ready, scheduled, publishing, published, failed
  scheduled_at?: string;
  published_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  post_id: number;
  title?: string;
  content_preview: string;
  platforms: string[];
  account_ids: number[];
  scheduled_at: string;
  status: string;
}

export interface PostPreviewData {
  id: number;
  title?: string;
  content: string;
  media_urls: string[];
  platforms: string[];
  account_ids: number[];
  status: string;
  scheduled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PublishingQueueEntry {
  id: number;
  post_id: number;
  account_id: number;
  status: string;
  scheduled_at?: string;
  published_at?: string;
  error_message?: string;
  platform_response?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export const postsService = {
  async getPosts(status?: string): Promise<Post[]> {
    const response = await apiClient.get<Post[]>("/posts", {
      params: status ? { status } : {},
    });
    return response.data;
  },

  async getDrafts(): Promise<Post[]> {
    const response = await apiClient.get<Post[]>("/posts/drafts");
    return response.data;
  },

  async getCalendarEvents(): Promise<CalendarEvent[]> {
    const response = await apiClient.get<CalendarEvent[]>("/posts/calendar");
    return response.data;
  },

  async getPost(id: number): Promise<Post> {
    const response = await apiClient.get<Post>(`/posts/${id}`);
    return response.data;
  },

  async getPostPreview(id: number): Promise<PostPreviewData> {
    const response = await apiClient.get<PostPreviewData>(`/posts/${id}/preview`);
    return response.data;
  },

  async createPost(post: Partial<Post>): Promise<Post> {
    const response = await apiClient.post<Post>("/posts", post);
    return response.data;
  },

  async updatePost(id: number, post: Partial<Post>): Promise<Post> {
    const response = await apiClient.put<Post>(`/posts/${id}`, post);
    return response.data;
  },

  async deletePost(id: number): Promise<void> {
    await apiClient.delete(`/posts/${id}`);
  },

  async markReady(id: number): Promise<Post> {
    const response = await apiClient.post<Post>(`/posts/${id}/ready`);
    return response.data;
  },

  async getQueueStatus(id: number): Promise<PublishingQueueEntry[]> {
    const response = await apiClient.get<PublishingQueueEntry[]>(`/posts/${id}/queue`);
    return response.data;
  },

  async uploadMedia(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<{ url: string }>("/posts/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.url;
  },
};

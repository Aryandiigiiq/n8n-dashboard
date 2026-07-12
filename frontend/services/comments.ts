import apiClient from "./api";

export interface Comment {
  id: number;
  user_id: number;
  account_id: number;
  post_id?: number;
  platform_post_id: string;
  platform_comment_id: string;
  parent_id?: string;
  sender_id: string;
  sender_name?: string;
  content: string;
  is_hidden: boolean;
  is_deleted: boolean;
  is_from_me: boolean;
  sent_at: string;
  created_at: string;
}

export const commentsService = {
  async syncComments(accountId: number): Promise<Comment[]> {
    const response = await apiClient.post<Comment[]>(`/comments/accounts/${accountId}/sync`);
    return response.data;
  },

  async getComments(accountId: number): Promise<Comment[]> {
    const response = await apiClient.get<Comment[]>(`/comments/accounts/${accountId}`);
    return response.data;
  },

  async replyToComment(accountId: number, commentId: string, content: string): Promise<Comment> {
    const response = await apiClient.post<Comment>(`/comments/accounts/${accountId}/${commentId}/reply`, {
      content,
    });
    return response.data;
  },

  async hideComment(accountId: number, commentId: string, hide: boolean): Promise<Comment> {
    const response = await apiClient.post<Comment>(`/comments/accounts/${accountId}/${commentId}/hide`, null, {
      params: { hide },
    });
    return response.data;
  },

  async deleteComment(accountId: number, commentId: string): Promise<void> {
    await apiClient.delete(`/comments/accounts/${accountId}/${commentId}`);
  },
};

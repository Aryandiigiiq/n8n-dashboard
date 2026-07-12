import apiClient from "./api";

export interface Message {
  id: number;
  user_id: number;
  account_id: number;
  conversation_id: string;
  platform_message_id: string;
  sender_id: string;
  sender_name?: string;
  content: string;
  is_from_me: boolean;
  sent_at: string;
  created_at: string;
}

export interface Conversation {
  conversation_id: string;
  latest_message: string;
  latest_message_time: string;
  participant_name: string;
  participant_id: string;
}

export const messagesService = {
  async syncMessages(accountId: number): Promise<Message[]> {
    const response = await apiClient.post<Message[]>(`/messages/accounts/${accountId}/sync`);
    return response.data;
  },

  async getConversations(accountId: number): Promise<Conversation[]> {
    const response = await apiClient.get<Conversation[]>(`/messages/accounts/${accountId}/conversations`);
    return response.data;
  },

  async getConversationMessages(accountId: number, conversationId: string): Promise<Message[]> {
    const response = await apiClient.get<Message[]>(`/messages/accounts/${accountId}/conversations/${conversationId}`);
    return response.data;
  },

  async replyToConversation(accountId: number, conversationId: string, content: string): Promise<Message> {
    const response = await apiClient.post<Message>(`/messages/accounts/${accountId}/conversations/${conversationId}/reply`, {
      content,
    });
    return response.data;
  },
};

import { useState, useEffect, useCallback } from "react";
import { messagesService, Message, Conversation } from "@/services/messages";

export function useMessages(accountId: number | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!accountId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await messagesService.getConversations(accountId);
      setConversations(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch conversations");
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  const sync = useCallback(async () => {
    if (!accountId) return;
    try {
      setLoading(true);
      setError(null);
      await messagesService.syncMessages(accountId);
      await fetchConversations();
    } catch (err: any) {
      setError(err.message || "Failed to sync messages");
    } finally {
      setLoading(false);
    }
  }, [accountId, fetchConversations]);

  const fetchConversationMessages = useCallback(async (conversationId: string) => {
    if (!accountId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await messagesService.getConversationMessages(accountId, conversationId);
      setActiveMessages(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch conversation messages");
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  const reply = useCallback(async (conversationId: string, content: string) => {
    if (!accountId) return;
    try {
      setError(null);
      const newMsg = await messagesService.replyToConversation(accountId, conversationId, content);
      setActiveMessages((prev) => [...prev, newMsg]);
      await fetchConversations();
      return newMsg;
    } catch (err: any) {
      setError(err.message || "Failed to send message reply");
      throw err;
    }
  }, [accountId, fetchConversations]);

  useEffect(() => {
    if (accountId) {
      fetchConversations();
    } else {
      setConversations([]);
      setActiveMessages([]);
    }
  }, [accountId, fetchConversations]);

  return {
    conversations,
    activeMessages,
    loading,
    error,
    sync,
    fetchConversations,
    fetchConversationMessages,
    reply,
  };
}

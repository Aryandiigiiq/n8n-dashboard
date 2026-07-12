import { useState, useEffect, useCallback } from "react";
import { commentsService, Comment } from "@/services/comments";

export function useComments(accountId: number | null) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    if (!accountId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await commentsService.getComments(accountId);
      setComments(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch comments");
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  const sync = useCallback(async () => {
    if (!accountId) return;
    try {
      setLoading(true);
      setError(null);
      await commentsService.syncComments(accountId);
      await fetchComments();
    } catch (err: any) {
      setError(err.message || "Failed to sync comments");
    } finally {
      setLoading(false);
    }
  }, [accountId, fetchComments]);

  const reply = useCallback(async (commentId: string, content: string) => {
    if (!accountId) return;
    try {
      setError(null);
      const newComment = await commentsService.replyToComment(accountId, commentId, content);
      await fetchComments();
      return newComment;
    } catch (err: any) {
      setError(err.message || "Failed to reply to comment");
      throw err;
    }
  }, [accountId, fetchComments]);

  const hide = useCallback(async (commentId: string, isHidden: boolean) => {
    if (!accountId) return;
    try {
      setError(null);
      await commentsService.hideComment(accountId, commentId, isHidden);
      setComments((prev) =>
        prev.map((c) => (c.platform_comment_id === commentId ? { ...c, is_hidden: isHidden } : c))
      );
    } catch (err: any) {
      setError(err.message || "Failed to hide/unhide comment");
      throw err;
    }
  }, [accountId]);

  const deleteComment = useCallback(async (commentId: string) => {
    if (!accountId) return;
    try {
      setError(null);
      await commentsService.deleteComment(accountId, commentId);
      setComments((prev) => prev.filter((c) => c.platform_comment_id !== commentId));
    } catch (err: any) {
      setError(err.message || "Failed to delete comment");
      throw err;
    }
  }, [accountId]);

  useEffect(() => {
    if (accountId) {
      fetchComments();
    } else {
      setComments([]);
    }
  }, [accountId, fetchComments]);

  return {
    comments,
    loading,
    error,
    sync,
    fetchComments,
    reply,
    hide,
    deleteComment,
  };
}

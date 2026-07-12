import { useState, useEffect, useCallback } from "react";
import { postsService, Post } from "@/services/posts";

export function usePosts(status?: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await postsService.getPosts(status);
      setPosts(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch posts");
    } finally {
      setLoading(false);
    }
  }, [status]);

  const createPost = useCallback(async (data: Partial<Post>) => {
    try {
      setLoading(true);
      setError(null);
      const newPost = await postsService.createPost(data);
      await fetchPosts();
      return newPost;
    } catch (err: any) {
      setError(err.message || "Failed to create post");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPosts]);

  const updatePost = useCallback(async (id: number, data: Partial<Post>) => {
    try {
      setLoading(true);
      setError(null);
      const updated = await postsService.updatePost(id, data);
      await fetchPosts();
      return updated;
    } catch (err: any) {
      setError(err.message || "Failed to update post");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPosts]);

  const deletePost = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      await postsService.deletePost(id);
      await fetchPosts();
    } catch (err: any) {
      setError(err.message || "Failed to delete post");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPosts]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    loading,
    error,
    refresh: fetchPosts,
    createPost,
    updatePost,
    deletePost,
  };
}
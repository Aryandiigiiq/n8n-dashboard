"use client";

import React from "react";
import { Post } from "@/services/posts";
import { DraftCard } from "./DraftCard";

interface DraftListProps {
  posts: Post[];
  loading?: boolean;
  onEdit?: (post: Post) => void;
  onDelete?: (id: number) => void;
}

export const DraftList: React.FC<DraftListProps> = ({
  posts,
  loading = false,
  onEdit,
  onDelete,
}) => {
  const drafts = posts.filter((p) => p.status === "draft");

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
        Your Drafts
      </h3>

      {loading ? (
        <div className="text-xs text-zinc-500 animate-pulse">Loading drafts...</div>
      ) : drafts.length === 0 ? (
        <div className="p-6 border border-dashed border-zinc-800 rounded-xl text-center text-xs text-zinc-500">
          No drafts saved yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {drafts.map((post) => (
            <DraftCard
              key={post.id}
              post={post}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

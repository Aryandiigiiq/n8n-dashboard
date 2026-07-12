"use client";

import React from "react";
import { Post } from "@/services/posts";

interface DraftCardProps {
  post: Post;
  onEdit?: (post: Post) => void;
  onDelete?: (id: number) => void;
}

export const DraftCard: React.FC<DraftCardProps> = ({
  post,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="p-4 bg-zinc-950/40 border border-zinc-800/60 rounded-xl flex flex-col justify-between space-y-3">
      <div className="space-y-1">
        <p className="text-zinc-200 text-sm line-clamp-3 leading-relaxed">
          {post.content || "Empty content"}
        </p>
        <span className="text-[10px] text-zinc-500">
          Last updated: {new Date(post.updated_at).toLocaleString()}
        </span>
      </div>
      
      <div className="flex items-center space-x-2 justify-end pt-2 border-t border-zinc-900/50">
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(post)}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Edit
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(post.id)}
            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

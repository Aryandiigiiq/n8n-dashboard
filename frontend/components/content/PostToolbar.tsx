"use client";

import React from "react";

interface PostToolbarProps {
  onPublish: () => void;
  onSaveDraft: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export const PostToolbar: React.FC<PostToolbarProps> = ({
  onPublish,
  onSaveDraft,
  loading = false,
  disabled = false,
}) => {
  return (
    <div className="flex items-center space-x-4 pt-4 border-t border-zinc-800/80">
      <button
        type="button"
        onClick={onPublish}
        disabled={disabled || loading}
        className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-550/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Processing..." : "Publish Post"}
      </button>
      <button
        type="button"
        onClick={onSaveDraft}
        disabled={disabled || loading}
        className="px-5 py-3 bg-zinc-950/40 border border-zinc-800/80 text-zinc-350 hover:text-white hover:bg-zinc-850 hover:border-zinc-700 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Save Draft
      </button>
    </div>
  );
};

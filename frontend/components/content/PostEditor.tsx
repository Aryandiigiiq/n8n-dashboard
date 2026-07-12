"use client";

import React from "react";

interface PostEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export const PostEditor: React.FC<PostEditorProps> = ({
  value,
  onChange,
  placeholder = "Type your copy here...",
  rows = 5,
}) => {
  return (
    <div className="space-y-3">
      <label htmlFor="post-editor-textarea" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
        Post Copy
      </label>
      <textarea
        id="post-editor-textarea"
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-zinc-950/40 border border-zinc-800/85 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm resize-none"
      />
      <div className="flex justify-end text-[10px] text-zinc-500 font-semibold">
        {value.length} characters
      </div>
    </div>
  );
};

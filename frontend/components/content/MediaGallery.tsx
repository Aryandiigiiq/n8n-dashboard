"use client";

import React from "react";

interface MediaGalleryProps {
  mediaUrls: string[];
  onSelect?: (url: string) => void;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  mediaUrls,
  onSelect,
}) => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
        Media Library
      </h3>
      {mediaUrls.length === 0 ? (
        <p className="text-zinc-550 text-xs italic">Media gallery is currently empty.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {mediaUrls.map((url, idx) => (
            <div
              key={idx}
              onClick={() => onSelect && onSelect(url)}
              className="aspect-square rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center cursor-pointer hover:border-zinc-600 transition-colors"
            >
              <img src={`${API_URL}${url}`} alt="Gallery Item" className="object-cover w-full h-full" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

"use client";

import React, { useState } from "react";
import { mediaService } from "@/services/media";

interface MediaUploaderProps {
    mediaUrls: string[];
    onChange: (urls: string[]) => void;
    maxFiles?: number;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
    mediaUrls,
    onChange,
    maxFiles = 4,
}) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setError(null);
        setUploading(true);
        try {
            const mediaItem = await mediaService.upload(files[0]);
            // Extract the matching string path attribute from the MediaItem object
            onChange([...mediaUrls, mediaItem.url]);
        } catch (err: any) {
            setError(err.message || "Failed to upload image");
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = (index: number) => {
        onChange(mediaUrls.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-3">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Attachments
            </label>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex flex-wrap gap-4 items-center">
                {mediaUrls.map((url, idx) => (
                    <div key={idx} className="relative h-20 w-20 rounded-xl overflow-hidden border border-zinc-850 group">
                        <img src={`${API_URL}${url}`} alt="Attachment" className="h-full w-full object-cover" />
                        <button
                            type="button"
                            onClick={() => handleRemove(idx)}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 transition-opacity rounded-xl cursor-pointer"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                ))}

                {mediaUrls.length < maxFiles && (
                    <label className="h-20 w-20 bg-zinc-950/40 border border-dashed border-zinc-800/80 rounded-xl flex flex-col items-center justify-center text-zinc-550 hover:text-zinc-350 hover:border-zinc-700 transition-all cursor-pointer">
                        <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleFileChange}
                            disabled={uploading}
                            className="hidden"
                        />
                        {uploading ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-450" />
                        ) : (
                            <>
                                <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="text-[10px] font-semibold">Upload</span>
                            </>
                        )}
                    </label>
                )}
            </div>
        </div>
    );
};

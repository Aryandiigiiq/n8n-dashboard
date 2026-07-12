"use client";

import React, { useState } from "react";
import { Account } from "@/services/integrations";

interface PostPreviewProps {
  content: string;
  mediaUrls: string[];
  activeAccount?: Account;
}

export const PostPreview: React.FC<PostPreviewProps> = ({
  content,
  mediaUrls,
  activeAccount,
}) => {
  const [platform, setPlatform] = useState<"facebook" | "instagram">("facebook");
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  return (
    <div className="space-y-4 sticky top-24 z-10">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Live Mockup Preview</span>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 flex">
          <button
            type="button"
            onClick={() => setPlatform("facebook")}
            className={`px-3 py-1 text-[10px] font-semibold rounded ${
              platform === "facebook" ? "bg-zinc-800 text-zinc-150" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Facebook
          </button>
          <button
            type="button"
            onClick={() => setPlatform("instagram")}
            className={`px-3 py-1 text-[10px] font-semibold rounded ${
              platform === "instagram" ? "bg-zinc-800 text-zinc-150" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Instagram
          </button>
        </div>
      </div>

      {platform === "facebook" ? (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-xl font-sans">
          <div className="flex items-center space-x-3">
            {activeAccount?.profile_picture ? (
              <img src={activeAccount.profile_picture} alt="Avatar" className="h-10 w-10 rounded-full border border-zinc-800" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                {activeAccount ? activeAccount.name[0].toUpperCase() : "S"}
              </div>
            )}
            <div>
              <h4 className="font-semibold text-zinc-200 text-sm">{activeAccount?.name || "Aryan's Page"}</h4>
              <p className="text-[10px] text-zinc-505 mt-0.5">Just now &bull; Public</p>
            </div>
          </div>

          <p className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">
            {content || "Aryan's sample text preview will show up here as you type..."}
          </p>

          {mediaUrls.length > 0 && (
            <div className="rounded-lg overflow-hidden border border-zinc-850 max-h-[300px]">
              <img src={`${API_URL}${mediaUrls[0]}`} alt="Post Media" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl shadow-xl font-sans overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              {activeAccount?.profile_picture ? (
                <img src={activeAccount.profile_picture} alt="Avatar" className="h-8 w-8 rounded-full border border-zinc-800" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-xs">
                  {activeAccount ? activeAccount.name[0].toUpperCase() : "S"}
                </div>
              )}
              <div>
                <h4 className="font-semibold text-zinc-200 text-xs">{activeAccount?.metadata_json?.username || "instagram_user"}</h4>
              </div>
            </div>
          </div>

          <div className="aspect-square bg-zinc-950 flex items-center justify-center overflow-hidden border-y border-zinc-800/80">
            {mediaUrls.length > 0 ? (
              <img src={`${API_URL}${mediaUrls[0]}`} alt="Instagram Post" className="w-full h-full object-cover" />
            ) : (
              <div className="text-zinc-600 text-xs p-8 text-center flex flex-col items-center">
                <span>An image attachment is required for Instagram mockup.</span>
              </div>
            )}
          </div>

          <div className="p-4 space-y-2">
            <p className="text-zinc-300 text-xs">
              <span className="font-semibold text-zinc-200 mr-2">{activeAccount?.metadata_json?.username || "instagram_user"}</span>
              {content || "Preview text description..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

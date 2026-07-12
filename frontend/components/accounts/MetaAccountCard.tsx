"use client";

import React from "react";
import { Account } from "@/services/integrations";

interface MetaAccountCardProps {
  account: Account;
  onDisconnect?: (id: number) => void;
}

export const MetaAccountCard: React.FC<MetaAccountCardProps> = ({
  account,
  onDisconnect,
}) => {
  return (
    <div className="p-4 bg-zinc-950/40 border border-zinc-800/60 rounded-xl flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {account.profile_picture ? (
          <img src={account.profile_picture} alt={account.name} className="h-10 w-10 rounded-full object-cover border border-zinc-700/50" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-sm text-zinc-400">
            {account.name[0].toUpperCase()}
          </div>
        )}
        <div>
          <h4 className="font-semibold text-zinc-200 text-sm">{account.name}</h4>
          <div className="flex items-center space-x-2 mt-0.5">
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase ${
              account.metadata_json?.platform === "instagram"
                ? "bg-pink-500/10 text-pink-400"
                : "bg-blue-500/10 text-blue-400"
            }`}>
              {account.metadata_json?.platform || "Facebook"}
            </span>
            {account.metadata_json?.username && (
              <span className="text-xs text-zinc-550">@{account.metadata_json.username}</span>
            )}
          </div>
        </div>
      </div>
      
      {onDisconnect && (
        <button
          type="button"
          onClick={() => onDisconnect(account.id)}
          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        >
          Disconnect
        </button>
      )}
    </div>
  );
};

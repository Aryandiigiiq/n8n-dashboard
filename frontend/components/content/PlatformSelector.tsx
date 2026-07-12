"use client";

import React from "react";
import { Account } from "@/services/integrations";

interface PlatformSelectorProps {
  accounts: Account[];
  selectedAccounts: number[];
  onChange: (selectedIds: number[]) => void;
  loading?: boolean;
}

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  accounts,
  selectedAccounts,
  onChange,
  loading = false,
}) => {
  const handleToggle = (id: number) => {
    if (selectedAccounts.includes(id)) {
      onChange(selectedAccounts.filter((item) => item !== id));
    } else {
      onChange([...selectedAccounts, id]);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
        Target Channels
      </label>
      {loading ? (
        <div className="text-xs text-zinc-505 animate-pulse">Loading channels...</div>
      ) : accounts.length === 0 ? (
        <div className="p-4 border border-dashed border-zinc-800 rounded-xl text-center text-xs text-zinc-500">
          No connected social channels.
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {accounts.map((acc) => {
            const isSelected = selectedAccounts.includes(acc.id);
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => handleToggle(acc.id)}
                className={`px-4 py-2.5 rounded-xl border text-xs font-medium flex items-center space-x-2 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-indigo-500/20 border-indigo-500 text-indigo-350"
                    : "bg-zinc-950/20 border-zinc-800/80 text-zinc-450 hover:text-zinc-300 hover:border-zinc-700"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${
                  acc.metadata_json?.platform === "instagram" ? "bg-pink-500" : "bg-blue-500"
                }`} />
                <span>{acc.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

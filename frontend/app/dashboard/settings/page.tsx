"use client";

import React, { useState } from "react";
import apiClient from "@/services/api";

export default function SettingsPage() {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = async () => {
    setConnecting(true);
    setError("");
    try {
      const res = await apiClient.get<{ url: string }>("/oauth/meta/authorize");
      if (res.data && res.data.url) {
        window.location.href = res.data.url;
      } else {
        setError("Failed to retrieve authorization URL.");
      }
    } catch (e) {
      setError("Failed to connect with Meta API.");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl animate-in fade-in duration-300">
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
        <h3 className="text-lg font-bold text-zinc-200">AOS Configurations</h3>
        <p className="text-xs text-zinc-500 mt-1">Configure your Workspace references and n8n triggers.</p>
        <div className="mt-6 space-y-4">
          <div>
            <label className="text-xs text-zinc-400 font-semibold block mb-1">n8n API endpoint</label>
            <input
              type="text"
              defaultValue="http://localhost:5678"
              className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2 rounded text-zinc-300"
              disabled
            />
          </div>
        </div>
      </div>

      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
        <h3 className="text-lg font-bold text-zinc-200">Integrations</h3>
        <p className="text-xs text-zinc-500 mt-1">Link your Meta channels to enable synchronized posting and triggers.</p>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs">
            {error}
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white text-xs font-semibold rounded-xl transition-all shadow-md cursor-pointer"
          >
            {connecting ? "Connecting..." : "Connect Instagram Channel"}
          </button>
        </div>
      </div>
    </div>
  );
}

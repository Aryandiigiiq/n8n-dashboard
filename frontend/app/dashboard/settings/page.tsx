"use client";

import React, { useState } from "react";
import apiClient from "@/services/api";

export default function SettingsPage() {
  const [connectingInstagram, setConnectingInstagram] = useState(false);
  const [connectingFacebook, setConnectingFacebook] = useState(false);
  const [connectingLinkedIn, setConnectingLinkedIn] = useState(false);
  const [error, setError] = useState("");

  const handleConnectInstagram = async () => {
    setConnectingInstagram(true);
    setError("");
    try {
      const res = await apiClient.get<{ url: string }>("/oauth/meta/instagram/authorize");
      if (res.data && res.data.url) {
        window.location.href = res.data.url;
      } else {
        setError("Failed to retrieve Instagram authorization URL.");
      }
    } catch (e) {
      setError("Failed to connect with Instagram API.");
    } finally {
      setConnectingInstagram(false);
    }
  };

  const handleConnectFacebook = async () => {
    setConnectingFacebook(true);
    setError("");
    try {
      const res = await apiClient.get<{ url: string }>("/oauth/meta/facebook/authorize");
      if (res.data && res.data.url) {
        window.location.href = res.data.url;
      } else {
        setError("Failed to retrieve Facebook authorization URL.");
      }
    } catch (e) {
      setError("Failed to connect with Facebook API.");
    } finally {
      setConnectingFacebook(false);
    }
  };

  const handleConnectLinkedIn = async () => {
    setConnectingLinkedIn(true);
    setError("");
    try {
      const res = await apiClient.get<{ url: string }>("/oauth/meta/linkedin/authorize");
      if (res.data && res.data.url) {
        window.location.href = res.data.url;
      } else {
        setError("Failed to retrieve LinkedIn authorization URL.");
      }
    } catch (e) {
      setError("Failed to connect with LinkedIn API.");
    } finally {
      setConnectingLinkedIn(false);
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
        <p className="text-xs text-zinc-500 mt-1">Link your social media profiles to enable synchronized automation workflows.</p>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleConnectInstagram}
            disabled={connectingInstagram}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-750 disabled:bg-indigo-850 text-white text-xs font-semibold rounded-xl transition-all shadow-md cursor-pointer"
          >
            {connectingInstagram ? "Connecting..." : "Connect Instagram"}
          </button>
          <button
            onClick={handleConnectFacebook}
            disabled={connectingFacebook}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-750 disabled:bg-blue-850 text-white text-xs font-semibold rounded-xl transition-all shadow-md cursor-pointer"
          >
            {connectingFacebook ? "Connecting..." : "Connect Facebook"}
          </button>
          <button
            onClick={handleConnectLinkedIn}
            disabled={connectingLinkedIn}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-850 text-white text-xs font-semibold rounded-xl transition-all shadow-md cursor-pointer"
          >
            {connectingLinkedIn ? "Connecting..." : "Connect LinkedIn"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";

export default function SettingsPage() {
  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl">
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
  );
}

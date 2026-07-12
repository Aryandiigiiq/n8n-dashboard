"use client";

import React from "react";

export default function SettingsPage() {
  return (
    <div className="p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-4">
      <h3 className="text-zinc-200 text-lg font-bold">Workspace Settings</h3>
      <p className="text-zinc-400 text-sm">
        Configure profile settings, active timezones, API keys, and notification preferences.
      </p>
    </div>
  );
}

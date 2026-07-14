"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import apiClient from "@/services/api";
import { automationService } from "@/services/automation";

export default function DashboardPage() {
  const [stats, setStats] = useState({ posts: 0, automations: 0, executions: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const postsRes = await apiClient.get("/posts");
        const autos = await automationService.getAutomations();
        setStats({
          posts: postsRes.data.length,
          automations: autos.length,
          executions: autos.filter((a) => a.is_active).length
        });
      } catch (e) {
        console.error("Failed to load statistics:", e);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="p-8 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border border-zinc-800/80">
        <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">
          Automation Operating System
        </h1>
        <p className="mt-2 text-zinc-400 text-sm max-w-xl">
          Zero-code business automation orchestration. Connect channels, track auto-replies, and build custom trigger flows instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-2">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Synced Posts</span>
          <h3 className="text-3xl font-bold text-zinc-150">{stats.posts}</h3>
          <p className="text-[11px] text-zinc-450">Discovered media posts from Meta</p>
        </div>
        <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-2">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Automations</span>
          <h3 className="text-3xl font-bold text-zinc-150">{stats.automations}</h3>
          <p className="text-[11px] text-zinc-450">Active visual layouts compiled to n8n</p>
        </div>
        <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-2">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Running Workflows</span>
          <h3 className="text-3xl font-bold text-zinc-150">{stats.executions}</h3>
          <p className="text-[11px] text-zinc-450">Live auto-reply webhook events active</p>
        </div>
      </div>
    </div>
  );
}

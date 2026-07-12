"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Card */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">
            Welcome back, {user?.name || "User"}!
          </h1>
          <p className="mt-2 text-zinc-400 text-sm max-w-xl">
            Manage your social media presence, schedule new campaigns, and respond to incoming messages from a unified, elegant interface.
          </p>
        </div>
        <Link
          href="/dashboard/content"
          className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-650 hover:to-purple-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-550/20 transition-all duration-200 shrink-0 text-center"
        >
          Create New Post
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Connected Accounts Card */}
        <div className="p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-zinc-400 text-sm font-semibold uppercase tracking-wider">Connected Accounts</h3>
            <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </span>
          </div>
          <div>
            <span className="text-4xl font-extrabold text-zinc-100">0</span>
            <p className="text-xs text-zinc-500 mt-1">Ready to link Facebook & Instagram</p>
          </div>
        </div>

        {/* Scheduled Posts Card */}
        <div className="p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-zinc-400 text-sm font-semibold uppercase tracking-wider">Scheduled Queue</h3>
            <span className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <div>
            <span className="text-4xl font-extrabold text-zinc-100">0</span>
            <p className="text-xs text-zinc-500 mt-1">Pending publishing schedules</p>
          </div>
        </div>

        {/* Inbox messages Card */}
        <div className="p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-zinc-400 text-sm font-semibold uppercase tracking-wider">Unread Messages</h3>
            <span className="p-2 bg-pink-500/10 text-pink-400 rounded-xl">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </span>
          </div>
          <div>
            <span className="text-4xl font-extrabold text-zinc-100">0</span>
            <p className="text-xs text-zinc-500 mt-1">Conversations requiring review</p>
          </div>
        </div>
      </div>
    </div>
  );
}

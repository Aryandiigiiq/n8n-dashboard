"use client";

import React, { useEffect, useState, useCallback } from "react";
import { postsService, Post, CalendarEvent } from "@/services/posts";
import { schedulesService, Schedule } from "@/services/schedules";
import { integrationsService, Account } from "@/services/integrations";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay(); // 0=Sunday
}

type StatusColor = { dot: string; badge: string };
const STATUS_COLORS: Record<string, StatusColor> = {
  draft: { dot: "bg-zinc-500", badge: "bg-zinc-800 text-zinc-400" },
  ready: { dot: "bg-amber-500", badge: "bg-amber-500/15 text-amber-400" },
  scheduled: { dot: "bg-blue-500", badge: "bg-blue-500/15 text-blue-400" },
  publishing: { dot: "bg-indigo-500 animate-pulse", badge: "bg-indigo-500/15 text-indigo-300" },
  published: { dot: "bg-emerald-500", badge: "bg-emerald-500/15 text-emerald-400" },
  failed: { dot: "bg-red-500", badge: "bg-red-500/15 text-red-400" },
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// ─────────────────────────────────────────────────────────────────────────────
// Schedule Dialog
// ─────────────────────────────────────────────────────────────────────────────

interface ScheduleDialogProps {
  post: Post;
  accounts: Account[];
  onClose: () => void;
  onScheduled: () => void;
}

function ScheduleDialog({ post, accounts, onClose, onScheduled }: ScheduleDialogProps) {
  const [date, setDate] = useState(post.scheduled_at ? post.scheduled_at.slice(0, 16) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!date) {
      setError("Please select a date and time");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await postsService.updatePost(post.id, {
        scheduled_at: new Date(date).toISOString(),
        status: "scheduled",
      });
      onScheduled();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to schedule post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-md space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-zinc-100">Schedule Post</h3>
            <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{post.content.slice(0, 80)}...</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 cursor-pointer p-1">✕</button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Publish Date & Time</label>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Target Accounts</label>
          <div className="flex flex-wrap gap-2">
            {post.account_ids?.map((id) => {
              const acc = accounts.find((a) => a.id === id);
              return acc ? (
                <span key={id} className="flex items-center space-x-1.5 px-3 py-1.5 bg-zinc-800 text-zinc-300 text-xs rounded-lg">
                  <span className={`h-1.5 w-1.5 rounded-full ${acc.metadata_json?.platform === "instagram" ? "bg-pink-500" : "bg-blue-500"}`} />
                  <span>{acc.name}</span>
                </span>
              ) : null;
            })}
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold rounded-xl cursor-pointer disabled:opacity-50 transition-all"
          >
            {saving ? "Scheduling..." : "Confirm Schedule"}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold rounded-xl cursor-pointer transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Calendar Grid
// ─────────────────────────────────────────────────────────────────────────────

interface CalendarGridProps {
  year: number;
  month: number;
  events: CalendarEvent[];
  onSelectDay: (day: Date) => void;
  selectedDay: Date | null;
}

function CalendarGrid({ year, month, events, onSelectDay, selectedDay }: CalendarGridProps) {
  const days = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  const getEventsForDay = (day: number) => {
    const d = new Date(year, month, day);
    return events.filter((e) => {
      const ed = new Date(e.scheduled_at);
      return isSameDay(ed, d);
    });
  };

  const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-zinc-500 uppercase py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) {
            return <div key={`empty-${i}`} className="aspect-square" />;
          }
          const cellDate = new Date(year, month, day);
          const dayEvents = getEventsForDay(day);
          const isTodayCell = isToday(cellDate);
          const isSelected = selectedDay && isSameDay(selectedDay, cellDate);

          return (
            <button
              key={day}
              onClick={() => onSelectDay(cellDate)}
              className={`aspect-square rounded-xl flex flex-col items-center justify-start pt-1.5 px-1 transition-all cursor-pointer text-xs relative ${
                isSelected
                  ? "bg-indigo-600 text-white"
                  : isTodayCell
                  ? "bg-zinc-800 text-zinc-100 ring-1 ring-indigo-500/50"
                  : "hover:bg-zinc-800/60 text-zinc-300"
              }`}
            >
              <span className={`font-semibold text-xs ${isSelected ? "text-white" : isTodayCell ? "text-indigo-300" : ""}`}>
                {day}
              </span>
              {dayEvents.length > 0 && (
                <div className="flex flex-wrap gap-0.5 justify-center mt-0.5">
                  {dayEvents.slice(0, 3).map((ev, idx) => {
                    const color = STATUS_COLORS[ev.status]?.dot || "bg-zinc-500";
                    return <span key={idx} className={`h-1 w-1 rounded-full ${color} ${isSelected ? "bg-white" : ""}`} />;
                  })}
                  {dayEvents.length > 3 && (
                    <span className="text-[8px] text-zinc-400">+{dayEvents.length - 3}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Calendar Page
// ─────────────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Schedule dialog
  const [schedulingPost, setSchedulingPost] = useState<Post | null>(null);
  // Reschedule dialog for existing schedule
  const [reschedulingId, setReschedulingId] = useState<number | null>(null);
  const [newDateVal, setNewDateVal] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [events, posts, scheds, accs] = await Promise.all([
        postsService.getCalendarEvents(),
        postsService.getPosts(),
        schedulesService.getSchedules(),
        integrationsService.getAccounts(),
      ]);
      setCalendarEvents(events);
      setAllPosts(posts);
      setSchedules(scheds);
      setAccounts(accs);
    } catch (err: any) {
      setError(err.message || "Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCancelSchedule = async (id: number) => {
    if (!confirm("Cancel this scheduled publication?")) return;
    setActionLoading(id);
    try {
      await schedulesService.cancelSchedule(id);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to cancel schedule");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReschedule = async (id: number) => {
    if (!newDateVal) { setError("Please pick a date/time"); return; }
    setActionLoading(id);
    try {
      await schedulesService.reschedule(id, new Date(newDateVal).toISOString());
      setReschedulingId(null);
      setNewDateVal("");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to reschedule");
    } finally {
      setActionLoading(null);
    }
  };

  // Upcoming (next 7 days)
  const upcomingSchedules = schedules
    .filter((s) => {
      if (s.status !== "pending") return false;
      const d = new Date(s.scheduled_at);
      const diff = (d.getTime() - Date.now()) / 1000 / 60 / 60 / 24;
      return diff >= 0 && diff <= 7;
    })
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  const getPostContent = (id: number) => allPosts.find((p) => p.id === id)?.content || "";
  const getAccountName = (id: number) => accounts.find((a) => a.id === id)?.name || `Account #${id}`;

  // Day events panel
  const dayEvents = selectedDay
    ? calendarEvents.filter((e) => isSameDay(new Date(e.scheduled_at), selectedDay))
    : [];

  // Posts that can be scheduled (draft/ready, no scheduled_at)
  const unscheduledPosts = allPosts.filter((p) => p.status === "draft" || p.status === "ready");

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-center space-x-2">
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-300 cursor-pointer">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

        {/* ── Left: Calendar + Selected Day ─────────────────────────────── */}
        <div className="xl:col-span-8 space-y-6">
          {/* Calendar Header */}
          <div className="p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-100">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </h2>
              <div className="flex items-center space-x-2">
                <button onClick={prevMonth} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); }}
                  className="px-3 py-2 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg cursor-pointer transition-all"
                >
                  Today
                </button>
                <button onClick={nextMonth} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center space-x-2 justify-center py-20 text-zinc-500 text-sm">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-indigo-500" />
                <span>Loading calendar...</span>
              </div>
            ) : (
              <CalendarGrid
                year={viewYear}
                month={viewMonth}
                events={calendarEvents}
                onSelectDay={setSelectedDay}
                selectedDay={selectedDay}
              />
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-4 pt-2 border-t border-zinc-800/60">
              {Object.entries(STATUS_COLORS).slice(1, 6).map(([status, colors]) => (
                <div key={status} className="flex items-center space-x-1.5">
                  <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
                  <span className="text-[10px] text-zinc-500 capitalize">{status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected day events */}
          {selectedDay && (
            <div className="p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-zinc-200">
                {selectedDay.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </h3>
              {dayEvents.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-xs">No posts scheduled for this day.</div>
              ) : (
                <div className="space-y-3">
                  {dayEvents.map((ev) => {
                    const colors = STATUS_COLORS[ev.status] || STATUS_COLORS.draft;
                    return (
                      <div key={ev.post_id} className="p-4 bg-zinc-950/50 border border-zinc-800/60 rounded-xl space-y-2 hover:border-zinc-700 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 mr-2">
                            <p className="font-semibold text-zinc-200 text-sm truncate">{ev.title || ev.content_preview}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">{new Date(ev.scheduled_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase shrink-0 ${colors.badge}`}>
                            {ev.status}
                          </span>
                        </div>
                        {ev.content_preview && (
                          <p className="text-xs text-zinc-400 line-clamp-2">{ev.content_preview}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5">
                          {ev.platforms?.map((p) => (
                            <span key={p} className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase ${
                              p === "instagram" ? "bg-pink-500/10 text-pink-400" : "bg-blue-500/10 text-blue-400"
                            }`}>
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Upcoming + Queue Post ──────────────────────────────── */}
        <div className="xl:col-span-4 space-y-6">

          {/* Upcoming widget */}
          <div className="p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-zinc-200">⏰ Upcoming (7 Days)</h3>
            {loading ? (
              <div className="text-center text-xs text-zinc-500 py-6">Loading...</div>
            ) : upcomingSchedules.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-xl">
                No posts scheduled in the next 7 days.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSchedules.map((sched) => (
                  <div key={sched.id} className="p-3 bg-zinc-950/50 border border-zinc-800/60 rounded-xl space-y-2">
                    <div className="flex items-start justify-between">
                      <p className="text-xs font-semibold text-zinc-200 line-clamp-2 flex-1 mr-2">
                        {getPostContent(sched.post_id).slice(0, 60) || "Post content..."}
                      </p>
                      <span className="text-[10px] bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded-full font-semibold shrink-0">
                        pending
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500">
                      🗓️ {formatDate(sched.scheduled_at)} — {getAccountName(sched.account_id)}
                    </p>

                    {reschedulingId === sched.id ? (
                      <div className="space-y-2 pt-1">
                        <input
                          type="datetime-local"
                          value={newDateVal}
                          onChange={(e) => setNewDateVal(e.target.value)}
                          min={new Date().toISOString().slice(0, 16)}
                          className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-200 text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleReschedule(sched.id)}
                            disabled={actionLoading === sched.id}
                            className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold rounded-lg cursor-pointer disabled:opacity-50 transition-all"
                          >
                            {actionLoading === sched.id ? "..." : "Confirm"}
                          </button>
                          <button
                            onClick={() => { setReschedulingId(null); setNewDateVal(""); }}
                            className="px-3 py-1.5 bg-zinc-800 text-zinc-400 text-[10px] rounded-lg cursor-pointer transition-all hover:bg-zinc-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => { setReschedulingId(sched.id); setNewDateVal(sched.scheduled_at.slice(0, 16)); }}
                          className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-semibold rounded-lg cursor-pointer transition-all"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => handleCancelSchedule(sched.id)}
                          disabled={actionLoading === sched.id}
                          className="flex-1 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-semibold rounded-lg cursor-pointer disabled:opacity-50 transition-all"
                        >
                          {actionLoading === sched.id ? "..." : "Cancel"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Schedule Panel */}
          {unscheduledPosts.length > 0 && (
            <div className="p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-zinc-200">📋 Queue for Publishing</h3>
              <p className="text-xs text-zinc-500">Drafts not yet scheduled.</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {unscheduledPosts.map((post) => (
                  <div key={post.id} className="p-3 bg-zinc-950/50 border border-zinc-800/60 rounded-xl flex items-start justify-between hover:border-zinc-700 transition-colors">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-xs text-zinc-300 line-clamp-2">
                        {post.title || post.content.slice(0, 50) || "Untitled"}
                      </p>
                      <span className={`text-[10px] mt-1 inline-block px-1.5 py-0.5 rounded-full font-semibold ${STATUS_COLORS[post.status]?.badge || "bg-zinc-800 text-zinc-500"}`}>
                        {post.status}
                      </span>
                    </div>
                    <button
                      onClick={() => setSchedulingPost(post)}
                      className="shrink-0 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 text-[10px] font-semibold rounded-lg cursor-pointer transition-all"
                    >
                      Schedule
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Scheduled Breakdown */}
          <div className="p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-3">
            <h3 className="text-sm font-bold text-zinc-200">📊 Publishing Summary</h3>
            {(["pending", "publishing", "completed", "failed"] as const).map((status) => {
              const count = schedules.filter((s) => s.status === status).length;
              const colors = STATUS_COLORS[status === "pending" ? "scheduled" : status === "completed" ? "published" : status] || STATUS_COLORS.draft;
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
                    <span className="text-xs text-zinc-400 capitalize">{status}</span>
                  </div>
                  <span className="text-xs font-semibold text-zinc-300">{count}</span>
                </div>
              );
            })}
            <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
              <span className="text-xs text-zinc-500">Total Schedules</span>
              <span className="text-xs font-bold text-zinc-200">{schedules.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Dialog */}
      {schedulingPost && (
        <ScheduleDialog
          post={schedulingPost}
          accounts={accounts}
          onClose={() => setSchedulingPost(null)}
          onScheduled={loadData}
        />
      )}
    </div>
  );
}

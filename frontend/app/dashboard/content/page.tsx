"use client";

import React, { useEffect, useState, useCallback } from "react";
import { integrationsService, Account } from "@/services/integrations";
import { postsService, Post } from "@/services/posts";
import { mediaService, MediaItem } from "@/services/media";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-zinc-800 text-zinc-400",
    ready: "bg-amber-500/15 text-amber-400",
    scheduled: "bg-blue-500/15 text-blue-400",
    publishing: "bg-indigo-500/15 text-indigo-300 animate-pulse",
    published: "bg-emerald-500/15 text-emerald-400",
    failed: "bg-red-500/15 text-red-400",
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${map[status] ?? "bg-zinc-800 text-zinc-500"}`}>
      {status}
    </span>
  );
}

function ReadyBadge() {
  return (
    <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-xs font-semibold">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Ready to Publish</span>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

type Tab = "compose" | "drafts" | "gallery";

export default function ContentPage() {
  // Global state
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [drafts, setDrafts] = useState<Post[]>([]);
  const [gallery, setGallery] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("compose");

  // Compose form state
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [previewPlatform, setPreviewPlatform] = useState<"facebook" | "instagram">("facebook");

  // Action states
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [markingReady, setMarkingReady] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      const [accs, draftList, galleryList] = await Promise.all([
        integrationsService.getAccounts(),
        postsService.getDrafts(),
        mediaService.getGallery(),
      ]);
      setAccounts(accs);
      setDrafts(draftList);
      setGallery(galleryList);
      if (accs.length > 0 && selectedAccounts.length === 0) {
        setSelectedAccounts([accs[0].id]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load content data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Notification auto-dismiss ─────────────────────────────────────────────
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(t);
    }
  }, [success]);

  // ── Compose helpers ────────────────────────────────────────────────────────
  const resetCompose = () => {
    setEditingPost(null);
    setTitle("");
    setContent("");
    setMediaUrls([]);
    setScheduledAt("");
    setError(null);
    setSuccess(null);
  };

  const loadPostIntoEditor = (post: Post) => {
    setEditingPost(post);
    setTitle(post.title || "");
    setContent(post.content);
    setMediaUrls(post.media_urls || []);
    setSelectedAccounts(post.account_ids || []);
    setScheduledAt(post.scheduled_at ? post.scheduled_at.slice(0, 16) : "");
    setTab("compose");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAccountToggle = (id: number) => {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ── Media upload ───────────────────────────────────────────────────────────
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const item = await mediaService.upload(files[0]);
      setMediaUrls((prev) => [...prev, item.url]);
      setGallery((prev) => [item, ...prev]);
    } catch (err: any) {
      setError(err.message || "Failed to upload media");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteGalleryItem = async (id: number) => {
    if (!confirm("Delete this media item permanently?")) return;
    try {
      await mediaService.deleteMedia(id);
      setGallery((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete media");
    }
  };

  const handleInsertFromGallery = (url: string) => {
    if (mediaUrls.length >= 4) {
      setError("Maximum 4 attachments per post");
      return;
    }
    if (!mediaUrls.includes(url)) {
      setMediaUrls((prev) => [...prev, url]);
    }
    setTab("compose");
  };

  // ── Save / Update ──────────────────────────────────────────────────────────
  const handleSave = async (asDraft: boolean) => {
    if (!content.trim() && mediaUrls.length === 0) {
      setError("Post content cannot be empty");
      return;
    }
    setError(null);
    setSaving(true);

    const targetPlatforms = Array.from(
      new Set(
        accounts
          .filter((a) => selectedAccounts.includes(a.id))
          .map((a) => a.metadata_json?.platform || "facebook")
      )
    );

    const payload: Partial<Post> = {
      title: title || undefined,
      content,
      media_urls: mediaUrls,
      platforms: targetPlatforms,
      account_ids: selectedAccounts,
      status: asDraft ? "draft" : scheduledAt ? "scheduled" : "draft",
      scheduled_at: !asDraft && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
    };

    try {
      if (editingPost) {
        await postsService.updatePost(editingPost.id, payload);
        setSuccess("Draft updated successfully!");
      } else {
        await postsService.createPost(payload);
        setSuccess(asDraft ? "Draft saved!" : scheduledAt ? "Post scheduled!" : "Post created as draft!");
      }
      resetCompose();
      await loadAll();
    } catch (err: any) {
      setError(err.message || "Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete draft ───────────────────────────────────────────────────────────
  const handleDeleteDraft = async (id: number) => {
    if (!confirm("Delete this draft permanently?")) return;
    setDeletingId(id);
    try {
      await postsService.deletePost(id);
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      if (editingPost?.id === id) resetCompose();
    } catch (err: any) {
      setError(err.message || "Failed to delete draft");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Mark Ready to Publish ──────────────────────────────────────────────────
  const handleMarkReady = async (id: number) => {
    setMarkingReady(id);
    try {
      await postsService.markReady(id);
      setSuccess("Post marked ready to publish and enqueued!");
      await loadAll();
    } catch (err: any) {
      setError(err.message || "Failed to mark post as ready");
    } finally {
      setMarkingReady(null);
    }
  };

  const activeAcc = accounts.find((a) => selectedAccounts.includes(a.id)) || accounts[0];
  const charCount = content.length;
  const charLimit = previewPlatform === "instagram" ? 2200 : 63206;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Tab bar */}
      <div className="flex items-center space-x-1 bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-1 w-fit">
        {(["compose", "drafts", "gallery"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all capitalize cursor-pointer ${
              tab === t
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t === "compose" ? "✍️ Compose" : t === "drafts" ? `📝 Drafts (${drafts.length})` : `🖼️ Media (${gallery.length})`}
          </button>
        ))}
      </div>

      {/* Global alerts */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-center space-x-2">
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-300 hover:text-red-100 cursor-pointer">✕</button>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl flex items-center space-x-2">
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      {/* ─── COMPOSE TAB ──────────────────────────────────────────────────── */}
      {tab === "compose" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Editor Panel */}
          <div className="lg:col-span-7 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-8 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-zinc-100">
                  {editingPost ? "Edit Draft" : "Create New Post"}
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  {editingPost ? `Editing post #${editingPost.id}` : "Compose your post, attach media, and select destination accounts."}
                </p>
              </div>
              {editingPost && (
                <button
                  onClick={resetCompose}
                  className="text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer flex items-center space-x-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>New Post</span>
                </button>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Title (Optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Internal draft title..."
                className="w-full px-4 py-2.5 bg-zinc-950/40 border border-zinc-800/85 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
              />
            </div>

            {/* Target Channels */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Target Channels
              </label>
              {loading ? (
                <div className="text-xs text-zinc-500">Loading channels...</div>
              ) : accounts.length === 0 ? (
                <div className="p-4 border border-dashed border-zinc-800 rounded-xl text-center text-xs text-zinc-500">
                  No connected channels.{" "}
                  <a href="/dashboard/accounts" className="text-indigo-400 hover:underline">Connect accounts</a> first.
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {accounts.map((acc) => {
                    const isSel = selectedAccounts.includes(acc.id);
                    return (
                      <button
                        key={acc.id}
                        onClick={() => handleAccountToggle(acc.id)}
                        className={`px-4 py-2.5 rounded-xl border text-xs font-medium flex items-center space-x-2 transition-all cursor-pointer ${
                          isSel
                            ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                            : "bg-zinc-950/20 border-zinc-800/80 text-zinc-450 hover:text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${acc.metadata_json?.platform === "instagram" ? "bg-pink-500" : "bg-blue-500"}`} />
                        <span>{acc.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Content textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Post Copy
                </label>
                <span className={`text-[10px] font-mono ${charCount > charLimit * 0.9 ? "text-amber-400" : "text-zinc-600"}`}>
                  {charCount}/{charLimit}
                </span>
              </div>

              {/* Toolbar */}
              <div className="flex items-center space-x-1 bg-zinc-950/30 border border-zinc-800/60 rounded-t-xl px-3 py-2">
                {["Bold", "Italic", "Link", "Emoji", "Hashtag"].map((tool) => (
                  <button
                    key={tool}
                    type="button"
                    title={tool}
                    onClick={() => {
                      const insertions: Record<string, string> = {
                        Bold: "**bold** ",
                        Italic: "_italic_ ",
                        Link: "[link text](url) ",
                        Emoji: "✨ ",
                        Hashtag: "#hashtag ",
                      };
                      setContent((prev) => prev + insertions[tool]);
                    }}
                    className="px-2 py-1 text-[10px] font-semibold text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-all cursor-pointer"
                  >
                    {tool === "Bold" ? "B" : tool === "Italic" ? "I" : tool === "Link" ? "🔗" : tool === "Emoji" ? "😊" : "#"}
                  </button>
                ))}
              </div>

              <textarea
                id="post-content"
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your caption here..."
                className="w-full px-4 py-3 bg-zinc-950/40 border border-zinc-800/85 border-t-0 rounded-b-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm resize-none"
              />
            </div>

            {/* Media Uploader */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Attachments</label>
                <button
                  type="button"
                  onClick={() => setTab("gallery")}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
                >
                  Browse Gallery →
                </button>
              </div>
              <div className="flex flex-wrap gap-4 items-center">
                {mediaUrls.map((url, idx) => (
                  <div key={idx} className="relative h-20 w-20 rounded-xl overflow-hidden border border-zinc-800 group">
                    {url.match(/\.(mp4|mov|webm|mpeg)$/i) ? (
                      <video src={`${API_URL}${url}`} className="h-full w-full object-cover" />
                    ) : (
                      <img src={`${API_URL}${url}`} alt="Attachment" className="h-full w-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => setMediaUrls((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 transition-opacity cursor-pointer"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
                {mediaUrls.length < 4 && (
                  <label className="h-20 w-20 bg-zinc-950/40 border border-dashed border-zinc-800/80 rounded-xl flex flex-col items-center justify-center text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-all cursor-pointer">
                    <input type="file" accept="image/*,video/*" onChange={handleMediaUpload} disabled={uploading} className="hidden" />
                    {uploading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
                    ) : (
                      <>
                        <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-[10px] font-semibold">Upload</span>
                      </>
                    )}
                  </label>
                )}
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Schedule Publishing (Optional)
              </label>
              <input
                id="scheduled-date"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full max-w-sm px-4 py-3 bg-zinc-950/40 border border-zinc-800/85 rounded-xl text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-xs"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3 pt-4 border-t border-zinc-800/80 flex-wrap gap-y-2">
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? "Saving..." : scheduledAt ? "Schedule Post" : "Save Draft"}
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="px-5 py-3 bg-zinc-950/40 border border-zinc-800/80 text-zinc-350 hover:text-white hover:bg-zinc-850 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                Save as Draft
              </button>
              {editingPost && editingPost.status !== "published" && (
                <button
                  onClick={() => handleMarkReady(editingPost.id)}
                  disabled={markingReady === editingPost.id}
                  className="px-5 py-3 bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-400 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {markingReady === editingPost.id ? "Marking..." : "✓ Mark Ready to Publish"}
                </button>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-5 space-y-4 sticky top-24">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Live Preview</span>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 flex">
                {(["facebook", "instagram"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPreviewPlatform(p)}
                    className={`px-3 py-1 text-[10px] font-semibold rounded capitalize cursor-pointer ${
                      previewPlatform === p ? "bg-zinc-800 text-zinc-150" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {previewPlatform === "facebook" ? (
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center space-x-3">
                  {activeAcc?.profile_picture ? (
                    <img src={activeAcc.profile_picture} alt="" className="h-10 w-10 rounded-full border border-zinc-800" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                      {activeAcc ? activeAcc.name[0].toUpperCase() : "P"}
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-zinc-200 text-sm">{activeAcc?.name || "Your Page"}</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Just now • 🌐 Public</p>
                  </div>
                </div>
                <p className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">
                  {content || <span className="text-zinc-600 italic">Your caption will appear here...</span>}
                </p>
                {mediaUrls.length > 0 && (
                  <div className="rounded-lg overflow-hidden border border-zinc-800 max-h-[280px]">
                    <img src={`${API_URL}${mediaUrls[0]}`} alt="Post Media" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="pt-3 border-t border-zinc-800/80 flex justify-between text-zinc-500 text-xs font-semibold">
                  <span>👍 Like</span>
                  <span>💬 Comment</span>
                  <span>↗ Share</span>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl shadow-xl overflow-hidden">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-3">
                    {activeAcc?.profile_picture ? (
                      <img src={activeAcc.profile_picture} alt="" className="h-8 w-8 rounded-full border border-zinc-800" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                        {activeAcc ? activeAcc.name[0].toUpperCase() : "P"}
                      </div>
                    )}
                    <h4 className="font-semibold text-zinc-200 text-xs">{activeAcc?.metadata_json?.username || "your_username"}</h4>
                  </div>
                  <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01" />
                  </svg>
                </div>
                <div className="aspect-square bg-zinc-950 flex items-center justify-center overflow-hidden border-y border-zinc-800/80">
                  {mediaUrls.length > 0 ? (
                    <img src={`${API_URL}${mediaUrls[0]}`} alt="IG Post" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-zinc-600 text-xs text-center p-8">
                      <svg className="w-10 h-10 mb-2 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Upload an image for Instagram preview
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex justify-between text-zinc-300 text-sm">
                    <div className="flex space-x-3">❤️ 💬 ↗</div>
                    <span>🔖</span>
                  </div>
                  <p className="text-zinc-300 text-xs">
                    <span className="font-semibold text-zinc-200 mr-2">{activeAcc?.metadata_json?.username || "your_username"}</span>
                    {content || <span className="text-zinc-600 italic">Caption preview...</span>}
                  </p>
                </div>
              </div>
            )}

            {/* Scheduling info */}
            {scheduledAt && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
                🗓️ Scheduled for <span className="font-semibold">{new Date(scheduledAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── DRAFTS TAB ───────────────────────────────────────────────────── */}
      {tab === "drafts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-100">Drafts & Ready Posts</h2>
            <button
              onClick={() => { resetCompose(); setTab("compose"); }}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              + New Post
            </button>
          </div>

          {loading ? (
            <div className="flex items-center space-x-2 justify-center py-16 text-zinc-500 text-sm">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-indigo-500" />
              <span>Loading drafts...</span>
            </div>
          ) : drafts.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl">
              <svg className="w-10 h-10 text-zinc-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-zinc-500 text-sm">No drafts yet.</p>
              <button
                onClick={() => { resetCompose(); setTab("compose"); }}
                className="mt-4 text-indigo-400 hover:text-indigo-300 text-xs cursor-pointer"
              >
                Create your first post →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {drafts.map((draft) => (
                <div key={draft.id} className="p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-3 hover:border-zinc-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="font-semibold text-zinc-200 text-sm truncate">
                        {draft.title || draft.content.slice(0, 60) || "Untitled Draft"}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">{formatDate(draft.updated_at)}</p>
                    </div>
                    <StatusBadge status={draft.status} />
                  </div>

                  {draft.content && (
                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{draft.content}</p>
                  )}

                  {draft.platforms && draft.platforms.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {draft.platforms.map((p) => (
                        <span key={p} className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase ${
                          p === "instagram" ? "bg-pink-500/10 text-pink-400" : "bg-blue-500/10 text-blue-400"
                        }`}>
                          {p}
                        </span>
                      ))}
                    </div>
                  )}

                  {draft.media_urls && draft.media_urls.length > 0 && (
                    <div className="flex space-x-2">
                      {draft.media_urls.slice(0, 3).map((url, i) => (
                        <img
                          key={i}
                          src={`${API_URL}${url}`}
                          alt=""
                          className="h-12 w-12 rounded-lg object-cover border border-zinc-800"
                        />
                      ))}
                      {draft.media_urls.length > 3 && (
                        <div className="h-12 w-12 rounded-lg bg-zinc-800 flex items-center justify-center text-xs text-zinc-400 font-semibold">
                          +{draft.media_urls.length - 3}
                        </div>
                      )}
                    </div>
                  )}

                  {draft.status === "ready" && <ReadyBadge />}

                  <div className="flex items-center space-x-2 pt-2 border-t border-zinc-800/60">
                    <button
                      onClick={() => loadPostIntoEditor(draft)}
                      className="flex-1 px-3 py-2 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      ✎ Edit
                    </button>
                    {draft.status !== "ready" && draft.status !== "published" && (
                      <button
                        onClick={() => handleMarkReady(draft.id)}
                        disabled={markingReady === draft.id}
                        className="flex-1 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                      >
                        {markingReady === draft.id ? "..." : "✓ Ready"}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteDraft(draft.id)}
                      disabled={deletingId === draft.id}
                      className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                    >
                      {deletingId === draft.id ? "..." : "🗑"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── GALLERY TAB ──────────────────────────────────────────────────── */}
      {tab === "gallery" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-100">Media Gallery</h2>
            <label className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold rounded-xl cursor-pointer hover:from-indigo-600 hover:to-purple-700 transition-all">
              <input type="file" accept="image/*,video/*" onChange={handleMediaUpload} disabled={uploading} className="hidden" />
              {uploading ? "Uploading..." : "⬆ Upload Media"}
            </label>
          </div>

          {loading ? (
            <div className="flex items-center space-x-2 justify-center py-16 text-zinc-500 text-sm">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-indigo-500" />
              <span>Loading gallery...</span>
            </div>
          ) : gallery.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl">
              <svg className="w-10 h-10 text-zinc-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-zinc-500 text-sm">No media uploaded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {gallery.map((item) => (
                <div key={item.id} className="group relative rounded-xl overflow-hidden border border-zinc-800/60 bg-zinc-950/40 hover:border-zinc-700 transition-all">
                  {item.mime_type.startsWith("video/") ? (
                    <video src={`${API_URL}${item.url}`} className="h-36 w-full object-cover" />
                  ) : (
                    <img src={`${API_URL}${item.url}`} alt={item.alt_text || item.original_filename} className="h-36 w-full object-cover" />
                  )}
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center space-y-2 p-2">
                    <button
                      onClick={() => handleInsertFromGallery(item.url)}
                      className="w-full px-2 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold rounded-lg cursor-pointer transition-all"
                    >
                      Insert
                    </button>
                    <button
                      onClick={() => handleDeleteGalleryItem(item.id)}
                      className="w-full px-2 py-1.5 bg-red-600/80 hover:bg-red-500 text-white text-[10px] font-semibold rounded-lg cursor-pointer transition-all"
                    >
                      Delete
                    </button>
                  </div>
                  {/* Info */}
                  <div className="p-2">
                    <p className="text-[10px] text-zinc-400 truncate">{item.original_filename}</p>
                    <p className="text-[10px] text-zinc-600">{formatBytes(item.size)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

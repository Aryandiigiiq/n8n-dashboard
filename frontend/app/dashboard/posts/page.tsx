"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import apiClient from "@/services/api";
import { automationService, PostAutomation } from "@/services/automation";

interface SyncPost {
    post_id: string;
    permalink: string;
    platform: string;
    caption?: string;
    media_type?: string;
    likes: number;
    comments: number;
    automation_count: number;
    is_active: boolean;
}

export default function PostsPage() {
    const [posts, setPosts] = useState<SyncPost[]>([]);
    const [syncing, setSyncing] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

    const [platformFilter, setPlatformFilter] = useState("");
    const [campaignFilter, setCampaignFilter] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [availableWorkflows, setAvailableWorkflows] = useState<any[]>([]);

    const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
    const [batchDropdownOpen, setBatchDropdownOpen] = useState(false);

    const loadData = async () => {
        try {
            const res = await apiClient.get<SyncPost[]>("/posts", {
                params: {
                    platform: platformFilter || undefined,
                    campaign: campaignFilter || undefined,
                    search: searchQuery || undefined
                }
            });
            setPosts(res.data);

            const wfRes = await apiClient.get("/automations");
            setAvailableWorkflows(wfRes.data);
        } catch (e) {
            console.error("Failed to fetch posts:", e);
        }

    };

    useEffect(() => {
        loadData();
    }, [platformFilter, campaignFilter, searchQuery]);

    const handleSync = async () => {
        setSyncing(true);
        try {
            await apiClient.post("/posts/sync");
            await loadData();
        } catch (e) {
            console.error("Sync failed:", e);
        } finally {
            setSyncing(false);
        }
    };

    const handleLinkWorkflow = async (post: SyncPost, type: string) => {
        setDropdownOpen(null);
        const mockGraph = {
            nodes: [
                { id: "1", type: "incoming_event", data: { event: "new_comment", platform: post.platform } },
                { id: "2", type: "if_condition", data: { operator: "contains", keyword: "support" } },
                { id: "3", type: "send_request", data: { text: `Connecting to ${type}...` } }
            ],
            edges: [
                { source: "1", target: "2" },
                { source: "2", target: "3" }
            ]
        };

        const payload: PostAutomation = {
            post_id: post.post_id,
            permalink: post.permalink,
            platform: post.platform,
            post_caption: post.caption || "Social Post",
            visual_graph: mockGraph
        };

        try {
            const res = await automationService.createAutomation(payload);
            await automationService.publishAutomation(res.id!);
            await loadData();
            alert(`Linked & Activated "${type}" automation workflow for this post!`);
        } catch (e) {
            alert("Failed to map automation workflow.");
        }
    };

    const togglePostSelection = (postId: string) => {
        setSelectedPostIds((prev) =>
            prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
        );
    };

    const handleBatchAssign = async (type: string) => {
        setBatchDropdownOpen(false);
        const selectedPosts = posts.filter((p) => selectedPostIds.includes(p.post_id));
        for (const post of selectedPosts) {
            await handleLinkWorkflow(post, type);
        }
        setSelectedPostIds([]);
        alert(`Assigned "${type}" to ${selectedPosts.length} posts successfully.`);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-100">Social Channel Posts</h1>
                    <p className="text-zinc-400 text-xs mt-1">Directly sync live Facebook/Instagram post metrics</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 relative">
                    <input
                        type="text"
                        placeholder="Search captions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs px-3 py-2 rounded-xl focus:outline-none"
                    />
                    <select
                        value={platformFilter}
                        onChange={(e) => setPlatformFilter(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs px-3 py-2 rounded-xl focus:outline-none"
                    >
                        <option value="">All Platforms</option>
                        <option value="instagram">Instagram</option>
                        <option value="linkedin">LinkedIn</option>
                    </select>

                    {selectedPostIds.length > 0 && (
                        <div>
                            <button
                                onClick={() => setBatchDropdownOpen(!batchDropdownOpen)}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
                            >
                                Batch Actions ({selectedPostIds.length}) ▾
                            </button>
                            {batchDropdownOpen && (
                                <div className="absolute right-0 mt-2 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-30 w-48 py-2">
                                    <button
                                        onClick={() => handleBatchAssign("Auto Reply")}
                                        className="w-full text-left block px-4 py-2 hover:bg-zinc-850 text-zinc-300 text-xs font-medium cursor-pointer"
                                    >
                                        Assign Auto Reply
                                    </button>
                                    <button
                                        onClick={() => handleBatchAssign("Support Answers")}
                                        className="w-full text-left block px-4 py-2 hover:bg-zinc-850 text-zinc-300 text-xs font-medium cursor-pointer"
                                    >
                                        Assign Support Replies
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 disabled:bg-zinc-800 text-zinc-200 text-xs font-semibold rounded-xl cursor-pointer"
                    >
                        {syncing ? "Syncing..." : "Sync from Facebook/IG"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {posts.map((post, index) => {
                    const mockThumb = "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=300&q=80";

                    return (
                        <div key={`${post.post_id}-${index}`} className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col justify-between">
                            <div>
                                <div className="relative h-44 bg-zinc-950">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={mockThumb} alt="thumbnail" className="w-full h-full object-cover opacity-80" />
                                    <span className="absolute top-3 right-3 px-2 py-0.5 text-[9px] font-bold uppercase bg-zinc-950/80 border border-zinc-800 rounded text-zinc-300">
                                        {post.platform}
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={selectedPostIds.includes(post.post_id)}
                                        onChange={() => togglePostSelection(post.post_id)}
                                        className="absolute top-3 left-3 h-4 w-4 bg-zinc-950 border border-zinc-800 rounded cursor-pointer accent-indigo-600"
                                    />
                                </div>
                                <div className="p-5 space-y-2">
                                    <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed">{post.caption || "No caption provided."}</p>
                                    <div className="flex gap-4 text-[10px] text-zinc-500 font-bold uppercase tracking-wide">
                                        <span>👍 {post.likes} Likes</span>
                                        <span>💬 {post.comments} Comments</span>
                                        <span>📷 {post.media_type || "Image"}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase pt-1">
                                        <span>Flows: {post.automation_count}</span>
                                        <span className={`px-2 py-0.5 rounded ${post.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-400"}`}>
                                            {post.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 pt-0 flex items-center gap-3 relative">
                                <a
                                    href={post.permalink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-1/2 text-center px-3 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-semibold rounded-xl transition-all border border-zinc-750"
                                >
                                    Open Post
                                </a>
                                <div className="w-1/2">
                                    <button
                                        onClick={() => setDropdownOpen(dropdownOpen === post.post_id ? null : post.post_id)}
                                        className="w-full text-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md cursor-pointer"
                                    >
                                        Automation ▾
                                    </button>
                                    {dropdownOpen === post.post_id && (
                                        <div className="absolute right-5 bottom-16 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-20 w-48 py-2 animate-in fade-in duration-200 max-h-60 overflow-y-auto">
                                            <Link
                                                href={`/dashboard/workflows?new=true&post_id=${post.post_id}&post_url=${encodeURIComponent(post.permalink)}&platform=${post.platform}&caption=${encodeURIComponent(post.caption || "")}`}
                                                className="w-full text-left block px-4 py-2 hover:bg-zinc-850 text-zinc-300 text-xs font-medium"
                                            >
                                                Create New Flow
                                            </Link>
                                            <hr className="border-zinc-850 my-1" />
                                            <div className="px-4 py-1 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Select Saved Flow</div>
                                            {availableWorkflows.map((wf, idx) => (
                                                <button
                                                    key={`${wf.id}-${idx}`}
                                                    onClick={async () => {
                                                        setDropdownOpen(null);
                                                        try {
                                                            await apiClient.put(`/automations/${wf.id}`, {
                                                                post_id: post.post_id,
                                                                permalink: post.permalink,
                                                                platform: post.platform,
                                                                post_thumbnail: wf.post_thumbnail || "",
                                                                post_caption: wf.post_caption || "Social Post",
                                                                visual_graph: wf.visual_graph
                                                            });
                                                            await apiClient.post(`/automations/${wf.id}/publish?activate=true`);
                                                            await loadData();
                                                            alert(`Assigned and activated workflow "${wf.post_caption}"!`);
                                                        } catch (e) {
                                                            alert("Failed to assign flow.");
                                                        }
                                                    }}
                                                    className="w-full text-left block px-4 py-2 hover:bg-zinc-850 text-zinc-300 text-xs font-medium truncate cursor-pointer"
                                                >
                                                    {wf.post_caption || `Flow #${wf.id}`}
                                                </button>
                                            ))}
                                            {post.is_active && (
                                                <>
                                                    <hr className="border-zinc-850 my-1" />
                                                    <button
                                                        onClick={async () => {
                                                            setDropdownOpen(null);
                                                            try {
                                                                const activeWf = availableWorkflows.find(w => w.post_id === post.post_id);
                                                                if (activeWf) {
                                                                    await apiClient.post(`/automations/${activeWf.id}/publish?activate=false`);
                                                                }
                                                                await loadData();
                                                                alert("Automation deactivated.");
                                                            } catch (e) {
                                                                alert("Failed to deactivate.");
                                                            }
                                                        }}
                                                        className="w-full text-left block px-4 py-2 hover:bg-rose-950/40 text-rose-400 text-xs font-semibold cursor-pointer"
                                                    >
                                                        Deactivate Flow
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

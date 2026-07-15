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

    // Automation configuration state managers
    const [expandedCard, setExpandedCard] = useState<string | null>(null);
    const [automationConfigs, setAutomationConfigs] = useState<Record<string, any>>({});
    const [keywordsInput, setKeywordsInput] = useState("");


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

            // Fetch automation configuration settings for each synced post
            for (const post of res.data) {
                const configRes = await apiClient.get(`/posts/${post.post_id}/automation`);
                setAutomationConfigs(prev => ({ ...prev, [post.post_id]: configRes.data }));
            }
        } catch (e) {
            console.error("Failed to fetch posts:", e);
        }
    };


    useEffect(() => {
        loadData();
    }, [platformFilter, campaignFilter, searchQuery]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && expandedCard) {
                if (window.confirm("You may have unsaved changes. Are you sure you want to close?")) {
                    setExpandedCard(null);
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [expandedCard]);


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
                    const config = automationConfigs[post.post_id] || {};

                    return (
                        <div key={`${post.post_id}-${index}`} className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col justify-between p-5 space-y-4">
                            <div className="flex gap-4">
                                <img src={mockThumb} alt="thumbnail" className="w-20 h-20 object-cover rounded-xl border border-zinc-800" />
                                <div className="flex-1 space-y-1">
                                    <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">{post.caption || "No caption"}</p>
                                    <div className="flex gap-3 text-[10px] text-zinc-500">
                                        <span>👍 {post.likes} Likes</span>
                                        <span>💬 {post.comments} Comments</span>
                                    </div>
                                    <div className="flex items-center gap-2 pt-1">
                                        <label className="text-[10px] text-zinc-400 font-bold">Enabled:</label>
                                        <input
                                            type="checkbox"
                                            checked={config.automation_enabled || false}
                                            onChange={async (e) => {
                                                const updated = { ...config, automation_enabled: e.target.checked };
                                                setAutomationConfigs(prev => ({ ...prev, [post.post_id]: updated }));
                                                await apiClient.post(`/posts/${post.post_id}/automation`, updated);
                                            }}
                                            className="h-3.5 w-3.5 rounded accent-indigo-600 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-zinc-850 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Automation State</span>
                                <button
                                    onClick={() => {
                                        setExpandedCard(post.post_id);
                                        const currentConfig = automationConfigs[post.post_id] || {};
                                        setKeywordsInput(currentConfig.keywords?.join(", ") || "");
                                    }}
                                    className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold"
                                >
                                    Configure Settings ▾
                                </button>

                            </div>
                        </div>
                    );
                })}
            </div>

            {expandedCard && (() => {
                const post = posts.find(p => p.post_id === expandedCard);
                const config = automationConfigs[expandedCard] || {};
                
                if (!post) return null;

                const handleClose = () => {
                    if (window.confirm("You may have unsaved changes. Are you sure you want to close?")) {
                        setExpandedCard(null);
                    }
                };

                const handleSync = async () => {
                    try {
                        const payload = {
                            platform_name: post.platform || "instagram",
                            automation_enabled: config.automation_enabled ?? false,
                            match_type: config.match_type || "contains",
                            ignore_case: config.ignore_case ?? true,
                            keywords: config.keywords || [],
                            reply_enabled: config.reply_enabled ?? true,
                            dm_enabled: config.dm_enabled ?? true,
                            reply_template: config.reply_template || "",
                            dm_template: config.dm_template || "",
                            reply_delay: Number(config.reply_delay ?? 0),
                            expires_at: config.expires_at || null,
                            campaign_name: config.campaign_name || ""
                        };
                        await apiClient.post(`/posts/${expandedCard}/automation`, payload);
                        alert("Configuration Synced");
                        setExpandedCard(null);
                    } catch (e: any) {
                        alert(`Sync failed: ${e.response?.data?.detail || e.message}`);
                    }
                };

                return (
                    <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={handleClose}>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                                <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">Configure Post Automation</h3>
                                <button onClick={handleClose} className="text-zinc-500 hover:text-zinc-400 text-lg">×</button>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={config.automation_enabled || false}
                                        onChange={(e) => setAutomationConfigs(prev => ({
                                            ...prev,
                                            [expandedCard]: { ...config, automation_enabled: e.target.checked }
                                        }))}
                                        className="accent-indigo-600"
                                    />
                                    <label className="text-[10px] text-zinc-400 font-bold">Automation Enabled</label>
                                </div>

                                <div>
                                    <label className="block text-[10px] text-zinc-500 font-bold mb-1">Keywords (Comma separated)</label>
                                    <input
                                        type="text"
                                        value={keywordsInput}
                                        onChange={(e) => {
                                            setKeywordsInput(e.target.value);
                                            const kwArray = e.target.value.split(",").map(k => k.trim()).filter(Boolean);
                                            setAutomationConfigs(prev => ({
                                                ...prev,
                                                [expandedCard]: { ...config, keywords: kwArray }
                                            }));
                                        }}
                                        placeholder="CATALOG, DISCOUNT"
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-300 focus:outline-none"
                                    />

                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] text-zinc-500 font-bold mb-1">Match Type</label>
                                        <select
                                            value={config.match_type || "contains"}
                                            onChange={(e) => setAutomationConfigs(prev => ({
                                                ...prev,
                                                [expandedCard]: { ...config, match_type: e.target.value }
                                            }))}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-300 focus:outline-none"
                                        >
                                            <option value="contains">Contains</option>
                                            <option value="exact">Exact</option>
                                            <option value="starts_with">Starts With</option>
                                            <option value="ends_with">Ends With</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2 pt-4">
                                        <input
                                            type="checkbox"
                                            checked={config.ignore_case || false}
                                            onChange={(e) => setAutomationConfigs(prev => ({
                                                ...prev,
                                                [expandedCard]: { ...config, ignore_case: e.target.checked }
                                            }))}
                                            className="accent-indigo-600"
                                        />
                                        <label className="text-[10px] text-zinc-400 font-bold">Ignore Case</label>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={config.reply_enabled ?? true}
                                            onChange={(e) => setAutomationConfigs(prev => ({
                                                ...prev,
                                                [expandedCard]: { ...config, reply_enabled: e.target.checked }
                                            }))}
                                            className="accent-indigo-600"
                                        />
                                        <label className="text-[10px] text-zinc-400 font-bold">Enable Public Reply</label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={config.dm_enabled ?? true}
                                            onChange={(e) => setAutomationConfigs(prev => ({
                                                ...prev,
                                                [expandedCard]: { ...config, dm_enabled: e.target.checked }
                                            }))}
                                            className="accent-indigo-600"
                                        />
                                        <label className="text-[10px] text-zinc-400 font-bold">Enable DM</label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] text-zinc-500 font-bold mb-1">Reply Template</label>
                                    <textarea
                                        value={config.reply_template || ""}
                                        onChange={(e) => setAutomationConfigs(prev => ({
                                            ...prev,
                                            [expandedCard]: { ...config, reply_template: e.target.value }
                                        }))}
                                        rows={2}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-300 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] text-zinc-500 font-bold mb-1">DM Template</label>
                                    <textarea
                                        value={config.dm_template || ""}
                                        onChange={(e) => setAutomationConfigs(prev => ({
                                            ...prev,
                                            [expandedCard]: { ...config, dm_template: e.target.value }
                                        }))}
                                        rows={3}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-300 focus:outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] text-zinc-500 font-bold mb-1">Reply Delay</label>
                                        <select
                                            value={config.reply_delay || 0}
                                            onChange={(e) => setAutomationConfigs(prev => ({
                                                ...prev,
                                                [expandedCard]: { ...config, reply_delay: Number(e.target.value) }
                                            }))}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-300 focus:outline-none"
                                        >
                                            <option value={0}>Immediately</option>
                                            <option value={30}>30 sec</option>
                                            <option value={60}>1 min</option>
                                            <option value={120}>2 min</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-zinc-500 font-bold mb-1">Expiry Date</label>
                                        <input
                                            type="date"
                                            value={config.expires_at ? config.expires_at.split("T")[0] : ""}
                                            onChange={(e) => setAutomationConfigs(prev => ({
                                                ...prev,
                                                [expandedCard]: { ...config, expires_at: e.target.value ? `${e.target.value}T23:59:59Z` : null }
                                            }))}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-300 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
                                <button onClick={handleClose} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-xl text-xs font-semibold">Cancel</button>
                                <button onClick={handleSync} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold">Sync to Database</button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}


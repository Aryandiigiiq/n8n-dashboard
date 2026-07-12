"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAccounts } from "@/hooks/useAccounts";
import { useMessages } from "@/hooks/useMessages";
import { useComments } from "@/hooks/useComments";

export default function InboxPage() {
  const { accounts, loading: loadingAccounts } = useAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"messages" | "comments">("messages");

  // Messages State
  const {
    conversations,
    activeMessages,
    loading: loadingMessages,
    sync: syncMessages,
    fetchConversationMessages,
    reply: replyToMessage,
  } = useMessages(selectedAccountId);

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [newMessageText, setNewMessageText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Comments State
  const {
    comments,
    loading: loadingComments,
    sync: syncComments,
    reply: replyToComment,
    hide: hideComment,
    deleteComment,
  } = useComments(selectedAccountId);

  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [newCommentReplyText, setNewCommentReplyText] = useState("");

  // Set default selected account
  useEffect(() => {
    if (accounts.length > 0 && selectedAccountId === null) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Set default active conversation
  useEffect(() => {
    if (conversations.length > 0 && activeConversationId === null) {
      setActiveConversationId(conversations[0].conversation_id);
    }
  }, [conversations, activeConversationId]);

  // Load conversation messages when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      fetchConversationMessages(activeConversationId);
    }
  }, [activeConversationId, fetchConversationMessages]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeConversationId) return;

    try {
      await replyToMessage(activeConversationId, newMessageText.trim());
      setNewMessageText("");
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const handleSendCommentReply = async (e: React.FormEvent, commentId: string) => {
    e.preventDefault();
    if (!newCommentReplyText.trim()) return;

    try {
      await replyToComment(commentId, newCommentReplyText.trim());
      setNewCommentReplyText("");
      setActiveCommentId(null);
    } catch (err) {
      console.error("Failed to reply to comment", err);
    }
  };

  const handleSync = async () => {
    if (activeTab === "messages") {
      await syncMessages();
    } else {
      await syncComments();
    }
  };

  if (loadingAccounts) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl space-y-6">
        <div className="p-4 bg-indigo-500/10 rounded-full text-indigo-400">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-zinc-200">No Social Accounts Connected</h3>
          <p className="text-zinc-400 text-sm max-w-sm">
            Please connect at least one Facebook Page or Instagram Business account to view messages and comments.
          </p>
        </div>
        <Link
          href="/dashboard/accounts"
          className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-zinc-100 font-semibold rounded-xl text-sm transition-all"
        >
          Link an Account
        </Link>
      </div>
    );
  }

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/20 border border-zinc-800/60 p-4 rounded-2xl backdrop-blur-xl">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Account:</label>
          <select
            value={selectedAccountId || ""}
            onChange={(e) => {
              setSelectedAccountId(Number(e.target.value));
              setActiveConversationId(null);
              setActiveCommentId(null);
            }}
            className="flex-1 sm:flex-none bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.metadata_json?.platform || "Meta"})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
          {/* Tab buttons */}
          <div className="bg-zinc-950 p-1 rounded-xl border border-zinc-800 flex space-x-1">
            <button
              onClick={() => setActiveTab("messages")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === "messages"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/10"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Messages
            </button>
            <button
              onClick={() => setActiveTab("comments")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === "comments"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/10"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Comments
            </button>
          </div>

          {/* Sync Button */}
          <button
            onClick={handleSync}
            disabled={loadingMessages || loadingComments}
            className="flex items-center space-x-2 px-4 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-800 transition-colors disabled:opacity-50"
          >
            <svg
              className={`w-3.5 h-3.5 ${loadingMessages || loadingComments ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3 3L22 4" />
            </svg>
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Main Inbox Container */}
      <div className="flex-1 flex bg-zinc-900/20 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-xl">
        {activeTab === "messages" ? (
          <>
            {/* Sidebar: Conversation List */}
            <div className="w-80 border-r border-zinc-800/80 flex flex-col h-full bg-zinc-950/20">
              <div className="p-4 border-b border-zinc-800/60 font-semibold text-xs text-zinc-400 uppercase tracking-wider">
                Direct Messages
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-zinc-900/60">
                {loadingMessages && conversations.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 text-sm">Loading conversations...</div>
                ) : conversations.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 text-sm">No conversations found.</div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.conversation_id}
                      onClick={() => setActiveConversationId(conv.conversation_id)}
                      className={`w-full text-left p-4 flex flex-col space-y-1 transition-all ${
                        activeConversationId === conv.conversation_id
                          ? "bg-indigo-500/10 border-l-4 border-indigo-500"
                          : "hover:bg-zinc-900/40"
                      }`}
                    >
                      <div className="flex justify-between items-baseline w-full">
                        <span className="font-bold text-zinc-200 text-sm truncate max-w-[140px]">
                          {conv.participant_name}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {new Date(conv.latest_message_time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <span className="text-zinc-400 text-xs truncate w-full">{conv.latest_message}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col h-full bg-zinc-950/50">
              {activeConversationId ? (
                <>
                  {/* Chat Header */}
                  <div className="h-14 border-b border-zinc-800/60 px-6 flex items-center justify-between">
                    <span className="font-bold text-zinc-200">
                      {conversations.find((c) => c.conversation_id === activeConversationId)?.participant_name || "Conversation"}
                    </span>
                  </div>

                  {/* Messages list */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {activeMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.is_from_me ? "justify-end" : "justify-start"} w-full`}
                      >
                        <div
                          className={`max-w-[70%] p-3.5 rounded-2xl text-sm shadow-md ${
                            msg.is_from_me
                              ? "bg-gradient-to-br from-indigo-550 to-purple-650 text-white rounded-br-none"
                              : "bg-zinc-850 text-zinc-200 rounded-bl-none border border-zinc-800/50"
                          }`}
                        >
                          <p className="leading-relaxed">{msg.content}</p>
                          <span className="block text-[9px] text-zinc-400 mt-1.5 text-right font-medium">
                            {new Date(msg.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-800/80 flex gap-3">
                    <input
                      type="text"
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      placeholder="Type a response..."
                      className="flex-1 bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-indigo-500/10"
                    >
                      Send
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
                  Select a conversation to start chatting.
                </div>
              )}
            </div>
          </>
        ) : (
          /* Comments Tab View */
          <div className="flex-1 flex flex-col h-full bg-zinc-950/20">
            <div className="p-4 border-b border-zinc-800/60 font-semibold text-xs text-zinc-400 uppercase tracking-wider flex justify-between items-center">
              <span>Public Comments</span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingComments && comments.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-sm">Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-sm">No comments found.</div>
              ) : (
                comments.map((comm) => (
                  <div
                    key={comm.platform_comment_id}
                    className={`p-5 rounded-2xl border transition-all ${
                      comm.is_hidden
                        ? "bg-zinc-950/50 border-zinc-900 opacity-60"
                        : "bg-zinc-900/40 border-zinc-800/60"
                    } flex flex-col space-y-3`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs uppercase">
                          {comm.sender_name ? comm.sender_name[0] : "U"}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-zinc-200 text-sm">{comm.sender_name || "User"}</span>
                            {comm.is_from_me && (
                              <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[9px] font-semibold border border-indigo-500/20 uppercase tracking-wider">
                                Page
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-500">
                            {new Date(comm.sent_at).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        {/* Hide button */}
                        {!comm.is_from_me && (
                          <button
                            onClick={() => hide(comm.platform_comment_id, !comm.is_hidden)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                              comm.is_hidden
                                ? "bg-amber-500/10 hover:bg-amber-550/20 text-amber-400 border-amber-500/20"
                                : "bg-zinc-850 hover:bg-zinc-800 text-zinc-400 border-zinc-800"
                            }`}
                          >
                            {comm.is_hidden ? "Unhide" : "Hide"}
                          </button>
                        )}

                        {/* Delete button */}
                        <button
                          onClick={() => deleteComment(comm.platform_comment_id)}
                          className="px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-550/20 text-red-400 text-xs font-semibold transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <p className="text-zinc-300 text-sm pl-11">{comm.content}</p>

                    {/* Reply Dialog */}
                    <div className="pl-11 pt-2">
                      {activeCommentId === comm.platform_comment_id ? (
                        <form
                          onSubmit={(e) => handleSendCommentReply(e, comm.platform_comment_id)}
                          className="flex gap-2"
                        >
                          <input
                            type="text"
                            value={newCommentReplyText}
                            onChange={(e) => setNewCommentReplyText(e.target.value)}
                            placeholder="Type comment reply..."
                            className="flex-1 bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
                          />
                          <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-all"
                          >
                            Reply
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveCommentId(null);
                              setNewCommentReplyText("");
                            }}
                            className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 font-semibold text-xs rounded-xl transition-all"
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <button
                          onClick={() => {
                            setActiveCommentId(comm.platform_comment_id);
                            setNewCommentReplyText("");
                          }}
                          className="flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-semibold"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                          <span>Reply to comment</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

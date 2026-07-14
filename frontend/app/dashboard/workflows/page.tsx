"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { automationService, PostAutomation, VisualNode, VisualEdge } from "@/services/automation";
import apiClient from "@/services/api";

function BuilderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const isNew = searchParams.get("new") === "true";
  const postId = searchParams.get("post_id") || "";
  const postUrl = searchParams.get("post_url") || "";
  const platform = searchParams.get("platform") || "instagram";
  const caption = searchParams.get("caption") || "";
  const thumbnail = searchParams.get("thumbnail") || "";
  const editId = searchParams.get("edit_id");

  const [automations, setAutomations] = useState<PostAutomation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [activePostId, setActivePostId] = useState("");
  const [activePermalink, setActivePermalink] = useState("");
  const [activePlatform, setActivePlatform] = useState("instagram");
  const [activeCaption, setActiveCaption] = useState("");
  const [activeThumbnail, setActiveThumbnail] = useState("");

  const [nodes, setNodes] = useState<VisualNode[]>([]);
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(null);

  const [statusMessage, setStatusMessage] = useState("");
  const [outputLogs, setOutputLogs] = useState("");
  const [workflowName, setWorkflowName] = useState("My Automation Workflow");
  const [postsList, setPostsList] = useState<any[]>([]);
  const [selectedPostId, setSelectedPostId] = useState("");
  const [applyToAll, setApplyToAll] = useState(true);

  // Fetch posts dynamically when activePlatform changes
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await apiClient.get("/posts", { params: { platform: activePlatform } });
        setPostsList(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchPosts();
  }, [activePlatform]);

  const loadAutomations = async () => {
    try {
      const list = await automationService.getAutomations();
      setAutomations(list);

      if (editId) {
        const found = list.find((a) => a.id === Number(editId));
        if (found) {
          loadSelectedAutomation(found);
        }
      } else if (isNew && postId) {
        setSelectedId(null);
        setActivePostId(postId);
        setActivePermalink(postUrl);
        setActivePlatform(platform);
        setActiveCaption(caption);
        setActiveThumbnail(thumbnail);
        setNodes([
          { id: "1", type: "incoming_event", data: { event: "new_comment", platform } },
          { id: "2", type: "if_condition", data: { operator: "contains", keyword: "" } },
          { id: "3", type: "send_request", data: { action_type: "reply", text: "" } }
        ]);
        setSelectedNodeIndex(0);
      } else if (list.length > 0) {
        loadSelectedAutomation(list[0]);
      } else {
        handleNew();
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAutomations();
  }, [editId, isNew, postId, postUrl]);

  const loadSelectedAutomation = (auto: PostAutomation) => {
    setSelectedId(auto.id || null);
    setActivePostId(auto.post_id);
    setActivePermalink(auto.permalink);
    setActivePlatform(auto.platform);
    setActiveCaption(auto.post_caption || "");
    setWorkflowName(auto.post_caption || "My Automation Workflow");
    setActiveThumbnail(auto.post_thumbnail || "");
    setNodes(auto.visual_graph.nodes || []);
    setSelectedNodeIndex(auto.visual_graph.nodes.length > 0 ? 0 : null);
  };

  const handleNew = () => {
    setSelectedId(null);
    setActivePostId("manual_flow_id");
    setActivePermalink("https://instagram.com/p/manual");
    setActivePlatform("instagram");
    setActiveCaption("Workspace Custom Flow Draft");
    setWorkflowName("My Automation Workflow");
    setSelectedPostId(""); // <-- Clear specific post
    setApplyToAll(true);   // <-- Default to all posts scope
    setActiveThumbnail("https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=300&q=80");
    setNodes([
      { id: "1", type: "incoming_event", data: { event: "new_comment", platform: "instagram" } },
      { id: "2", type: "if_condition", data: { operator: "contains", keyword: "" } },
      { id: "3", type: "send_request", data: { action_type: "reply", text: "" } }
    ]);
    setSelectedNodeIndex(0);
  };


  const handleUpdateNodeData = (key: string, value: any) => {
    if (selectedNodeIndex === null) return;
    setNodes((prev) =>
      prev.map((n, idx) =>
        idx === selectedNodeIndex
          ? { ...n, data: { ...n.data, [key]: value } }
          : n
      )
    );
  };

  const handleAddBlock = (type: "if_condition" | "send_request" | "store_value" | "delay" | "loop" | "switch" | "ai_action" | "generic_api" | "custom_script") => {
    const newId = String(Date.now());
    let defaultData = {};
    if (type === "if_condition") defaultData = { operator: "contains", keyword: "" };
    if (type === "send_request") defaultData = { action_type: "reply", text: "" };
    if (type === "store_value") defaultData = { variable_name: "key", variable_value: "" };
    if (type === "delay") defaultData = { duration: 5, unit: "minutes" };
    if (type === "loop") defaultData = { batch_size: 1 };
    if (type === "switch") defaultData = { rules: [{ value: "support" }] };
    if (type === "ai_action") defaultData = { prompt: "" };
    if (type === "generic_api") defaultData = { url: "", method: "GET", body: "{}", headers: [] };
    if (type === "custom_script") defaultData = { code: "return items;" };


    const newBlock: VisualNode = { id: newId, type, data: defaultData };
    setNodes((prev) => [...prev, newBlock]);
    setSelectedNodeIndex(nodes.length);
  };

  const handleDeleteBlock = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (nodes.length <= 1) {
      setStatusMessage("Cannot delete the last remaining step block.");
      return;
    }
    setNodes((prev) => prev.filter((_, i) => i !== idx));
    setSelectedNodeIndex(0);
  };


  const handleSave = async () => {
    const edges: VisualEdge[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        source: nodes[i].id,
        target: nodes[i + 1].id
      });
    }

    const payload: PostAutomation = {
      post_id: applyToAll ? "all_posts" : selectedPostId, // <-- Target Scoping
      permalink: activePermalink,
      platform: activePlatform,
      post_thumbnail: activeThumbnail,
      post_caption: workflowName, // <-- Textbox Workflow Name
      visual_graph: { nodes, edges }
    };


    try {
      if (selectedId) {
        await automationService.updateAutomation(selectedId, payload);
        setStatusMessage("Successfully saved changes to automation!");
      } else {
        const created = await automationService.createAutomation(payload);
        setSelectedId(created.id || null);
        setStatusMessage("Successfully created automation!");
      }
      loadAutomations();
    } catch (e) {
      setStatusMessage("Failed to save workflow automation.");
    }
  };

  const handlePublish = async (activate = true) => {
    if (!selectedId) {
      setStatusMessage("Please save this automation before publishing.");
      return;
    }
    setOutputLogs("Publishing to n8n runtime API...");
    try {
      const res = await apiClient.post(`/automations/${selectedId}/publish`, null, {
        params: { activate }
      });
      setOutputLogs(JSON.stringify(res.data, null, 2));
      setStatusMessage(
        activate
          ? "Successfully published and activated workflow inside n8n!"
          : "Successfully sent workflow draft to n8n!"
      );
      loadAutomations();
    } catch (e: any) {
      setOutputLogs(e.message || "Failed publishing to n8n");
      setStatusMessage("Failed to publish workflow. Check logs.");
    }
  };

  const handleExecute = async () => {
    if (!selectedId) return;
    setOutputLogs("Triggering workflow execution run in n8n...");
    try {
      const res = await apiClient.post(`/automations/${selectedId}/execute`);
      setOutputLogs(JSON.stringify(res.data, null, 2));
      setStatusMessage("Workflow run executed successfully!");
    } catch (e: any) {
      setOutputLogs(e.message || "Execution run failed.");
      setStatusMessage("Workflow execution failed. Check logs.");
    }
  };


  const activeNode = selectedNodeIndex !== null ? nodes[selectedNodeIndex] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-[85vh]">
      {/* Sidebar Selector */}
      <div className="lg:col-span-1 bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-zinc-300">Automations</h2>
            <button
              onClick={() => {
                router.replace("/dashboard/workflows");
                handleNew();
              }}
              className="px-2.5 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium cursor-pointer"
            >
              + Create
            </button>
          </div>
          <div className="space-y-2">
            {automations.map((a) => (
              <button
                key={a.id}
                onClick={() => loadSelectedAutomation(a)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold border transition-all truncate block ${selectedId === a.id
                  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/50"
                  : "bg-zinc-950/40 text-zinc-400 border-zinc-800 hover:text-zinc-100 hover:bg-zinc-850"
                  }`}
              >
                {a.post_caption || `Automation ${a.id}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Canvas Panel */}
      <div className="lg:col-span-3 space-y-6">
        {statusMessage && (
          <div className="p-3 bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-xl text-xs flex items-center justify-between">
            <span>ℹ️ {statusMessage}</span>
            <button onClick={() => setStatusMessage("")} className="text-zinc-500 hover:text-zinc-300">×</button>
          </div>
        )}

        <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            {activeThumbnail && (
              <img src={activeThumbnail} alt="post" className="w-12 h-12 object-cover rounded-lg border border-zinc-800" />
            )}
            <div className="space-y-2 flex-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Workflow Configuration</span>
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="Enter workflow name..."
                className="w-full bg-zinc-950 border border-zinc-850 text-zinc-100 text-xs px-3 py-2 rounded-xl focus:outline-none font-semibold"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Platform Selector */}
            <select
              value={activePlatform}
              onChange={(e) => setActivePlatform(e.target.value)}
              className="bg-zinc-950 border border-zinc-850 text-zinc-300 text-xs px-3 py-2 rounded-xl focus:outline-none"
            >
              <option value="instagram">Instagram</option>
              <option value="linkedin">LinkedIn</option>
            </select>

            {/* Apply to all check */}
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
                className="rounded border-zinc-800 bg-zinc-950 accent-indigo-600 h-4 w-4"
              />
              All Posts
            </label>

            {/* Target Post selector dropdown */}
            {!applyToAll && (
              <select
                value={selectedPostId}
                onChange={(e) => setSelectedPostId(e.target.value)}
                className="bg-zinc-950 border border-zinc-850 text-zinc-300 text-xs px-3 py-2 rounded-xl focus:outline-none max-w-[200px]"
              >
                <option value="">Choose Post...</option>
                {postsList.map((post) => (
                  <option key={post.post_id} value={post.post_id}>
                    {post.caption ? post.caption.substring(0, 30) + "..." : post.post_id}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="p-6 bg-zinc-950/40 border border-zinc-800 rounded-2xl space-y-4 min-h-[45vh] flex flex-col justify-start items-center">
              {nodes.map((node, index) => (
                <React.Fragment key={node.id}>
                  {index > 0 && (
                    <div className="w-0.5 h-6 bg-zinc-800 border-dashed border-l-2 border-zinc-700" />
                  )}
                  <div
                    onClick={() => setSelectedNodeIndex(index)}
                    className={`w-full max-w-sm p-4 rounded-xl border transition-all cursor-pointer relative group ${selectedNodeIndex === index
                      ? "bg-indigo-500/10 border-indigo-500 text-indigo-200"
                      : "bg-zinc-900/60 border-zinc-850 hover:border-zinc-700 text-zinc-300"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-zinc-950 rounded border border-zinc-800 text-zinc-500">
                          {node.type.replace("_", " ")}
                        </span>
                        <h4 className="text-xs font-bold text-zinc-200">
                          {node.type === "incoming_event" && `WHEN: ${node.data.event || "New Comment"}`}
                          {node.type === "if_condition" && `IF: ${node.data.operator || "Contains"} "${node.data.keyword || ""}"`}
                          {node.type === "send_request" && `THEN: ${node.data.action_type || "Reply"}`}
                          {node.type === "store_value" && `STORE: ${node.data.variable_name || "Value"}`}
                          {node.type === "delay" && `WAIT: ${node.data.duration || 5} ${node.data.unit || "minutes"}`}
                          {node.type === "generic_api" && `CALL API: ${node.data.method || "GET"} ${node.data.url || ""}`}
                          {node.type === "custom_script" && `RUN SCRIPT: JS`}
                        </h4>
                      </div>
                      <button
                        onClick={(e) => handleDeleteBlock(index, e)}
                        className="text-zinc-600 hover:text-red-400 text-xs px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </React.Fragment>
              ))}

              <div className="w-0.5 h-6 bg-zinc-800 border-dashed border-l-2 border-zinc-700" />
              <div className="flex gap-2">
                <button onClick={() => handleAddBlock("if_condition")} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] font-bold rounded-lg cursor-pointer">+ Add IF</button>
                <button onClick={() => handleAddBlock("send_request")} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] font-bold rounded-lg cursor-pointer">+ Add Action</button>
                <button onClick={() => handleAddBlock("store_value")} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] font-bold rounded-lg cursor-pointer">+ Add Store Value</button>
                <button onClick={() => handleAddBlock("delay")} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] font-bold rounded-lg cursor-pointer">+ Add WAIT</button>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={handleSave} className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-200 cursor-pointer">Save Layout</button>
              <button onClick={() => handlePublish(true)} className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-xs font-semibold text-white cursor-pointer">Publish & Activate</button>
              <button onClick={() => handlePublish(false)} className="px-5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-zinc-750 cursor-pointer">Send to n8n (Draft)</button>
              {selectedId && (
                <button onClick={handleExecute} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-semibold text-white cursor-pointer">Execute Workflow</button>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-2xl min-h-[45vh] space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Properties Panel</h3>
            {activeNode ? (
              <div className="space-y-4">
                {activeNode.type === "incoming_event" && (
                  <div>
                    <label className="text-[10px] text-zinc-500 font-bold block mb-1">Trigger Event</label>
                    <select
                      value={activeNode.data.event || "new_comment"}
                      onChange={(e) => handleUpdateNodeData("event", e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-2 text-xs text-zinc-300 focus:outline-none"
                    >
                      <option value="instagram_comment">Instagram Comment Trigger</option>
                      <option value="instagram_dm">Instagram Direct Message (DM)</option>
                      <option value="linkedin_comment">LinkedIn Comment Trigger</option>
                      <option value="linkedin_share">LinkedIn Share Trigger</option>
                      <option value="new_comment">New Comment Posted</option>
                      <option value="new_dm">New Direct Message Received</option>
                      <option value="mention">Mention in Post</option>
                      <option value="story_reply">Story Reply or Mention</option>
                      <option value="user_tagged">User Tagged in Media</option>
                      <option value="timer_fired">Scheduled Timer Fired</option>
                      <option value="webhook_generic">Generic Webhook Trigger</option>
                    </select>

                  </div>
                )}

                {activeNode.type === "if_condition" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-zinc-500 font-bold block mb-1">Operator Rule</label>
                      <select
                        value={activeNode.data.operator || "contains"}
                        onChange={(e) => handleUpdateNodeData("operator", e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-2 text-xs text-zinc-300 focus:outline-none"
                      >
                        <option value="contains">Contains Keyword</option>
                        <option value="equals">Equals Text</option>
                        <option value="starts_with">Starts With</option>
                        <option value="ends_with">Ends With</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 font-bold block mb-1">Matching Keyword</label>
                      <input
                        type="text"
                        value={activeNode.data.keyword || ""}
                        onChange={(e) => handleUpdateNodeData("keyword", e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-2 text-xs text-zinc-300 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {activeNode.type === "send_request" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-zinc-500 font-bold block mb-1">Action Type</label>
                      <select
                        value={activeNode.data.action_type || "reply"}
                        onChange={(e) => handleUpdateNodeData("action_type", e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-2 text-xs text-zinc-300 focus:outline-none"
                      >
                        <option value="reply">Reply to Comment</option>
                        <option value="send_dm">Send Direct Message (DM)</option>
                        <option value="generic_api">Generic HTTP Request</option>
                        <option value="mcp_command">MCP Command Execution</option>
                        <option value="hide_comment">Hide/Delete Comment</option>
                        <option value="slack_notify">Send Slack Notification</option>
                        <option value="whatsapp_dm">Send WhatsApp Message</option>
                        <option value="jira_ticket">Create Jira Support Ticket</option>
                      </select>

                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 font-bold block mb-1">Message Template</label>
                      <textarea
                        value={activeNode.data.text || ""}
                        onChange={(e) => handleUpdateNodeData("text", e.target.value)}
                        rows={4}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-2 text-xs text-zinc-300 focus:outline-none resize-none font-sans"
                      />
                    </div>
                  </div>
                )}

                {activeNode.type === "store_value" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-zinc-500 font-bold block mb-1">Variable Name</label>
                      <input
                        type="text"
                        value={activeNode.data.variable_name || "key"}
                        onChange={(e) => handleUpdateNodeData("variable_name", e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-2 text-xs text-zinc-300 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 font-bold block mb-1">Store Value</label>
                      <input
                        type="text"
                        value={activeNode.data.variable_value || ""}
                        onChange={(e) => handleUpdateNodeData("variable_value", e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-2 text-xs text-zinc-300 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {activeNode.type === "delay" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-zinc-500 font-bold block mb-1">Delay Duration</label>
                      <input
                        type="number"
                        value={activeNode.data.duration || 5}
                        onChange={(e) => handleUpdateNodeData("duration", Number(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-2 text-xs text-zinc-300 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 font-bold block mb-1">Time Unit</label>
                      <select
                        value={activeNode.data.unit || "minutes"}
                        onChange={(e) => handleUpdateNodeData("unit", e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-2 text-xs text-zinc-300 focus:outline-none"
                      >
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </select>
                    </div>
                  </div>
                )}

                {activeNode.type === "loop" && (
                  <div>
                    <label className="text-[10px] text-zinc-500 font-bold block mb-1">Batch Loop Count</label>
                    <input
                      type="number"
                      value={activeNode.data.batch_size || 1}
                      onChange={(e) => handleUpdateNodeData("batch_size", Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-2 text-xs text-zinc-300 focus:outline-none"
                    />
                  </div>
                )}

                {activeNode.type === "switch" && (
                  <div className="space-y-3">
                    <label className="text-[10px] text-zinc-500 font-bold block mb-1">Switch Paths (Separated by Commas)</label>
                    <input
                      type="text"
                      defaultValue={(activeNode.data.rules || []).map((r: any) => r.value).join(", ")}
                      onChange={(e) => {
                        const vals = e.target.value.split(",").map((v) => ({ value: v.trim() }));
                        handleUpdateNodeData("rules", vals);
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-2 text-xs text-zinc-300 focus:outline-none"
                    />
                  </div>
                )}

                {activeNode.type === "ai_action" && (
                  <div>
                    <label className="text-[10px] text-zinc-500 font-bold block mb-1">AI Prompt Instruction</label>
                    <textarea
                      value={activeNode.data.prompt || ""}
                      onChange={(e) => handleUpdateNodeData("prompt", e.target.value)}
                      rows={4}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-2 text-xs text-zinc-300 focus:outline-none resize-none font-sans"
                    />
                  </div>
                )}

                {activeNode.type === "generic_api" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-zinc-500 font-bold block mb-1">Request URL</label>
                      <input
                        type="text"
                        value={activeNode.data.url || ""}
                        onChange={(e) => handleUpdateNodeData("url", e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-2 text-xs text-zinc-300 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 font-bold block mb-1">HTTP Method</label>
                      <select
                        value={activeNode.data.method || "GET"}
                        onChange={(e) => handleUpdateNodeData("method", e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-2 text-xs text-zinc-300 focus:outline-none"
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                      </select>
                    </div>
                  </div>
                )}

                {activeNode.type === "custom_script" && (
                  <div>
                    <label className="text-[10px] text-zinc-500 font-bold block mb-1">JavaScript Code block</label>
                    <textarea
                      value={activeNode.data.code || "return items;"}
                      onChange={(e) => handleUpdateNodeData("code", e.target.value)}
                      rows={6}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-2 text-xs text-zinc-300 font-mono focus:outline-none resize-none"
                    />
                  </div>
                )}
              </div>


            ) : (
              <p className="text-xs text-zinc-500">Select any block step to edit its rules.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl">
        <label className="text-xs text-zinc-500 font-bold block mb-2 uppercase tracking-wider">Compile Output Terminal</label>
        <pre className="text-zinc-400 font-mono text-[10px] overflow-auto max-h-40 whitespace-pre-wrap bg-zinc-900/30 p-3 rounded border border-zinc-850">
          {outputLogs || "Ready."}
        </pre>
      </div>
    </div>
  );
}

export default function WorkflowsPage() {
  return (
    <Suspense fallback={<div className="text-zinc-500 text-xs p-6">Loading Builder Workspace...</div>}>
      <BuilderContent />
    </Suspense>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import apiClient from "@/services/api";

interface WorkflowExecution {
    id: number;
    n8n_execution_id: string | null;
    status: string;
    trigger_type: string;
    created_at: string;
}

export default function ExecutionsPage() {
    const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get<WorkflowExecution[]>("/executions")
            .then((res) => {
                setExecutions(res.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to load executions:", err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] text-zinc-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                <p className="ml-3">Loading executions...</p>
            </div>
        );
    }
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-zinc-100">Execution History & Logs</h1>
                <p className="text-zinc-400 text-xs mt-1">Real-time run states compiled from n8n callbacks</p>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl">
                {loading ? (
                    <p className="text-zinc-500 text-xs">Loading execution logs...</p>
                ) : executions.length === 0 ? (
                    <p className="text-zinc-500 text-xs">No executions recorded yet.</p>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-zinc-500 text-xs font-bold uppercase border-b border-zinc-800 pb-3">
                                <th className="py-2.5">Execution ID</th>
                                <th className="py-2.5">Status</th>
                                <th className="py-2.5">Trigger Type</th>
                                <th className="py-2.5">Start Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/40 text-xs text-zinc-300">
                            {executions.map((e) => (
                                <tr key={e.id}>
                                    <td className="py-3.5 font-mono text-zinc-400">{e.n8n_execution_id || `Local-${e.id}`}</td>
                                    <td className="py-3.5">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${e.status === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                            e.status === "failed" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                                                "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                            }`}>
                                            {e.status}
                                        </span>
                                    </td>
                                    <td className="py-3.5 font-medium">{e.trigger_type}</td>
                                    <td className="py-3.5 text-zinc-500">{new Date(e.created_at).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

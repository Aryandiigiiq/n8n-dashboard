"use client";

import React, { useState } from "react";
import { integrationsService } from "@/services/integrations";

interface ConnectMetaDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const ConnectMetaDialog: React.FC<ConnectMetaDialogProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleConnect = async () => {
        setLoading(true);
        setError(null);
        try {
            const redirectUri = `${window.location.origin}/dashboard/accounts`;
            const response = await integrationsService.getAuthUrl("meta", redirectUri);
            window.location.href = response.url;
        } catch (err: any) {
            setError(err.message || "Failed to start Meta connection flow");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative space-y-6">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="text-center space-y-2">
                    <div className="h-12 w-12 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 font-bold text-xl mx-auto">
                        f
                    </div>
                    <h3 className="text-lg font-bold text-zinc-100">Connect Meta Account</h3>
                    <p className="text-xs text-zinc-400">
                        Link Facebook Pages and Instagram Business Profiles to publish content and track insights.
                    </p>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center space-x-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                <div className="flex items-center space-x-3 justify-end pt-2">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2.5 bg-zinc-950/40 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConnect}
                        disabled={loading}
                        className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                        {loading ? "Redirecting..." : "Connect Now"}
                    </button>
                </div>
            </div>
        </div>
    );
};
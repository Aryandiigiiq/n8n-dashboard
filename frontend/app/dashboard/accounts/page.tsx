"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import apiClient from "@/services/api";

function CallbackContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState("Connecting account...");
    const [error, setError] = useState("");

    useEffect(() => {
        const exchangeCode = async () => {
            const code = searchParams.get("code");
            const state = searchParams.get("state") || "instagram";

            if (!code) {
                setError("Authorization code is missing.");
                return;
            }

            try {
                let endpoint = "/oauth/meta/instagram/callback";
                if (state === "linkedin") {
                    endpoint = "/oauth/meta/linkedin/callback";
                } else if (state === "facebook") {
                    endpoint = "/oauth/meta/facebook/callback";
                }

                await apiClient.post(endpoint, { code });
                setStatus("Connected successfully! Redirecting...");
                setTimeout(() => {
                    router.replace("/dashboard/settings");
                }, 1500);
            } catch (e: any) {
                setError(e.response?.data?.detail || "Failed to exchange OAuth authorization code.");
            }
        };

        exchangeCode();
    }, [searchParams, router]);

    if (error) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center p-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm text-center space-y-3">
                    <span className="text-2xl">⚠️</span>
                    <h3 className="text-zinc-200 font-bold text-sm">Connection Failed</h3>
                    <p className="text-zinc-500 text-xs">{error}</p>
                    <button
                        onClick={() => router.replace("/dashboard/settings")}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl"
                    >
                        Back to Settings
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[50vh] flex items-center justify-center">
            <div className="text-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto" />
                <p className="text-zinc-400 text-xs font-medium">{status}</p>
            </div>
        </div>
    );
}

export default function AccountsCallbackPage() {
    return (
        <Suspense fallback={<div className="text-zinc-500 text-xs text-center p-12">Loading Authorization context...</div>}>
            <CallbackContent />
        </Suspense>
    );
}

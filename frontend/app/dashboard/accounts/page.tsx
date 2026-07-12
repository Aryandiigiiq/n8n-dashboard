"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { integrationsService, Integration, Account } from "@/services/integrations";

export default function AccountsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadData = async () => {
    try {
      setLoading(true);
      const [ints, accs] = await Promise.all([
        integrationsService.getIntegrations(),
        integrationsService.getAccounts(),
      ]);
      setIntegrations(ints);
      setAccounts(accs);
    } catch (err: any) {
      setError(err.message || "Failed to load account data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const code = searchParams.get("code");
    const stateParam = searchParams.get("state");
    if (code) {
      const storedState = sessionStorage.getItem("meta_oauth_state");
      if (stateParam && storedState && stateParam !== storedState) {
        setError("OAuth state validation failed. Possible CSRF attack detected.");
        setLoading(false);
        return;
      }
      
      // Clean query params and trigger connect
      const redirectUri = `${window.location.origin}/dashboard/accounts`;
      integrationsService
        .connectIntegration("meta", code, redirectUri, stateParam || "")
        .then(() => {
          sessionStorage.removeItem("meta_oauth_state");
          router.replace("/dashboard/accounts");
          loadData();
        })
        .catch((err: any) => {
          setError(err.message || "Failed to connect integration");
          setLoading(false);
        });
    } else {
      loadData();
    }
  }, [searchParams, router]);

  const handleConnectMeta = async () => {
    try {
      setError(null);
      const redirectUri = `${window.location.origin}/dashboard/accounts`;
      const { url, state } = await integrationsService.getAuthUrl("meta", redirectUri);
      sessionStorage.setItem("meta_oauth_state", state);
      window.location.href = url;
    } catch (err: any) {
      setError(err.message || "Failed to initiate Facebook OAuth");
    }
  };

  const handleDisconnect = async (id: number) => {
    if (!confirm("Are you sure you want to disconnect this integration? All linked profiles will be deleted.")) {
      return;
    }
    try {
      setLoading(true);
      await integrationsService.disconnectIntegration(id);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to disconnect integration");
      setLoading(false);
    }
  };

  const isMetaConnected = integrations.some((i) => i.provider === "meta" && i.is_active);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-center space-x-2 animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Connection Panel */}
      <div className="p-8 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Platform Integrations</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Link and authorize third-party platforms to publish and manage social channels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-zinc-950/40 border border-zinc-800/60 rounded-xl flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-zinc-200">Meta integration</span>
                  {isMetaConnected ? (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-full">
                      Connected
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-zinc-800 text-zinc-500 text-xs font-semibold rounded-full">
                      Disconnected
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 max-w-xs">
                  Supports Facebook Pages and Instagram Business publishing, analytics, and inbox comments.
                </p>
              </div>
              <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 font-extrabold">
                f
              </div>
            </div>

            <div className="pt-2">
              {isMetaConnected ? (
                <button
                  onClick={() => handleDisconnect(integrations.find((i) => i.provider === "meta")!.id)}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold rounded-xl border border-red-500/20 transition-all cursor-pointer"
                >
                  Disconnect Meta
                </button>
              ) : (
                <button
                  onClick={handleConnectMeta}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Connect Meta Account
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Connected Accounts List */}
      <div className="p-8 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Linked Accounts</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Active channels linked under your active integrations.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center space-x-2 justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-650 border-t-indigo-500"></div>
            <span className="text-xs text-zinc-400">Loading accounts...</span>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-800/80 rounded-xl">
            <svg className="w-8 h-8 text-zinc-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-zinc-500 text-xs">No active social media channels linked.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map((acc) => (
              <div key={acc.id} className="p-4 bg-zinc-950/40 border border-zinc-800/60 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {acc.profile_picture ? (
                    <img src={acc.profile_picture} alt={acc.name} className="h-10 w-10 rounded-full object-cover border border-zinc-700/50" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-sm text-zinc-400">
                      {acc.name[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-zinc-200 text-sm">{acc.name}</h4>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase ${
                        acc.metadata_json?.platform === "instagram"
                          ? "bg-pink-500/10 text-pink-400"
                          : "bg-blue-500/10 text-blue-400"
                      }`}>
                        {acc.metadata_json?.platform || "Facebook"}
                      </span>
                      {acc.metadata_json?.username && (
                        <span className="text-xs text-zinc-500">@{acc.metadata_json.username}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-555"></span>
                  <span className="text-xs text-zinc-500 font-semibold">Active</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

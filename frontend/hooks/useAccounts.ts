import { useState, useEffect, useCallback } from "react";
import { integrationsService, Account, Integration } from "@/services/integrations";

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [ints, accs] = await Promise.all([
        integrationsService.getIntegrations(),
        integrationsService.getAccounts(),
      ]);
      setIntegrations(ints);
      setAccounts(accs);
    } catch (err: any) {
      setError(err.message || "Failed to fetch accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  const connect = useCallback(async (provider: string, code: string, redirectUri: string, state: string) => {
    try {
      setLoading(true);
      setError(null);
      await integrationsService.connectIntegration(provider, code, redirectUri, state);
      await fetchAccounts();
    } catch (err: any) {
      setError(err.message || "Failed to connect integration");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchAccounts]);

  const disconnect = useCallback(async (integrationId: number) => {
    try {
      setLoading(true);
      setError(null);
      await integrationsService.disconnectIntegration(integrationId);
      await fetchAccounts();
    } catch (err: any) {
      setError(err.message || "Failed to disconnect integration");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchAccounts]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return {
    accounts,
    integrations,
    loading,
    error,
    refresh: fetchAccounts,
    connect,
    disconnect,
  };
}
import apiClient from "./api";

export interface Integration {
  id: number;
  user_id: number;
  provider: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: number;
  user_id: number;
  integration_id: number;
  platform_id: string;
  name: string;
  profile_picture?: string;
  is_active: boolean;
  metadata_json?: {
    platform: string;
    username?: string;
    category?: string;
    facebook_page_id?: string;
  };
  created_at: string;
  updated_at: string;
}

export const integrationsService = {
  async getIntegrations(): Promise<Integration[]> {
    const response = await apiClient.get<Integration[]>("/integrations");
    return response.data;
  },

  async getAccounts(): Promise<Account[]> {
    const response = await apiClient.get<Account[]>("/integrations/accounts");
    return response.data;
  },

  async getAuthUrl(provider: string, redirectUri: string): Promise<{ url: string; state: string }> {
    const response = await apiClient.get<{ url: string; state: string }>("/integrations/auth-url", {
      params: { provider, redirect_uri: redirectUri },
    });
    return response.data;
  },

  async connectIntegration(provider: string, code: string, redirectUri: string, state: string): Promise<Integration> {
    const response = await apiClient.post<Integration>("/integrations/connect", null, {
      params: { provider, code, redirect_uri: redirectUri, state },
    });
    return response.data;
  },

  async disconnectIntegration(integrationId: number): Promise<void> {
    await apiClient.delete(`/integrations/${integrationId}`);
  },
};

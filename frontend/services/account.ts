import apiClient from "./api";
import { Account } from "./integrations";

export const accountService = {
  async getAccounts(): Promise<Account[]> {
    const response = await apiClient.get<Account[]>("/integrations/accounts");
    return response.data;
  },

  async disconnect(id: number): Promise<void> {
    await apiClient.delete(`/integrations/${id}`);
  }
};

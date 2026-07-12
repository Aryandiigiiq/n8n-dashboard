import apiClient from "./api";

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export const authService = {
  saveToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
    }
  },

  getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  },

  removeToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
  },

  async login(username: string, password: string): Promise<TokenResponse> {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    try {
      const response = await apiClient.post<TokenResponse>("/auth/login", formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      const data = response.data;
      this.saveToken(data.access_token);
      return data;
    } catch (error: any) {
      const detail = error.response?.data?.detail || "Login failed";
      throw new Error(detail);
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<User>("/me");
      return response.data;
    } catch (error: any) {
      const detail = error.response?.data?.detail || "Failed to fetch user";
      throw new Error(detail);
    }
  },

  logout(): void {
    this.removeToken();
  }
};
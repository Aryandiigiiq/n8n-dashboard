import apiClient from "./api";

export interface VisualNode {
    id: string;
    type: string;  // "trigger" | "condition" | "action" | "wait"
    data: Record<string, any>;
}

export interface VisualEdge {
    source: string;
    target: string;
}

export interface PostAutomation {
    id?: number;
    workspace_id?: number;
    post_id: string;
    permalink: string;
    platform: string;
    post_thumbnail?: string;
    post_caption?: string;
    n8n_workflow_id?: string;
    is_active?: boolean;
    visual_graph: {
        nodes: VisualNode[];
        edges: VisualEdge[];
    };
    created_at?: string;
    updated_at?: string;
}

export const automationService = {
    async getAutomations(): Promise<PostAutomation[]> {
        const response = await apiClient.get<PostAutomation[]>("/automations");
        return response.data;
    },

    async createAutomation(data: PostAutomation): Promise<PostAutomation> {
        const response = await apiClient.post<PostAutomation>("/automations", data);
        return response.data;
    },

    async updateAutomation(id: number, data: PostAutomation): Promise<PostAutomation> {
        const response = await apiClient.put<PostAutomation>(`/automations/${id}`, data);
        return response.data;
    },

    async publishAutomation(id: number): Promise<PostAutomation> {
        const response = await apiClient.post<PostAutomation>(`/automations/${id}/publish`);
        return response.data;
    },
};

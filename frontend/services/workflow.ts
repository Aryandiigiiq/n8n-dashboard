import apiClient from "./api";

export interface WorkflowTemplate {
    id: number;
    workspace_id: number;
    name: string;
    description?: string;
    n8n_workflow_id?: string;
    workflow_json: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface WorkflowVariable {
    id: number;
    workspace_id: number;
    name: string;
    value: unknown;
    created_at: string;
    updated_at: string;
}

export interface WorkflowExecution {
    id: number;
    workspace_id: number;
    automation_id: number;
    n8n_execution_id?: string;
    status: string; // pending, running, success, failed
    trigger_type: string;
    input_payload?: Record<string, unknown>;
    output_payload?: Record<string, unknown>;
    created_at: string;
    finished_at?: string;
}

export const workflowService = {
    async getTemplates(): Promise<WorkflowTemplate[]> {
        const response = await apiClient.get<WorkflowTemplate[]>("/templates");
        return response.data;
    },

    async createTemplate(template: Partial<WorkflowTemplate>): Promise<WorkflowTemplate> {
        const response = await apiClient.post<WorkflowTemplate>("/templates", template);
        return response.data;
    },

    async triggerExecution(automationId: number, variables: Record<string, unknown>): Promise<WorkflowExecution> {
        const response = await apiClient.post<WorkflowExecution>("/executions", {
            automation_id: automationId,
            variables,
        });
        return response.data;
    },

    async getExecutions(): Promise<WorkflowExecution[]> {
        const response = await apiClient.get<WorkflowExecution[]>("/executions");
        return response.data;
    },

    async getVariables(): Promise<WorkflowVariable[]> {
        const response = await apiClient.get<WorkflowVariable[]>("/variables");
        return response.data;
    },

    async setVariable(name: string, value: unknown): Promise<WorkflowVariable> {
        const response = await apiClient.post<WorkflowVariable>("/variables", { name, value });
        return response.data;
    },
    async updateTemplate(id: number, template: Partial<WorkflowTemplate>): Promise<WorkflowTemplate> {
        const response = await apiClient.put<WorkflowTemplate>(`/templates/${id}`, template);
        return response.data;
    },

};

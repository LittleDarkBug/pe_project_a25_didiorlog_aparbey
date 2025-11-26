import { apiClient } from '@/app/lib/apiClient';

export interface CreateProjectDto {
    name: string;
    temp_file_id: string;
    mapping: Record<string, string>;
}

export interface Project {
    id: string;
    name: string;
    stats: any;
    created_at?: string;
    metadata?: any;
    graph_data?: any;
}

export const projectsService = {
    create: async (data: CreateProjectDto): Promise<Project> => {
        return apiClient.post<Project>('/projects/', data);
    },

    list: async (): Promise<Project[]> => {
        return apiClient.get<Project[]>('/projects/');
    },

    getById: async (id: string): Promise<Project> => {
        return apiClient.get<Project>(`/projects/${id}`);
    },

    delete: async (id: string): Promise<void> => {
        return apiClient.delete(`/projects/${id}`);
    }
};

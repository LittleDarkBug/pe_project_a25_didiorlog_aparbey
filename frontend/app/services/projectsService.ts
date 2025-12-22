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
    updated_at?: string;
    metadata?: any;
    graph_data?: any;
    mapping?: Record<string, string>;
}

export interface JobResponse {
    job_id: string;
    project_id: string;
}

export interface TaskStatus {
    status: 'PENDING' | 'STARTED' | 'SUCCESS' | 'FAILURE';
    result?: any;
    error?: string;
}

export const projectsService = {
    create: async (data: CreateProjectDto): Promise<JobResponse> => {
        return apiClient.post<JobResponse>('/projects/', data);
    },

    list: async (): Promise<Project[]> => {
        return apiClient.get<Project[]>('/projects/');
    },

    getById: async (id: string): Promise<Project> => {
        return apiClient.get<Project>(`/projects/${id}`);
    },

    update: async (id: string, data: Partial<CreateProjectDto>): Promise<JobResponse> => {
        return apiClient.put<JobResponse>(`/projects/${id}`, data);
    },

    getTaskStatus: async (job_id: string): Promise<TaskStatus> => {
        return apiClient.get<TaskStatus>(`/projects/tasks/${job_id}`);
    },

    delete: async (id: string): Promise<void> => {
        return apiClient.delete(`/projects/${id}`);
    }
};

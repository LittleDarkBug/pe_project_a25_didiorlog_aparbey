import { apiClient } from '@/app/lib/apiClient';

export interface CreateProjectPayload {
    file: File;
    name: string;
    description?: string;
    isPublic?: boolean;
    mapping?: Record<string, string>;
    algorithm?: string;
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
    create: async (payload: CreateProjectPayload): Promise<JobResponse> => {
        const formData = new FormData();
        formData.append('file', payload.file);
        formData.append('name', payload.name);

        if (payload.description) {
            formData.append('description', payload.description);
        }

        formData.append('is_public', payload.isPublic ? 'true' : 'false');

        if (payload.mapping && Object.keys(payload.mapping).length > 0) {
            formData.append('mapping', JSON.stringify(payload.mapping));
        }

        formData.append('algorithm', payload.algorithm || 'auto');

        return apiClient.post<JobResponse>('/projects/', formData);
    },

    list: async (): Promise<Project[]> => {
        return apiClient.get<Project[]>('/projects/');
    },

    getById: async (id: string): Promise<Project> => {
        return apiClient.get<Project>(`/projects/${id}`);
    },

    update: async (id: string, data: Partial<Omit<CreateProjectPayload, 'file'>>): Promise<JobResponse> => {
        return apiClient.put<JobResponse>(`/projects/${id}`, data);
    },

    getTaskStatus: async (job_id: string): Promise<TaskStatus> => {
        return apiClient.get<TaskStatus>(`/projects/tasks/${job_id}`);
    },

    delete: async (id: string): Promise<void> => {
        return apiClient.delete(`/projects/${id}`);
    }
};

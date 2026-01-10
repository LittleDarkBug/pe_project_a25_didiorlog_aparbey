import { apiClient } from '@/app/lib/apiClient';

export interface AdminStats {
    total_users: number;
    active_users: number;
    total_projects: number;
    public_projects: number;
}

export interface UserAdminView {
    id: string;
    email: string;
    full_name?: string;
    is_active: boolean;
    is_superuser: boolean;
    role: string;
    is_elite?: boolean;
    elite_request_status?: string;
    elite_request_date?: string;
    created_at: string;
    project_count: number;
}

export interface ProjectAdminView {
    id: string;
    name: string;
    description?: string;
    is_public: boolean;
    created_at: string;
    updated_at: string;
    owner_id: string;
    owner_email?: string;
    node_count: number;
    edge_count: number;
}

export interface UserUpdateData {
    is_active?: boolean;
    role?: string;
    is_elite?: boolean;
    elite_request_status?: string;
}

export interface UserCreateData {
    email: string;
    password: string;
    full_name?: string;
    role?: string;
    is_active?: boolean;
}

export const adminService = {
    getStats: async (): Promise<AdminStats> => {
        const response = await apiClient.get<AdminStats>('/admin/stats');
        return response;
    },

    getUsers: async (skip = 0, limit = 100, search = ''): Promise<UserAdminView[]> => {
        const params = new URLSearchParams({
            skip: skip.toString(),
            limit: limit.toString(),
            ...(search && { search })
        });
        const response = await apiClient.get<UserAdminView[]>(`/admin/users?${params}`);
        return response;
    },

    createUser: async (data: UserCreateData): Promise<UserAdminView> => {
        const response = await apiClient.post<UserAdminView>('/admin/users', data);
        return response;
    },

    updateUser: async (userId: string, data: UserUpdateData): Promise<UserAdminView> => {
        const response = await apiClient.patch<UserAdminView>(`/admin/users/${userId}`, data);
        return response;
    },

    deleteUser: async (userId: string): Promise<void> => {
        await apiClient.delete(`/admin/users/${userId}`);
    },

    getProjects: async (skip = 0, limit = 50, search = '', sortBy = 'created_at', sortOrder = 'desc', isPublic: boolean | undefined = undefined): Promise<ProjectAdminView[]> => {
        const params = new URLSearchParams({
            skip: skip.toString(),
            limit: limit.toString(),
            sort_by: sortBy,
            sort_order: sortOrder,
            ...(search && { search })
        });

        if (isPublic !== undefined) {
            params.append('is_public', isPublic.toString());
        }

        const response = await apiClient.get<ProjectAdminView[]>(`/admin/projects?${params}`);
        return response;
    },

    updateProject: async (projectId: string, data: { name?: string; description?: string; is_public?: boolean; }): Promise<ProjectAdminView> => {
        const response = await apiClient.patch<ProjectAdminView>(`/admin/projects/${projectId}`, data);
        return response;
    },

    deleteProject: async (projectId: string): Promise<void> => {
        await apiClient.delete(`/admin/projects/${projectId}`);
    }
};

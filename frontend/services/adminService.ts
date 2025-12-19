import apiClient from '@/app/lib/apiClient';

export interface AdminStats {
    total_users: number;
    total_projects: number;
    active_users: number;
    public_projects: number;
}

export interface UserAdminView {
    id: string;
    email: string;
    full_name: string | null;
    is_active: boolean;
    is_superuser: boolean;
    role: string;
    created_at: string;
    last_login: string | null;
}

export interface ProjectAdminView {
    id: string;
    name: string;
    owner_email: string | null;
    is_public: boolean;
    created_at: string;
    node_count: number;
    edge_count: number;
}

export const adminService = {
    getStats: async (): Promise<AdminStats> => {
        const response = await apiClient.get('/admin/stats');
        return response.data;
    },

    getUsers: async (skip = 0, limit = 50, search = ''): Promise<UserAdminView[]> => {
        const response = await apiClient.get('/admin/users', {
            params: { skip, limit, search }
        });
        return response.data;
    },

    updateUser: async (userId: string, data: { is_active?: boolean; role?: string }): Promise<UserAdminView> => {
        const response = await apiClient.patch(`/admin/users/${userId}`, data);
        return response.data;
    },

    deleteUser: async (userId: string): Promise<void> => {
        await apiClient.delete(`/admin/users/${userId}`);
    },

    getProjects: async (skip = 0, limit = 50, search = ''): Promise<ProjectAdminView[]> => {
        const response = await apiClient.get('/admin/projects', {
            params: { skip, limit, search }
        });
        return response.data;
    },

    deleteProject: async (projectId: string): Promise<void> => {
        await apiClient.delete(`/admin/projects/${projectId}`);
    }
};

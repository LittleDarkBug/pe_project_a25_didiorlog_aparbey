import { apiClient } from '@/app/lib/apiClient';

export interface ShareLinkResponse {
    token: string;
    expires_at: string;
    url: string;
}

export const shareService = {
    generateLink: async (projectId: string, expiresInDays: number = 7): Promise<ShareLinkResponse> => {
        return apiClient.post<ShareLinkResponse>('/share/generate', {
            project_id: projectId,
            expires_in_days: expiresInDays
        });
    },

    getSharedProject: async (token: string) => {
        return apiClient.get<any>(`/share/${token}`);
    }
};

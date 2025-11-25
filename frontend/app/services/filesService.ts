import { apiClient } from '@/app/lib/apiClient';

export interface AnalysisResult {
    type: string;
    columns: string[];
    preview: any[];
    suggestions: Record<string, string>;
    stats?: {
        node_count: number;
        edge_count: number;
        density: number;
        is_connected: boolean;
        sample_size: number;
    };
    temp_file_id: string;
    message?: string;  // Message d'erreur ou d'information
}

export const filesService = {
    analyze: async (file: File): Promise<AnalysisResult> => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post<AnalysisResult>('/files/analyze/', formData);
    }
};

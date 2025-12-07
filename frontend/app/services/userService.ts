import { apiClient } from '@/app/lib/apiClient';
import { API_ENDPOINTS } from '@/app/config/api';

/** Modèle utilisateur */
export interface User {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  is_active: boolean;
}

/** Données pour créer un utilisateur */
export interface CreateUserData {
  name: string;
  email: string;
  password: string;
}

/** Service pour les opérations CRUD sur les utilisateurs */
export const userService = {
  getMe: async (): Promise<User> => {
    return apiClient.get<User>(API_ENDPOINTS.USERS.ME);
  },
  updateMe: async (data: Partial<User>): Promise<User> => {
    return apiClient.patch<User>(API_ENDPOINTS.USERS.ME, data);
  },
  getAll: async (): Promise<User[]> => {
    return apiClient.get<User[]>(API_ENDPOINTS.USERS.BASE);
  },
  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(API_ENDPOINTS.USERS.BY_ID(id));
  },
};

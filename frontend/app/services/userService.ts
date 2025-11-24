import { apiClient } from '@/app/lib/apiClient';
import { API_ENDPOINTS } from '@/app/config/api';

/** Modèle utilisateur */
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

/** Données pour créer un utilisateur */
export interface CreateUserData {
  name: string;
  email: string;
  password: string;
}

/** Service pour les opérations CRUD sur les utilisateurs */
export const userService = {
  getAll: async (): Promise<User[]> => {
    return apiClient.get<User[]>(API_ENDPOINTS.USERS.BASE);
  },
  getById: async (id: string): Promise<User> => {
    return apiClient.get<User>(API_ENDPOINTS.USERS.BY_ID(id));
  },
  create: async (data: CreateUserData): Promise<User> => {
    return apiClient.post<User>(API_ENDPOINTS.USERS.BASE, data);
  },
  update: async (id: string, data: Partial<User>): Promise<User> => {
    return apiClient.patch<User>(API_ENDPOINTS.USERS.BY_ID(id), data);
  },
  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(API_ENDPOINTS.USERS.BY_ID(id));
  },
};

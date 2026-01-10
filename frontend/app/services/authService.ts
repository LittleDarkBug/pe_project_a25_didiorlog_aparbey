import { apiClient } from '@/app/lib/apiClient';
import { API_ENDPOINTS } from '@/app/config/api';
import { User } from './userService';

/**
 * Interface pour la requête de connexion
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Interface pour la requête d'inscription
 */
export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  request_elite?: boolean;
}

/**
 * Interface pour la réponse contenant les tokens
 */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Service d'authentification
 */
export const authService = {
  /**
   * Connecte un utilisateur
   * @param credentials Identifiants de connexion
   * @returns Tokens d'accès
   */
  login: async (credentials: LoginRequest): Promise<TokenResponse> => {
    return apiClient.post<TokenResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
  },

  /**
   * Inscrit un nouvel utilisateur
   * @param data Données d'inscription
   * @returns Utilisateur créé (sans token, nécessite connexion ensuite)
   */
  register: async (data: RegisterRequest): Promise<User> => {
    return apiClient.post<User>(API_ENDPOINTS.AUTH.REGISTER, data);
  },

  /**
   * Récupère l'utilisateur courant
   * @returns Utilisateur connecté
   */
  getCurrentUser: async (): Promise<User> => {
    return apiClient.get<User>('/users/me');
  },

  /**
   * Déconnecte l'utilisateur
   * Note: Le token doit être injecté via l'intercepteur ou le header
   */
  logout: async (): Promise<void> => {
    return apiClient.post<void>(API_ENDPOINTS.AUTH.LOGOUT, {});
  },

  /**
   * Rafraîchit le token d'accès
   * @param refreshToken Token de rafraîchissement
   * @returns Nouveaux tokens
   */
  refreshToken: async (refreshToken: string): Promise<TokenResponse> => {
    return apiClient.post<TokenResponse>(API_ENDPOINTS.AUTH.REFRESH, { refresh_token: refreshToken });
  },
};

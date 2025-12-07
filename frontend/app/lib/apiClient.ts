import { API_CONFIG } from '@/app/config/api';
import { getSession } from 'next-auth/react';

/** Options pour les requêtes fetch avec support timeout */
interface FetchOptions extends RequestInit {
  timeout?: number;
}

/** Erreur personnalisée pour les erreurs API avec status et data */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Client HTTP centralisé avec gestion des erreurs et timeout
 * Supporte GET, POST, PUT, PATCH, DELETE
 */
class ApiClient {
  private baseURL: string;
  private defaultTimeout: number;

  constructor(baseURL: string, timeout: number = API_CONFIG.TIMEOUT) {
    this.baseURL = baseURL;
    this.defaultTimeout = timeout;
  }

  private async request<T>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const { timeout = this.defaultTimeout, ...fetchOptions } = options;
    const url = `${this.baseURL}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const headers: HeadersInit = { ...fetchOptions.headers };

    // Ajouter le token d'authentification via NextAuth
    let token = null;
    try {
        if (typeof window !== 'undefined') {
            const session = await getSession();
            // @ts-ignore
            token = session?.user?.accessToken;
        }
    } catch (e) {
        console.error("Error getting session", e);
    }

    if (token) {
      // @ts-ignore
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Définir Content-Type à json uniquement si le body n'est PAS FormData
    if (!(fetchOptions.body instanceof FormData)) {
      // @ts-ignore
      headers['Content-Type'] = 'application/json';
    } else {
      // Laisser le navigateur définir Content-Type avec boundary pour FormData
      // @ts-ignore
      delete headers['Content-Type'];
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.detail || errorData.message || 'Une erreur est survenue',
          response.status,
          errorData
        );
      }

      // Handle 204 No Content or empty responses
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return undefined as T;
      }

      // Check if response has JSON content
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      // Return empty object for non-JSON responses
      return undefined as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('La requête a expiré');
      }

      throw new ApiError('Erreur réseau');
    }
  }

  /** Requête GET */
  async get<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /** Requête POST */
  async post<T>(endpoint: string, data?: unknown, options?: FetchOptions): Promise<T> {
    const isFormData = data instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: isFormData ? (data as BodyInit) : JSON.stringify(data),
    });
  }

  /** Requête PUT */
  async put<T>(endpoint: string, data?: unknown, options?: FetchOptions): Promise<T> {
    const isFormData = data instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: isFormData ? (data as BodyInit) : JSON.stringify(data),
    });
  }

  /** Requête PATCH */
  async patch<T>(endpoint: string, data?: unknown, options?: FetchOptions): Promise<T> {
    const isFormData = data instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: isFormData ? (data as BodyInit) : JSON.stringify(data),
    });
  }

  /** Requête DELETE */
  async delete<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

/** Instance globale du client API */
export const apiClient = new ApiClient(API_CONFIG.BASE_URL);

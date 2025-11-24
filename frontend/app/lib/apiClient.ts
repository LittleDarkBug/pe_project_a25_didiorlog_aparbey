import { API_CONFIG } from '@/app/config/api';

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

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || 'Une erreur est survenue',
          response.status,
          errorData
        );
      }

      return await response.json();
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
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /** Requête PUT */
  async put<T>(endpoint: string, data?: unknown, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /** Requête PATCH */
  async patch<T>(endpoint: string, data?: unknown, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /** Requête DELETE */
  async delete<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

/** Instance globale du client API */
export const apiClient = new ApiClient(API_CONFIG.BASE_URL);

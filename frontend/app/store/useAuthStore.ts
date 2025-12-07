import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/app/services/userService';
import { authService, LoginRequest, RegisterRequest } from '@/app/services/authService';

/**
 * État du store d'authentification
 */
interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (credentials: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => Promise<void>;
    setTokens: (accessToken: string, refreshToken: string) => void;
    setUser: (user: User | null) => void;
    fetchUser: () => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            fetchUser: async () => {
                try {
                    const user = await authService.getCurrentUser();
                    set({ user });
                } catch (error) {
                    console.error("Failed to fetch user", error);
                }
            },

            login: async (credentials) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await authService.login(credentials);

                    // Stocker les tokens
                    localStorage.setItem('access_token', response.access_token);
                    localStorage.setItem('refresh_token', response.refresh_token);

                    // Récupérer le profil utilisateur
                    const user = await authService.getCurrentUser();

                    set({
                        accessToken: response.access_token,
                        refreshToken: response.refresh_token,
                        user: user,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (err: any) {
                    set({
                        error: err.response?.data?.detail || 'Erreur de connexion',
                        isLoading: false
                    });
                    throw err;
                }
            },

            register: async (data) => {
                set({ isLoading: true, error: null });
                try {
                    await authService.register(data);
                    set({ isLoading: false });
                } catch (err: any) {
                    set({
                        error: err.response?.data?.detail || "Erreur d'inscription",
                        isLoading: false
                    });
                    throw err;
                }
            },

            logout: async () => {
                set({ isLoading: true });
                try {
                    console.log("[useAuthStore] Début du logout, token présent:", !!localStorage.getItem('access_token'));
                    // On tente le logout API mais on nettoie le store quoi qu'il arrive
                    await authService.logout();
                    console.log("[useAuthStore] Logout API réussi");
                } catch (err) {
                    console.error("Erreur lors du logout API", err);
                } finally {
                    // Nettoyer localStorage
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');

                    set({
                        user: null,
                        accessToken: null,
                        refreshToken: null,
                        isAuthenticated: false,
                        isLoading: false,
                        error: null
                    });
                    console.log("[useAuthStore] Store et localStorage nettoyés");

                    // Rediriger vers la homepage
                    if (typeof window !== 'undefined') {
                        window.location.href = '/';
                    }
                }
            },

            setTokens: (accessToken, refreshToken) => {
                set({ accessToken, refreshToken, isAuthenticated: !!accessToken });
            },

            setUser: (user) => {
                set({ user });
            },

            clearError: () => {
                set({ error: null });
            }
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
                user: state.user
            }),
        }
    )
);

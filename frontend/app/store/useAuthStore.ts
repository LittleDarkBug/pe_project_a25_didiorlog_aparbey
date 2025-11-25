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

            login: async (credentials) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await authService.login(credentials);
                    set({
                        accessToken: response.access_token,
                        refreshToken: response.refresh_token,
                        isAuthenticated: true,
                        isLoading: false,
                    });

                    // TODO: Fetch user profile after login if needed, 
                    // but for now we rely on the fact that we have the token.
                    // We might want to decode the token or fetch /users/me
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
                    // On tente le logout API mais on nettoie le store quoi qu'il arrive
                    await authService.logout();
                } catch (err) {
                    console.error("Erreur lors du logout API", err);
                } finally {
                    set({
                        user: null,
                        accessToken: null,
                        refreshToken: null,
                        isAuthenticated: false,
                        isLoading: false,
                        error: null
                    });
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

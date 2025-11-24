import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * Store global de l'application
 * Utilise devtools (Redux DevTools) et persist (localStorage)
 */
export interface AppState {
  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetState: () => void;
}

const initialState = {
  isLoading: false,
  error: null,
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        resetState: () => set(initialState),
      }),
      {
        name: 'app-storage',
        partialize: (state) => ({ error: state.error }),
      }
    ),
    { name: 'AppStore' }
  )
);

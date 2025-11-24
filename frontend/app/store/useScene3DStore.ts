import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/** Configuration pour les scènes 3D Babylon.js */
export interface Scene3DConfig {
  antialias: boolean;
  adaptToDeviceRatio: boolean;
  engineOptions: Record<string, unknown>;
}

/** Store pour gérer l'état et la configuration des scènes 3D */
export interface Scene3DState {
  config: Scene3DConfig;
  isSceneReady: boolean;
  activeSceneId: string | null;
  setConfig: (config: Partial<Scene3DConfig>) => void;
  setSceneReady: (ready: boolean) => void;
  setActiveScene: (sceneId: string | null) => void;
  resetConfig: () => void;
}

const defaultConfig: Scene3DConfig = {
  antialias: true,
  adaptToDeviceRatio: true,
  engineOptions: {},
};

export const useScene3DStore = create<Scene3DState>()(
  devtools(
    (set) => ({
      config: defaultConfig,
      isSceneReady: false,
      activeSceneId: null,
      
      setConfig: (newConfig) =>
        set((state) => ({
          config: { ...state.config, ...newConfig },
        })),
      
      setSceneReady: (ready) =>
        set({ isSceneReady: ready }),
      
      setActiveScene: (sceneId) =>
        set({ activeSceneId: sceneId }),
      
      resetConfig: () =>
        set({
          config: defaultConfig,
          isSceneReady: false,
          activeSceneId: null,
        }),
    }),
    { name: 'Scene3DStore' }
  )
);

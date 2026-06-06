'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemePref = 'light' | 'dark' | 'system';

/** Preferencias del usuario (equipo favorito, tema). Persistidas localmente. */
interface PreferencesState {
  version: number;
  favoriteTeamId: string | null;
  theme: ThemePref;
  setFavorite: (teamId: string | null) => void;
  setTheme: (theme: ThemePref) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      version: 1,
      favoriteTeamId: null,
      theme: 'system',
      setFavorite: (favoriteTeamId) => set({ favoriteTeamId }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'm26-preferences',
      version: 1,
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        version: s.version,
        favoriteTeamId: s.favoriteTeamId,
        theme: s.theme,
      }),
    },
  ),
);

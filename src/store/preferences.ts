'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemePref = 'light' | 'dark' | 'system';

/** Preferencias del usuario (equipo favorito, tema). Persistidas localmente. */
interface PreferencesState {
  version: number;
  favoriteTeamId: string | null;
  theme: ThemePref;
  /** Fecha (ISO) en que el usuario vio la guía de bienvenida. `null` = nunca. */
  onboardingSeenAt: string | null;
  setFavorite: (teamId: string | null) => void;
  setTheme: (theme: ThemePref) => void;
  /** Marca la guía de bienvenida como vista (idempotente). */
  markOnboardingSeen: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      version: 1,
      favoriteTeamId: null,
      theme: 'system',
      onboardingSeenAt: null,
      setFavorite: (favoriteTeamId) => set({ favoriteTeamId }),
      setTheme: (theme) => set({ theme }),
      markOnboardingSeen: () => {
        if (get().onboardingSeenAt) return;
        set({ onboardingSeenAt: new Date().toISOString() });
      },
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
        onboardingSeenAt: s.onboardingSeenAt,
      }),
    },
  ),
);

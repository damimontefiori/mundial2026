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
  /** Veces que se abrió la app (para sugerencias ocasionales de instalar/login). */
  launchCount: number;
  setFavorite: (teamId: string | null) => void;
  setTheme: (theme: ThemePref) => void;
  /** Marca la guía de bienvenida como vista (idempotente). */
  markOnboardingSeen: () => void;
  /** Suma 1 a `launchCount` (llamar una vez por apertura, tras hidratar). */
  registerLaunch: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      version: 1,
      favoriteTeamId: 'ARG', // por defecto, Argentina (el usuario puede cambiarlo)
      theme: 'system',
      onboardingSeenAt: null,
      launchCount: 0,
      setFavorite: (favoriteTeamId) => set({ favoriteTeamId }),
      setTheme: (theme) => set({ theme }),
      markOnboardingSeen: () => {
        if (get().onboardingSeenAt) return;
        set({ onboardingSeenAt: new Date().toISOString() });
      },
      registerLaunch: () => set((s) => ({ launchCount: s.launchCount + 1 })),
    }),
    {
      name: 'm26-preferences',
      version: 2,
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      // v2: el favorito por defecto pasa a ser Argentina. A quien nunca eligió uno
      // (favoriteTeamId null) se lo seteamos a 'ARG'; respeta a quien ya eligió otro.
      migrate: (persisted) => {
        const s = (persisted ?? {}) as Partial<PreferencesState>;
        return { ...s, favoriteTeamId: s.favoriteTeamId ?? 'ARG' } as PreferencesState;
      },
      partialize: (s) => ({
        version: s.version,
        favoriteTeamId: s.favoriteTeamId,
        theme: s.theme,
        onboardingSeenAt: s.onboardingSeenAt,
        launchCount: s.launchCount,
      }),
    },
  ),
);

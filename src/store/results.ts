'use client';

import { create } from 'zustand';
import type { OfficialResult, OfficialResultsFile } from '@/types';

/**
 * Resultados REALES del torneo, servidos como archivo estático `public/results.json`
 * y regenerados por un job programado (ver `.github/workflows/update-results.yml`).
 *
 * No se persiste: se busca en cada carga (el service worker cachea el archivo para
 * que funcione offline con el último valor conocido).
 */
interface ResultsState {
  official: Record<string, OfficialResult>;
  updatedAt: string | null;
  loaded: boolean;
  load: () => Promise<void>;
}

export const useResultsStore = create<ResultsState>((set, get) => ({
  official: {},
  updatedAt: null,
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    try {
      // cache: 'no-cache' → revalida con el SW/servidor sin romper el offline.
      const res = await fetch('/results.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`results.json ${res.status}`);
      const data = (await res.json()) as OfficialResultsFile;
      set({
        official: data.results ?? {},
        updatedAt: data.updatedAt ?? null,
        loaded: true,
      });
    } catch {
      // Sin resultados (offline en primera carga o archivo ausente): la app sigue
      // funcionando 100% con la simulación del usuario.
      set({ loaded: true });
    }
  },
}));

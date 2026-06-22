'use client';

import { create } from 'zustand';
import type { AwardsFile, ScorerEntry } from '@/types';

/**
 * Premios del torneo, servidos como archivo estático `public/awards.json` y
 * regenerados por el mismo job que `results.json` (ver `scripts/fetch-results.ts`).
 * Solo trae los goleadores (lo único nuevo de la API); el resto de los premios se
 * derivan en el cliente desde los resultados. Espejo de `store/results.ts`.
 */
interface AwardsState {
  scorers: ScorerEntry[];
  updatedAt: string | null;
  loaded: boolean;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
}

// Una sola petición en vuelo (igual que en results store).
let inflight: Promise<void> | null = null;

export const useAwardsStore = create<AwardsState>((set, get) => ({
  scorers: [],
  updatedAt: null,
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    await get().refresh();
  },

  refresh: async () => {
    if (inflight) return inflight;
    inflight = (async () => {
      try {
        const res = await fetch('/awards.json', { cache: 'no-cache' });
        if (!res.ok) throw new Error(`awards.json ${res.status}`);
        const data = (await res.json()) as AwardsFile;
        const scorers = data.scorers ?? [];
        // No degradar estado bueno: un 200 con `scorers` vacío (semilla o hipo de la
        // API/CI) no debe borrar lo ya cargado; a lo sumo refrescamos la fecha.
        if (scorers.length === 0 && get().scorers.length > 0) {
          set({ updatedAt: data.updatedAt ?? get().updatedAt, loaded: true });
          return;
        }
        set({ scorers, updatedAt: data.updatedAt ?? null, loaded: true });
      } catch {
        // Sin premios (offline o archivo ausente): la app sigue funcionando.
        set({ loaded: true });
      } finally {
        inflight = null;
      }
    })();
    return inflight;
  },
}));

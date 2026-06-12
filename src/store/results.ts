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
  /** Carga inicial (una sola vez por sesión). */
  load: () => Promise<void>;
  /** Vuelve a traer results.json ignorando el guard (foco/visibilidad/intervalo). */
  refresh: () => Promise<void>;
}

// Una sola petición en vuelo: foco + visibilitychange (y load() inicial) suelen
// dispararse casi juntos; reusamos la promesa para no lanzar fetches duplicados.
let inflight: Promise<void> | null = null;

export const useResultsStore = create<ResultsState>((set, get) => ({
  official: {},
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
        // cache: 'no-cache' → revalida con el SW/servidor sin romper el offline.
        const res = await fetch('/results.json', { cache: 'no-cache' });
        if (!res.ok) throw new Error(`results.json ${res.status}`);
        const data = (await res.json()) as OfficialResultsFile;
        const results = data.results ?? {};
        // No degradar estado bueno: un 200 con `results` vacío (la semilla del archivo,
        // o un hipo transitorio de la API/CI) NO debe borrar lo ya cargado ni desbloquear
        // partidos jugados. Conservamos lo previo y, a lo sumo, refrescamos la fecha.
        if (Object.keys(results).length === 0 && Object.keys(get().official).length > 0) {
          set({ updatedAt: data.updatedAt ?? get().updatedAt, loaded: true });
          return;
        }
        set({ official: results, updatedAt: data.updatedAt ?? null, loaded: true });
      } catch {
        // Sin resultados (offline en primera carga o archivo ausente): la app sigue
        // funcionando 100% con la simulación del usuario.
        set({ loaded: true });
      } finally {
        inflight = null;
      }
    })();
    return inflight;
  },
}));

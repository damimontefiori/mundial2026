'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { GroupResult, OfficialResult } from '@/types';
import { projectSimulation } from '@/lib/predict';

/**
 * Estado de la simulación del usuario (local-first, persistido en localStorage).
 * - groupResults: marcador cargado para cada partido de grupos.
 * - knockoutPicks: equipo elegido como ganador en cada cruce de eliminatorias.
 *
 * Este shape mapea 1:1 al futuro modelo del Prode en Supabase (ver docs/DATA_MODEL.md).
 */
interface SimulationState {
  /** Versión del esquema para migraciones futuras de localStorage. */
  version: number;
  groupResults: Record<string, GroupResult>;
  knockoutPicks: Record<string, string>;
  setGroupResult: (matchId: string, result: GroupResult) => void;
  clearGroupResult: (matchId: string) => void;
  setPick: (matchId: string, teamId: string) => void;
  clearPick: (matchId: string) => void;
  resetGroups: () => void;
  resetKnockout: () => void;
  resetAll: () => void;
  /**
   * Completa lo que falte con la PROYECCIÓN del modelo predictivo (ver `src/lib/predict.ts`):
   * el marcador más probable según Ataque/Defensa (Poisson) y el ganador proyectado de
   * cada cruce. Es determinística (no usa azar) y respeta tanto los resultados reales
   * (`official`, no editables) como lo que el usuario ya cargó a mano.
   */
  simulateRest: (official?: Record<string, OfficialResult>) => void;
}

export const useSimulationStore = create<SimulationState>()(
  persist(
    (set, get) => ({
      version: 1,
      groupResults: {},
      knockoutPicks: {},

      setGroupResult: (matchId, result) =>
        set((s) => ({ groupResults: { ...s.groupResults, [matchId]: result } })),

      clearGroupResult: (matchId) =>
        set((s) => {
          const next = { ...s.groupResults };
          delete next[matchId];
          return { groupResults: next };
        }),

      setPick: (matchId, teamId) =>
        set((s) => ({ knockoutPicks: { ...s.knockoutPicks, [matchId]: teamId } })),

      clearPick: (matchId) =>
        set((s) => {
          const next = { ...s.knockoutPicks };
          delete next[matchId];
          return { knockoutPicks: next };
        }),

      resetGroups: () => set({ groupResults: {}, knockoutPicks: {} }),
      resetKnockout: () => set({ knockoutPicks: {} }),
      resetAll: () => set({ groupResults: {}, knockoutPicks: {} }),

      simulateRest: (official = {}) => {
        const { groupResults, knockoutPicks } = projectSimulation(
          get().groupResults,
          get().knockoutPicks,
          official,
        );
        set({ groupResults, knockoutPicks });
      },
    }),
    {
      name: 'm26-simulation',
      version: 1,
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        version: s.version,
        groupResults: s.groupResults,
        knockoutPicks: s.knockoutPicks,
      }),
    },
  ),
);

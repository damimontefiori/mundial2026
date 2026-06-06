'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { GroupResult, OfficialResult } from '@/types';
import { computeBracket } from '@/lib/bracket';
import { mergeOfficial } from '@/lib/officialResults';
import { groupStageMatches, knockoutStageMatches } from '@/data/matches';

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
   * Completa lo que falte con resultados aleatorios y define la llave entera.
   * Respeta los resultados reales (`official`): no toca los partidos ya jugados.
   */
  simulateRest: (official?: Record<string, OfficialResult>) => void;
}

const randomGoals = (): number => Math.floor(Math.random() * 4);

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
        const { locked } = mergeOfficial(get().groupResults, get().knockoutPicks, official);

        // 1) Completar al azar los partidos de grupos faltantes (sin tocar los reales).
        const userGroup = { ...get().groupResults };
        for (const m of groupStageMatches) {
          if (locked.has(m.id)) continue;
          if (!userGroup[m.id]) {
            userGroup[m.id] = { homeGoals: randomGoals(), awayGoals: randomGoals() };
          }
        }

        // 2) Elegir ganadores al azar para los cruces no jugados, resolviendo la
        //    llave con los resultados efectivos (usuario + reales) en cada pasada.
        const userPicks = { ...get().knockoutPicks };
        for (let iter = 0; iter < 8; iter++) {
          const { groupResults, picks } = mergeOfficial(userGroup, userPicks, official);
          const view = computeBracket(groupResults, picks);
          for (const m of knockoutStageMatches) {
            if (locked.has(m.id)) continue;
            const r = view.knockout[m.id];
            if (r.homeTeamId && r.awayTeamId && !userPicks[m.id]) {
              userPicks[m.id] = Math.random() < 0.5 ? r.homeTeamId : r.awayTeamId;
            }
          }
        }

        set({ groupResults: userGroup, knockoutPicks: userPicks });
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

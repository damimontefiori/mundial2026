import type { GroupResult, OfficialResult } from '@/types';
import { matchesById } from '@/data/matches';

/**
 * Combina los resultados REALES (oficiales, ya jugados) con la simulación del
 * usuario. Los partidos oficiales FINISHED tienen prioridad y quedan "bloqueados"
 * (no editables); el resto sigue siendo lo que simula el usuario.
 *
 * Es código puro (sin React) para poder testearlo y reutilizarlo en el store.
 */
export interface EffectiveSimulation {
  /** Resultados de grupos efectivos (usuario + oficiales jugados). */
  groupResults: Record<string, GroupResult>;
  /** Picks de eliminatorias efectivos (usuario + ganadores oficiales). */
  picks: Record<string, string>;
  /** Ids de partidos con resultado real (no editables por el usuario). */
  locked: Set<string>;
}

export function mergeOfficial(
  userGroupResults: Record<string, GroupResult>,
  userPicks: Record<string, string>,
  official: Record<string, OfficialResult>,
): EffectiveSimulation {
  const groupResults = { ...userGroupResults };
  const picks = { ...userPicks };
  const locked = new Set<string>();

  for (const [id, r] of Object.entries(official)) {
    if (r.status !== 'FINISHED') continue;
    const match = matchesById[id];
    if (!match) continue;
    if (match.stage === 'group') {
      groupResults[id] = { homeGoals: r.homeGoals, awayGoals: r.awayGoals };
      locked.add(id);
    } else if (r.winnerCode) {
      // En eliminatorias, el "pick" es el equipo que avanzó. computeBracket lo
      // valida contra los equipos resueltos del cruce, así que basta el id.
      picks[id] = r.winnerCode;
      locked.add(id);
    }
  }

  return { groupResults, picks, locked };
}

/** true si hay al menos un resultado real cargado (para mostrar avisos en la UI). */
export function hasOfficialResults(official: Record<string, OfficialResult>): boolean {
  return Object.values(official).some((r) => r.status === 'FINISHED');
}

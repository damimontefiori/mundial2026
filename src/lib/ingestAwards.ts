import type { ScorerEntry } from '@/types';
import { resolveTeamId, type ApiTeamLite } from '@/lib/ingestApiResults';

/**
 * Mapea la respuesta de `/competitions/WC/scorers` (football-data.org v4) a nuestro
 * `ScorerEntry[]`: resuelve el equipo a NUESTRO id (reusa `resolveTeamId`) y ordena
 * el ranking del Botín de Oro. Código puro y testeable; lo usa `fetch-results.ts`.
 */

export interface ApiScorer {
  player?: {
    name?: string;
    nationality?: string | null;
    dateOfBirth?: string | null;
  };
  team?: ApiTeamLite;
  goals?: number | null;
  assists?: number | null;
  playedMatches?: number | null;
}

/** Desempates del Botín de Oro: goles ↓, asistencias ↓, menos PJ ↑, nombre. */
export function buildScorers(apiScorers: ApiScorer[] | undefined): ScorerEntry[] {
  const list: ScorerEntry[] = (apiScorers ?? [])
    .filter((s): s is ApiScorer & { player: { name: string } } => Boolean(s.player?.name))
    .map((s) => ({
      playerName: s.player.name,
      teamId: resolveTeamId(s.team),
      teamName: s.team?.name ?? '',
      nationality: s.player.nationality ?? null,
      dateOfBirth: s.player.dateOfBirth ?? null,
      goals: s.goals ?? 0,
      assists: typeof s.assists === 'number' ? s.assists : null,
      playedMatches: s.playedMatches ?? 0,
    }));

  return list.sort(
    (a, b) =>
      b.goals - a.goals ||
      (b.assists ?? 0) - (a.assists ?? 0) ||
      a.playedMatches - b.playedMatches ||
      a.playerName.localeCompare(b.playerName),
  );
}

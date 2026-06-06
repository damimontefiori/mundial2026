import type { GroupId, GroupResult, StandingRow } from '@/types';
import { groupsById } from '@/data/groups';
import { matchesOfGroup } from '@/data/matches';

/**
 * Cálculo de la tabla de posiciones de un grupo a partir de los resultados
 * simulados por el usuario. Implementa los criterios de desempate de FIFA:
 *
 *   1) Puntos                     4) Puntos entre los empatados (H2H)
 *   2) Diferencia de gol          5) DG entre los empatados
 *   3) Goles a favor              6) GF entre los empatados
 *   7) (fair play / sorteo) → desempate determinístico por id de equipo.
 */

function emptyRow(teamId: string, group: GroupId): StandingRow {
  return {
    teamId,
    group,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  };
}

function applyResult(home: StandingRow, away: StandingRow, hg: number, ag: number): void {
  home.played += 1;
  away.played += 1;
  home.goalsFor += hg;
  home.goalsAgainst += ag;
  away.goalsFor += ag;
  away.goalsAgainst += hg;
  home.goalDifference = home.goalsFor - home.goalsAgainst;
  away.goalDifference = away.goalsFor - away.goalsAgainst;
  if (hg > ag) {
    home.won += 1;
    home.points += 3;
    away.lost += 1;
  } else if (hg < ag) {
    away.won += 1;
    away.points += 3;
    home.lost += 1;
  } else {
    home.drawn += 1;
    away.drawn += 1;
    home.points += 1;
    away.points += 1;
  }
}

function compareOverall(a: StandingRow, b: StandingRow): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
  return 0;
}

function sameOverall(a: StandingRow, b: StandingRow): boolean {
  return (
    a.points === b.points && a.goalDifference === b.goalDifference && a.goalsFor === b.goalsFor
  );
}

interface Mini {
  points: number;
  gd: number;
  gf: number;
}

/** Desempata un conjunto de equipos igualados usando solo los partidos entre ellos. */
function breakTie(
  tied: StandingRow[],
  groupId: GroupId,
  results: Record<string, GroupResult>,
): StandingRow[] {
  const ids = new Set(tied.map((r) => r.teamId));
  const mini = new Map<string, Mini>();
  tied.forEach((r) => mini.set(r.teamId, { points: 0, gd: 0, gf: 0 }));

  for (const m of matchesOfGroup(groupId)) {
    if (m.home.kind !== 'team' || m.away.kind !== 'team') continue;
    if (!ids.has(m.home.teamId) || !ids.has(m.away.teamId)) continue;
    const r = results[m.id];
    if (!r) continue;
    const h = mini.get(m.home.teamId)!;
    const a = mini.get(m.away.teamId)!;
    h.gf += r.homeGoals;
    a.gf += r.awayGoals;
    h.gd += r.homeGoals - r.awayGoals;
    a.gd += r.awayGoals - r.homeGoals;
    if (r.homeGoals > r.awayGoals) h.points += 3;
    else if (r.homeGoals < r.awayGoals) a.points += 3;
    else {
      h.points += 1;
      a.points += 1;
    }
  }

  return [...tied].sort((x, y) => {
    const mx = mini.get(x.teamId)!;
    const my = mini.get(y.teamId)!;
    if (my.points !== mx.points) return my.points - mx.points;
    if (my.gd !== mx.gd) return my.gd - mx.gd;
    if (my.gf !== mx.gf) return my.gf - mx.gf;
    return x.teamId.localeCompare(y.teamId);
  });
}

/** Calcula la tabla de un grupo. Asigna `rank` 1..4 a cada fila. */
export function computeGroupStandings(
  groupId: GroupId,
  results: Record<string, GroupResult>,
): StandingRow[] {
  const group = groupsById[groupId];
  const rows = new Map<string, StandingRow>();
  group.teamIds.forEach((t) => rows.set(t, emptyRow(t, groupId)));

  for (const m of matchesOfGroup(groupId)) {
    if (m.home.kind !== 'team' || m.away.kind !== 'team') continue;
    const r = results[m.id];
    if (!r) continue;
    applyResult(rows.get(m.home.teamId)!, rows.get(m.away.teamId)!, r.homeGoals, r.awayGoals);
  }

  const list = [...rows.values()];
  list.sort(compareOverall);

  // Romper empates por grupos de filas iguales en (pts, DG, GF).
  let i = 0;
  while (i < list.length) {
    let j = i + 1;
    while (j < list.length && sameOverall(list[i], list[j])) j += 1;
    if (j - i > 1) {
      const ordered = breakTie(list.slice(i, j), groupId, results);
      for (let k = 0; k < ordered.length; k++) list[i + k] = ordered[k];
    }
    i = j;
  }

  list.forEach((row, idx) => {
    row.rank = idx + 1;
  });
  return list;
}

/** true si los 6 partidos del grupo tienen resultado cargado. */
export function isGroupComplete(groupId: GroupId, results: Record<string, GroupResult>): boolean {
  return matchesOfGroup(groupId).every((m) => results[m.id] !== undefined);
}

/** Cantidad de partidos con resultado cargado en un grupo (0..6). */
export function groupProgress(groupId: GroupId, results: Record<string, GroupResult>): number {
  return matchesOfGroup(groupId).filter((m) => results[m.id] !== undefined).length;
}

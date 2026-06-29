import type { GroupId, StandingRow } from '@/types';
import { GROUP_IDS } from '@/types';
import { knockoutStageMatches } from '@/data/matches';
import { computeGroupStandings, isGroupComplete } from './standings';

/**
 * Lógica de la llave (eliminatorias).
 *
 * A partir de los resultados de grupos (cargados por el usuario) y de los
 * "picks" de ganadores en eliminatorias, resuelve todos los cruces:
 *   - posiciones de cada grupo,
 *   - ranking de los 12 terceros y los 8 mejores que clasifican,
 *   - asignación de cada tercero a su cupo de R32 (evitando revanchas de grupo),
 *   - progresión R32 → R16 → Cuartos → Semis → Final.
 *
 * Es código puro (sin React) y está cubierto por tests.
 */

export interface KnockoutResolved {
  homeTeamId: string | null;
  awayTeamId: string | null;
  winnerTeamId: string | null;
}

export interface BracketView {
  standings: Record<GroupId, StandingRow[]>;
  groupComplete: Record<GroupId, boolean>;
  allGroupsComplete: boolean;
  /** Los 12 terceros ordenados (mejor primero). */
  thirdRanking: StandingRow[];
  /** Letras de grupo de los 8 mejores terceros (solo si todos los grupos están completos). */
  qualifiedThirdGroups: GroupId[];
  /** matchId de R32 → grupo cuyo 3.º juega ese cupo. */
  thirdAllocation: Record<string, GroupId>;
  /** matchId → equipos resueltos y ganador (si fue elegido). */
  knockout: Record<string, KnockoutResolved>;
}

type Slot = (typeof knockoutStageMatches)[number]['home'];

interface ThirdSlot {
  matchId: string;
  allowed: GroupId[];
}

const OFFICIAL_THIRD_ALLOCATIONS: Record<string, Record<string, GroupId>> = {
  BDEFIJKL: {
    M74: 'D',
    M77: 'F',
    M79: 'E',
    M80: 'K',
    M81: 'B',
    M82: 'I',
    M85: 'J',
    M87: 'L',
  },
};

function thirdGroupKey(groups: readonly GroupId[]): string {
  return [...groups].sort().join('');
}

function officialThirdAllocation(
  qualifiedGroups: GroupId[],
  slots: ThirdSlot[],
): Record<string, GroupId> | null {
  const allocation = OFFICIAL_THIRD_ALLOCATIONS[thirdGroupKey(qualifiedGroups)];
  if (!allocation) return null;

  const slotById = new Map(slots.map((slot) => [slot.matchId, slot]));
  const used = new Set<GroupId>();
  for (const slot of slots) {
    const group = allocation[slot.matchId];
    if (!group || used.has(group) || !qualifiedGroups.includes(group)) return null;
    if (!slotById.get(slot.matchId)?.allowed.includes(group)) return null;
    used.add(group);
  }

  return { ...allocation };
}

/** Cupos de R32 reservados para mejores terceros (lado visitante en la data). */
function thirdSlots(): ThirdSlot[] {
  const slots: ThirdSlot[] = [];
  for (const m of knockoutStageMatches) {
    if (m.away.kind === 'thirdFrom') slots.push({ matchId: m.id, allowed: m.away.groups });
    if (m.home.kind === 'thirdFrom') slots.push({ matchId: m.id, allowed: m.home.groups });
  }
  return slots;
}

function sortThirds(thirds: StandingRow[]): StandingRow[] {
  return [...thirds].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.group.localeCompare(b.group);
  });
}

/**
 * Asigna los grupos de los 8 terceros clasificados a los 8 cupos de R32.
 * Cada cupo admite solo ciertos grupos (no el del rival → evita revancha).
 * Usa backtracking determinístico; siempre existe una asignación válida.
 */
export function allocateThirds(
  qualifiedGroups: GroupId[],
  slots: ThirdSlot[],
): Record<string, GroupId> | null {
  const official = officialThirdAllocation(qualifiedGroups, slots);
  if (official) return official;

  const assignment: Record<string, GroupId> = {};
  const used = new Set<GroupId>();

  function backtrack(i: number): boolean {
    if (i === slots.length) return true;
    const slot = slots[i];
    for (const g of qualifiedGroups) {
      if (used.has(g)) continue;
      if (!slot.allowed.includes(g)) continue;
      assignment[slot.matchId] = g;
      used.add(g);
      if (backtrack(i + 1)) return true;
      used.delete(g);
      delete assignment[slot.matchId];
    }
    return false;
  }

  return backtrack(0) ? assignment : null;
}

function resolveKnockout(
  standings: Record<GroupId, StandingRow[]>,
  groupComplete: Record<GroupId, boolean>,
  thirdAllocation: Record<string, GroupId>,
  picks: Record<string, string>,
): Record<string, KnockoutResolved> {
  const resolved: Record<string, KnockoutResolved> = {};
  const winners: Record<string, string | null> = {};

  const teamAt = (rows: StandingRow[], rank: number): string | null =>
    rows.find((r) => r.rank === rank)?.teamId ?? null;

  function resolveSlot(slot: Slot, matchId: string): string | null {
    switch (slot.kind) {
      case 'team':
        return slot.teamId;
      case 'groupWinner':
        return groupComplete[slot.group] ? teamAt(standings[slot.group], 1) : null;
      case 'groupRunnerUp':
        return groupComplete[slot.group] ? teamAt(standings[slot.group], 2) : null;
      case 'thirdFrom': {
        const g = thirdAllocation[matchId];
        if (!g || !groupComplete[g]) return null;
        return teamAt(standings[g], 3);
      }
      case 'winnerOf':
        return winners[slot.matchId] ?? null;
      case 'loserOf': {
        const w = winners[slot.matchId];
        const src = resolved[slot.matchId];
        if (!w || !src || !src.homeTeamId || !src.awayTeamId) return null;
        return w === src.homeTeamId ? src.awayTeamId : src.homeTeamId;
      }
      default:
        return null;
    }
  }

  // Procesar en orden de número garantiza que winnerOf/loserOf ya están resueltos.
  for (const m of knockoutStageMatches) {
    const homeTeamId = resolveSlot(m.home, m.id);
    const awayTeamId = resolveSlot(m.away, m.id);
    const pick = picks[m.id];
    const winnerTeamId = pick && (pick === homeTeamId || pick === awayTeamId) ? pick : null;
    resolved[m.id] = { homeTeamId, awayTeamId, winnerTeamId };
    winners[m.id] = winnerTeamId;
  }

  return resolved;
}

/** Construye la vista completa de la llave a partir del estado de simulación. */
export function computeBracket(
  results: Record<string, { homeGoals: number; awayGoals: number }>,
  picks: Record<string, string>,
): BracketView {
  const standings = {} as Record<GroupId, StandingRow[]>;
  const groupComplete = {} as Record<GroupId, boolean>;
  let allGroupsComplete = true;

  for (const g of GROUP_IDS) {
    standings[g] = computeGroupStandings(g, results);
    groupComplete[g] = isGroupComplete(g, results);
    if (!groupComplete[g]) allGroupsComplete = false;
  }

  const thirds = GROUP_IDS.map((g) => standings[g].find((r) => r.rank === 3)).filter(
    (r): r is StandingRow => Boolean(r),
  );
  const thirdRanking = sortThirds(thirds);
  const qualifiedThirdGroups = allGroupsComplete
    ? thirdRanking.slice(0, 8).map((r) => r.group)
    : [];

  const thirdAllocation = allGroupsComplete
    ? (allocateThirds(qualifiedThirdGroups, thirdSlots()) ?? {})
    : {};

  const knockout = resolveKnockout(standings, groupComplete, thirdAllocation, picks);

  return {
    standings,
    groupComplete,
    allGroupsComplete,
    thirdRanking,
    qualifiedThirdGroups,
    thirdAllocation,
    knockout,
  };
}

/** Devuelve el id del campeón si la final fue resuelta y elegida. */
export function championOf(view: BracketView): string | null {
  return view.knockout['M104']?.winnerTeamId ?? null;
}

import type { Match, MatchSlot } from '@/types';
import type { BracketView } from '@/lib/bracket';
import { matchesById } from '@/data/matches';
import { teamsById } from '@/data/teams';

/** Texto del cupo cuando todavía no hay un equipo concreto. */
export function placeholderForSlot(slot: MatchSlot): string {
  switch (slot.kind) {
    case 'team':
      return teamsById[slot.teamId]?.name ?? slot.teamId;
    case 'groupWinner':
      return `1.º Grupo ${slot.group}`;
    case 'groupRunnerUp':
      return `2.º Grupo ${slot.group}`;
    case 'thirdFrom':
      return 'Mejor 3.º';
    case 'winnerOf':
      return `Ganador P${matchesById[slot.matchId]?.number ?? '?'}`;
    case 'loserOf':
      return `Perdedor P${matchesById[slot.matchId]?.number ?? '?'}`;
    default:
      return 'A definir';
  }
}

export interface SideInfo {
  teamId: string | null;
  label: string;
}

/** Resuelve un lado del partido a un equipo concreto (si se conoce) o a su placeholder. */
export function sideInfo(match: Match, side: 'home' | 'away', view: BracketView): SideInfo {
  const slot = match[side];
  if (slot.kind === 'team') {
    return { teamId: slot.teamId, label: teamsById[slot.teamId]?.name ?? slot.teamId };
  }
  const resolved = view.knockout[match.id];
  const teamId = resolved ? (side === 'home' ? resolved.homeTeamId : resolved.awayTeamId) : null;
  return {
    teamId,
    label: teamId ? (teamsById[teamId]?.name ?? teamId) : placeholderForSlot(slot),
  };
}

/** true si el equipo favorito participa (o podría participar) en el partido. */
export function involvesFavorite(
  match: Match,
  view: BracketView,
  favoriteId: string | null,
): boolean {
  if (!favoriteId) return false;
  const home = sideInfo(match, 'home', view);
  const away = sideInfo(match, 'away', view);
  return home.teamId === favoriteId || away.teamId === favoriteId;
}

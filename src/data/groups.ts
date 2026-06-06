import type { Group, GroupId } from '@/types';

/**
 * Los 12 grupos (A–L) del Mundial 2026 según el sorteo oficial
 * (Washington D.C., 5 de diciembre de 2025).
 *
 * El orden dentro de cada grupo es la posición oficial (1.º = cabeza de serie
 * del Bombo 1). Anfitriones: México (A1), Canadá (B1), EE.UU. (D1).
 * Ver docs/DATA_SOURCES.md.
 */
export const groups: Group[] = [
  { id: 'A', teamIds: ['MEX', 'RSA', 'KOR', 'CZE'] },
  { id: 'B', teamIds: ['CAN', 'BIH', 'QAT', 'SUI'] },
  { id: 'C', teamIds: ['BRA', 'MAR', 'HAI', 'SCO'] },
  { id: 'D', teamIds: ['USA', 'PAR', 'AUS', 'TUR'] },
  { id: 'E', teamIds: ['GER', 'CUW', 'CIV', 'ECU'] },
  { id: 'F', teamIds: ['NED', 'JPN', 'SWE', 'TUN'] },
  { id: 'G', teamIds: ['BEL', 'EGY', 'IRN', 'NZL'] },
  { id: 'H', teamIds: ['ESP', 'CPV', 'KSA', 'URU'] },
  { id: 'I', teamIds: ['FRA', 'SEN', 'IRQ', 'NOR'] },
  { id: 'J', teamIds: ['ARG', 'ALG', 'AUT', 'JOR'] },
  { id: 'K', teamIds: ['POR', 'COD', 'UZB', 'COL'] },
  { id: 'L', teamIds: ['ENG', 'CRO', 'GHA', 'PAN'] },
];

export const groupsById: Record<GroupId, Group> = Object.fromEntries(
  groups.map((g) => [g.id, g]),
) as Record<GroupId, Group>;

export function getGroup(id: GroupId): Group {
  return groupsById[id];
}

/** Devuelve el grupo al que pertenece un equipo. */
export function groupOfTeam(teamId: string): GroupId | undefined {
  return groups.find((g) => g.teamIds.includes(teamId))?.id;
}

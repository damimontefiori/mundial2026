import type { GroupId, Match, MatchSlot, Stage } from '@/types';

/**
 * Calendario completo del Mundial 2026: 104 partidos.
 * - 72 de fase de grupos (12 grupos × 6).
 * - 16 Dieciseisavos (R32), 8 Octavos (R16), 4 Cuartos, 2 Semis, 1 Tercer puesto, 1 Final.
 *
 * Datos del calendario oficial FIFA confirmado tras el sorteo (6 de diciembre de
 * 2025): enfrentamientos, fechas, horarios y sedes reales. La numeración 1..104
 * es la oficial. Ver docs/DATA_SOURCES.md.
 *
 * Cada partido se define con su hora LOCAL de la sede y el huso horario de esa
 * fecha (con horario de verano), y se guarda como UTC ISO 8601. La UI lo muestra
 * siempre en horario de Argentina (UTC−3).
 */

/** Convierte fecha/hora local de la sede (con su offset UTC) a un ISO 8601 en UTC. */
function localToUTC(date: string, time: string, offset: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  // offset es el desfase de la sede respecto de UTC (ej. −4); UTC = local − offset.
  return new Date(Date.UTC(y, m - 1, d, hh - offset, mm)).toISOString();
}

// ── Constructores de cupos (slots) ───────────────────────────────────────
const team = (teamId: string): MatchSlot => ({ kind: 'team', teamId });
const winner = (group: GroupId): MatchSlot => ({ kind: 'groupWinner', group });
const runnerUp = (group: GroupId): MatchSlot => ({ kind: 'groupRunnerUp', group });
const winnerOf = (matchId: string): MatchSlot => ({ kind: 'winnerOf', matchId });
const loserOf = (matchId: string): MatchSlot => ({ kind: 'loserOf', matchId });
/** Cupo de mejor 3.º: lista oficial de grupos admitidos para ese cruce de R32. */
const third = (groups: GroupId[]): MatchSlot => ({ kind: 'thirdFrom', groups });

// ── Fase de grupos (72) ──────────────────────────────────────────────────
interface GroupFixture {
  n: number;
  md: number;
  group: GroupId;
  home: string;
  away: string;
  date: string;
  time: string;
  off: number;
  venue: string;
}

// prettier-ignore
const groupFixtures: GroupFixture[] = [
  // Grupo A — México, Sudáfrica, Corea del Sur, Chequia
  { n: 1, md: 1, group: 'A', home: 'MEX', away: 'RSA', date: '2026-06-11', time: '13:00', off: -6, venue: 'mexico' },
  { n: 2, md: 1, group: 'A', home: 'KOR', away: 'CZE', date: '2026-06-11', time: '20:00', off: -6, venue: 'guadalajara' },
  { n: 25, md: 2, group: 'A', home: 'CZE', away: 'RSA', date: '2026-06-18', time: '12:00', off: -4, venue: 'atlanta' },
  { n: 28, md: 2, group: 'A', home: 'MEX', away: 'KOR', date: '2026-06-18', time: '19:00', off: -6, venue: 'guadalajara' },
  { n: 53, md: 3, group: 'A', home: 'CZE', away: 'MEX', date: '2026-06-24', time: '19:00', off: -6, venue: 'mexico' },
  { n: 54, md: 3, group: 'A', home: 'RSA', away: 'KOR', date: '2026-06-24', time: '19:00', off: -6, venue: 'monterrey' },
  // Grupo B — Canadá, Bosnia y Herzegovina, Catar, Suiza
  { n: 3, md: 1, group: 'B', home: 'CAN', away: 'BIH', date: '2026-06-12', time: '15:00', off: -4, venue: 'toronto' },
  { n: 8, md: 1, group: 'B', home: 'QAT', away: 'SUI', date: '2026-06-13', time: '12:00', off: -7, venue: 'sfbay' },
  { n: 26, md: 2, group: 'B', home: 'SUI', away: 'BIH', date: '2026-06-18', time: '12:00', off: -7, venue: 'la' },
  { n: 27, md: 2, group: 'B', home: 'CAN', away: 'QAT', date: '2026-06-18', time: '15:00', off: -7, venue: 'vancouver' },
  { n: 51, md: 3, group: 'B', home: 'SUI', away: 'CAN', date: '2026-06-24', time: '12:00', off: -7, venue: 'vancouver' },
  { n: 52, md: 3, group: 'B', home: 'BIH', away: 'QAT', date: '2026-06-24', time: '12:00', off: -7, venue: 'seattle' },
  // Grupo C — Brasil, Marruecos, Haití, Escocia
  { n: 7, md: 1, group: 'C', home: 'BRA', away: 'MAR', date: '2026-06-13', time: '18:00', off: -4, venue: 'nyc' },
  { n: 5, md: 1, group: 'C', home: 'HAI', away: 'SCO', date: '2026-06-13', time: '21:00', off: -4, venue: 'boston' },
  { n: 30, md: 2, group: 'C', home: 'SCO', away: 'MAR', date: '2026-06-19', time: '18:00', off: -4, venue: 'boston' },
  { n: 29, md: 2, group: 'C', home: 'BRA', away: 'HAI', date: '2026-06-19', time: '20:30', off: -4, venue: 'philadelphia' },
  { n: 49, md: 3, group: 'C', home: 'SCO', away: 'BRA', date: '2026-06-24', time: '18:00', off: -4, venue: 'miami' },
  { n: 50, md: 3, group: 'C', home: 'MAR', away: 'HAI', date: '2026-06-24', time: '18:00', off: -4, venue: 'atlanta' },
  // Grupo D — Estados Unidos, Paraguay, Australia, Turquía
  { n: 4, md: 1, group: 'D', home: 'USA', away: 'PAR', date: '2026-06-12', time: '18:00', off: -7, venue: 'la' },
  { n: 6, md: 1, group: 'D', home: 'AUS', away: 'TUR', date: '2026-06-13', time: '21:00', off: -7, venue: 'vancouver' },
  { n: 32, md: 2, group: 'D', home: 'USA', away: 'AUS', date: '2026-06-19', time: '12:00', off: -7, venue: 'seattle' },
  { n: 31, md: 2, group: 'D', home: 'TUR', away: 'PAR', date: '2026-06-19', time: '20:00', off: -7, venue: 'sfbay' },
  { n: 59, md: 3, group: 'D', home: 'TUR', away: 'USA', date: '2026-06-25', time: '19:00', off: -7, venue: 'la' },
  { n: 60, md: 3, group: 'D', home: 'PAR', away: 'AUS', date: '2026-06-25', time: '19:00', off: -7, venue: 'sfbay' },
  // Grupo E — Alemania, Curazao, Costa de Marfil, Ecuador
  { n: 10, md: 1, group: 'E', home: 'GER', away: 'CUW', date: '2026-06-14', time: '12:00', off: -5, venue: 'houston' },
  { n: 9, md: 1, group: 'E', home: 'CIV', away: 'ECU', date: '2026-06-14', time: '19:00', off: -4, venue: 'philadelphia' },
  { n: 33, md: 2, group: 'E', home: 'GER', away: 'CIV', date: '2026-06-20', time: '16:00', off: -4, venue: 'toronto' },
  { n: 34, md: 2, group: 'E', home: 'ECU', away: 'CUW', date: '2026-06-20', time: '19:00', off: -5, venue: 'kansas' },
  { n: 55, md: 3, group: 'E', home: 'CUW', away: 'CIV', date: '2026-06-25', time: '16:00', off: -4, venue: 'philadelphia' },
  { n: 56, md: 3, group: 'E', home: 'ECU', away: 'GER', date: '2026-06-25', time: '16:00', off: -4, venue: 'nyc' },
  // Grupo F — Países Bajos, Japón, Suecia, Túnez
  { n: 11, md: 1, group: 'F', home: 'NED', away: 'JPN', date: '2026-06-14', time: '15:00', off: -5, venue: 'dallas' },
  { n: 12, md: 1, group: 'F', home: 'SWE', away: 'TUN', date: '2026-06-14', time: '20:00', off: -6, venue: 'monterrey' },
  { n: 35, md: 2, group: 'F', home: 'NED', away: 'SWE', date: '2026-06-20', time: '12:00', off: -5, venue: 'houston' },
  { n: 36, md: 2, group: 'F', home: 'TUN', away: 'JPN', date: '2026-06-20', time: '22:00', off: -6, venue: 'monterrey' },
  { n: 57, md: 3, group: 'F', home: 'JPN', away: 'SWE', date: '2026-06-25', time: '18:00', off: -5, venue: 'dallas' },
  { n: 58, md: 3, group: 'F', home: 'TUN', away: 'NED', date: '2026-06-25', time: '18:00', off: -5, venue: 'kansas' },
  // Grupo G — Bélgica, Egipto, Irán, Nueva Zelanda
  { n: 16, md: 1, group: 'G', home: 'BEL', away: 'EGY', date: '2026-06-15', time: '12:00', off: -7, venue: 'seattle' },
  { n: 15, md: 1, group: 'G', home: 'IRN', away: 'NZL', date: '2026-06-15', time: '18:00', off: -7, venue: 'la' },
  { n: 39, md: 2, group: 'G', home: 'BEL', away: 'IRN', date: '2026-06-21', time: '12:00', off: -7, venue: 'la' },
  { n: 40, md: 2, group: 'G', home: 'NZL', away: 'EGY', date: '2026-06-21', time: '18:00', off: -7, venue: 'vancouver' },
  { n: 63, md: 3, group: 'G', home: 'EGY', away: 'IRN', date: '2026-06-26', time: '20:00', off: -7, venue: 'seattle' },
  { n: 64, md: 3, group: 'G', home: 'NZL', away: 'BEL', date: '2026-06-26', time: '20:00', off: -7, venue: 'vancouver' },
  // Grupo H — España, Cabo Verde, Arabia Saudita, Uruguay
  { n: 14, md: 1, group: 'H', home: 'ESP', away: 'CPV', date: '2026-06-15', time: '12:00', off: -4, venue: 'atlanta' },
  { n: 13, md: 1, group: 'H', home: 'KSA', away: 'URU', date: '2026-06-15', time: '18:00', off: -4, venue: 'miami' },
  { n: 38, md: 2, group: 'H', home: 'ESP', away: 'KSA', date: '2026-06-21', time: '12:00', off: -4, venue: 'atlanta' },
  { n: 37, md: 2, group: 'H', home: 'URU', away: 'CPV', date: '2026-06-21', time: '18:00', off: -4, venue: 'miami' },
  { n: 65, md: 3, group: 'H', home: 'CPV', away: 'KSA', date: '2026-06-26', time: '19:00', off: -5, venue: 'houston' },
  { n: 66, md: 3, group: 'H', home: 'URU', away: 'ESP', date: '2026-06-26', time: '18:00', off: -6, venue: 'guadalajara' },
  // Grupo I — Francia, Senegal, Irak, Noruega
  { n: 17, md: 1, group: 'I', home: 'FRA', away: 'SEN', date: '2026-06-16', time: '15:00', off: -4, venue: 'nyc' },
  { n: 18, md: 1, group: 'I', home: 'IRQ', away: 'NOR', date: '2026-06-16', time: '18:00', off: -4, venue: 'boston' },
  { n: 42, md: 2, group: 'I', home: 'FRA', away: 'IRQ', date: '2026-06-22', time: '17:00', off: -4, venue: 'philadelphia' },
  { n: 41, md: 2, group: 'I', home: 'NOR', away: 'SEN', date: '2026-06-22', time: '20:00', off: -4, venue: 'nyc' },
  { n: 61, md: 3, group: 'I', home: 'NOR', away: 'FRA', date: '2026-06-26', time: '15:00', off: -4, venue: 'boston' },
  { n: 62, md: 3, group: 'I', home: 'SEN', away: 'IRQ', date: '2026-06-26', time: '15:00', off: -4, venue: 'toronto' },
  // Grupo J — Argentina, Argelia, Austria, Jordania
  { n: 19, md: 1, group: 'J', home: 'ARG', away: 'ALG', date: '2026-06-16', time: '20:00', off: -5, venue: 'kansas' },
  { n: 20, md: 1, group: 'J', home: 'AUT', away: 'JOR', date: '2026-06-16', time: '21:00', off: -7, venue: 'sfbay' },
  { n: 43, md: 2, group: 'J', home: 'ARG', away: 'AUT', date: '2026-06-22', time: '12:00', off: -5, venue: 'dallas' },
  { n: 44, md: 2, group: 'J', home: 'JOR', away: 'ALG', date: '2026-06-22', time: '20:00', off: -7, venue: 'sfbay' },
  { n: 69, md: 3, group: 'J', home: 'ALG', away: 'AUT', date: '2026-06-27', time: '21:00', off: -5, venue: 'kansas' },
  { n: 70, md: 3, group: 'J', home: 'JOR', away: 'ARG', date: '2026-06-27', time: '21:00', off: -5, venue: 'dallas' },
  // Grupo K — Portugal, RD Congo, Uzbekistán, Colombia
  { n: 23, md: 1, group: 'K', home: 'POR', away: 'COD', date: '2026-06-17', time: '12:00', off: -5, venue: 'houston' },
  { n: 24, md: 1, group: 'K', home: 'UZB', away: 'COL', date: '2026-06-17', time: '20:00', off: -6, venue: 'mexico' },
  { n: 47, md: 2, group: 'K', home: 'POR', away: 'UZB', date: '2026-06-23', time: '12:00', off: -5, venue: 'houston' },
  { n: 48, md: 2, group: 'K', home: 'COL', away: 'COD', date: '2026-06-23', time: '20:00', off: -6, venue: 'guadalajara' },
  { n: 71, md: 3, group: 'K', home: 'COL', away: 'POR', date: '2026-06-27', time: '19:30', off: -4, venue: 'miami' },
  { n: 72, md: 3, group: 'K', home: 'COD', away: 'UZB', date: '2026-06-27', time: '19:30', off: -4, venue: 'atlanta' },
  // Grupo L — Inglaterra, Croacia, Ghana, Panamá
  { n: 22, md: 1, group: 'L', home: 'ENG', away: 'CRO', date: '2026-06-17', time: '15:00', off: -5, venue: 'dallas' },
  { n: 21, md: 1, group: 'L', home: 'GHA', away: 'PAN', date: '2026-06-17', time: '19:00', off: -4, venue: 'toronto' },
  { n: 45, md: 2, group: 'L', home: 'ENG', away: 'GHA', date: '2026-06-23', time: '16:00', off: -4, venue: 'boston' },
  { n: 46, md: 2, group: 'L', home: 'PAN', away: 'CRO', date: '2026-06-23', time: '19:00', off: -4, venue: 'toronto' },
  { n: 67, md: 3, group: 'L', home: 'PAN', away: 'ENG', date: '2026-06-27', time: '17:00', off: -4, venue: 'nyc' },
  { n: 68, md: 3, group: 'L', home: 'CRO', away: 'GHA', date: '2026-06-27', time: '17:00', off: -4, venue: 'philadelphia' },
];

const groupMatches: Match[] = groupFixtures.map((f) => ({
  id: `M${f.n}`,
  number: f.n,
  stage: 'group',
  matchday: f.md,
  group: f.group,
  kickoffUTC: localToUTC(f.date, f.time, f.off),
  venueId: f.venue,
  home: team(f.home),
  away: team(f.away),
}));

// ── Eliminatorias (32) ───────────────────────────────────────────────────
// Estructura oficial de la llave. Los cupos de mejor 3.º llevan la lista oficial
// de grupos admitidos (Anexo de combinaciones de la FIFA) para cada cruce.
interface KnockoutFixture {
  n: number;
  stage: Stage;
  label: string;
  home: MatchSlot;
  away: MatchSlot;
  date: string;
  time: string;
  off: number;
  venue: string;
}

// prettier-ignore
const knockoutFixtures: KnockoutFixture[] = [
  // Dieciseisavos (R32)
  { n: 73, stage: 'R32', label: 'Dieciseisavos', home: runnerUp('A'), away: runnerUp('B'), date: '2026-06-28', time: '12:00', off: -7, venue: 'la' },
  { n: 74, stage: 'R32', label: 'Dieciseisavos', home: winner('E'), away: third(['A', 'B', 'C', 'D', 'F']), date: '2026-06-29', time: '16:30', off: -4, venue: 'boston' },
  { n: 75, stage: 'R32', label: 'Dieciseisavos', home: winner('F'), away: runnerUp('C'), date: '2026-06-29', time: '19:00', off: -6, venue: 'monterrey' },
  { n: 76, stage: 'R32', label: 'Dieciseisavos', home: winner('C'), away: runnerUp('F'), date: '2026-06-29', time: '12:00', off: -5, venue: 'houston' },
  { n: 77, stage: 'R32', label: 'Dieciseisavos', home: winner('I'), away: third(['C', 'D', 'F', 'G', 'H']), date: '2026-06-30', time: '17:00', off: -4, venue: 'nyc' },
  { n: 78, stage: 'R32', label: 'Dieciseisavos', home: runnerUp('E'), away: runnerUp('I'), date: '2026-06-30', time: '12:00', off: -5, venue: 'dallas' },
  { n: 79, stage: 'R32', label: 'Dieciseisavos', home: winner('A'), away: third(['C', 'E', 'F', 'H', 'I']), date: '2026-06-30', time: '19:00', off: -6, venue: 'mexico' },
  { n: 80, stage: 'R32', label: 'Dieciseisavos', home: winner('L'), away: third(['E', 'H', 'I', 'J', 'K']), date: '2026-07-01', time: '12:00', off: -4, venue: 'atlanta' },
  { n: 81, stage: 'R32', label: 'Dieciseisavos', home: winner('D'), away: third(['B', 'E', 'F', 'I', 'J']), date: '2026-07-01', time: '17:00', off: -7, venue: 'sfbay' },
  { n: 82, stage: 'R32', label: 'Dieciseisavos', home: winner('G'), away: third(['A', 'E', 'H', 'I', 'J']), date: '2026-07-01', time: '13:00', off: -7, venue: 'seattle' },
  { n: 83, stage: 'R32', label: 'Dieciseisavos', home: runnerUp('K'), away: runnerUp('L'), date: '2026-07-02', time: '19:00', off: -4, venue: 'toronto' },
  { n: 84, stage: 'R32', label: 'Dieciseisavos', home: winner('H'), away: runnerUp('J'), date: '2026-07-02', time: '12:00', off: -7, venue: 'la' },
  { n: 85, stage: 'R32', label: 'Dieciseisavos', home: winner('B'), away: third(['E', 'F', 'G', 'I', 'J']), date: '2026-07-02', time: '20:00', off: -7, venue: 'vancouver' },
  { n: 86, stage: 'R32', label: 'Dieciseisavos', home: winner('J'), away: runnerUp('H'), date: '2026-07-03', time: '18:00', off: -4, venue: 'miami' },
  { n: 87, stage: 'R32', label: 'Dieciseisavos', home: winner('K'), away: third(['D', 'E', 'I', 'J', 'L']), date: '2026-07-03', time: '20:30', off: -5, venue: 'kansas' },
  { n: 88, stage: 'R32', label: 'Dieciseisavos', home: runnerUp('D'), away: runnerUp('G'), date: '2026-07-03', time: '13:00', off: -5, venue: 'dallas' },
  // Octavos (R16)
  { n: 89, stage: 'R16', label: 'Octavos', home: winnerOf('M74'), away: winnerOf('M77'), date: '2026-07-04', time: '17:00', off: -4, venue: 'philadelphia' },
  { n: 90, stage: 'R16', label: 'Octavos', home: winnerOf('M73'), away: winnerOf('M75'), date: '2026-07-04', time: '12:00', off: -5, venue: 'houston' },
  { n: 91, stage: 'R16', label: 'Octavos', home: winnerOf('M76'), away: winnerOf('M78'), date: '2026-07-05', time: '16:00', off: -4, venue: 'nyc' },
  { n: 92, stage: 'R16', label: 'Octavos', home: winnerOf('M79'), away: winnerOf('M80'), date: '2026-07-05', time: '18:00', off: -6, venue: 'mexico' },
  { n: 93, stage: 'R16', label: 'Octavos', home: winnerOf('M83'), away: winnerOf('M84'), date: '2026-07-06', time: '14:00', off: -5, venue: 'dallas' },
  { n: 94, stage: 'R16', label: 'Octavos', home: winnerOf('M81'), away: winnerOf('M82'), date: '2026-07-06', time: '17:00', off: -7, venue: 'seattle' },
  { n: 95, stage: 'R16', label: 'Octavos', home: winnerOf('M86'), away: winnerOf('M88'), date: '2026-07-07', time: '12:00', off: -4, venue: 'atlanta' },
  { n: 96, stage: 'R16', label: 'Octavos', home: winnerOf('M85'), away: winnerOf('M87'), date: '2026-07-07', time: '13:00', off: -7, venue: 'vancouver' },
  // Cuartos (QF)
  { n: 97, stage: 'QF', label: 'Cuartos', home: winnerOf('M89'), away: winnerOf('M90'), date: '2026-07-09', time: '16:00', off: -4, venue: 'boston' },
  { n: 98, stage: 'QF', label: 'Cuartos', home: winnerOf('M93'), away: winnerOf('M94'), date: '2026-07-10', time: '12:00', off: -7, venue: 'la' },
  { n: 99, stage: 'QF', label: 'Cuartos', home: winnerOf('M91'), away: winnerOf('M92'), date: '2026-07-11', time: '17:00', off: -4, venue: 'miami' },
  { n: 100, stage: 'QF', label: 'Cuartos', home: winnerOf('M95'), away: winnerOf('M96'), date: '2026-07-11', time: '20:00', off: -5, venue: 'kansas' },
  // Semifinales (SF)
  { n: 101, stage: 'SF', label: 'Semifinal', home: winnerOf('M97'), away: winnerOf('M98'), date: '2026-07-14', time: '14:00', off: -5, venue: 'dallas' },
  { n: 102, stage: 'SF', label: 'Semifinal', home: winnerOf('M99'), away: winnerOf('M100'), date: '2026-07-15', time: '15:00', off: -4, venue: 'atlanta' },
  // Tercer puesto y Final
  { n: 103, stage: 'third', label: 'Tercer puesto', home: loserOf('M101'), away: loserOf('M102'), date: '2026-07-18', time: '17:00', off: -4, venue: 'miami' },
  { n: 104, stage: 'final', label: 'Final', home: winnerOf('M101'), away: winnerOf('M102'), date: '2026-07-19', time: '15:00', off: -4, venue: 'nyc' },
];

const knockoutMatches: Match[] = knockoutFixtures.map((f) => ({
  id: `M${f.n}`,
  number: f.n,
  stage: f.stage,
  label: f.label,
  kickoffUTC: localToUTC(f.date, f.time, f.off),
  venueId: f.venue,
  home: f.home,
  away: f.away,
}));

/** Todos los partidos, ordenados por número (1..104). */
export const matches: Match[] = [...groupMatches, ...knockoutMatches].sort(
  (a, b) => a.number - b.number,
);

export const matchesById: Record<string, Match> = Object.fromEntries(matches.map((m) => [m.id, m]));

export function getMatch(id: string): Match | undefined {
  return matchesById[id];
}

export const groupStageMatches: Match[] = matches.filter((m) => m.stage === 'group');
export const knockoutStageMatches: Match[] = matches.filter((m) => m.stage !== 'group');

/** Partidos de un grupo, ordenados por jornada y número. */
export function matchesOfGroup(group: GroupId): Match[] {
  return groupStageMatches.filter((m) => m.group === group).sort((a, b) => a.number - b.number);
}

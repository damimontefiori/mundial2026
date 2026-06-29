import type { Match, OfficialResult, ScorerEntry } from '@/types';
import type { BracketView } from '@/lib/bracket';
import { matches } from '@/data/matches';

const ARGENTINA = 'ARG';
const FIRST_WORLD_CUP_GOAL = new Date('2006-06-16T00:00:00Z');

export interface MessiRecordMetric {
  id: string;
  title: string;
  category: 'chasing' | 'extending';
  unit: string;
  baseline: number;
  live: number | null;
  current: number | null;
  record: number;
  progressMax: number;
  status: 'pending' | 'tied' | 'broken' | 'extended' | 'unavailable';
  statusLabel: string;
  detail: string;
  source: string;
  note?: string;
}

export interface MessiRecordsSummary {
  liveGoals: number;
  liveAssists: number | null;
  argentinaWins: number;
  appearances: number;
  worldCups: number;
  hasMessiAppearance: boolean;
}

export interface MessiRecordsDashboard {
  summary: MessiRecordsSummary;
  chasing: MessiRecordMetric[];
  extending: MessiRecordMetric[];
}

const isMessiScorer = (scorer: ScorerEntry): boolean =>
  scorer.teamId === ARGENTINA && /messi/i.test(scorer.playerName);

function teamIdsOf(match: Match, view: BracketView): [string | null, string | null] {
  if (match.stage === 'group') {
    return [
      match.home.kind === 'team' ? match.home.teamId : null,
      match.away.kind === 'team' ? match.away.teamId : null,
    ];
  }

  const resolved = view.knockout[match.id];
  return [resolved?.homeTeamId ?? null, resolved?.awayTeamId ?? null];
}

function argentinaFinishedStats(
  official: Record<string, OfficialResult>,
  view: BracketView,
): { played: number; wins: number; latestKickoffUTC: string | null } {
  let played = 0;
  let wins = 0;
  let latestKickoffUTC: string | null = null;

  for (const match of matches) {
    const result = official[match.id];
    if (!result || result.status !== 'FINISHED') continue;

    const [homeId, awayId] = teamIdsOf(match, view);
    const isHome = homeId === ARGENTINA;
    const isAway = awayId === ARGENTINA;
    if (!isHome && !isAway) continue;

    played += 1;
    latestKickoffUTC = match.kickoffUTC;

    if (match.stage === 'group') {
      if (isHome && result.homeGoals > result.awayGoals) wins += 1;
      if (isAway && result.awayGoals > result.homeGoals) wins += 1;
    } else if (result.winnerCode === ARGENTINA) {
      wins += 1;
    }
  }

  return { played, wins, latestKickoffUTC };
}

function chasingStatus(
  current: number,
  record: number,
): Pick<MessiRecordMetric, 'status' | 'statusLabel'> {
  if (current > record) return { status: 'broken', statusLabel: 'Récord superado' };
  if (current === record) return { status: 'tied', statusLabel: 'Récord igualado' };
  return { status: 'pending', statusLabel: `A ${record - current} de igualarlo` };
}

function yearsBetween(start: Date, end: Date): number {
  const years = end.getUTCFullYear() - start.getUTCFullYear();
  const beforeAnniversary =
    end.getUTCMonth() < start.getUTCMonth() ||
    (end.getUTCMonth() === start.getUTCMonth() && end.getUTCDate() < start.getUTCDate());
  return beforeAnniversary ? years - 1 : years;
}

export function computeMessiRecords(
  scorers: ScorerEntry[],
  official: Record<string, OfficialResult>,
  view: BracketView,
): MessiRecordsDashboard {
  const messi = scorers.find(isMessiScorer) ?? null;
  const argentina = argentinaFinishedStats(official, view);
  const liveGoals = messi?.goals ?? 0;
  const liveAssists = typeof messi?.assists === 'number' ? messi.assists : null;
  const appearances =
    messi?.playedMatches && messi.playedMatches > 0 ? messi.playedMatches : argentina.played;
  const hasMessiAppearance = appearances > 0;
  const worldCups = hasMessiAppearance ? 6 : 5;
  const latestGoalReference =
    liveGoals > 0 && argentina.latestKickoffUTC ? new Date(argentina.latestKickoffUTC) : null;
  const longevityYears = latestGoalReference
    ? yearsBetween(FIRST_WORLD_CUP_GOAL, latestGoalReference)
    : 20;

  const goalCurrent = 13 + liveGoals;
  const goals = chasingStatus(goalCurrent, 16);
  const winsCurrent = 16 + argentina.wins;
  const wins = chasingStatus(winsCurrent, 17);

  const assistsCurrent = liveAssists === null ? null : 8 + liveAssists;
  const assists = assistsCurrent === null ? null : chasingStatus(assistsCurrent, 10);

  const chasing: MessiRecordMetric[] = [
    {
      id: 'goals',
      title: 'Máximo goleador histórico',
      category: 'chasing',
      unit: 'goles',
      baseline: 13,
      live: liveGoals,
      current: goalCurrent,
      record: 16,
      progressMax: 17,
      status: goals.status,
      statusLabel: goals.statusLabel,
      detail: 'Klose marcó 16. Con 17, Messi queda solo arriba.',
      source: 'Goles vivos desde awards.json',
    },
    {
      id: 'wins',
      title: 'Más victorias en Mundiales',
      category: 'chasing',
      unit: 'victorias',
      baseline: 16,
      live: argentina.wins,
      current: winsCurrent,
      record: 17,
      progressMax: 18,
      status: wins.status,
      statusLabel: wins.statusLabel,
      detail: 'Klose llegó a 17 triunfos. Cada victoria de Argentina suma al contador.',
      source: 'Resultados oficiales de Argentina',
    },
    {
      id: 'assists',
      title: 'Máximo asistidor histórico',
      category: 'chasing',
      unit: 'asistencias',
      baseline: 8,
      live: liveAssists,
      current: assistsCurrent,
      record: 10,
      progressMax: 11,
      status: assists?.status ?? 'unavailable',
      statusLabel: assists?.statusLabel ?? 'Dato oficial pendiente',
      detail: 'Pelé figura con 10 asistencias en registros FIFA unificados.',
      source: 'Datos oficiales del torneo',
      note:
        liveAssists === null
          ? 'Las asistencias oficiales 2026 todavía no están confirmadas en los datos disponibles.'
          : undefined,
    },
  ];

  const extending: MessiRecordMetric[] = [
    {
      id: 'appearances',
      title: 'Más partidos jugados',
      category: 'extending',
      unit: 'PJ',
      baseline: 26,
      live: appearances,
      current: 26 + appearances,
      record: 26,
      progressMax: 32,
      status: 'extended',
      statusLabel: `Techo actual: ${26 + appearances}`,
      detail: 'Llegó como líder histórico y cada presencia en 2026 agranda la marca.',
      source: messi?.playedMatches
        ? 'PJ de Messi en awards.json'
        : 'Estimado por partidos de Argentina',
    },
    {
      id: 'world-cups',
      title: 'Más Mundiales disputados',
      category: 'extending',
      unit: 'Mundiales',
      baseline: 5,
      live: hasMessiAppearance ? 1 : 0,
      current: worldCups,
      record: 6,
      progressMax: 6,
      status: hasMessiAppearance ? 'tied' : 'pending',
      statusLabel: hasMessiAppearance ? 'Cima compartida' : 'Aún sin minutos 2026',
      detail:
        'Con minutos en 2026 alcanza 6 Copas del Mundo, junto a Cristiano Ronaldo y Memo Ochoa.',
      source: 'Baseline histórico + participación 2026',
    },
    {
      id: 'captaincy',
      title: 'Más partidos como capitán',
      category: 'extending',
      unit: 'capitanías',
      baseline: 21,
      live: appearances,
      current: 21 + appearances,
      record: 21,
      progressMax: 27,
      status: 'extended',
      statusLabel: `Marca extendida a ${21 + appearances}`,
      detail:
        'Ya era récord mundialista. Se estima con sus partidos jugados.',
      source: 'Estimación sobre PJ de Messi',
      note: 'Valores calculados en relación a los partidos jugados registrados.',
    },
    {
      id: 'longevity',
      title: 'Longevidad goleadora',
      category: 'extending',
      unit: 'años',
      baseline: 20,
      live: liveGoals > 0 ? longevityYears - 20 : 0,
      current: longevityYears,
      record: 20,
      progressMax: 21,
      status: liveGoals > 0 ? 'extended' : 'pending',
      statusLabel:
        liveGoals > 0 ? `Más de ${longevityYears} años vigente` : 'Esperando gol en 2026',
      detail:
        'Mide el tramo entre su primer gol mundialista en 2006 y su vigencia goleadora en 2026.',
      source: 'Baseline histórico + goles 2026',
      note: 'Football-Data no trae fecha de cada gol; se muestra como umbral histórico del torneo.',
    },
  ];

  return {
    summary: {
      liveGoals,
      liveAssists,
      argentinaWins: argentina.wins,
      appearances,
      worldCups,
      hasMessiAppearance,
    },
    chasing,
    extending,
  };
}

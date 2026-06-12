import type { MatchStatus, OfficialResult } from '@/types';
import { groupStageMatches, knockoutStageMatches, matchesById } from '@/data/matches';
import { teams } from '@/data/teams';
import { computeBracket } from '@/lib/bracket';

/**
 * Convierte la respuesta de una API de fútbol (football-data.org v4) al formato
 * de `public/results.json`: resultados reales indexados por NUESTRO id de partido
 * (M1..M104). Es código puro y testeable; el script `scripts/fetch-results.ts` lo
 * usa con los datos en vivo.
 *
 * Estrategia de mapeo (sin depender de ids ajenos ni de la asignación de terceros):
 *  - Grupos: por el par de equipos (dos selecciones se enfrentan una sola vez).
 *  - Eliminatorias: R32 se ancla por el lado sembrado (1.º/2.º de grupo, que es
 *    determinístico); las rondas siguientes se resuelven con los ganadores reales
 *    de la ronda previa (propagación). Dos equipos se cruzan a lo sumo una vez, así
 *    que el par identifica el partido de forma única.
 */

export interface ApiTeamLite {
  name?: string;
  shortName?: string;
  tla?: string;
}

export interface ApiScoreLite {
  winner?: string | null;
  fullTime?: { home?: number | null; away?: number | null } & Record<string, number | null>;
}

export interface ApiMatchLite {
  utcDate?: string;
  status?: string;
  stage?: string;
  group?: string | null;
  homeTeam?: ApiTeamLite;
  awayTeam?: ApiTeamLite;
  score?: ApiScoreLite;
}

// ── Resolución de equipo (API → nuestro id) ──────────────────────────────────

const norm = (s: string): string =>
  // NFD separa los acentos; luego nos quedamos solo con [a-z] (descarta acentos,
  // espacios y puntuación). Ej: "Türkiye" → "turkiye", "Côte d'Ivoire" → "cotedivoire".
  s.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');

/** Nombres en inglés/variantes por equipo, para cuando el `tla` no alcance. */
const NAME_VARIANTS: Record<string, string[]> = {
  ARG: ['argentina'],
  BRA: ['brazil', 'brasil'],
  URU: ['uruguay'],
  COL: ['colombia'],
  ECU: ['ecuador'],
  PAR: ['paraguay'],
  USA: ['united states', 'usa', 'united states of america'],
  MEX: ['mexico'],
  CAN: ['canada'],
  PAN: ['panama'],
  HAI: ['haiti'],
  CUW: ['curacao', 'curaçao'],
  FRA: ['france', 'francia'],
  ENG: ['england', 'inglaterra'],
  ESP: ['spain', 'espana', 'españa'],
  POR: ['portugal'],
  NED: ['netherlands', 'holland', 'paises bajos'],
  BEL: ['belgium', 'belgica'],
  GER: ['germany', 'alemania'],
  CRO: ['croatia', 'croacia'],
  SUI: ['switzerland', 'suiza'],
  AUT: ['austria'],
  NOR: ['norway', 'noruega'],
  SCO: ['scotland', 'escocia'],
  SWE: ['sweden', 'suecia'],
  CZE: ['czechia', 'czech republic', 'chequia'],
  TUR: ['turkey', 'turkiye', 'turquia'],
  BIH: ['bosnia and herzegovina', 'bosnia herzegovina', 'bosnia y herzegovina'],
  MAR: ['morocco', 'marruecos'],
  SEN: ['senegal'],
  EGY: ['egypt', 'egipto'],
  ALG: ['algeria', 'argelia'],
  TUN: ['tunisia', 'tunez'],
  CIV: ['ivory coast', 'cote divoire', 'costa de marfil'],
  GHA: ['ghana'],
  CPV: ['cape verde', 'cabo verde'],
  RSA: ['south africa', 'sudafrica'],
  JPN: ['japan', 'japon'],
  KOR: ['south korea', 'korea republic', 'republic of korea', 'corea del sur'],
  IRN: ['iran', 'ir iran'],
  AUS: ['australia'],
  KSA: ['saudi arabia', 'arabia saudita'],
  QAT: ['qatar', 'catar'],
  UZB: ['uzbekistan'],
  JOR: ['jordan', 'jordania'],
  NZL: ['new zealand', 'nueva zelanda'],
  IRQ: ['iraq', 'irak'],
  COD: ['dr congo', 'congo dr', 'democratic republic of congo', 'congo', 'rd congo'],
};

function buildNameIndex(): Map<string, string> {
  const idx = new Map<string, string>();
  for (const t of teams) {
    idx.set(norm(t.name), t.id); // nuestro nombre (es)
    for (const variant of NAME_VARIANTS[t.id] ?? []) idx.set(norm(variant), t.id);
  }
  return idx;
}

const NAME_INDEX = buildNameIndex();
const VALID_IDS = new Set(teams.map((t) => t.id));

/** API team → nuestro id (por `tla`=código FIFA, luego por nombre). null si no se reconoce. */
export function resolveTeamId(team: ApiTeamLite | undefined): string | null {
  if (!team) return null;
  if (team.tla && VALID_IDS.has(team.tla)) return team.tla;
  for (const name of [team.name, team.shortName]) {
    if (!name) continue;
    const id = NAME_INDEX.get(norm(name));
    if (id) return id;
  }
  return null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function mapStatus(status: string | undefined): MatchStatus | null {
  switch (status) {
    case 'FINISHED':
    case 'AWARDED':
      return 'FINISHED';
    case 'IN_PLAY':
      return 'IN_PLAY';
    case 'PAUSED':
      return 'PAUSED';
    case 'TIMED':
      return 'TIMED';
    case 'SCHEDULED':
      return 'SCHEDULED';
    default:
      return null; // POSTPONED / SUSPENDED / CANCELLED → se ignoran
  }
}

const goalsOf = (score: ApiScoreLite | undefined): { home: number; away: number } => ({
  home: score?.fullTime?.home ?? 0,
  away: score?.fullTime?.away ?? 0,
});

/**
 * ¿La API ya reportó el marcador final? El free tier de football-data.org a veces
 * marca un partido como FINISHED *antes* de cargar los goles (`fullTime` en null), lo
 * que publicaría un 0-0 fantasma y bloquearía el partido. Exigimos goles numéricos
 * para recién entonces publicarlo: en la corrida siguiente, ya con el marcador real,
 * se completa solo. (Un 0-0 real llega como `{home: 0, away: 0}`, no como null.)
 */
const hasGoals = (score: ApiScoreLite | undefined): boolean =>
  typeof score?.fullTime?.home === 'number' && typeof score?.fullTime?.away === 'number';

const pairKey = (a: string, b: string): string => [a, b].sort().join('|');

const isGroupApiMatch = (m: ApiMatchLite): boolean =>
  Boolean(m.group) || m.stage === 'GROUP_STAGE';

// ── Mapeo principal ──────────────────────────────────────────────────────────

export function apiToOfficial(apiMatches: ApiMatchLite[]): Record<string, OfficialResult> {
  const official: Record<string, OfficialResult> = {};

  // Índice de nuestros partidos de grupo por par de equipos.
  const groupByPair = new Map<string, string>();
  for (const m of groupStageMatches) {
    if (m.home.kind !== 'team' || m.away.kind !== 'team') continue;
    groupByPair.set(pairKey(m.home.teamId, m.away.teamId), m.id);
  }

  const apiGroup = apiMatches.filter(isGroupApiMatch);
  const apiKnockout = apiMatches.filter((m) => !isGroupApiMatch(m));

  // 1) Grupos: mapear por par y orientar los goles a NUESTRO home/away.
  const groupResults: Record<string, { homeGoals: number; awayGoals: number }> = {};
  for (const api of apiGroup) {
    const homeId = resolveTeamId(api.homeTeam);
    const awayId = resolveTeamId(api.awayTeam);
    if (!homeId || !awayId) continue;
    const matchId = groupByPair.get(pairKey(homeId, awayId));
    if (!matchId) continue;
    const status = mapStatus(api.status);
    if (!status || status === 'SCHEDULED' || status === 'TIMED') continue;
    if (!hasGoals(api.score)) continue; // FINISHED/IN_PLAY sin marcador aún: no publicar.

    const ours = matchesById[matchId];
    const ourHome = ours.home.kind === 'team' ? ours.home.teamId : null;
    const g = goalsOf(api.score);
    const sameOrientation = homeId === ourHome;
    const homeGoals = sameOrientation ? g.home : g.away;
    const awayGoals = sameOrientation ? g.away : g.home;

    official[matchId] = { homeGoals, awayGoals, status };
    if (status === 'FINISHED') groupResults[matchId] = { homeGoals, awayGoals };
  }

  // 2) Eliminatorias: resolver R32 (lado sembrado) y propagar con ganadores reales.
  const view = computeBracket(groupResults, {});

  // Índices de la API de eliminatorias.
  const apiByPair = new Map<string, ApiMatchLite>();
  const apiEarliestByTeam = new Map<string, ApiMatchLite>();
  for (const api of apiKnockout) {
    const a = resolveTeamId(api.homeTeam);
    const b = resolveTeamId(api.awayTeam);
    if (!a || !b) continue;
    apiByPair.set(pairKey(a, b), api);
    for (const id of [a, b]) {
      const prev = apiEarliestByTeam.get(id);
      if (!prev || (api.utcDate ?? '') < (prev.utcDate ?? '')) apiEarliestByTeam.set(id, api);
    }
  }

  const actualWinner = new Map<string, string>();
  const actualLoser = new Map<string, string>();

  const emitKnockout = (matchId: string, api: ApiMatchLite, ourHomeId: string | null) => {
    const status = mapStatus(api.status);
    if (!status || status === 'SCHEDULED' || status === 'TIMED') return;
    if (!hasGoals(api.score)) return; // FINISHED/IN_PLAY sin marcador aún: no publicar.
    const apiHomeId = resolveTeamId(api.homeTeam);
    const apiAwayId = resolveTeamId(api.awayTeam);
    const g = goalsOf(api.score);
    const sameOrientation = apiHomeId === ourHomeId;
    const homeGoals = sameOrientation ? g.home : g.away;
    const awayGoals = sameOrientation ? g.away : g.home;

    let winnerCode: string | undefined;
    if (api.score?.winner === 'HOME_TEAM') winnerCode = apiHomeId ?? undefined;
    else if (api.score?.winner === 'AWAY_TEAM') winnerCode = apiAwayId ?? undefined;

    official[matchId] = { homeGoals, awayGoals, status, winnerCode };

    if (status === 'FINISHED' && winnerCode && apiHomeId && apiAwayId) {
      actualWinner.set(matchId, winnerCode);
      actualLoser.set(matchId, winnerCode === apiHomeId ? apiAwayId : apiHomeId);
    }
  };

  // Procesar en orden de número: garantiza que las rondas previas ya se resolvieron.
  for (const m of knockoutStageMatches) {
    const { home, away } = m;
    if (home.kind === 'winnerOf' && away.kind === 'winnerOf') {
      // R16 en adelante: ambos lados vienen de un ganador real.
      const a = actualWinner.get(home.matchId);
      const b = actualWinner.get(away.matchId);
      if (!a || !b) continue;
      const api = apiByPair.get(pairKey(a, b));
      if (api) emitKnockout(m.id, api, a);
    } else if (home.kind === 'loserOf' && away.kind === 'loserOf') {
      // Tercer puesto: perdedores de las semis.
      const a = actualLoser.get(home.matchId);
      const b = actualLoser.get(away.matchId);
      if (!a || !b) continue;
      const api = apiByPair.get(pairKey(a, b));
      if (api) emitKnockout(m.id, api, a);
    } else {
      // R32: anclar por el lado sembrado (nuestro home resuelto).
      const ourHomeId = view.knockout[m.id]?.homeTeamId ?? null;
      if (!ourHomeId) continue;
      const api = apiEarliestByTeam.get(ourHomeId);
      if (api) emitKnockout(m.id, api, ourHomeId);
    }
  }

  return official;
}

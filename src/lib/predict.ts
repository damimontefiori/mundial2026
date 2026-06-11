import type { GroupResult, OfficialResult } from '@/types';
import { teams } from '@/data/teams';
import { teamRatings } from '@/data/ratings';
import { groupStageMatches, knockoutStageMatches, matchesById } from '@/data/matches';
import { computeBracket } from '@/lib/bracket';
import { mergeOfficial } from '@/lib/officialResults';

/**
 * Motor predictivo del Prode auto-actualizable (ver `docs/Prode_Rendimiento_Predictivo.md`).
 *
 * Tres pilares, todos código puro y testeable (sin React):
 *  1. Línea base: Ataque/Defensa/Elo por selección (`src/data/ratings.ts`).
 *  2. Proyección: Goles Esperados (xG) por Poisson + probabilidades de resultado.
 *  3. Retroalimentación: cada resultado REAL recalibra Elo y atributos, de modo que
 *     las proyecciones de los partidos siguientes incorporan la información nueva.
 *
 * La proyección es DETERMINÍSTICA (marcador más probable = moda de Poisson): a igual
 * entrada, igual salida. No usa azar.
 */

// ── Parámetros del modelo ─────────────────────────────────────────────────
/** Media de goles por equipo por partido en una fase final (constante del informe). */
const AVG_GOALS = 1.35;
/** Atributo "promedio" (Ataque/Defensa de una selección media). */
const RATING_BASELINE = 75;
/** Factor de importancia del torneo (K de Elo): máximo para una Copa del Mundo. */
const K_FACTOR = 60;
/** Bonificación Elo del anfitrión (localía), según el informe (+100 al "local"). */
const HOME_ELO_BONUS = 100;
/**
 * Multiplicador de xG por localía del anfitrión. Extensión propia (no está en el
 * informe, que sólo modela la localía como +100 de Elo): el Elo no alimenta la
 * proyección de marcadores, así que sin esto los anfitriones no tendrían ninguna
 * ventaja proyectada. Ver ADR 0006.
 */
const HOST_GOAL_FACTOR = 1.1;
/** Anfitriones 2026 (gozan de localía). */
const HOSTS = new Set(['MEX', 'USA', 'CAN']);
/** Cuánto se mueve Ataque/Defensa por cada gol de "sorpresa" respecto de la xG. */
const LEARNING_RATE = 1.6;
/** Cotas de los atributos recalibrados. */
const RATING_MIN = 40;
const RATING_MAX = 99;
/** Truncado de la matriz de Poisson (P(≥9 goles) es despreciable). */
const MAX_GOALS = 8;
/** Rating neutro para cualquier equipo sin línea base explícita (no debería ocurrir). */
const NEUTRAL: DynamicRating = { elo: 1450, attack: 65, defense: 65 };

// ── Tipos ──────────────────────────────────────────────────────────────────
export interface DynamicRating {
  /** Puntaje de poder tipo Elo (semilla = Puntos FIFA). */
  elo: number;
  attack: number;
  defense: number;
}

export type RatingTable = Record<string, DynamicRating>;

export interface MatchForecast {
  lambdaHome: number;
  lambdaAway: number;
  /** Marcador más probable (moda de cada Poisson). */
  scoreHome: number;
  scoreAway: number;
  /** Probabilidades del resultado a 90' (suman ~1). */
  probHome: number;
  probDraw: number;
  probAway: number;
}

// ── Línea base ───────────────────────────────────────────────────────────
/** Construye la tabla de ratings en t=0 a partir de la data estática. */
export function baselineRatings(): RatingTable {
  const table: RatingTable = {};
  for (const t of teams) {
    const r = teamRatings[t.id];
    table[t.id] = r ? { elo: r.fifaPoints, attack: r.attack, defense: r.defense } : { ...NEUTRAL };
  }
  return table;
}

// ── Poisson ─────────────────────────────────────────────────────────────
function factorial(n: number): number {
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
}

function poissonPmf(k: number, lambda: number): number {
  return (Math.exp(-lambda) * lambda ** k) / factorial(k);
}

/** Moda de una Poisson(λ): el número de goles más probable. */
export function poissonMode(lambda: number): number {
  return Math.max(0, Math.floor(lambda));
}

/**
 * Goles esperados (xG) de un equipo, según el informe:
 *   λ = 1.35 · (Ataque / 75) · ((150 − Defensa_rival) / Defensa_rival)
 * Verificado con el ejemplo Francia (Atk 94) vs Arabia (Def 64) → 2.27.
 */
export function expectedGoals(attack: number, oppDefense: number, hostFactor = 1): number {
  return (
    AVG_GOALS *
    (attack / RATING_BASELINE) *
    ((2 * RATING_BASELINE - oppDefense) / oppDefense) *
    hostFactor
  );
}

const isHost = (id: string, oppId: string): boolean => HOSTS.has(id) && !HOSTS.has(oppId);

const ratingOf = (table: RatingTable, id: string): DynamicRating => table[id] ?? NEUTRAL;

/** Proyecta un partido: xG, marcador más probable y probabilidades de resultado. */
export function forecastMatch(table: RatingTable, homeId: string, awayId: string): MatchForecast {
  const h = ratingOf(table, homeId);
  const a = ratingOf(table, awayId);
  const lambdaHome = expectedGoals(
    h.attack,
    a.defense,
    isHost(homeId, awayId) ? HOST_GOAL_FACTOR : 1,
  );
  const lambdaAway = expectedGoals(
    a.attack,
    h.defense,
    isHost(awayId, homeId) ? HOST_GOAL_FACTOR : 1,
  );

  let probHome = 0;
  let probDraw = 0;
  let probAway = 0;
  const homePmf = Array.from({ length: MAX_GOALS + 1 }, (_, i) => poissonPmf(i, lambdaHome));
  const awayPmf = Array.from({ length: MAX_GOALS + 1 }, (_, j) => poissonPmf(j, lambdaAway));
  for (let i = 0; i <= MAX_GOALS; i++) {
    for (let j = 0; j <= MAX_GOALS; j++) {
      const p = homePmf[i] * awayPmf[j];
      if (i > j) probHome += p;
      else if (i === j) probDraw += p;
      else probAway += p;
    }
  }
  // Renormalizar: la matriz se trunca en MAX_GOALS, así que su masa es <1. Dividir por
  // el total hace que las tres probabilidades sumen exactamente 1 (clave para la
  // confianza que se muestra en pantalla cuando λ es alto tras la recalibración).
  const total = probHome + probDraw + probAway || 1;

  return {
    lambdaHome,
    lambdaAway,
    scoreHome: poissonMode(lambdaHome),
    scoreAway: poissonMode(lambdaAway),
    probHome: probHome / total,
    probDraw: probDraw / total,
    probAway: probAway / total,
  };
}

/**
 * Probabilidad de AVANZAR de cada lado en un cruce de eliminatorias: reparte la masa
 * de empate (prórroga/penales) en proporción a la fuerza relativa. Suman 1.
 */
export function advanceProbabilities(f: MatchForecast): { home: number; away: number } {
  const decisive = f.probHome + f.probAway;
  const homeShare = decisive > 0 ? f.probHome / decisive : 0.5;
  const home = f.probHome + f.probDraw * homeShare;
  return { home, away: 1 - home };
}

// ── Retroalimentación (Elo + atributos) ────────────────────────────────────
/** Multiplicador por diferencia de goles del Elo mundialista (informe / eloratings). */
function goalDiffMultiplier(goalDiff: number): number {
  const d = Math.abs(goalDiff);
  if (d <= 1) return 1;
  if (d === 2) return 1.5;
  if (d === 3) return 1.75;
  return (11 + d) / 8; // 4+ goles
}

const clampRating = (x: number): number => Math.min(RATING_MAX, Math.max(RATING_MIN, x));

/**
 * Aplica UN resultado real a la tabla de ratings (la muta):
 *  - actualiza el Elo de ambos equipos (R' = R + K·G·(S − E)), y
 *  - retropropaga la "sorpresa" de goles hacia Ataque (propio) y Defensa (rival).
 * `homeId`/`awayId` y `hg`/`ag` están en NUESTRA orientación (home/away del dataset).
 */
export function applyResult(
  table: RatingTable,
  homeId: string,
  awayId: string,
  hg: number,
  ag: number,
): void {
  const h = table[homeId];
  const a = table[awayId];
  if (!h || !a) return;

  // 1) Elo (con bonificación de localía para el anfitrión).
  const eloHome = h.elo + (isHost(homeId, awayId) ? HOME_ELO_BONUS : 0);
  const eloAway = a.elo + (isHost(awayId, homeId) ? HOME_ELO_BONUS : 0);
  const expHome = 1 / (1 + Math.pow(10, -(eloHome - eloAway) / 400));
  const sHome = hg > ag ? 1 : hg === ag ? 0.5 : 0;
  const delta = K_FACTOR * goalDiffMultiplier(hg - ag) * (sHome - expHome);
  h.elo += delta;
  a.elo -= delta;

  // 2) Retropropagación de la sorpresa de goles (con los atributos PREVIOS al partido).
  const lambdaHome = expectedGoals(
    h.attack,
    a.defense,
    isHost(homeId, awayId) ? HOST_GOAL_FACTOR : 1,
  );
  const lambdaAway = expectedGoals(
    a.attack,
    h.defense,
    isHost(awayId, homeId) ? HOST_GOAL_FACTOR : 1,
  );
  const surpriseHome = hg - lambdaHome; // el local marcó más/menos de lo esperado
  const surpriseAway = ag - lambdaAway;
  h.attack = clampRating(h.attack + LEARNING_RATE * surpriseHome);
  a.defense = clampRating(a.defense - LEARNING_RATE * surpriseHome);
  a.attack = clampRating(a.attack + LEARNING_RATE * surpriseAway);
  h.defense = clampRating(h.defense - LEARNING_RATE * surpriseAway);
}

/**
 * Recalibra la línea base con TODOS los resultados reales jugados (en orden de
 * partido). Devuelve una tabla nueva; no muta la base. Es la pieza que hace que las
 * proyecciones "contemplen los resultados reales que van sucediendo".
 */
export function adjustRatingsFromOfficial(official: Record<string, OfficialResult>): RatingTable {
  const table = baselineRatings();
  const entries = Object.entries(official).filter(([, r]) => r.status === 'FINISHED');
  if (entries.length === 0) return table;

  // Resolver los equipos de eliminatorias jugadas a partir de un bracket "solo real".
  const realGroups: Record<string, GroupResult> = {};
  const realPicks: Record<string, string> = {};
  for (const [id, r] of entries) {
    const m = matchesById[id];
    if (!m) continue;
    if (m.stage === 'group') realGroups[id] = { homeGoals: r.homeGoals, awayGoals: r.awayGoals };
    else if (r.winnerCode) realPicks[id] = r.winnerCode;
  }
  const view = computeBracket(realGroups, realPicks);

  const ordered = [...groupStageMatches, ...knockoutStageMatches].sort(
    (x, y) => x.number - y.number,
  );
  for (const m of ordered) {
    const r = official[m.id];
    if (!r || r.status !== 'FINISHED') continue;
    let homeId: string | null = null;
    let awayId: string | null = null;
    if (m.stage === 'group') {
      homeId = m.home.kind === 'team' ? m.home.teamId : null;
      awayId = m.away.kind === 'team' ? m.away.teamId : null;
    } else {
      const k = view.knockout[m.id];
      homeId = k?.homeTeamId ?? null;
      awayId = k?.awayTeamId ?? null;
    }
    if (!homeId || !awayId) continue;
    applyResult(table, homeId, awayId, r.homeGoals, r.awayGoals);
  }
  return table;
}

// ── Proyección de la simulación completa ───────────────────────────────────
/** Decide, de forma determinística, qué equipo avanza en un cruce. */
export function projectWinner(table: RatingTable, homeId: string, awayId: string): string {
  const f = forecastMatch(table, homeId, awayId);
  if (f.scoreHome !== f.scoreAway) return f.scoreHome > f.scoreAway ? homeId : awayId;
  const adv = advanceProbabilities(f);
  if (adv.home !== adv.away) return adv.home > adv.away ? homeId : awayId;
  const eloHome = ratingOf(table, homeId).elo + (isHost(homeId, awayId) ? HOME_ELO_BONUS : 0);
  const eloAway = ratingOf(table, awayId).elo + (isHost(awayId, homeId) ? HOME_ELO_BONUS : 0);
  if (eloHome !== eloAway) return eloHome > eloAway ? homeId : awayId;
  return homeId <= awayId ? homeId : awayId; // desempate estable final
}

export interface ProjectedSimulation {
  groupResults: Record<string, GroupResult>;
  knockoutPicks: Record<string, string>;
}

/**
 * Completa la simulación del usuario con la PROYECCIÓN del modelo:
 *  - respeta los resultados reales (no los toca) y lo que el usuario ya cargó;
 *  - rellena el resto de grupos con el marcador más probable;
 *  - resuelve las eliminatorias eligiendo en cada cruce al equipo proyectado ganador.
 * Los ratings se recalibran antes con los resultados reales (auto-actualización).
 */
export function projectSimulation(
  userGroups: Record<string, GroupResult>,
  userPicks: Record<string, string>,
  official: Record<string, OfficialResult> = {},
): ProjectedSimulation {
  const { locked } = mergeOfficial(userGroups, userPicks, official);
  const table = adjustRatingsFromOfficial(official);

  // 1) Grupos: proyectar lo que no esté jugado ni cargado por el usuario.
  const groupResults = { ...userGroups };
  for (const m of groupStageMatches) {
    if (locked.has(m.id) || groupResults[m.id]) continue;
    if (m.home.kind !== 'team' || m.away.kind !== 'team') continue;
    const f = forecastMatch(table, m.home.teamId, m.away.teamId);
    groupResults[m.id] = { homeGoals: f.scoreHome, awayGoals: f.scoreAway };
  }

  // 2) Eliminatorias: iterar para que cada ronda resuelta alimente la siguiente.
  const knockoutPicks = { ...userPicks };
  for (let iter = 0; iter < 8; iter++) {
    const merged = mergeOfficial(groupResults, knockoutPicks, official);
    const view = computeBracket(merged.groupResults, merged.picks);
    for (const m of knockoutStageMatches) {
      if (locked.has(m.id)) continue;
      const k = view.knockout[m.id];
      if (!k.homeTeamId || !k.awayTeamId) continue;
      // Respetar un pick del usuario sólo si sigue siendo VÁLIDO para los equipos que
      // hoy resuelven el cruce. Un pick "rancio" (p. ej. tras editar un grupo y que
      // avance otro equipo) se descarta y se re-proyecta; de lo contrario bloquearía
      // la cadena hasta la final y "Proyectar" no daría campeón.
      const pick = knockoutPicks[m.id];
      if (pick === k.homeTeamId || pick === k.awayTeamId) continue;
      knockoutPicks[m.id] = projectWinner(table, k.homeTeamId, k.awayTeamId);
    }
  }

  return { groupResults, knockoutPicks };
}

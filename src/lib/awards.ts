import type { Match, OfficialResult, ScorerEntry, Stage } from '@/types';
import type { BracketView } from '@/lib/bracket';
import { matches, knockoutStageMatches } from '@/data/matches';
import { championOf } from '@/lib/bracket';

/**
 * Premios DERIVADOS de los resultados reales (sin pedir nada extra a la API):
 *  - Guante de Oro: valla menos vencida (vallas invictas + goles recibidos) por equipo.
 *  - Dinero por fase: fase máxima alcanzada por cada selección → premio garantizado.
 * Más el filtro del Mejor Jugador Joven sobre los goleadores. Código puro y testeable.
 */

// ── Guante de Oro (valla menos vencida) ──────────────────────────────────────

export interface GkRow {
  teamId: string;
  played: number;
  goalsAgainst: number;
  cleanSheets: number;
}

/** Equipos de un partido orientados a NUESTRO id (grupos = estático; eliminatorias = bracket). */
function teamIdsOf(m: Match, view: BracketView): [string | null, string | null] {
  if (m.stage === 'group') {
    return [
      m.home.kind === 'team' ? m.home.teamId : null,
      m.away.kind === 'team' ? m.away.teamId : null,
    ];
  }
  const r = view.knockout[m.id];
  return [r?.homeTeamId ?? null, r?.awayTeamId ?? null];
}

/**
 * Goles recibidos y vallas invictas por equipo en TODOS los partidos jugados
 * (grupos + eliminatorias). Ordena por vallas invictas ↓, goles recibidos ↑, PJ ↑.
 */
export function computeGoalkeeping(
  official: Record<string, OfficialResult>,
  view: BracketView,
): GkRow[] {
  const acc = new Map<string, GkRow>();
  const bump = (teamId: string | null, conceded: number) => {
    if (!teamId) return;
    const r = acc.get(teamId) ?? { teamId, played: 0, goalsAgainst: 0, cleanSheets: 0 };
    r.played += 1;
    r.goalsAgainst += conceded;
    if (conceded === 0) r.cleanSheets += 1;
    acc.set(teamId, r);
  };

  for (const m of matches) {
    const o = official[m.id];
    if (!o || o.status !== 'FINISHED') continue;
    const [home, away] = teamIdsOf(m, view);
    bump(home, o.awayGoals); // el local recibe los goles del visitante
    bump(away, o.homeGoals);
  }

  return [...acc.values()].sort(
    (a, b) =>
      b.cleanSheets - a.cleanSheets ||
      a.goalsAgainst - b.goalsAgainst ||
      a.played - b.played ||
      a.teamId.localeCompare(b.teamId),
  );
}

// ── Mejor Jugador Joven (estimación) ─────────────────────────────────────────

/** Regla del Mundial 2026: nacidos el 1/1/2005 o después (sub-21). */
export const YOUNG_CUTOFF = '2005-01-01';

/** ¿El goleador califica para "joven"? (comparación lexicográfica de ISO yyyy-mm-dd). */
export function isYoungPlayer(s: ScorerEntry): boolean {
  return Boolean(s.dateOfBirth) && (s.dateOfBirth as string) >= YOUNG_CUTOFF;
}

// ── Dinero por fase ──────────────────────────────────────────────────────────

/** Premio garantizado por fase alcanzada, en millones de USD (montos de referencia). */
export const PRIZE_TIERS: { key: Stage | 'champion'; label: string; millions: number }[] = [
  { key: 'group', label: 'Fase de grupos', millions: 10 },
  { key: 'R32', label: 'Dieciseisavos', millions: 11 },
  { key: 'R16', label: 'Octavos', millions: 15 },
  { key: 'QF', label: 'Cuartos', millions: 21 },
  { key: 'SF', label: 'Semifinal', millions: 30 },
  { key: 'final', label: 'Final', millions: 45 },
  { key: 'champion', label: 'Campeón', millions: 60 },
];

const STAGE_RANK: Record<string, number> = { R32: 1, R16: 2, QF: 3, SF: 4, third: 4, final: 5 };

export interface PrizeRow {
  teamId: string;
  /** Etiqueta de la fase máxima alcanzada. */
  label: string;
  millions: number;
}

/**
 * Fase máxima alcanzada por cada selección que ya llegó a eliminatorias (un equipo
 * "alcanza" una fase si está resuelto como participante de ese cruce). Vacío durante
 * la fase de grupos. El campeón (final ya definida) se marca aparte.
 */
export function computePrizeMoney(view: BracketView): PrizeRow[] {
  const best: Record<string, Stage> = {};
  for (const m of knockoutStageMatches) {
    const r = view.knockout[m.id];
    if (!r) continue;
    for (const tid of [r.homeTeamId, r.awayTeamId]) {
      if (!tid) continue;
      if (!best[tid] || STAGE_RANK[m.stage] > STAGE_RANK[best[tid]]) best[tid] = m.stage;
    }
  }

  const champion = championOf(view);
  const tierFor = (key: Stage | 'champion') => PRIZE_TIERS.find((t) => t.key === key)!;

  const rows: PrizeRow[] = Object.entries(best).map(([teamId, stage]) => {
    if (teamId === champion) {
      const t = tierFor('champion');
      return { teamId, label: t.label, millions: t.millions };
    }
    // `third` (juego por el 3.º) y `SF` se muestran como "Semifinal".
    const key: Stage | 'champion' = stage === 'third' ? 'SF' : stage;
    const t = tierFor(key);
    return { teamId, label: t.label, millions: t.millions };
  });

  return rows.sort((a, b) => b.millions - a.millions || a.teamId.localeCompare(b.teamId));
}

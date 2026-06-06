import type { Match } from '@/types';
import { matchesById } from '@/data/matches';

/**
 * Disposición de la llave para dibujarla como árbol.
 *
 * Recorre el árbol desde la final (M104) siguiendo las referencias `winnerOf`,
 * de modo que dentro de cada ronda los partidos queden ordenados de arriba hacia
 * abajo tal como se conectan: el cruce N de una ronda se alimenta de los cruces
 * 2N y 2N+1 de la ronda anterior. Así, con columnas de igual alto y reparto
 * uniforme, cada partido queda centrado entre los dos que lo alimentan.
 *
 * El 3.er puesto se devuelve aparte (no forma parte del árbol principal).
 */
export interface BracketColumn {
  key: 'R32' | 'R16' | 'QF' | 'SF' | 'final';
  label: string;
  matches: Match[];
}

const COLUMN_LABELS: Record<BracketColumn['key'], string> = {
  R32: '16avos',
  R16: 'Octavos',
  QF: 'Cuartos',
  SF: 'Semis',
  final: 'Final',
};

export function buildBracketColumns(): { columns: BracketColumn[]; thirdPlace: Match | null } {
  const byStage: Record<BracketColumn['key'], Match[]> = {
    R32: [],
    R16: [],
    QF: [],
    SF: [],
    final: [],
  };

  const visit = (id: string) => {
    const m = matchesById[id];
    if (!m) return;
    // Recursión a los alimentadores primero (izquierda y luego derecha): así el
    // orden de cada ronda queda de arriba hacia abajo.
    if (m.home.kind === 'winnerOf') visit(m.home.matchId);
    if (m.away.kind === 'winnerOf') visit(m.away.matchId);
    const bucket = byStage[m.stage as BracketColumn['key']];
    if (bucket) bucket.push(m);
  };

  visit('M104'); // raíz = final

  const columns = (Object.keys(byStage) as BracketColumn['key'][]).map((key) => ({
    key,
    label: COLUMN_LABELS[key],
    matches: byStage[key],
  }));

  return { columns, thirdPlace: matchesById['M103'] ?? null };
}

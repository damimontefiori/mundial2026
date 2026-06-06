import { describe, expect, it } from 'vitest';
import { buildBracketColumns } from './bracketLayout';

describe('buildBracketColumns', () => {
  it('arma 5 columnas con 16/8/4/2/1 partidos y el 3.er puesto aparte', () => {
    const { columns, thirdPlace } = buildBracketColumns();
    expect(columns.map((c) => c.matches.length)).toEqual([16, 8, 4, 2, 1]);
    expect(columns.map((c) => c.key)).toEqual(['R32', 'R16', 'QF', 'SF', 'final']);
    expect(thirdPlace?.id).toBe('M103');
  });

  it('el orden cierra el árbol: cada cruce se alimenta de los dos anteriores adyacentes', () => {
    type BracketKey = 'R32' | 'R16' | 'QF' | 'SF' | 'final';
    const { columns } = buildBracketColumns();
    const byKey = Object.fromEntries(columns.map((c) => [c.key, c.matches]));
    const pairs: [BracketKey, BracketKey][] = [
      ['R16', 'R32'],
      ['QF', 'R16'],
      ['SF', 'QF'],
      ['final', 'SF'],
    ];
    for (const [parentKey, childKey] of pairs) {
      const parents = byKey[parentKey];
      const children = byKey[childKey];
      parents.forEach((parent, i) => {
        const feeders = [parent.home, parent.away]
          .filter((s) => s.kind === 'winnerOf')
          .map((s) => (s.kind === 'winnerOf' ? s.matchId : ''));
        // Los alimentadores del cruce i deben ser los hijos 2i y 2i+1.
        expect(new Set(feeders)).toEqual(new Set([children[2 * i].id, children[2 * i + 1].id]));
      });
    }
  });
});

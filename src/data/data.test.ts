import { describe, expect, it } from 'vitest';
import { validateData } from './validate';
import { matches, matchesOfGroup } from './matches';
import { groups } from './groups';

describe('integridad de datos', () => {
  it('los datasets curados son consistentes (sin problemas)', () => {
    const issues = validateData();
    expect(issues).toEqual([]);
  });

  it('hay 104 partidos numerados 1..104', () => {
    expect(matches).toHaveLength(104);
    expect(matches[0].number).toBe(1);
    expect(matches[matches.length - 1].number).toBe(104);
  });

  it('cada grupo tiene exactamente 6 partidos y 3 jornadas', () => {
    for (const g of groups) {
      const gm = matchesOfGroup(g.id);
      expect(gm).toHaveLength(6);
      expect(new Set(gm.map((m) => m.matchday))).toEqual(new Set([1, 2, 3]));
    }
  });

  it('cada equipo juega 3 partidos en la fase de grupos', () => {
    for (const g of groups) {
      const counts: Record<string, number> = {};
      for (const m of matchesOfGroup(g.id)) {
        if (m.home.kind === 'team') counts[m.home.teamId] = (counts[m.home.teamId] ?? 0) + 1;
        if (m.away.kind === 'team') counts[m.away.teamId] = (counts[m.away.teamId] ?? 0) + 1;
      }
      for (const teamId of g.teamIds) {
        expect(counts[teamId]).toBe(3);
      }
    }
  });
});

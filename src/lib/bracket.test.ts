import { describe, expect, it } from 'vitest';
import type { GroupId, GroupResult } from '@/types';
import { groups } from '@/data/groups';
import { knockoutStageMatches, matchesOfGroup } from '@/data/matches';
import { allocateThirds, championOf, computeBracket } from './bracket';

/**
 * Genera resultados de toda la fase de grupos donde, en cada grupo, el equipo
 * mejor sembrado (índice 0) gana, seguido por 1, 2 y 3. Así todos los grupos
 * quedan completos y el 3.º de cada grupo es determinístico.
 */
function fullGroupResults(): Record<string, GroupResult> {
  const results: Record<string, GroupResult> = {};
  for (const g of groups) {
    for (const m of matchesOfGroup(g.id)) {
      if (m.home.kind !== 'team' || m.away.kind !== 'team') continue;
      const hi = g.teamIds.indexOf(m.home.teamId);
      const ai = g.teamIds.indexOf(m.away.teamId);
      results[m.id] =
        hi < ai ? { homeGoals: 4 - hi, awayGoals: 0 } : { homeGoals: 0, awayGoals: 4 - ai };
    }
  }
  return results;
}

/** Simula la llave completa eligiendo siempre al equipo local de cada cruce. */
function playThrough() {
  const results = fullGroupResults();
  const picks: Record<string, string> = {};
  let view = computeBracket(results, picks);
  for (let iter = 0; iter < 8; iter++) {
    for (const m of knockoutStageMatches) {
      const r = view.knockout[m.id];
      if (r.homeTeamId && r.awayTeamId && !picks[m.id]) picks[m.id] = r.homeTeamId;
    }
    view = computeBracket(results, picks);
  }
  return view;
}

describe('computeBracket', () => {
  it('con grupos incompletos no resuelve los cruces de eliminatorias', () => {
    const view = computeBracket({}, {});
    expect(view.allGroupsComplete).toBe(false);
    expect(view.qualifiedThirdGroups).toEqual([]);
    expect(championOf(view)).toBeNull();
    expect(view.knockout['M73'].homeTeamId).toBeNull();
  });

  it('con todos los grupos completos clasifica 8 terceros y completa R32', () => {
    const results = fullGroupResults();
    const view = computeBracket(results, {});
    expect(view.allGroupsComplete).toBe(true);
    expect(view.qualifiedThirdGroups).toHaveLength(8);
    expect(Object.keys(view.thirdAllocation)).toHaveLength(8);

    // Todos los Dieciseisavos tienen ambos equipos resueltos.
    const r32 = knockoutStageMatches.filter((m) => m.stage === 'R32');
    for (const m of r32) {
      const r = view.knockout[m.id];
      expect(r.homeTeamId, `${m.id} home`).not.toBeNull();
      expect(r.awayTeamId, `${m.id} away`).not.toBeNull();
    }
  });

  it('la asignación de terceros respeta los grupos permitidos por cada cupo', () => {
    const results = fullGroupResults();
    const view = computeBracket(results, {});
    for (const m of knockoutStageMatches) {
      if (m.away.kind !== 'thirdFrom') continue;
      const assigned = view.thirdAllocation[m.id];
      expect(assigned).toBeDefined();
      expect(m.away.groups).toContain(assigned as GroupId);
      // El cupo excluye al grupo del equipo local (evita revancha).
      if (m.home.kind === 'groupWinner') {
        expect(assigned).not.toBe(m.home.group);
      }
    }
  });

  it('jugando toda la llave se obtiene un campeón', () => {
    const view = playThrough();
    const champion = championOf(view);
    expect(champion).not.toBeNull();
    // El finalista perdedor y el 3.er puesto también quedan definidos.
    expect(view.knockout['M104'].homeTeamId).not.toBeNull();
    expect(view.knockout['M104'].awayTeamId).not.toBeNull();
    expect(view.knockout['M103'].winnerTeamId).not.toBeNull();
  });
});

describe('allocateThirds', () => {
  it('encuentra una asignación válida para cualquier combinación de 8 de 12', () => {
    const slots = knockoutStageMatches
      .filter((m) => m.away.kind === 'thirdFrom')
      .map((m) => ({
        matchId: m.id,
        allowed: m.away.kind === 'thirdFrom' ? m.away.groups : [],
      }));
    // Tomamos 8 grupos cualesquiera.
    const qualified: GroupId[] = ['A', 'C', 'E', 'G', 'I', 'K', 'B', 'D'];
    const allocation = allocateThirds(qualified, slots);
    expect(allocation).not.toBeNull();
    expect(Object.keys(allocation!)).toHaveLength(8);
    // Cada grupo asignado es único.
    const assignedGroups = Object.values(allocation!);
    expect(new Set(assignedGroups).size).toBe(8);
  });
});

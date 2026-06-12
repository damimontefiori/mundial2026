import { describe, expect, it } from 'vitest';
import type { GroupResult } from '@/types';
import { groups } from '@/data/groups';
import { knockoutStageMatches, matchesOfGroup, matchesById } from '@/data/matches';
import { computeBracket } from '@/lib/bracket';
import { apiToOfficial, resolveTeamId, type ApiMatchLite } from './ingestApiResults';

/** Resultados de grupos donde gana el mejor sembrado (índice 0 > 1 > 2 > 3). */
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

/** Juega toda la llave eligiendo siempre al local; devuelve la vista resuelta. */
function playThrough(results: Record<string, GroupResult>) {
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

/** Construye partidos "de la API" a partir de una realidad conocida. */
function buildApiMatches(results: Record<string, GroupResult>, swapOne = false): ApiMatchLite[] {
  const api: ApiMatchLite[] = [];

  // Grupos
  let swapped = false;
  for (const g of groups) {
    for (const m of matchesOfGroup(g.id)) {
      if (m.home.kind !== 'team' || m.away.kind !== 'team') continue;
      const r = results[m.id];
      const homeId = m.home.teamId;
      const awayId = m.away.teamId;
      const doSwap = swapOne && !swapped;
      if (doSwap) swapped = true;
      api.push({
        utcDate: m.kickoffUTC,
        status: 'FINISHED',
        stage: 'GROUP_STAGE',
        group: `GROUP_${g.id}`,
        homeTeam: { tla: doSwap ? awayId : homeId },
        awayTeam: { tla: doSwap ? homeId : awayId },
        score: {
          winner:
            r.homeGoals === r.awayGoals
              ? 'DRAW'
              : (r.homeGoals > r.awayGoals) !== doSwap
                ? 'HOME_TEAM'
                : 'AWAY_TEAM',
          fullTime: doSwap
            ? { home: r.awayGoals, away: r.homeGoals }
            : { home: r.homeGoals, away: r.awayGoals },
        },
      });
    }
  }

  // Eliminatorias
  const view = playThrough(results);
  for (const m of knockoutStageMatches) {
    const r = view.knockout[m.id];
    if (!r.homeTeamId || !r.awayTeamId || !r.winnerTeamId) continue;
    const winnerIsHome = r.winnerTeamId === r.homeTeamId;
    api.push({
      utcDate: m.kickoffUTC,
      status: 'FINISHED',
      stage: m.stage === 'final' ? 'FINAL' : 'KNOCKOUT',
      group: null,
      homeTeam: { tla: r.homeTeamId },
      awayTeam: { tla: r.awayTeamId },
      score: {
        winner: winnerIsHome ? 'HOME_TEAM' : 'AWAY_TEAM',
        fullTime: winnerIsHome ? { home: 2, away: 1 } : { home: 1, away: 2 },
      },
    });
  }

  return api;
}

describe('resolveTeamId', () => {
  it('resuelve por tla (código FIFA = nuestro id)', () => {
    expect(resolveTeamId({ tla: 'ARG' })).toBe('ARG');
    expect(resolveTeamId({ tla: 'BRA' })).toBe('BRA');
  });
  it('resuelve por nombre en inglés cuando no hay tla', () => {
    expect(resolveTeamId({ name: 'Brazil' })).toBe('BRA');
    expect(resolveTeamId({ name: 'South Korea' })).toBe('KOR');
    expect(resolveTeamId({ name: 'Czech Republic' })).toBe('CZE');
    expect(resolveTeamId({ name: 'United States' })).toBe('USA');
  });
  it('devuelve null si no reconoce', () => {
    expect(resolveTeamId({ name: 'Atlantis' })).toBeNull();
    expect(resolveTeamId(undefined)).toBeNull();
  });
});

describe('apiToOfficial', () => {
  it('mapea los 72 partidos de grupos por par de equipos', () => {
    const results = fullGroupResults();
    const api = buildApiMatches(results).filter((m) => m.group);
    const official = apiToOfficial(api);
    const groupIds = Object.keys(official).filter((id) => matchesById[id].stage === 'group');
    expect(groupIds).toHaveLength(72);
    // El resultado guardado coincide con la realidad (orientado a nuestro home/away).
    for (const id of groupIds) {
      expect(official[id]).toMatchObject(results[id]);
      expect(official[id].status).toBe('FINISHED');
    }
  });

  it('orienta bien los goles aunque la API tenga el local/visitante invertido', () => {
    const results = fullGroupResults();
    const api = buildApiMatches(results, true).filter((m) => m.group);
    const official = apiToOfficial(api);
    // Todos deben seguir coincidiendo con la realidad pese al swap de uno.
    for (const id of Object.keys(official)) {
      expect(official[id]).toMatchObject(results[id]);
    }
  });

  it('no publica un partido FINISHED sin marcador todavía (lag del free tier)', () => {
    // La API a veces marca FINISHED antes de cargar los goles (fullTime en null). Eso
    // no debe publicar un 0-0 fantasma ni bloquear el partido.
    const m = matchesOfGroup('A').find((x) => x.home.kind === 'team' && x.away.kind === 'team')!;
    const homeId = m.home.kind === 'team' ? m.home.teamId : '';
    const awayId = m.away.kind === 'team' ? m.away.teamId : '';
    const base: ApiMatchLite = {
      utcDate: m.kickoffUTC,
      status: 'FINISHED',
      stage: 'GROUP_STAGE',
      group: 'GROUP_A',
      homeTeam: { tla: homeId },
      awayTeam: { tla: awayId },
      score: { winner: null, fullTime: { home: null, away: null } },
    };
    expect(apiToOfficial([base])[m.id]).toBeUndefined();

    // En cambio, un 0-0 legítimo (goles numéricos) sí se publica y se bloquea.
    const withScore: ApiMatchLite = {
      ...base,
      score: { winner: 'DRAW', fullTime: { home: 0, away: 0 } },
    };
    expect(apiToOfficial([withScore])[m.id]).toEqual({
      homeGoals: 0,
      awayGoals: 0,
      status: 'FINISHED',
    });
  });

  it('mapea toda la llave y reproduce los ganadores reales en el matchId correcto', () => {
    const results = fullGroupResults();
    const api = buildApiMatches(results);
    const official = apiToOfficial(api);
    const view = playThrough(results);

    // Los 104 partidos quedan mapeados.
    expect(Object.keys(official)).toHaveLength(104);

    // Cada cruce de eliminatorias tiene el ganador real correcto.
    for (const m of knockoutStageMatches) {
      const expectedWinner = view.knockout[m.id].winnerTeamId;
      expect(official[m.id]?.winnerCode, m.id).toBe(expectedWinner);
    }
  });
});

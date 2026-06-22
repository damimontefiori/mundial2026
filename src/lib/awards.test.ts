import { describe, expect, it } from 'vitest';
import type { OfficialResult, ScorerEntry } from '@/types';
import { computeBracket } from './bracket';
import { groupStageMatches } from '@/data/matches';
import { computeGoalkeeping, computePrizeMoney, isYoungPlayer } from './awards';

const fin = (homeGoals: number, awayGoals: number): OfficialResult => ({
  homeGoals,
  awayGoals,
  status: 'FINISHED',
});

describe('isYoungPlayer', () => {
  const base: ScorerEntry = {
    playerName: 'X',
    teamId: 'ARG',
    teamName: 'Argentina',
    nationality: null,
    dateOfBirth: null,
    goals: 1,
    assists: null,
    playedMatches: 1,
  };
  it('cumple si nació el 1/1/2005 o después', () => {
    expect(isYoungPlayer({ ...base, dateOfBirth: '2005-01-01' })).toBe(true);
    expect(isYoungPlayer({ ...base, dateOfBirth: '2007-09-10' })).toBe(true);
  });
  it('no cumple si nació antes, o si falta la fecha', () => {
    expect(isYoungPlayer({ ...base, dateOfBirth: '2004-12-31' })).toBe(false);
    expect(isYoungPlayer({ ...base, dateOfBirth: null })).toBe(false);
  });
});

describe('computeGoalkeeping', () => {
  it('cuenta vallas invictas y goles recibidos por equipo, y ordena valla menos vencida primero', () => {
    const view = computeBracket({}, {}); // sin eliminatorias resueltas; basta para grupos
    const m = groupStageMatches[0];
    const homeId = m.home.kind === 'team' ? m.home.teamId : '';
    const awayId = m.away.kind === 'team' ? m.away.teamId : '';

    const official: Record<string, OfficialResult> = { [m.id]: fin(2, 0) };
    const gk = computeGoalkeeping(official, view);

    const home = gk.find((r) => r.teamId === homeId)!;
    const away = gk.find((r) => r.teamId === awayId)!;
    expect(home).toMatchObject({ played: 1, goalsAgainst: 0, cleanSheets: 1 });
    expect(away).toMatchObject({ played: 1, goalsAgainst: 2, cleanSheets: 0 });
    // El local (valla invicta) va antes que el visitante (recibió 2).
    expect(gk[0].teamId).toBe(homeId);
  });

  it('ignora partidos no finalizados', () => {
    const view = computeBracket({}, {});
    const m = groupStageMatches[0];
    const official: Record<string, OfficialResult> = {
      [m.id]: { homeGoals: 1, awayGoals: 1, status: 'IN_PLAY' },
    };
    expect(computeGoalkeeping(official, view)).toEqual([]);
  });
});

describe('computePrizeMoney', () => {
  it('está vacío mientras no haya clasificados a eliminatorias', () => {
    expect(computePrizeMoney(computeBracket({}, {}))).toEqual([]);
  });
});

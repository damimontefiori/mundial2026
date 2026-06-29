import { describe, expect, it } from 'vitest';
import type { OfficialResult, ScorerEntry } from '@/types';
import { computeBracket } from './bracket';
import { computeMessiRecords } from './messiRecords';

const messi = (overrides: Partial<ScorerEntry> = {}): ScorerEntry => ({
  playerName: 'Lionel Messi',
  teamId: 'ARG',
  teamName: 'Argentina',
  nationality: 'Argentina',
  dateOfBirth: '1987-06-24',
  goals: 2,
  assists: 1,
  playedMatches: 3,
  ...overrides,
});

const fin = (homeGoals: number, awayGoals: number, winnerCode?: string): OfficialResult => ({
  homeGoals,
  awayGoals,
  status: 'FINISHED',
  winnerCode,
});

describe('computeMessiRecords', () => {
  it('combina baseline histórico con goles, asistencias, PJ y victorias del torneo actual', () => {
    const official: Record<string, OfficialResult> = {
      M19: fin(3, 0),
      M43: fin(2, 1),
      M70: fin(1, 1),
    };
    const view = computeBracket(
      {
        M19: { homeGoals: 3, awayGoals: 0 },
        M43: { homeGoals: 2, awayGoals: 1 },
        M70: { homeGoals: 1, awayGoals: 1 },
      },
      {},
    );

    const dashboard = computeMessiRecords([messi()], official, view);

    expect(dashboard.summary).toMatchObject({
      liveGoals: 2,
      liveAssists: 1,
      argentinaWins: 2,
      appearances: 3,
      worldCups: 6,
    });
    expect(dashboard.chasing.find((r) => r.id === 'goals')).toMatchObject({
      current: 15,
      status: 'pending',
    });
    expect(dashboard.chasing.find((r) => r.id === 'wins')).toMatchObject({
      current: 18,
      status: 'broken',
    });
    expect(dashboard.chasing.map((r) => r.id)).toEqual(['goals', 'wins', 'assists']);
    expect(dashboard.extending.find((r) => r.id === 'appearances')).toMatchObject({ current: 29 });
  });

  it('marca asistencias como dato oficial pendiente si no hay valor confirmado', () => {
    const dashboard = computeMessiRecords([messi({ assists: null })], {}, computeBracket({}, {}));
    const assists = dashboard.chasing.find((r) => r.id === 'assists');

    expect(assists).toMatchObject({
      current: null,
      live: null,
      status: 'unavailable',
      statusLabel: 'Dato oficial pendiente',
      note: 'Las asistencias oficiales 2026 todavía no están confirmadas en los datos disponibles.',
    });
  });
});

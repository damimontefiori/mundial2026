import { describe, expect, it } from 'vitest';
import type { OfficialResult } from '@/types';
import { mergeOfficial, hasOfficialResults } from './officialResults';

describe('mergeOfficial', () => {
  it('los resultados oficiales de grupos pisan y bloquean los del usuario', () => {
    const user = { M1: { homeGoals: 0, awayGoals: 0 } };
    const official: Record<string, OfficialResult> = {
      M1: { homeGoals: 2, awayGoals: 1, status: 'FINISHED' },
      M2: { homeGoals: 3, awayGoals: 0, status: 'FINISHED' },
    };
    const { groupResults, locked } = mergeOfficial(user, {}, official);
    expect(groupResults.M1).toEqual({ homeGoals: 2, awayGoals: 1 });
    expect(groupResults.M2).toEqual({ homeGoals: 3, awayGoals: 0 });
    expect(locked.has('M1')).toBe(true);
    expect(locked.has('M2')).toBe(true);
  });

  it('los partidos no FINISHED no afectan ni bloquean', () => {
    const official: Record<string, OfficialResult> = {
      M3: { homeGoals: 0, awayGoals: 0, status: 'IN_PLAY' },
      M4: { homeGoals: 0, awayGoals: 0, status: 'SCHEDULED' },
    };
    const { groupResults, picks, locked } = mergeOfficial({}, {}, official);
    expect(groupResults).toEqual({});
    expect(picks).toEqual({});
    expect(locked.size).toBe(0);
  });

  it('en eliminatorias usa winnerCode como pick y bloquea', () => {
    const official: Record<string, OfficialResult> = {
      M73: { homeGoals: 1, awayGoals: 0, status: 'FINISHED', winnerCode: 'ARG' },
    };
    const { picks, locked } = mergeOfficial({}, {}, official);
    expect(picks.M73).toBe('ARG');
    expect(locked.has('M73')).toBe(true);
  });

  it('conserva la simulación del usuario para partidos sin dato oficial', () => {
    const user = { M5: { homeGoals: 1, awayGoals: 1 } };
    const { groupResults } = mergeOfficial(user, {}, {});
    expect(groupResults.M5).toEqual({ homeGoals: 1, awayGoals: 1 });
  });

  it('hasOfficialResults detecta partidos jugados', () => {
    expect(hasOfficialResults({})).toBe(false);
    expect(hasOfficialResults({ M1: { homeGoals: 0, awayGoals: 0, status: 'TIMED' } })).toBe(false);
    expect(hasOfficialResults({ M1: { homeGoals: 1, awayGoals: 0, status: 'FINISHED' } })).toBe(
      true,
    );
  });
});

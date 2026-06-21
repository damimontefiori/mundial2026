import { describe, expect, it } from 'vitest';
import type { OfficialResult } from '@/types';
import { liveStatus } from './liveClock';

const KICK = '2026-06-20T18:00:00Z';
const base: OfficialResult = { homeGoals: 0, awayGoals: 0, status: 'IN_PLAY' };
const at = (iso: string) => new Date(iso);

describe('liveStatus', () => {
  it('devuelve null si el partido no está en curso', () => {
    expect(liveStatus(undefined, KICK, at('2026-06-20T18:10:00Z'))).toBeNull();
    expect(liveStatus({ ...base, status: 'FINISHED' }, KICK, at('2026-06-20T18:30:00Z'))).toBeNull();
    expect(liveStatus({ ...base, status: 'TIMED' }, KICK, at('2026-06-20T17:00:00Z'))).toBeNull();
  });

  it('IN_PLAY sin entretiempo registrado → Primer tiempo', () => {
    expect(liveStatus(base, KICK, at('2026-06-20T18:20:00Z'))).toEqual({
      phase: 'first',
      label: 'Primer tiempo',
    });
  });

  it('PAUSED → Entretiempo', () => {
    expect(liveStatus({ ...base, status: 'PAUSED' }, KICK, at('2026-06-20T18:47:00Z'))).toEqual({
      phase: 'half',
      label: 'Entretiempo',
    });
  });

  it('IN_PLAY con halfTime (o ancla de 2T) → Segundo tiempo', () => {
    expect(
      liveStatus({ ...base, halfTime: { homeGoals: 1, awayGoals: 0 } }, KICK, at('2026-06-20T19:10:00Z')),
    ).toEqual({ phase: 'second', label: 'Segundo tiempo' });
    expect(
      liveStatus({ ...base, secondHalfStartedAt: '2026-06-20T19:01:00Z' }, KICK, at('2026-06-20T19:05:00Z')),
    ).toEqual({ phase: 'second', label: 'Segundo tiempo' });
  });

  it('Alargue y Penales por duración', () => {
    expect(liveStatus({ ...base, duration: 'EXTRA_TIME' }, KICK, at('2026-06-20T20:00:00Z'))).toEqual({
      phase: 'extra',
      label: 'Alargue',
    });
    expect(
      liveStatus({ ...base, duration: 'PENALTY_SHOOTOUT' }, KICK, at('2026-06-20T20:10:00Z')),
    ).toEqual({ phase: 'penalties', label: 'Penales' });
  });

  it('cap por etapa: en vivo pasado el margen → Finalizado', () => {
    const maxGroup = 150 * 60 * 1000; // 2h30m
    expect(liveStatus(base, KICK, at('2026-06-20T20:45:00Z'), maxGroup)).toEqual({
      phase: 'finished',
      label: 'Finalizado',
    });
  });
});

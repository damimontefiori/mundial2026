import { describe, expect, it } from 'vitest';
import type { OfficialResult } from '@/types';
import { liveClock } from './liveClock';

const KICK = '2026-06-20T18:00:00Z';
const base: OfficialResult = { homeGoals: 0, awayGoals: 0, status: 'IN_PLAY' };
const at = (iso: string) => new Date(iso);

describe('liveClock', () => {
  it('devuelve null si el partido no está en curso', () => {
    expect(liveClock(undefined, KICK, at('2026-06-20T18:10:00Z'))).toBeNull();
    expect(liveClock({ ...base, status: 'FINISHED' }, KICK, at('2026-06-20T18:30:00Z'))).toBeNull();
    expect(liveClock({ ...base, status: 'TIMED' }, KICK, at('2026-06-20T17:00:00Z'))).toBeNull();
  });

  it('1er tiempo: cuenta desde el inicio programado (kickoff)', () => {
    expect(liveClock(base, KICK, at('2026-06-20T18:10:00Z'))).toEqual({
      phase: 'first',
      label: '10:00',
      ticking: true,
    });
  });

  it('1er tiempo más allá de 45 → "45+\'"', () => {
    expect(liveClock(base, KICK, at('2026-06-20T18:50:00Z'))?.label).toBe("45+'");
  });

  it('PAUSED → Entretiempo (no tickea)', () => {
    expect(liveClock({ ...base, status: 'PAUSED' }, KICK, at('2026-06-20T18:47:00Z'))).toEqual({
      phase: 'half',
      label: 'Entretiempo',
      ticking: false,
    });
  });

  it('2º tiempo con ancla: cuenta desde secondHalfStartedAt arrancando en 45', () => {
    const r = liveClock(
      { ...base, secondHalfStartedAt: '2026-06-20T19:01:00Z' },
      KICK,
      at('2026-06-20T19:06:00Z'),
    );
    expect(r).toEqual({ phase: 'second', label: '50:00', ticking: true });
  });

  it('REGRESIÓN: 2º tiempo sin ancla pero con entretiempo jugado → estima ~80, NO "45:00"', () => {
    const r = liveClock(
      { ...base, halfTime: { homeGoals: 0, awayGoals: 1 } },
      KICK,
      at('2026-06-20T19:35:00Z'), // 95 min transcurridos − 15 de descanso = 80'
    );
    expect(r).toEqual({ phase: 'second', label: '80:00', ticking: true });
  });

  it('alargue y penales por duración', () => {
    expect(liveClock({ ...base, duration: 'EXTRA_TIME' }, KICK, at('2026-06-20T20:00:00Z'))?.label).toBe(
      'Alargue',
    );
    expect(
      liveClock({ ...base, duration: 'PENALTY_SHOOTOUT' }, KICK, at('2026-06-20T20:10:00Z'))?.label,
    ).toBe('Penales');
  });

  it('cap por etapa: en vivo pasado el margen → Finalizado', () => {
    const maxGroup = 150 * 60 * 1000; // 2h30m
    const r = liveClock(base, KICK, at('2026-06-20T20:45:00Z'), maxGroup); // +2h45m > 2h30m
    expect(r).toEqual({ phase: 'finished', label: 'Finalizado', ticking: false });
  });
});

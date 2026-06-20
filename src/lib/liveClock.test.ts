import { describe, expect, it } from 'vitest';
import type { OfficialResult } from '@/types';
import { liveClock } from './liveClock';

const KICK = '2026-06-20T18:00:00Z';
const base: OfficialResult = { homeGoals: 0, awayGoals: 0, status: 'IN_PLAY' };
const at = (iso: string) => new Date(iso);

describe('liveClock', () => {
  it('devuelve null si el partido no está en curso', () => {
    expect(liveClock(undefined, KICK, at('2026-06-20T18:10:00Z'))).toBeNull();
    expect(liveClock({ ...base, status: 'FINISHED' }, KICK, at('2026-06-20T20:00:00Z'))).toBeNull();
    expect(liveClock({ ...base, status: 'TIMED' }, KICK, at('2026-06-20T17:00:00Z'))).toBeNull();
  });

  it('1er tiempo: cuenta desde liveStartedAt', () => {
    const r = liveClock(
      { ...base, liveStartedAt: '2026-06-20T18:01:00Z' },
      KICK,
      at('2026-06-20T18:11:00Z'),
    );
    expect(r).toEqual({ phase: 'first', label: '10:00', ticking: true });
  });

  it('1er tiempo más allá de 45 → "45+\'"', () => {
    const r = liveClock(
      { ...base, liveStartedAt: '2026-06-20T18:01:00Z' },
      KICK,
      at('2026-06-20T18:50:00Z'),
    );
    expect(r?.label).toBe("45+'");
  });

  it('PAUSED → Entretiempo (no tickea)', () => {
    const r = liveClock({ ...base, status: 'PAUSED' }, KICK, at('2026-06-20T18:47:00Z'));
    expect(r).toEqual({ phase: 'half', label: 'Entretiempo', ticking: false });
  });

  it('2do tiempo: cuenta desde secondHalfStartedAt arrancando en 45', () => {
    const r = liveClock(
      { ...base, secondHalfStartedAt: '2026-06-20T19:01:00Z' },
      KICK,
      at('2026-06-20T19:06:00Z'),
    );
    expect(r).toEqual({ phase: 'second', label: '50:00', ticking: true });
  });

  it('2do tiempo sin ancla pero con entretiempo jugado: estima restando el descanso', () => {
    const r = liveClock(
      { ...base, liveStartedAt: '2026-06-20T18:01:00Z', halfTime: { homeGoals: 1, awayGoals: 0 } },
      KICK,
      at('2026-06-20T19:11:00Z'), // 70' transcurridos − 15' descanso = 55'
    );
    expect(r).toEqual({ phase: 'second', label: '55:00', ticking: true });
  });

  it('alargue y penales por duración', () => {
    expect(liveClock({ ...base, duration: 'EXTRA_TIME' }, KICK, at('2026-06-20T20:00:00Z'))?.label).toBe(
      'Alargue',
    );
    expect(
      liveClock({ ...base, duration: 'PENALTY_SHOOTOUT' }, KICK, at('2026-06-20T20:10:00Z'))?.label,
    ).toBe('Penales');
  });

  it('en juego 3+ h después del inicio → Finalizado', () => {
    const r = liveClock(
      { ...base, liveStartedAt: '2026-06-20T18:01:00Z' },
      KICK,
      at('2026-06-20T22:30:00Z'),
    );
    expect(r).toEqual({ phase: 'finished', label: 'Finalizado', ticking: false });
  });
});

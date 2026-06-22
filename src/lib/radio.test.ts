import { describe, expect, it } from 'vitest';
import type { Match, OfficialResult } from '@/types';
import { activeRadioMatchId } from './radio';

// Match mínimo (solo los campos que usa la selección: id, stage, kickoffUTC).
const mk = (id: string, kickoffUTC: string): Match =>
  ({ id, stage: 'group', kickoffUTC }) as unknown as Match;

const fin: OfficialResult = { homeGoals: 1, awayGoals: 0, status: 'FINISHED' };
const live: OfficialResult = { homeGoals: 0, awayGoals: 0, status: 'IN_PLAY' };

describe('activeRadioMatchId', () => {
  const sorted = [
    mk('M1', '2026-06-22T15:00:00Z'),
    mk('M2', '2026-06-22T18:00:00Z'),
    mk('M3', '2026-06-22T21:00:00Z'),
  ];

  it('elige el primer partido por horario que aún no terminó', () => {
    // M1 finalizado → el activo es M2 (próximo).
    const official = { M1: fin };
    const now = new Date('2026-06-22T16:30:00Z');
    expect(activeRadioMatchId(sorted, official, now)).toBe('M2');
  });

  it('mientras un partido está en juego, el activo es ese (el más temprano no terminado)', () => {
    const official = { M1: fin, M2: live };
    const now = new Date('2026-06-22T18:30:00Z');
    expect(activeRadioMatchId(sorted, official, now)).toBe('M2');
  });

  it('si el feed quedó "en vivo" pasado el margen de la etapa, lo da por terminado', () => {
    // M1 sigue IN_PLAY pero ya pasaron > 2h30 (grupos) desde el kickoff → se salta a M2.
    const official = { M1: live };
    const now = new Date('2026-06-22T17:45:00Z'); // 2h45 después de las 15:00
    expect(activeRadioMatchId(sorted, official, now)).toBe('M2');
  });

  it('devuelve null si ya no quedan partidos por jugar', () => {
    const official = { M1: fin, M2: fin, M3: fin };
    const now = new Date('2026-06-23T00:00:00Z');
    expect(activeRadioMatchId(sorted, official, now)).toBeNull();
  });

  it('antes de empezar todo, el activo es el primero', () => {
    const now = new Date('2026-06-22T10:00:00Z');
    expect(activeRadioMatchId(sorted, {}, now)).toBe('M1');
  });
});

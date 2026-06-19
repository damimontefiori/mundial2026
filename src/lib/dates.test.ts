import { describe, expect, it } from 'vitest';
import { pastLiveWindow } from './dates';

describe('pastLiveWindow', () => {
  const kickoff = '2026-06-11T19:00:00Z';

  it('false durante la ventana razonable de un partido (≤ 3 h)', () => {
    expect(pastLiveWindow(kickoff, new Date('2026-06-11T19:30:00Z'))).toBe(false); // entretiempo
    expect(pastLiveWindow(kickoff, new Date('2026-06-11T21:30:00Z'))).toBe(false); // alargue/penales
  });

  it('true bastante después del inicio (ya terminó seguro)', () => {
    expect(pastLiveWindow(kickoff, new Date('2026-06-11T22:30:00Z'))).toBe(true); // +3.5 h
    expect(pastLiveWindow(kickoff, new Date('2026-06-12T03:00:00Z'))).toBe(true); // horas después
  });
});

import { describe, expect, it } from 'vitest';
import { buildScorers, type ApiScorer } from './ingestAwards';

describe('buildScorers', () => {
  it('mapea el equipo a nuestro id (por tla y por variante de nombre) y conserva los datos', () => {
    const raw: ApiScorer[] = [
      {
        player: { name: 'Messi', dateOfBirth: '1987-06-24', nationality: 'Argentina' },
        team: { tla: 'ARG', name: 'Argentina' },
        goals: 3,
        assists: 1,
        playedMatches: 2,
      },
      {
        // sin tla → debe resolver por la variante de nombre "brazil" → BRA
        player: { name: 'Endrick', dateOfBirth: '2006-07-21' },
        team: { name: 'Brazil' },
        goals: 5,
        assists: null,
        playedMatches: 3,
      },
    ];
    const out = buildScorers(raw);
    const endrick = out.find((s) => s.playerName === 'Endrick')!;
    const messi = out.find((s) => s.playerName === 'Messi')!;
    expect(endrick.teamId).toBe('BRA');
    expect(endrick.assists).toBeNull();
    expect(messi.teamId).toBe('ARG');
    expect(messi.dateOfBirth).toBe('1987-06-24');
  });

  it('ordena por goles ↓, luego asistencias ↓, luego menos PJ', () => {
    const raw: ApiScorer[] = [
      { player: { name: 'A' }, team: { tla: 'ARG' }, goals: 3, assists: 1, playedMatches: 2 },
      { player: { name: 'B' }, team: { tla: 'GER' }, goals: 3, assists: 2, playedMatches: 3 },
      { player: { name: 'C' }, team: { tla: 'ESP' }, goals: 5, assists: 0, playedMatches: 4 },
      { player: { name: 'D' }, team: { tla: 'FRA' }, goals: 3, assists: 1, playedMatches: 1 },
    ];
    const out = buildScorers(raw);
    // C (5 goles) primero; luego B (3,2); empatados A y D en (3,1) → menos PJ: D (1) antes que A (2).
    expect(out.map((s) => s.playerName)).toEqual(['C', 'B', 'D', 'A']);
  });

  it('descarta entradas sin nombre de jugador y tolera ausencia de campos', () => {
    const raw = [
      { team: { tla: 'ARG' }, goals: 2 }, // sin player.name → fuera
      { player: { name: 'X' }, team: { tla: 'ZZZ' } }, // equipo desconocido → teamId null, goles 0
    ] as ApiScorer[];
    const out = buildScorers(raw);
    expect(out).toHaveLength(1);
    expect(out[0].playerName).toBe('X');
    expect(out[0].teamId).toBeNull();
    expect(out[0].goals).toBe(0);
    expect(out[0].playedMatches).toBe(0);
  });

  it('no rompe con entrada vacía/undefined', () => {
    expect(buildScorers(undefined)).toEqual([]);
    expect(buildScorers([])).toEqual([]);
  });
});

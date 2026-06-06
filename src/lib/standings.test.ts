import { describe, expect, it } from 'vitest';
import type { GroupResult } from '@/types';
import { computeGroupStandings, groupProgress, isGroupComplete } from './standings';

describe('computeGroupStandings', () => {
  it('ordena por puntos, DG y GF (caso simple)', () => {
    // Grupo A: [MEX, RSA, KOR, CZE]. Partidos reales M1, M2, M25, M28, M53, M54.
    const results: Record<string, GroupResult> = {
      M1: { homeGoals: 2, awayGoals: 0 }, // MEX 2-0 RSA
      M2: { homeGoals: 2, awayGoals: 1 }, // KOR 2-1 CZE
      M25: { homeGoals: 2, awayGoals: 1 }, // CZE 2-1 RSA
      M28: { homeGoals: 1, awayGoals: 0 }, // MEX 1-0 KOR
      M53: { homeGoals: 0, awayGoals: 1 }, // CZE 0-1 MEX
      M54: { homeGoals: 0, awayGoals: 1 }, // RSA 0-1 KOR
    };
    const table = computeGroupStandings('A', results);
    expect(table.map((r) => r.teamId)).toEqual(['MEX', 'KOR', 'CZE', 'RSA']);
    expect(table.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
    expect(table[0].points).toBe(9);
    expect(table[0].goalDifference).toBe(4);
  });

  it('aplica desempate head-to-head cuando hay igualdad total', () => {
    // Grupo B: [CAN, BIH, QAT, SUI]. CAN y SUI quedan iguales en pts/DG/GF,
    // pero CAN le ganó a SUI en el cruce directo (M51) → CAN primero.
    const results: Record<string, GroupResult> = {
      M3: { homeGoals: 2, awayGoals: 0 }, // CAN 2-0 BIH
      M27: { homeGoals: 0, awayGoals: 1 }, // CAN 0-1 QAT
      M51: { homeGoals: 0, awayGoals: 1 }, // SUI 0-1 CAN
      M8: { homeGoals: 0, awayGoals: 1 }, // QAT 0-1 SUI
      M26: { homeGoals: 2, awayGoals: 0 }, // SUI 2-0 BIH
      M52: { homeGoals: 1, awayGoals: 1 }, // BIH 1-1 QAT
    };
    const table = computeGroupStandings('B', results);
    const can = table.find((r) => r.teamId === 'CAN')!;
    const sui = table.find((r) => r.teamId === 'SUI')!;
    // Igualdad total en los criterios generales:
    expect(can.points).toBe(sui.points);
    expect(can.goalDifference).toBe(sui.goalDifference);
    expect(can.goalsFor).toBe(sui.goalsFor);
    // El head-to-head desempata a favor de CAN:
    expect(can.rank).toBe(1);
    expect(sui.rank).toBe(2);
    expect(table[0].teamId).toBe('CAN');
  });

  it('reporta progreso y completitud del grupo', () => {
    expect(isGroupComplete('A', {})).toBe(false);
    expect(groupProgress('A', {})).toBe(0);
    const partial: Record<string, GroupResult> = { M1: { homeGoals: 1, awayGoals: 0 } };
    expect(groupProgress('A', partial)).toBe(1);
    expect(isGroupComplete('A', partial)).toBe(false);
  });
});

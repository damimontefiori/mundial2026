import { describe, expect, it } from 'vitest';
import type { OfficialResult } from '@/types';
import { groupStageMatches, knockoutStageMatches } from '@/data/matches';
import { teams } from '@/data/teams';
import { computeBracket, championOf } from './bracket';
import { mergeOfficial } from './officialResults';
import {
  adjustRatingsFromOfficial,
  advanceProbabilities,
  applyResult,
  baselineRatings,
  expectedGoals,
  forecastMatch,
  poissonMode,
  projectSimulation,
  projectWinner,
} from './predict';

const groupMatch = (homeId: string, awayId: string) =>
  groupStageMatches.find(
    (m) =>
      m.home.kind === 'team' &&
      m.away.kind === 'team' &&
      m.home.teamId === homeId &&
      m.away.teamId === awayId,
  );

describe('expectedGoals (xG de Poisson)', () => {
  it('reproduce el ejemplo del informe: Francia (Atk 94) vs Arabia (Def 64) ≈ 2.27', () => {
    expect(expectedGoals(94, 64)).toBeCloseTo(2.27, 2);
  });

  it('un equipo promedio contra una defensa promedio rinde la media del torneo (1.35)', () => {
    expect(expectedGoals(75, 75)).toBeCloseTo(1.35, 5);
  });

  it('mejor ataque ⇒ más xG; mejor defensa rival ⇒ menos xG', () => {
    expect(expectedGoals(90, 75)).toBeGreaterThan(expectedGoals(70, 75));
    expect(expectedGoals(75, 90)).toBeLessThan(expectedGoals(75, 60));
  });
});

describe('poissonMode', () => {
  it('es floor(λ) acotado a 0', () => {
    expect(poissonMode(2.27)).toBe(2);
    expect(poissonMode(0.42)).toBe(0);
    expect(poissonMode(1.0)).toBe(1);
  });
});

describe('forecastMatch', () => {
  it('el favorito tiene mayor probabilidad y marcador a favor', () => {
    const table = baselineRatings();
    const f = forecastMatch(table, 'FRA', 'KSA');
    expect(f.probHome).toBeGreaterThan(f.probAway);
    expect(f.scoreHome).toBeGreaterThanOrEqual(f.scoreAway);
    expect(f.probHome + f.probDraw + f.probAway).toBeCloseTo(1, 2);
  });

  it('Francia vs Arabia proyecta una goleada (2-0)', () => {
    const f = forecastMatch(baselineRatings(), 'FRA', 'KSA');
    expect(f.scoreHome).toBe(2);
    expect(f.scoreAway).toBe(0);
  });

  it('las probabilidades suman 1 incluso con λ alto (matriz truncada renormalizada)', () => {
    // Tabla extrema para forzar λ grande (ataque máximo vs defensa mínima).
    const extreme = baselineRatings();
    extreme.FRA = { elo: 2000, attack: 99, defense: 99 };
    extreme.HAI = { elo: 1000, attack: 40, defense: 40 };
    const f = forecastMatch(extreme, 'FRA', 'HAI');
    expect(f.lambdaHome).toBeGreaterThan(4); // régimen de cola no despreciable
    expect(f.probHome + f.probDraw + f.probAway).toBeCloseTo(1, 6);
  });
});

describe('advanceProbabilities', () => {
  it('suman 1 y favorecen al más fuerte', () => {
    const f = forecastMatch(baselineRatings(), 'ESP', 'CPV');
    const adv = advanceProbabilities(f);
    expect(adv.home + adv.away).toBeCloseTo(1, 6);
    expect(adv.home).toBeGreaterThan(adv.away);
  });
});

describe('applyResult (Elo + retropropagación)', () => {
  it('una sorpresa (el débil gana) sube el Elo del débil y baja el del fuerte', () => {
    const table = baselineRatings();
    const strongElo0 = table.FRA.elo;
    const weakElo0 = table.KSA.elo;
    // Arabia le gana 1-0 a Francia.
    applyResult(table, 'FRA', 'KSA', 0, 1);
    expect(table.KSA.elo).toBeGreaterThan(weakElo0);
    expect(table.FRA.elo).toBeLessThan(strongElo0);
  });

  it('castiga el ataque del que no marca y premia la defensa del rival', () => {
    const table = baselineRatings();
    const fraAtk0 = table.FRA.attack;
    const ksaDef0 = table.KSA.defense;
    // Francia no marca (0), cuando su xG esperado era ~2.27 → ataque baja, defensa rival sube.
    applyResult(table, 'FRA', 'KSA', 0, 1);
    expect(table.FRA.attack).toBeLessThan(fraAtk0);
    expect(table.KSA.defense).toBeGreaterThan(ksaDef0);
  });

  it('mantiene el Elo acotado y simétrico (suma cero entre los dos equipos)', () => {
    const table = baselineRatings();
    const total0 = table.FRA.elo + table.KSA.elo;
    applyResult(table, 'FRA', 'KSA', 3, 0);
    expect(table.FRA.elo + table.KSA.elo).toBeCloseTo(total0, 6);
  });
});

describe('adjustRatingsFromOfficial', () => {
  it('sin resultados reales devuelve la línea base', () => {
    const table = adjustRatingsFromOfficial({});
    expect(table).toEqual(baselineRatings());
  });

  it('incorpora un resultado real de grupos y mueve los ratings', () => {
    const m = groupMatch('FRA', 'KSA') ?? groupStageMatches.find((g) => g.stage === 'group')!;
    const homeId = m.home.kind === 'team' ? m.home.teamId : '';
    const official: Record<string, OfficialResult> = {
      [m.id]: { homeGoals: 0, awayGoals: 3, status: 'FINISHED' },
    };
    const base = baselineRatings();
    const adj = adjustRatingsFromOfficial(official);
    // El local perdió por goleada: su Elo baja respecto de la base.
    expect(adj[homeId].elo).toBeLessThan(base[homeId].elo);
  });

  it('ignora partidos no FINISHED', () => {
    const m = groupStageMatches[0];
    const official: Record<string, OfficialResult> = {
      [m.id]: { homeGoals: 5, awayGoals: 0, status: 'IN_PLAY' },
    };
    expect(adjustRatingsFromOfficial(official)).toEqual(baselineRatings());
  });
});

describe('projectSimulation', () => {
  const validIds = new Set(teams.map((t) => t.id));

  it('es determinística: misma entrada ⇒ misma salida', () => {
    const a = projectSimulation({}, {}, {});
    const b = projectSimulation({}, {}, {});
    expect(a).toEqual(b);
  });

  it('completa los 72 partidos de grupos y define un campeón válido', () => {
    const { groupResults, knockoutPicks } = projectSimulation({}, {}, {});
    const groupCount = groupStageMatches.filter((m) => groupResults[m.id]).length;
    expect(groupCount).toBe(groupStageMatches.length);

    const merged = mergeOfficial(groupResults, knockoutPicks, {});
    const view = computeBracket(merged.groupResults, merged.picks);
    expect(view.allGroupsComplete).toBe(true);
    const champ = championOf(view);
    expect(champ).not.toBeNull();
    expect(validIds.has(champ!)).toBe(true);
  });

  it('no pisa los resultados que cargó el usuario', () => {
    const m = groupStageMatches[0];
    const { groupResults } = projectSimulation({ [m.id]: { homeGoals: 9, awayGoals: 1 } }, {}, {});
    expect(groupResults[m.id]).toEqual({ homeGoals: 9, awayGoals: 1 });
  });

  it('no escribe los resultados reales (quedan a cargo de mergeOfficial)', () => {
    const m = groupStageMatches[0];
    const official: Record<string, OfficialResult> = {
      [m.id]: { homeGoals: 2, awayGoals: 0, status: 'FINISHED' },
    };
    const { groupResults } = projectSimulation({}, {}, official);
    expect(groupResults[m.id]).toBeUndefined();
  });

  it('descarta un pick de eliminatorias "rancio" y aun así define campeón', () => {
    // Un pick que no corresponde a ningún equipo del cruce (p. ej. quedó viejo tras
    // editar un grupo) no debe bloquear la proyección de la cadena hasta la final.
    const sf = knockoutStageMatches.find((m) => m.stage === 'SF')!;
    const { groupResults, knockoutPicks } = projectSimulation({}, { [sf.id]: 'ZZZ' }, {});
    const merged = mergeOfficial(groupResults, knockoutPicks, {});
    const view = computeBracket(merged.groupResults, merged.picks);
    expect(championOf(view)).not.toBeNull();
    // El pick rancio fue reemplazado por uno de los equipos reales del cruce.
    expect(knockoutPicks[sf.id]).not.toBe('ZZZ');
  });

  it('respeta un pick de eliminatorias válido del usuario (no lo pisa con el favorito)', () => {
    const clean = projectSimulation({}, {}, {});
    const merged = mergeOfficial(clean.groupResults, clean.knockoutPicks, {});
    const view = computeBracket(merged.groupResults, merged.picks);
    const r32 = knockoutStageMatches.find((m) => m.stage === 'R32')!;
    const k = view.knockout[r32.id];
    // El "otro" equipo del cruce (el que el modelo NO eligió).
    const other = k.winnerTeamId === k.homeTeamId ? k.awayTeamId! : k.homeTeamId!;
    const { knockoutPicks } = projectSimulation(clean.groupResults, { [r32.id]: other }, {});
    expect(knockoutPicks[r32.id]).toBe(other);
  });

  it('contempla los resultados reales para cambiar las proyecciones futuras', () => {
    // Un grupo sin jugar: la proyección base da un ganador del cruce. Si metemos un
    // resultado real chocante en OTRO partido del mismo equipo fuerte, su atributo
    // cae y puede cambiar el marcador proyectado de sus partidos restantes.
    const strong = forecastMatch(baselineRatings(), 'BRA', 'HAI');
    // Brasil recibe una manita real en su debut → su ataque/defensa se devalúan.
    const m = groupMatch('BRA', 'HAI');
    if (m) {
      const official: Record<string, OfficialResult> = {
        [m.id]: { homeGoals: 0, awayGoals: 4, status: 'FINISHED' },
      };
      const adjusted = forecastMatch(adjustRatingsFromOfficial(official), 'BRA', 'SCO');
      const baseVsSco = forecastMatch(baselineRatings(), 'BRA', 'SCO');
      // Tras el papelón, la xG proyectada de Brasil contra Escocia no puede subir.
      expect(adjusted.lambdaHome).toBeLessThanOrEqual(baseVsSco.lambdaHome);
    }
    expect(strong.scoreHome).toBeGreaterThanOrEqual(strong.scoreAway);
  });
});

describe('projectWinner', () => {
  it('elige al claramente más fuerte', () => {
    const table = baselineRatings();
    expect(projectWinner(table, 'ESP', 'CPV')).toBe('ESP');
    expect(projectWinner(table, 'HAI', 'BRA')).toBe('BRA');
  });

  it('es determinístico incluso en un cruce parejo', () => {
    const table = baselineRatings();
    const w1 = projectWinner(table, 'ESP', 'FRA');
    const w2 = projectWinner(table, 'ESP', 'FRA');
    expect(w1).toBe(w2);
    expect(['ESP', 'FRA']).toContain(w1);
  });
});

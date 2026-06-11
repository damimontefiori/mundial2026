/**
 * Línea base ("vaselina") del modelo predictivo del Prode.
 *
 * Métricas bidimensionales por selección tomadas del informe
 * `docs/Prode_Rendimiento_Predictivo.md` (sección "Línea Base de las 48 Selecciones"):
 *   - fifaPoints:  Puntos del ranking FIFA previos al torneo (semilla del Elo).
 *   - marketValue: Valor de mercado de la plantilla, en millones de euros.
 *   - ovr:         Overall (0–100), referencia general.
 *   - attack:      Atributo de Ataque (0–100) → alimenta la xG de Poisson.
 *   - defense:     Atributo de Defensa (0–100) → mitiga la xG del rival.
 *
 * Estos valores son el estado en t=0. El motor (`src/lib/predict.ts`) los
 * recalibra dinámicamente a medida que se cargan resultados reales.
 *
 * `id` = código FIFA de `src/data/teams.ts`.
 */

export interface TeamRating {
  fifaPoints: number;
  /** Valor de mercado de la plantilla (€M). */
  marketValue: number;
  ovr: number;
  attack: number;
  defense: number;
}

export const teamRatings: Record<string, TeamRating> = {
  // ── Grupo A ──
  MEX: { fifaPoints: 1681.03, marketValue: 220.0, ovr: 76, attack: 75, defense: 77 },
  KOR: { fifaPoints: 1588.66, marketValue: 139.05, ovr: 74, attack: 76, defense: 72 },
  CZE: { fifaPoints: 1501.38, marketValue: 160.0, ovr: 71, attack: 72, defense: 70 },
  RSA: { fifaPoints: 1429.73, marketValue: 25.0, ovr: 65, attack: 64, defense: 66 },

  // ── Grupo B ──
  SUI: { fifaPoints: 1649.4, marketValue: 280.0, ovr: 78, attack: 75, defense: 81 },
  CAN: { fifaPoints: 1556.48, marketValue: 210.0, ovr: 73, attack: 74, defense: 72 },
  BIH: { fifaPoints: 1385.84, marketValue: 151.6, ovr: 66, attack: 68, defense: 64 },
  QAT: { fifaPoints: 1454.96, marketValue: 20.0, ovr: 64, attack: 65, defense: 63 },

  // ── Grupo C ──
  BRA: { fifaPoints: 1761.16, marketValue: 1054.0, ovr: 88, attack: 90, defense: 86 },
  MAR: { fifaPoints: 1755.87, marketValue: 390.0, ovr: 82, attack: 81, defense: 83 },
  SCO: { fifaPoints: 1498.35, marketValue: 240.0, ovr: 72, attack: 70, defense: 74 },
  HAI: { fifaPoints: 1291.71, marketValue: 15.0, ovr: 58, attack: 60, defense: 56 },

  // ── Grupo D ──
  USA: { fifaPoints: 1673.13, marketValue: 320.0, ovr: 77, attack: 78, defense: 76 },
  TUR: { fifaPoints: 1599.04, marketValue: 350.0, ovr: 76, attack: 77, defense: 75 },
  AUS: { fifaPoints: 1580.67, marketValue: 40.0, ovr: 71, attack: 69, defense: 73 },
  PAR: { fifaPoints: 1503.5, marketValue: 153.65, ovr: 70, attack: 68, defense: 72 },

  // ── Grupo E ──
  GER: { fifaPoints: 1730.37, marketValue: 1153.0, ovr: 86, attack: 87, defense: 85 },
  ECU: { fifaPoints: 1594.78, marketValue: 260.0, ovr: 75, attack: 72, defense: 78 },
  CIV: { fifaPoints: 1532.98, marketValue: 310.0, ovr: 74, attack: 75, defense: 73 },
  CUW: { fifaPoints: 1294.65, marketValue: 18.0, ovr: 57, attack: 58, defense: 56 },

  // ── Grupo F ──
  NED: { fifaPoints: 1757.87, marketValue: 967.0, ovr: 85, attack: 84, defense: 86 },
  JPN: { fifaPoints: 1660.43, marketValue: 290.0, ovr: 78, attack: 80, defense: 76 },
  SWE: { fifaPoints: 1514.77, marketValue: 340.0, ovr: 75, attack: 78, defense: 72 },
  TUN: { fifaPoints: 1483.05, marketValue: 45.0, ovr: 68, attack: 66, defense: 70 },

  // ── Grupo G ──
  BEL: { fifaPoints: 1734.71, marketValue: 626.0, ovr: 83, attack: 85, defense: 81 },
  EGY: { fifaPoints: 1563.24, marketValue: 116.48, ovr: 74, attack: 77, defense: 71 },
  IRN: { fifaPoints: 1615.3, marketValue: 50.0, ovr: 72, attack: 74, defense: 70 },
  NZL: { fifaPoints: 1281.57, marketValue: 22.0, ovr: 59, attack: 61, defense: 57 },

  // ── Grupo H ──
  ESP: { fifaPoints: 1876.4, marketValue: 1270.0, ovr: 91, attack: 92, defense: 90 },
  URU: { fifaPoints: 1673.07, marketValue: 480.0, ovr: 81, attack: 80, defense: 82 },
  KSA: { fifaPoints: 1421.43, marketValue: 28.0, ovr: 65, attack: 66, defense: 64 },
  CPV: { fifaPoints: 1366.13, marketValue: 24.0, ovr: 63, attack: 64, defense: 62 },

  // ── Grupo I ──
  FRA: { fifaPoints: 1877.32, marketValue: 1520.0, ovr: 92, attack: 94, defense: 90 },
  SEN: { fifaPoints: 1688.99, marketValue: 280.0, ovr: 77, attack: 78, defense: 76 },
  NOR: { fifaPoints: 1550.94, marketValue: 694.0, ovr: 79, attack: 84, defense: 74 },
  IRQ: { fifaPoints: 1447.14, marketValue: 15.0, ovr: 63, attack: 65, defense: 61 },

  // ── Grupo J ──
  ARG: { fifaPoints: 1874.81, marketValue: 944.0, ovr: 90, attack: 91, defense: 89 },
  AUT: { fifaPoints: 1593.45, marketValue: 280.0, ovr: 75, attack: 74, defense: 76 },
  ALG: { fifaPoints: 1564.26, marketValue: 190.0, ovr: 73, attack: 74, defense: 72 },
  JOR: { fifaPoints: 1391.45, marketValue: 14.0, ovr: 64, attack: 66, defense: 62 },

  // ── Grupo K ──
  POR: { fifaPoints: 1763.83, marketValue: 1174.0, ovr: 87, attack: 89, defense: 85 },
  COL: { fifaPoints: 1693.09, marketValue: 320.0, ovr: 81, attack: 82, defense: 80 },
  COD: { fifaPoints: 1478.35, marketValue: 143.9, ovr: 67, attack: 68, defense: 66 },
  UZB: { fifaPoints: 1465.34, marketValue: 85.33, ovr: 66, attack: 68, defense: 64 },

  // ── Grupo L ──
  ENG: { fifaPoints: 1825.97, marketValue: 1310.0, ovr: 89, attack: 90, defense: 88 },
  CRO: { fifaPoints: 1717.07, marketValue: 360.0, ovr: 80, attack: 78, defense: 82 },
  PAN: { fifaPoints: 1540.64, marketValue: 25.0, ovr: 70, attack: 69, defense: 71 },
  GHA: { fifaPoints: 1346.31, marketValue: 150.0, ovr: 68, attack: 70, defense: 66 },
};

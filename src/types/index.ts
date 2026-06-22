/**
 * Modelo de dominio del Mundial 2026.
 *
 * Formato del torneo (clave para la lógica de la llave):
 * - 48 equipos en 12 grupos (A–L) de 4.
 * - Fase de grupos: 3 partidos por equipo, 3/1/0 puntos.
 * - Avanzan a Dieciseisavos (R32): 1.º y 2.º de cada grupo (24) + 8 mejores 3.º (de 12).
 * - Eliminatorias: R32 → R16 → Cuartos (QF) → Semis (SF) → Final (+ 3.º puesto).
 *
 * Todos los tipos son framework-agnósticos (no dependen de React).
 */

export type Confederation = 'UEFA' | 'CONMEBOL' | 'CONCACAF' | 'CAF' | 'AFC' | 'OFC';

export type GroupId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L';

export const GROUP_IDS: readonly GroupId[] = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
] as const;

export type HostCountry = 'USA' | 'CAN' | 'MEX';

/** Un equipo participante. `isPlaceholder` marca cupos aún por definir (repechajes). */
export interface Team {
  /** Identificador estable, normalmente el código FIFA. Ej: 'ARG'. */
  id: string;
  /** Nombre para mostrar en español. Ej: 'Argentina'. */
  name: string;
  /** Código FIFA de 3 letras. Ej: 'ARG'. */
  fifaCode: string;
  confederation: Confederation;
  /** Bandera como emoji (sin assets binarios → liviano y offline). */
  flag: string;
  /** true si el cupo todavía no tiene equipo definido (repechaje/play-off). */
  isPlaceholder?: boolean;
}

export interface Group {
  id: GroupId;
  /** Exactamente 4 ids de equipos, en orden de bombo/sorteo. */
  teamIds: string[];
}

export interface Venue {
  id: string;
  city: string;
  country: HostCountry;
  stadium: string;
  /** Zona horaria IANA del estadio. Ej: 'America/New_York'. */
  timezone: string;
}

export type Stage = 'group' | 'R32' | 'R16' | 'QF' | 'SF' | 'third' | 'final';

export const STAGE_ORDER: readonly Stage[] = [
  'group',
  'R32',
  'R16',
  'QF',
  'SF',
  'third',
  'final',
] as const;

/**
 * Referencia a uno de los lados de un partido. Puede ser un equipo concreto
 * (fase de grupos) o un cupo que se resuelve por la simulación:
 * - groupWinner / groupRunnerUp: 1.º o 2.º de un grupo.
 * - thirdFrom: uno de los mejores 3.º proveniente de uno de los grupos listados
 *   (mecanismo oficial: cada cupo de 3.º admite un subconjunto de grupos).
 * - winnerOf / loserOf: progresión de eliminatorias.
 */
export type MatchSlot =
  | { kind: 'team'; teamId: string }
  | { kind: 'groupWinner'; group: GroupId }
  | { kind: 'groupRunnerUp'; group: GroupId }
  | { kind: 'thirdFrom'; groups: GroupId[] }
  | { kind: 'winnerOf'; matchId: string }
  | { kind: 'loserOf'; matchId: string };

export interface Match {
  /** Id estable. Ej: 'G-A-1' (grupo) o 'M73' (eliminatorias). */
  id: string;
  /** Número de partido oficial (1..104) para ordenar y mostrar. */
  number: number;
  stage: Stage;
  /** Jornada 1..3 en fase de grupos. */
  matchday?: number;
  group?: GroupId;
  /** Fecha y hora en UTC (ISO 8601). Se convierte a hora AR para mostrar. */
  kickoffUTC: string;
  venueId: string;
  home: MatchSlot;
  away: MatchSlot;
  /** Etiqueta corta para eliminatorias. Ej: 'Octavos'. */
  label?: string;
}

/** Resultado simulado de un partido de grupos (lo carga el usuario). */
export interface GroupResult {
  homeGoals: number;
  awayGoals: number;
}

/** Estado de un partido según la fuente oficial (subconjunto del de football-data.org). */
export type MatchStatus = 'SCHEDULED' | 'TIMED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED';

/**
 * Resultado real de un partido, traído de una API oficial por un job programado
 * y servido como `public/results.json`. Ver `src/lib/ingestApiResults.ts`.
 */
export interface OfficialResult {
  homeGoals: number;
  awayGoals: number;
  status: MatchStatus;
  /** Código del equipo que avanza (cubre prórroga/penales). Solo en eliminatorias. */
  winnerCode?: string;
  /** Etapa de duración alcanzada (para la fase en vivo: alargue/penales). */
  duration?: 'REGULAR' | 'EXTRA_TIME' | 'PENALTY_SHOOTOUT';
  /** Marcador del entretiempo, orientado a nuestro home/away. */
  halfTime?: GroupResult;
  /** ISO del primer IN_PLAY tras un PAUSED (ancla del reloj de 2do tiempo). */
  secondHalfStartedAt?: string;
}

/** Archivo estático `public/results.json` con los resultados reales por id de partido. */
export interface OfficialResultsFile {
  /** ISO de la última actualización, o null si todavía no se pobló. */
  updatedAt: string | null;
  /** De dónde salieron los datos (ej. "football-data.org"). */
  source: string;
  /** matchId (M1..M104) → resultado real. */
  results: Record<string, OfficialResult>;
}

// ── Premios ──────────────────────────────────────────────────────────────

/**
 * Un goleador del torneo, traído de `/competitions/WC/scorers` y orientado a
 * nuestros equipos. Alimenta el Botín de Oro y (filtrando por `dateOfBirth`) la
 * estimación del Mejor Jugador Joven.
 */
export interface ScorerEntry {
  /** Nombre del jugador (tal cual lo da la API). */
  playerName: string;
  /** Nuestro id de equipo (código FIFA) o null si no se reconoció. */
  teamId: string | null;
  /** Nombre del equipo según la API (fallback si no hay `teamId`). */
  teamName: string;
  /** Nacionalidad del jugador según la API, o null. */
  nationality: string | null;
  /** Fecha de nacimiento ISO `yyyy-mm-dd`, o null (para el filtro de "joven"). */
  dateOfBirth: string | null;
  goals: number;
  /** Asistencias, o null si la API no las informa. */
  assists: number | null;
  playedMatches: number;
}

/**
 * Archivo estático `public/awards.json`. Solo trae lo que la API aporta de nuevo
 * (los goleadores); el Guante de Oro y el Dinero por fase se derivan en el cliente
 * a partir de `results.json`. Lo escribe `scripts/fetch-results.ts` cuando los
 * resultados cambian.
 */
export interface AwardsFile {
  /** ISO de la última actualización, o null si todavía no se pobló. */
  updatedAt: string | null;
  /** De dónde salieron los datos (ej. "football-data.org"). */
  source: string;
  /** Goleadores ordenados (mejor primero). */
  scorers: ScorerEntry[];
}

/** Fila de la tabla de un grupo (derivada de los resultados). */
export interface StandingRow {
  teamId: string;
  group: GroupId;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  /** Posición 1..4 dentro del grupo (1 = primero). undefined si aún no se puede decidir. */
  rank?: number;
}

// ── Figuritas ────────────────────────────────────────────────────────────

export type StickerKind = 'special' | 'team' | 'legend' | 'promo';

export interface StickerSection {
  id: string;
  title: string;
  kind: StickerKind;
  /**
   * Códigos oficiales de las figuritas de la sección, en orden de álbum.
   * Ej: `['00','FWC1',…]`, `['MEX1',…,'MEX20']`. Ver `src/data/stickers.ts`.
   */
  codes: string[];
  /** Cuando kind === 'team', referencia al equipo. */
  teamId?: string;
}

export interface StickerAlbum {
  /** Total de figuritas del **set base** (no incluye la promo Coca-Cola). */
  total: number;
  sections: StickerSection[];
}

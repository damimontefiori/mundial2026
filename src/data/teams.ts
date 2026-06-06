import type { Team } from '@/types';

/**
 * Los 48 equipos clasificados al Mundial 2026.
 *
 * Datos del sorteo oficial (Washington D.C., 5 de diciembre de 2025).
 * Cupos por confederación: UEFA 16, CAF 9, AFC 8, CONMEBOL 6, CONCACAF 6,
 * OFC 1, más 2 plazas del repechaje intercontinental. Ver docs/DATA_SOURCES.md
 * para el detalle y la verificación.
 *
 * `id` = código FIFA (estable). Banderas en emoji (livianas y offline).
 */
export const teams: Team[] = [
  // ── CONMEBOL (6) ──
  { id: 'ARG', name: 'Argentina', fifaCode: 'ARG', confederation: 'CONMEBOL', flag: '🇦🇷' },
  { id: 'BRA', name: 'Brasil', fifaCode: 'BRA', confederation: 'CONMEBOL', flag: '🇧🇷' },
  { id: 'URU', name: 'Uruguay', fifaCode: 'URU', confederation: 'CONMEBOL', flag: '🇺🇾' },
  { id: 'COL', name: 'Colombia', fifaCode: 'COL', confederation: 'CONMEBOL', flag: '🇨🇴' },
  { id: 'ECU', name: 'Ecuador', fifaCode: 'ECU', confederation: 'CONMEBOL', flag: '🇪🇨' },
  { id: 'PAR', name: 'Paraguay', fifaCode: 'PAR', confederation: 'CONMEBOL', flag: '🇵🇾' },

  // ── CONCACAF (6, incluye 3 anfitriones) ──
  { id: 'USA', name: 'Estados Unidos', fifaCode: 'USA', confederation: 'CONCACAF', flag: '🇺🇸' },
  { id: 'MEX', name: 'México', fifaCode: 'MEX', confederation: 'CONCACAF', flag: '🇲🇽' },
  { id: 'CAN', name: 'Canadá', fifaCode: 'CAN', confederation: 'CONCACAF', flag: '🇨🇦' },
  { id: 'PAN', name: 'Panamá', fifaCode: 'PAN', confederation: 'CONCACAF', flag: '🇵🇦' },
  { id: 'HAI', name: 'Haití', fifaCode: 'HAI', confederation: 'CONCACAF', flag: '🇭🇹' },
  { id: 'CUW', name: 'Curazao', fifaCode: 'CUW', confederation: 'CONCACAF', flag: '🇨🇼' },

  // ── UEFA (16) ──
  { id: 'FRA', name: 'Francia', fifaCode: 'FRA', confederation: 'UEFA', flag: '🇫🇷' },
  { id: 'ENG', name: 'Inglaterra', fifaCode: 'ENG', confederation: 'UEFA', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'ESP', name: 'España', fifaCode: 'ESP', confederation: 'UEFA', flag: '🇪🇸' },
  { id: 'POR', name: 'Portugal', fifaCode: 'POR', confederation: 'UEFA', flag: '🇵🇹' },
  { id: 'NED', name: 'Países Bajos', fifaCode: 'NED', confederation: 'UEFA', flag: '🇳🇱' },
  { id: 'BEL', name: 'Bélgica', fifaCode: 'BEL', confederation: 'UEFA', flag: '🇧🇪' },
  { id: 'GER', name: 'Alemania', fifaCode: 'GER', confederation: 'UEFA', flag: '🇩🇪' },
  { id: 'CRO', name: 'Croacia', fifaCode: 'CRO', confederation: 'UEFA', flag: '🇭🇷' },
  { id: 'SUI', name: 'Suiza', fifaCode: 'SUI', confederation: 'UEFA', flag: '🇨🇭' },
  { id: 'AUT', name: 'Austria', fifaCode: 'AUT', confederation: 'UEFA', flag: '🇦🇹' },
  { id: 'NOR', name: 'Noruega', fifaCode: 'NOR', confederation: 'UEFA', flag: '🇳🇴' },
  { id: 'SCO', name: 'Escocia', fifaCode: 'SCO', confederation: 'UEFA', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { id: 'SWE', name: 'Suecia', fifaCode: 'SWE', confederation: 'UEFA', flag: '🇸🇪' },
  { id: 'CZE', name: 'Chequia', fifaCode: 'CZE', confederation: 'UEFA', flag: '🇨🇿' },
  { id: 'TUR', name: 'Turquía', fifaCode: 'TUR', confederation: 'UEFA', flag: '🇹🇷' },
  { id: 'BIH', name: 'Bosnia y Herzegovina', fifaCode: 'BIH', confederation: 'UEFA', flag: '🇧🇦' },

  // ── CAF (9) ──
  { id: 'MAR', name: 'Marruecos', fifaCode: 'MAR', confederation: 'CAF', flag: '🇲🇦' },
  { id: 'SEN', name: 'Senegal', fifaCode: 'SEN', confederation: 'CAF', flag: '🇸🇳' },
  { id: 'EGY', name: 'Egipto', fifaCode: 'EGY', confederation: 'CAF', flag: '🇪🇬' },
  { id: 'ALG', name: 'Argelia', fifaCode: 'ALG', confederation: 'CAF', flag: '🇩🇿' },
  { id: 'TUN', name: 'Túnez', fifaCode: 'TUN', confederation: 'CAF', flag: '🇹🇳' },
  { id: 'CIV', name: 'Costa de Marfil', fifaCode: 'CIV', confederation: 'CAF', flag: '🇨🇮' },
  { id: 'GHA', name: 'Ghana', fifaCode: 'GHA', confederation: 'CAF', flag: '🇬🇭' },
  { id: 'CPV', name: 'Cabo Verde', fifaCode: 'CPV', confederation: 'CAF', flag: '🇨🇻' },
  { id: 'RSA', name: 'Sudáfrica', fifaCode: 'RSA', confederation: 'CAF', flag: '🇿🇦' },

  // ── AFC (8) ──
  { id: 'JPN', name: 'Japón', fifaCode: 'JPN', confederation: 'AFC', flag: '🇯🇵' },
  { id: 'KOR', name: 'Corea del Sur', fifaCode: 'KOR', confederation: 'AFC', flag: '🇰🇷' },
  { id: 'IRN', name: 'Irán', fifaCode: 'IRN', confederation: 'AFC', flag: '🇮🇷' },
  { id: 'AUS', name: 'Australia', fifaCode: 'AUS', confederation: 'AFC', flag: '🇦🇺' },
  { id: 'KSA', name: 'Arabia Saudita', fifaCode: 'KSA', confederation: 'AFC', flag: '🇸🇦' },
  { id: 'QAT', name: 'Catar', fifaCode: 'QAT', confederation: 'AFC', flag: '🇶🇦' },
  { id: 'UZB', name: 'Uzbekistán', fifaCode: 'UZB', confederation: 'AFC', flag: '🇺🇿' },
  { id: 'JOR', name: 'Jordania', fifaCode: 'JOR', confederation: 'AFC', flag: '🇯🇴' },

  // ── OFC (1) ──
  { id: 'NZL', name: 'Nueva Zelanda', fifaCode: 'NZL', confederation: 'OFC', flag: '🇳🇿' },

  // ── Repechaje intercontinental (2) ──
  { id: 'IRQ', name: 'Irak', fifaCode: 'IRQ', confederation: 'AFC', flag: '🇮🇶' },
  { id: 'COD', name: 'RD Congo', fifaCode: 'COD', confederation: 'CAF', flag: '🇨🇩' },
];

/** Mapa id → Team para acceso O(1). */
export const teamsById: Record<string, Team> = Object.fromEntries(teams.map((t) => [t.id, t]));

export function getTeam(id: string): Team | undefined {
  return teamsById[id];
}

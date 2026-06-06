import type { StickerAlbum, StickerSection } from '@/types';
import { groups } from './groups';
import { teamsById } from './teams';

/**
 * Álbum oficial Panini FIFA World Cup 2026™.
 *
 * Numeración VERIFICADA contra el checklist oficial (ver
 * docs/numeracion_oficial_mundial_2026_VERIFICADA.md). Esquema por código, no
 * secuencial: cada figurita tiene un código (ej. `MEX1`, `FWC1`, `00`).
 *
 * Set base = **980**:
 *  - Apertura: `00` (logo Panini) + `FWC1`–`FWC8` (emblema, mascotas, balón, sedes) → 9
 *  - 48 selecciones × 20 (`XXX1`–`XXX20`; N.º 1 = escudo, N.º 13 = foto del equipo) → 960
 *  - Museo FIFA / Historia del Mundial: `FWC9`–`FWC19` → 11
 *
 * Aparte (no viene en sobres, set promocional): `CC1`–`CC12` (Coca-Cola), 12.
 *
 * Orden del álbum: las selecciones van por grupo (A–L), en el orden del sorteo.
 * El código de equipo es el código FIFA (= `team.id`).
 */

const PER_TEAM = 20;

/** Genera `['FWC1','FWC2',…]` para un prefijo y un rango inclusivo. */
function range(prefix: string, from: number, to: number): string[] {
  const codes: string[] = [];
  for (let n = from; n <= to; n++) codes.push(`${prefix}${n}`);
  return codes;
}

const baseSections: StickerSection[] = [];

// 1) Apertura — 00 + FWC1..FWC8
baseSections.push({
  id: 'apertura',
  title: 'Inauguración y especiales',
  kind: 'special',
  codes: ['00', ...range('FWC', 1, 8)],
});

// 2) 48 selecciones × 20 (orden del álbum: por grupo A–L)
for (const g of groups) {
  for (const teamId of g.teamIds) {
    const t = teamsById[teamId];
    baseSections.push({
      id: `team-${teamId}`,
      title: `${t.flag} ${t.name} · Grupo ${g.id}`,
      kind: 'team',
      teamId,
      codes: range(teamId, 1, PER_TEAM),
    });
  }
}

// 3) Museo FIFA / Historia del Mundial — FWC9..FWC19
baseSections.push({
  id: 'museo',
  title: 'Historia del Mundial · Museo FIFA',
  kind: 'legend',
  codes: range('FWC', 9, 19),
});

// 4) Promo Coca-Cola — CC1..CC12 (set aparte; no cuenta en el total base)
const cocaColaSection: StickerSection = {
  id: 'cocacola',
  title: 'Promo Coca-Cola',
  kind: 'promo',
  codes: range('CC', 1, 12),
};

export const stickerAlbum: StickerAlbum = {
  total: baseSections.reduce((n, s) => n + s.codes.length, 0), // 980
  sections: [...baseSections, cocaColaSection],
};

/** Códigos del set base (sin la promo Coca-Cola) — para el cálculo de progreso. */
export const baseStickerCodes: string[] = baseSections.flatMap((s) => s.codes);

/** Devuelve el número total de figuritas del set base. */
export function totalStickers(): number {
  return stickerAlbum.total;
}

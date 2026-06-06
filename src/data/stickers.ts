import type { StickerAlbum, StickerKind, StickerSection } from '@/types';
import { groups } from './groups';
import { teamsById } from './teams';

/**
 * Estructura del álbum de figuritas (estilo Panini).
 *
 * ⚠️ NUMERACIÓN DE EJEMPLO — ajustar a la numeración oficial cuando esté
 * disponible (ver docs/DATA_SOURCES.md). La grilla es la misma mecánica:
 * secciones con rangos de números. El usuario marca las que tiene y la app
 * calcula las que le faltan.
 *
 * Layout: Especiales → Estadios → 48 equipos (18 c/u, ordenados por grupo) → Leyendas.
 */

const PER_TEAM = 18;

const sections: StickerSection[] = [];
let next = 1;
let counter = 0;

function push(title: string, kind: StickerKind, count: number, teamId?: string): void {
  counter += 1;
  sections.push({
    id: `s${counter}`,
    title,
    kind,
    from: next,
    to: next + count - 1,
    teamId,
  });
  next += count;
}

push('Inauguración y especiales', 'special', 18);
push('Estadios', 'stadium', 16);
for (const g of groups) {
  for (const teamId of g.teamIds) {
    const t = teamsById[teamId];
    push(`${t.flag} ${t.name} · Grupo ${g.id}`, 'team', PER_TEAM, teamId);
  }
}
push('Leyendas del Mundial', 'legend', 12);

export const stickerAlbum: StickerAlbum = {
  total: next - 1,
  sections,
};

/** Devuelve el número total de figuritas (slots) del álbum. */
export function totalStickers(): number {
  return stickerAlbum.total;
}

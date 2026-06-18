import type { StickerSection } from '@/types';
import { stickerAlbum } from '@/data/stickers';
import { teamsById } from '@/data/teams';

/**
 * Arma los mensajes de texto para compartir por WhatsApp el estado del álbum:
 * figuritas REPETIDAS (para cambiar) y FALTANTES. Código puro y testeable.
 *
 * Formato por sección:
 *  - Equipos: `🇿🇦 RSA: 5, 6` (número local 1..20 de cada figurita).
 *  - Especiales (Apertura, Museo FIFA, Coca-Cola): por su código, ej. `Apertura: FWC3`.
 * Las secciones sin ítems se omiten.
 */

const APP_URL = 'https://mundialapp.com.ar';

/** Etiqueta corta para las secciones no-equipo en el mensaje. */
const SPECIAL_LABEL: Record<string, string> = {
  apertura: 'Apertura',
  museo: 'Museo FIFA',
  cocacola: 'Coca-Cola',
};

type Owned = Record<string, number>;

/** Etiqueta de la sección: "🇿🇦 RSA" (equipos) o "Apertura" (especiales). */
function sectionLabel(section: StickerSection): string {
  if (section.kind === 'team' && section.teamId) {
    const team = teamsById[section.teamId];
    return `${team?.flag ?? ''} ${section.teamId}`.trim();
  }
  return SPECIAL_LABEL[section.id] ?? section.title;
}

/**
 * Ítems de una sección que cumplen el predicado sobre su cantidad: para equipos
 * devuelve el número local (1..20); para especiales, el código crudo (FWC3, CC2).
 */
function itemsForSection(
  section: StickerSection,
  owned: Owned,
  match: (count: number) => boolean,
): string[] {
  const out: string[] = [];
  section.codes.forEach((code, idx) => {
    if (match(owned[code] ?? 0)) out.push(section.kind === 'team' ? String(idx + 1) : code);
  });
  return out;
}

/** Una línea por sección con ítems que cumplen el predicado. */
function buildLines(owned: Owned, match: (count: number) => boolean): string[] {
  const lines: string[] = [];
  for (const section of stickerAlbum.sections) {
    const items = itemsForSection(section, owned, match);
    if (items.length > 0) lines.push(`${sectionLabel(section)}: ${items.join(', ')}`);
  }
  return lines;
}

/** ¿Hay alguna figurita repetida para compartir? (mismo universo que el mensaje). */
export function hasRepeated(owned: Owned): boolean {
  return buildLines(owned, (c) => c > 1).length > 0;
}

/** ¿Falta alguna figurita para compartir? (mismo universo que el mensaje). */
export function hasMissing(owned: Owned): boolean {
  return buildLines(owned, (c) => c === 0).length > 0;
}

/** Mensaje de figuritas repetidas (count > 1). */
export function buildRepeatedMessage(owned: Owned): string {
  const lines = buildLines(owned, (c) => c > 1);
  if (lines.length === 0) return `Todavía no tengo figuritas repetidas. Usá la app: ${APP_URL}`;
  return `Tengo estas figuritas repetidas para cambiar:\n\n${lines.join('\n')}\n\nUsá la app: ${APP_URL}`;
}

/** Mensaje de figuritas faltantes (count === 0). */
export function buildMissingMessage(owned: Owned): string {
  const lines = buildLines(owned, (c) => c === 0);
  if (lines.length === 0) return `¡Ya completé el álbum! 🎉 Usá la app: ${APP_URL}`;
  return `Me faltan estas figuritas:\n\n${lines.join('\n')}\n\nUsá la app: ${APP_URL}`;
}

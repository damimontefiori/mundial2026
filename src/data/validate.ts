import { z } from 'zod';
import { GROUP_IDS } from '@/types';
import { teams, teamsById } from './teams';
import { groups } from './groups';
import { venues, venuesById } from './venues';
import { matches, matchesById } from './matches';
import { stickerAlbum } from './stickers';

/**
 * Validación de integridad de los datasets. Se ejecuta en los tests
 * (ver src/data/data.test.ts) para garantizar que la data curada es consistente.
 */

const confederation = z.enum(['UEFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OFC']);

const teamSchema = z.object({
  id: z.string().min(2),
  name: z.string().min(2),
  fifaCode: z.string().length(3),
  confederation,
  flag: z.string().min(1),
  isPlaceholder: z.boolean().optional(),
});

const venueSchema = z.object({
  id: z.string().min(2),
  city: z.string().min(2),
  country: z.enum(['USA', 'CAN', 'MEX']),
  stadium: z.string().min(2),
  timezone: z.string().min(3),
});

const groupSchema = z.object({
  id: z.enum(GROUP_IDS as unknown as [string, ...string[]]),
  teamIds: z.array(z.string()).length(4),
});

/** Corre todas las validaciones y devuelve la lista de problemas (vacía = OK). */
export function validateData(): string[] {
  const issues: string[] = [];

  // Equipos
  const teamParse = z.array(teamSchema).safeParse(teams);
  if (!teamParse.success) issues.push(`teams: ${teamParse.error.issues[0]?.message}`);
  if (teams.length !== 48) issues.push(`Se esperaban 48 equipos, hay ${teams.length}.`);
  const teamIdSet = new Set(teams.map((t) => t.id));
  if (teamIdSet.size !== teams.length) issues.push('Hay ids de equipo duplicados.');

  // Sedes
  const venueParse = z.array(venueSchema).safeParse(venues);
  if (!venueParse.success) issues.push(`venues: ${venueParse.error.issues[0]?.message}`);
  if (venues.length !== 16) issues.push(`Se esperaban 16 sedes, hay ${venues.length}.`);

  // Grupos
  const groupParse = z.array(groupSchema).safeParse(groups);
  if (!groupParse.success) issues.push(`groups: ${groupParse.error.issues[0]?.message}`);
  if (groups.length !== 12) issues.push(`Se esperaban 12 grupos, hay ${groups.length}.`);
  const seen = new Set<string>();
  for (const g of groups) {
    for (const tid of g.teamIds) {
      if (!teamsById[tid]) issues.push(`Grupo ${g.id}: equipo desconocido "${tid}".`);
      if (seen.has(tid)) issues.push(`El equipo ${tid} aparece en más de un grupo.`);
      seen.add(tid);
    }
  }
  if (seen.size !== 48) issues.push(`Los grupos cubren ${seen.size} equipos, deberían ser 48.`);

  // Partidos
  if (matches.length !== 104) issues.push(`Se esperaban 104 partidos, hay ${matches.length}.`);
  const numbers = matches.map((m) => m.number).sort((a, b) => a - b);
  for (let i = 0; i < numbers.length; i++) {
    if (numbers[i] !== i + 1) {
      issues.push(`La numeración de partidos no es 1..104 (falla en ${i + 1}).`);
      break;
    }
  }
  for (const m of matches) {
    if (!venuesById[m.venueId]) issues.push(`Partido ${m.id}: sede desconocida "${m.venueId}".`);
    if (Number.isNaN(Date.parse(m.kickoffUTC)))
      issues.push(`Partido ${m.id}: fecha inválida "${m.kickoffUTC}".`);
    for (const slot of [m.home, m.away]) {
      if (slot.kind === 'team' && !teamsById[slot.teamId])
        issues.push(`Partido ${m.id}: equipo desconocido "${slot.teamId}".`);
      if (slot.kind === 'winnerOf' || slot.kind === 'loserOf') {
        if (!matchesById[slot.matchId])
          issues.push(`Partido ${m.id}: referencia a partido inexistente "${slot.matchId}".`);
      }
    }
  }
  const stageCounts = { group: 0, R32: 0, R16: 0, QF: 0, SF: 0, third: 0, final: 0 };
  for (const m of matches) stageCounts[m.stage] += 1;
  const expected = { group: 72, R32: 16, R16: 8, QF: 4, SF: 2, third: 1, final: 1 };
  for (const [stage, count] of Object.entries(expected)) {
    if (stageCounts[stage as keyof typeof stageCounts] !== count)
      issues.push(
        `Etapa ${stage}: se esperaban ${count} partidos, hay ${stageCounts[stage as keyof typeof stageCounts]}.`,
      );
  }

  // Figuritas: códigos únicos en todo el álbum y total base = 980.
  const allCodes = stickerAlbum.sections.flatMap((s) => s.codes);
  if (new Set(allCodes).size !== allCodes.length)
    issues.push('Figuritas: hay códigos duplicados.');
  for (const s of stickerAlbum.sections) {
    if (s.codes.length === 0) issues.push(`Figuritas: sección "${s.title}" sin códigos.`);
  }
  const baseCount = stickerAlbum.sections
    .filter((s) => s.kind !== 'promo')
    .reduce((n, s) => n + s.codes.length, 0);
  if (baseCount !== stickerAlbum.total)
    issues.push(`Figuritas: el total base (${stickerAlbum.total}) no coincide con las secciones (${baseCount}).`);
  if (stickerAlbum.total !== 980)
    issues.push(`Figuritas: se esperaban 980 del set base, hay ${stickerAlbum.total}.`);
  const teamSections = stickerAlbum.sections.filter((s) => s.kind === 'team');
  if (teamSections.length !== 48)
    issues.push(`Figuritas: se esperaban 48 secciones de equipo, hay ${teamSections.length}.`);
  for (const s of teamSections) {
    if (s.codes.length !== 20)
      issues.push(`Figuritas: la selección "${s.title}" tiene ${s.codes.length} (esperaba 20).`);
    if (s.teamId && !teamsById[s.teamId])
      issues.push(`Figuritas: sección de equipo desconocido "${s.teamId}".`);
  }

  return issues;
}

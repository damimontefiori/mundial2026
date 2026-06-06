import type { Match } from '@/types';
import { getVenue } from '@/data/venues';

/**
 * Generación de archivos .ics (iCalendar) para agregar partidos al calendario
 * (Google Calendar, Apple, etc.). Todo del lado del cliente, sin backend.
 */

export interface IcsEvent {
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  location: string;
  description: string;
}

/** yyyymmddThhmmssZ (UTC). */
function toIcsDate(d: Date): string {
  return d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

const MATCH_DURATION_MS = 2 * 60 * 60 * 1000; // 2 horas

/** Construye un evento .ics a partir de un partido y los nombres de los equipos. */
export function matchToEvent(match: Match, homeLabel: string, awayLabel: string): IcsEvent {
  const venue = getVenue(match.venueId);
  const start = new Date(match.kickoffUTC);
  const stageLabel =
    match.stage === 'group' ? `Grupo ${match.group}` : (match.label ?? 'Eliminatorias');
  return {
    uid: `${match.id}@mundial2026`,
    start,
    end: new Date(start.getTime() + MATCH_DURATION_MS),
    summary: `⚽ ${homeLabel} vs ${awayLabel}`,
    location: venue ? `${venue.stadium}, ${venue.city}` : '',
    description: `Mundial 2026 · ${stageLabel} · Partido ${match.number}`,
  };
}

/** Serializa eventos a un documento iCalendar (.ics). */
export function buildICS(events: IcsEvent[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mundial2026//App//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];
  const stamp = toIcsDate(new Date());
  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${toIcsDate(e.start)}`,
      `DTEND:${toIcsDate(e.end)}`,
      `SUMMARY:${escapeText(e.summary)}`,
      `LOCATION:${escapeText(e.location)}`,
      `DESCRIPTION:${escapeText(e.description)}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/** Dispara la descarga de un .ics en el navegador. */
export function downloadICS(filename: string, content: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

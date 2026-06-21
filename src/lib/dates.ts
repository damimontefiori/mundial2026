import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import type { Stage } from '@/types';

/**
 * Toda la app muestra fechas y horas en horario de Argentina.
 * Los partidos se guardan en UTC (ISO 8601) y se convierten aquí.
 */
export const AR_TZ = 'America/Argentina/Buenos_Aires';

/** Hora del partido, ej. "16:00". */
export function formatTime(iso: string): string {
  return formatInTimeZone(new Date(iso), AR_TZ, 'HH:mm');
}

/** Fecha corta, ej. "jue 11 jun". */
export function formatShortDate(iso: string): string {
  return formatInTimeZone(new Date(iso), AR_TZ, 'EEE d MMM', { locale: es });
}

/** Fecha larga, ej. "jueves 11 de junio". */
export function formatLongDate(iso: string): string {
  return formatInTimeZone(new Date(iso), AR_TZ, "EEEE d 'de' MMMM", { locale: es });
}

/** Fecha y hora, ej. "jue 11 jun · 16:00". */
export function formatDateTime(iso: string): string {
  return `${formatShortDate(iso)} · ${formatTime(iso)}`;
}

/** Clave de día en horario AR (yyyy-MM-dd) para agrupar partidos por jornada/día. */
export function dayKey(iso: string): string {
  return formatInTimeZone(new Date(iso), AR_TZ, 'yyyy-MM-dd');
}

/** true si la fecha (en día AR) ya pasó respecto de `now`. */
export function isPast(iso: string, now: Date = new Date()): boolean {
  return new Date(iso).getTime() < now.getTime();
}

/**
 * Ventana máxima en que un partido puede seguir "en vivo" según la etapa. Margen generoso
 * (calor + pausas de hidratación + VAR) para no cortar un partido real; es el backstop del
 * lag del feed al marcar FINISHED.
 */
export function liveWindowMs(stage: Stage): number {
  return stage === 'group' ? 150 * 60 * 1000 : 225 * 60 * 1000; // 2h30m grupos / 3h45m elim.
}

/**
 * true si un partido "en juego" lleva más de `maxMs` desde el inicio: seguro ya terminó.
 * Sirve para no mostrar "EN VIVO" eternamente cuando el feed tarda en marcar FINISHED.
 */
export function pastLiveWindow(
  kickoffISO: string,
  now: Date = new Date(),
  maxMs = 3 * 60 * 60 * 1000,
): boolean {
  return now.getTime() - new Date(kickoffISO).getTime() > maxMs;
}

/** Pone en mayúscula la primera letra (útil para nombres de día/mes en es). */
export function capitalizeDate(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

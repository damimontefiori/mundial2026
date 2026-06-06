import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';

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

/** Pone en mayúscula la primera letra (útil para nombres de día/mes en es). */
export function capitalizeDate(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

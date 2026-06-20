import type { OfficialResult } from '@/types';
import { pastLiveWindow } from '@/lib/dates';

/**
 * Reloj ESTIMADO de un partido en curso. El feed gratuito de football-data.org no
 * trae el minuto, así que se estima en el cliente anclado a las transiciones reales
 * que sí reporta el feed (`liveStartedAt` = arrancó, `secondHalfStartedAt` = 2do tiempo),
 * capturadas por el job cada 1 min. Precisión ±1–2 min; el tiempo adicionado se muestra
 * como "45+'/90+'" porque no lo conocemos. Es código puro y testeable.
 */

export type LivePhase = 'first' | 'half' | 'second' | 'extra' | 'penalties' | 'finished';

export interface LiveClock {
  phase: LivePhase;
  /** Texto a mostrar: "12:34", "45+'", "Entretiempo", "Alargue", "Finalizado"… */
  label: string;
  /** true si conviene re-renderizar cada segundo (partido corriendo). */
  ticking: boolean;
}

const HALF_MS = 45 * 60 * 1000;
const FULL_MS = 90 * 60 * 1000;
const HALFTIME_BREAK_MS = 15 * 60 * 1000;

/** mm:ss a partir de milisegundos. */
function fmt(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(totalSec / 60)}:${String(totalSec % 60).padStart(2, '0')}`;
}

/**
 * Devuelve el estado del reloj para un partido, o `null` si no está en curso
 * (la UI usa su propio rótulo "Finalizado"/hora para esos casos).
 */
export function liveClock(
  official: OfficialResult | undefined,
  kickoffUTC: string,
  now: Date = new Date(),
): LiveClock | null {
  if (!official) return null;
  const { status } = official;
  if (status !== 'IN_PLAY' && status !== 'PAUSED') return null;

  // En juego 3+ h después del inicio ⇒ ya terminó (el feed tardó en marcar FINISHED).
  if (pastLiveWindow(kickoffUTC, now)) return { phase: 'finished', label: 'Finalizado', ticking: false };

  if (official.duration === 'PENALTY_SHOOTOUT')
    return { phase: 'penalties', label: 'Penales', ticking: false };
  if (status === 'PAUSED') return { phase: 'half', label: 'Entretiempo', ticking: false };
  if (official.duration === 'EXTRA_TIME') return { phase: 'extra', label: 'Alargue', ticking: true };

  const t = now.getTime();

  // 2do tiempo con ancla precisa (cuenta desde el reinicio, arrancando en 45').
  if (official.secondHalfStartedAt) {
    const ms = HALF_MS + (t - new Date(official.secondHalfStartedAt).getTime());
    return { phase: 'second', label: ms > FULL_MS ? "90+'" : fmt(ms), ticking: true };
  }
  // 2do tiempo sin ancla, pero con entretiempo ya jugado (halfTime presente): estimar
  // restando el descanso al tiempo transcurrido desde el inicio.
  if (official.halfTime && official.liveStartedAt) {
    const ms = t - new Date(official.liveStartedAt).getTime() - HALFTIME_BREAK_MS;
    return { phase: 'second', label: ms > FULL_MS ? "90+'" : fmt(Math.max(HALF_MS, ms)), ticking: true };
  }
  // 1er tiempo (desde el ancla; si todavía no llegó, desde el horario programado).
  const ms = t - new Date(official.liveStartedAt ?? kickoffUTC).getTime();
  return { phase: 'first', label: ms > HALF_MS ? "45+'" : fmt(Math.max(0, ms)), ticking: true };
}

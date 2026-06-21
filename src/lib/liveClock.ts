import type { OfficialResult } from '@/types';
import { pastLiveWindow } from '@/lib/dates';

/**
 * Reloj ESTIMADO de un partido en curso. El feed gratuito de football-data.org no trae
 * el minuto, así que se estima en el cliente desde el horario de inicio (`kickoffUTC`),
 * afinado con la transición real del 2º tiempo cuando el job la capturó
 * (`secondHalfStartedAt`). La FASE la manda el feed (status/duration). Precisión ±1–2 min;
 * el tiempo adicionado se muestra como "45+'/90+'" porque no lo conocemos. Puro y testeable.
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
 * Estado del reloj para un partido en curso, o `null` si no está en curso (la UI usa su
 * propio rótulo "Finalizado"/hora). `maxLiveMs` = margen de la etapa (cap del lag del feed).
 */
export function liveClock(
  official: OfficialResult | undefined,
  kickoffUTC: string,
  now: Date = new Date(),
  maxLiveMs?: number,
): LiveClock | null {
  if (!official) return null;
  const { status } = official;
  if (status !== 'IN_PLAY' && status !== 'PAUSED') return null;

  // En vivo más allá del margen de la etapa ⇒ ya terminó (el feed tardó en marcar FINISHED).
  if (pastLiveWindow(kickoffUTC, now, maxLiveMs))
    return { phase: 'finished', label: 'Finalizado', ticking: false };

  if (official.duration === 'PENALTY_SHOOTOUT')
    return { phase: 'penalties', label: 'Penales', ticking: false };
  if (status === 'PAUSED') return { phase: 'half', label: 'Entretiempo', ticking: false };
  if (official.duration === 'EXTRA_TIME') return { phase: 'extra', label: 'Alargue', ticking: true };

  const t = now.getTime();
  const elapsed = t - new Date(kickoffUTC).getTime(); // ms desde el inicio programado

  // 2º tiempo con ancla precisa del reinicio (cuenta desde 45').
  if (official.secondHalfStartedAt) {
    const ms = HALF_MS + (t - new Date(official.secondHalfStartedAt).getTime());
    return { phase: 'second', label: ms > FULL_MS ? "90+'" : fmt(ms), ticking: true };
  }
  // 2º tiempo sin ancla pero con entretiempo ya jugado (o +1h de juego): estimar desde el
  // inicio restando el descanso típico.
  if (official.halfTime || elapsed > 60 * 60 * 1000) {
    const ms = elapsed - HALFTIME_BREAK_MS;
    return { phase: 'second', label: ms > FULL_MS ? "90+'" : fmt(Math.max(HALF_MS, ms)), ticking: true };
  }
  // 1er tiempo (desde el inicio programado).
  return { phase: 'first', label: elapsed > HALF_MS ? "45+'" : fmt(Math.max(0, elapsed)), ticking: true };
}

import type { OfficialResult } from '@/types';
import { pastLiveWindow } from '@/lib/dates';

/**
 * Fase de un partido en curso, derivada SOLO del feed (sin estimar el minuto). El feed
 * gratuito no trae un minuto fiable, así que mostramos únicamente la fase: 1er/2do tiempo,
 * entretiempo, alargue o penales. La distinción 1er/2do tiempo sale de si el feed ya
 * registró el entretiempo (`halfTime`) o el reinicio (`secondHalfStartedAt`).
 */

export type LivePhase = 'first' | 'half' | 'second' | 'extra' | 'penalties' | 'finished';

export interface LiveStatus {
  phase: LivePhase;
  /** Texto a mostrar: "Primer tiempo", "Entretiempo", "Segundo tiempo", "Alargue"… */
  label: string;
}

/**
 * Fase de un partido en curso, o `null` si no está en curso (la UI usa su propio rótulo
 * "Finalizado"/hora). `maxLiveMs` = margen de la etapa (backstop del lag del feed).
 */
export function liveStatus(
  official: OfficialResult | undefined,
  kickoffUTC: string,
  now: Date = new Date(),
  maxLiveMs?: number,
): LiveStatus | null {
  if (!official) return null;
  const { status } = official;
  if (status !== 'IN_PLAY' && status !== 'PAUSED') return null;

  // En vivo más allá del margen de la etapa ⇒ ya terminó (el feed tardó en marcar FINISHED).
  if (pastLiveWindow(kickoffUTC, now, maxLiveMs)) return { phase: 'finished', label: 'Finalizado' };

  if (official.duration === 'PENALTY_SHOOTOUT') return { phase: 'penalties', label: 'Penales' };
  if (status === 'PAUSED') return { phase: 'half', label: 'Entretiempo' };
  if (official.duration === 'EXTRA_TIME') return { phase: 'extra', label: 'Alargue' };

  // Tiempo regular: 1er vs 2do tiempo según si el feed ya registró el entretiempo.
  const secondHalf = Boolean(official.secondHalfStartedAt) || Boolean(official.halfTime);
  return secondHalf
    ? { phase: 'second', label: 'Segundo tiempo' }
    : { phase: 'first', label: 'Primer tiempo' };
}

import type { Match, OfficialResult } from '@/types';
import { liveWindowMs } from '@/lib/dates';

/**
 * Configuración de la transmisión de radio (AM 910 / La Red) del partido en curso.
 *
 * El reproductor vive 100% en el cliente (ver `RadioControl.tsx`): el stream se
 * reproduce directo desde el navegador, sin proxy en el server.
 */

/** URL del stream. Es pública (corre en el browser); configurable por env. */
export const RADIO_STREAM_URL =
  process.env.NEXT_PUBLIC_RADIO_STREAM_URL ??
  'https://playerservices.streamtheworld.com/api/livestream-redirect/LA_RED_AM910AAC_SC';

/**
 * Flag para apagar la transmisión sin tocar código: en Vercel setear
 * `NEXT_PUBLIC_RADIO_ENABLED=false` y redeployar. Por defecto está ACTIVADA.
 */
export const RADIO_ENABLED = process.env.NEXT_PUBLIC_RADIO_ENABLED !== 'false';

/** Nombre de la emisora para los rótulos/créditos. */
export const RADIO_NAME = 'AM 910';

/** La transmisión se habilita esta antelación antes del inicio (30 min). */
export const RADIO_LEAD_MS = 30 * 60 * 1000;

/**
 * Si tras este tiempo el stream no empezó a reproducir (códec no soportado o red
 * trabada), se corta y se muestra "No se pudo conectar" en vez de quedar colgado en
 * "Conectando…". Algunos navegadores no disparan `error` ante un stall (ej. Firefox
 * con HE-AAC), por eso hace falta este backstop por tiempo.
 */
export const RADIO_CONNECT_TIMEOUT_MS = 30 * 1000;

/** ¿El partido ya terminó? (FINISHED del feed, o backstop por el margen de la etapa). */
function isMatchOver(m: Match, official: OfficialResult | undefined, now: Date): boolean {
  if (official?.status === 'FINISHED') return true;
  // Si el feed se quedó "en vivo" pasado el margen de la etapa, lo damos por terminado.
  return now.getTime() > new Date(m.kickoffUTC).getTime() + liveWindowMs(m.stage);
}

/**
 * "Próximo partido a disputarse": el primero por horario que TODAVÍA no terminó. Es el
 * único partido donde se muestra el control de radio; al finalizar, pasa al siguiente.
 * `matchesSorted` debe venir ordenado por kickoff ascendente.
 */
export function activeRadioMatchId(
  matchesSorted: Match[],
  official: Record<string, OfficialResult>,
  now: Date = new Date(),
): string | null {
  return matchesSorted.find((m) => !isMatchOver(m, official[m.id], now))?.id ?? null;
}

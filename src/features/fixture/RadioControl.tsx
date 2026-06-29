'use client';

import { cn } from '@/lib/cn';
import { useNow } from '@/lib/useNow';
import { RADIO_LEAD_MS, RADIO_NAME } from '@/lib/radio';
import { useRadioPlayerStore } from '@/store/radioPlayer';
import { PlayIcon, StopIcon, RadioIcon } from '@/components/icons';

/**
 * Control compacto de transmisión por radio para la tarjeta del próximo partido.
 * Antes de la ventana (30 min) muestra un aviso sutil; dentro de la ventana habilita
 * reproducir/detener el stream de AM 910 (audio nativo del navegador, lado cliente).
 */
export function RadioControl({ kickoffUTC }: { kickoffUTC: string }) {
  const now = useNow(true, 30_000);
  const status = useRadioPlayerStore((s) => s.status);
  const play = useRadioPlayerStore((s) => s.play);
  const stop = useRadioPlayerStore((s) => s.stop);

  const playing = status === 'connecting' || status === 'playing';
  // Disponible desde 30 min antes del inicio (y durante todo el partido).
  const available = now.getTime() >= new Date(kickoffUTC).getTime() - RADIO_LEAD_MS;

  const toggle = async () => {
    if (playing) {
      stop();
      return;
    }
    await play();
  };

  // Aún no entró en la ventana de 30 min: aviso sutil de que se activará.
  if (!available) {
    return (
      <div className="flex items-center gap-1.5 border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">
        <RadioIcon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">
          Relato por <span className="font-semibold">{RADIO_NAME}</span> · se activa 30′ antes
        </span>
      </div>
    );
  }

  const credit = `Proporcionado por ${RADIO_NAME}`;
  const note =
    status === 'error'
      ? `No se pudo conectar · ${credit}`
      : status === 'playing'
        ? `● En vivo · ${credit}`
        : credit;

  return (
    <div className="flex items-center gap-2 border-t border-border/60 px-3 py-2">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={
          playing ? `Detener transmisión de ${RADIO_NAME}` : `Escuchar transmisión de ${RADIO_NAME}`
        }
        className={cn(
          'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          playing ? 'bg-destructive/15 text-destructive' : 'bg-primary text-primary-foreground',
        )}
      >
        {playing ? <StopIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
        {status === 'connecting' ? 'Conectando…' : playing ? 'Detener' : 'Escuchar'}
      </button>
      <span
        aria-live="polite"
        className="min-w-0 flex-1 truncate text-[0.7rem] text-muted-foreground"
      >
        {note}
      </span>
    </div>
  );
}

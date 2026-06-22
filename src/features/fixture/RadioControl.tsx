'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { useNow } from '@/lib/useNow';
import { RADIO_CONNECT_TIMEOUT_MS, RADIO_LEAD_MS, RADIO_NAME, RADIO_STREAM_URL } from '@/lib/radio';
import { PlayIcon, StopIcon, RadioIcon } from '@/components/icons';

type Status = 'idle' | 'connecting' | 'playing' | 'error';

/**
 * Control compacto de transmisión por radio para la tarjeta del próximo partido.
 * Antes de la ventana (30 min) muestra un aviso sutil; dentro de la ventana habilita
 * reproducir/detener el stream de AM 910 (audio nativo del navegador, lado cliente).
 */
export function RadioControl({ kickoffUTC }: { kickoffUTC: string }) {
  const now = useNow(true, 30_000);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<Status>('idle');

  const playing = status === 'connecting' || status === 'playing';
  // Disponible desde 30 min antes del inicio (y durante todo el partido).
  const available = now.getTime() >= new Date(kickoffUTC).getTime() - RADIO_LEAD_MS;

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    const onPlaying = () => {
      clearTimer();
      setStatus('playing');
    };
    const onError = () => {
      clearTimer();
      setStatus('error');
    };
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('error', onError);
    audioRef.current = audio;
    return () => {
      clearTimer();
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('error', onError);
      audio.pause();
      audio.src = '';
      audio.load();
      audioRef.current = null;
    };
  }, []);

  // Stop "real": pausar + limpiar src libera el recurso del stream. `next` = estado final.
  const stop = (next: Status) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = '';
      audio.load();
    }
    setStatus(next);
  };

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      stop('idle');
      return;
    }
    try {
      setStatus('connecting');
      audio.src = RADIO_STREAM_URL;
      audio.load();
      // Backstop: si no empezó a reproducir en 30 s, cortar y marcar error (algunos
      // navegadores no disparan `error` ante un stall, ej. Firefox con HE-AAC).
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => stop('error'), RADIO_CONNECT_TIMEOUT_MS);
      await audio.play();
    } catch {
      stop('error');
    }
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
        aria-label={playing ? `Detener transmisión de ${RADIO_NAME}` : `Escuchar transmisión de ${RADIO_NAME}`}
        className={cn(
          'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          playing ? 'bg-destructive/15 text-destructive' : 'bg-primary text-primary-foreground',
        )}
      >
        {playing ? <StopIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
        {status === 'connecting' ? 'Conectando…' : playing ? 'Detener' : 'Escuchar'}
      </button>
      <span aria-live="polite" className="min-w-0 flex-1 truncate text-[0.7rem] text-muted-foreground">
        {note}
      </span>
    </div>
  );
}

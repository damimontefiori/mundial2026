'use client';

import { useEffect, useMemo } from 'react';
import type { StarSticker } from '@/data/starStickers';
import { getTeam } from '@/data/teams';

const COLORS = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#a855f7', '#ec4899', '#22d3ee', '#facc15'];
const AUTO_CLOSE_MS = 3800;

/** Animaciones autocontenidas (no tocamos CSS global). Se desactivan con reduce-motion. */
const CSS = `
@keyframes m26-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes m26-pop {
  0% { opacity: 0; transform: scale(.6) translateY(28px) }
  55% { opacity: 1; transform: scale(1.06) translateY(0) }
  100% { opacity: 1; transform: scale(1) translateY(0) }
}
@keyframes m26-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
@keyframes m26-confetti {
  0% { transform: translateY(-12vh) rotate(0); opacity: 1 }
  100% { transform: translateY(102vh) rotate(700deg); opacity: .85 }
}
@media (prefers-reduced-motion: reduce) {
  .m26-confetti-piece { display: none }
  .m26-anim { animation: none !important }
}
`;

/**
 * Festejo a pantalla completa al conseguir una figurita estrella: confeti, la imagen
 * del jugador entrando con pop + flotar suave, y la leyenda. Se cierra solo (~3.8 s) o
 * al tocar. Render condicional: solo cuando `star` no es null.
 */
export function StickerCelebration({
  star,
  onClose,
}: {
  star: StarSticker | null;
  onClose: () => void;
}) {
  // Generadas una vez por montaje. El padre remonta (key por estrella) → confeti nuevo.
  const pieces = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.7,
        duration: 1.8 + Math.random() * 1.8,
        size: 6 + Math.random() * 7,
        color: COLORS[i % COLORS.length],
        round: Math.random() > 0.5,
      })),
    [],
  );

  useEffect(() => {
    if (!star) return;
    const id = window.setTimeout(onClose, AUTO_CLOSE_MS);
    return () => window.clearTimeout(id);
  }, [star, onClose]);

  if (!star) return null;
  const team = getTeam(star.teamId);

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={`¡Conseguiste a ${star.player}!`}
      onClick={onClose}
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center overflow-hidden bg-background/85 px-6 text-center backdrop-blur-sm"
      style={{ animation: 'm26-fade .3s ease-out' }}
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {pieces.map((p, i) => (
          <span
            key={i}
            className="m26-confetti-piece absolute top-0"
            style={{
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: p.color,
              borderRadius: p.round ? '9999px' : '2px',
              animation: `m26-confetti ${p.duration}s linear ${p.delay}s forwards`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex h-60 items-end justify-center sm:h-72">
        <div
          className="absolute inset-x-0 bottom-2 mx-auto h-52 w-52 rounded-full bg-primary/20 blur-2xl"
          aria-hidden
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={star.image}
          alt={star.player}
          className="m26-anim relative max-h-full w-auto object-contain drop-shadow-2xl"
          style={{ animation: 'm26-pop .55s ease-out, m26-float 3s ease-in-out .55s infinite' }}
        />
      </div>

      <div
        className="m26-anim relative z-10 mt-4 max-w-sm"
        style={{ animation: 'm26-pop .5s ease-out .1s both' }}
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">
          ⭐ ¡Figurita estrella!
        </p>
        <h2 className="mt-1 text-2xl font-extrabold leading-tight">¡Felicitaciones!</h2>
        <p className="mt-1 text-lg font-bold">
          {team ? `${team.flag} ` : ''}Conseguiste a {star.player}
        </p>
        <p className="text-sm text-muted-foreground">{star.role}</p>
        <p className="mt-3 text-xs text-muted-foreground">(tocá para cerrar)</p>
      </div>
    </div>
  );
}

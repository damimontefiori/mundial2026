'use client';

import { cn } from '@/lib/cn';
import type { RatingTable } from '@/lib/predict';
import { advanceProbabilities, forecastMatch } from '@/lib/predict';

/**
 * Visualizaciones livianas del "grado de certeza" del modelo predictivo
 * (`src/lib/predict.ts`). No deciden nada: solo muestran lo que proyecta el motor.
 */

/** Barra fina con la probabilidad de AVANZAR de cada lado de un cruce de eliminatorias. */
export function ForecastBar({
  ratings,
  homeId,
  awayId,
  className,
}: {
  ratings: RatingTable;
  homeId: string;
  awayId: string;
  className?: string;
}) {
  const adv = advanceProbabilities(forecastMatch(ratings, homeId, awayId));
  const homePct = Math.round(adv.home * 100);
  return (
    <div
      className={cn('flex items-center gap-1', className)}
      title={`Pronóstico de avance: ${homePct}% / ${100 - homePct}%`}
    >
      <span className="tabular w-7 text-right text-[10px] tabular-nums text-muted-foreground">
        {homePct}%
      </span>
      <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
        <span className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${homePct}%` }} />
      </span>
      <span className="tabular w-7 text-[10px] tabular-nums text-muted-foreground">
        {100 - homePct}%
      </span>
    </div>
  );
}

/** Pronóstico de un partido de grupos: marcador más probable + confianza del resultado. */
export function GroupForecast({
  ratings,
  homeId,
  awayId,
}: {
  ratings: RatingTable;
  homeId: string;
  awayId: string;
}) {
  const f = forecastMatch(ratings, homeId, awayId);
  const outcomeProb =
    f.scoreHome > f.scoreAway ? f.probHome : f.scoreHome < f.scoreAway ? f.probAway : f.probDraw;
  return (
    <div className="mt-2 flex items-center justify-between rounded-lg bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground">
      <span>Pronóstico</span>
      <span className="tabular font-bold tabular-nums text-foreground">
        {f.scoreHome} – {f.scoreAway}
      </span>
      <span className="tabular tabular-nums">{Math.round(outcomeProb * 100)}% conf.</span>
    </div>
  );
}

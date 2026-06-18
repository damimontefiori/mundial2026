'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Match, OfficialResult } from '@/types';
import type { BracketView } from '@/lib/bracket';
import type { RatingTable } from '@/lib/predict';
import { buildBracketColumns } from '@/lib/bracketLayout';
import { teamsById } from '@/data/teams';
import { formatShortDate } from '@/lib/dates';
import { cn } from '@/lib/cn';
import { useSimulationStore } from '@/store/simulation';
import { placeholderForSlot } from '@/features/shared/matchDisplay';
import { ForecastBar } from './Forecast';

/** Una de las dos filas (equipo) dentro de la tarjeta de un cruce. */
function TeamRow({
  teamId,
  label,
  isWinner,
  isFavorite,
  goals,
  clickable,
  onPick,
}: {
  teamId: string | null;
  label: string;
  isWinner: boolean;
  isFavorite: boolean;
  goals: number | null;
  clickable: boolean;
  onPick: () => void;
}) {
  const team = teamId ? teamsById[teamId] : null;
  return (
    <button
      onClick={onPick}
      disabled={!clickable}
      className={cn(
        'flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-xs transition-colors',
        clickable && 'hover:bg-muted',
        isWinner ? 'font-bold text-foreground' : 'text-muted-foreground',
        !clickable && 'cursor-default',
      )}
    >
      <span className="text-sm leading-none" aria-hidden="true">
        {team ? team.flag : '🏳️'}
      </span>
      <span className={cn('flex-1 truncate', team ? '' : 'italic', isFavorite && 'text-primary')}>
        {team ? team.name : label}
      </span>
      {isFavorite ? <span aria-hidden>⭐</span> : null}
      {goals !== null ? <span className="tabular w-4 text-right tabular-nums">{goals}</span> : null}
    </button>
  );
}

function MatchCell({
  match,
  view,
  favoriteId,
  locked,
  official,
  ratings,
  hasLeft,
  hasRight,
}: {
  match: Match;
  view: BracketView;
  favoriteId: string | null;
  locked: Set<string>;
  official: Record<string, OfficialResult>;
  ratings: RatingTable;
  hasLeft: boolean;
  hasRight: boolean;
}) {
  const setPick = useSimulationStore((s) => s.setPick);
  const clearPick = useSimulationStore((s) => s.clearPick);
  const resolved = view.knockout[match.id];
  const homeId = resolved?.homeTeamId ?? null;
  const awayId = resolved?.awayTeamId ?? null;
  const winnerId = resolved?.winnerTeamId ?? null;
  const isLocked = locked.has(match.id);
  const off = official[match.id];

  const pick = (teamId: string | null) => {
    if (!teamId || isLocked) return;
    if (winnerId === teamId) clearPick(match.id);
    else setPick(match.id, teamId);
  };

  return (
    <div className="relative shrink-0">
      {/* Conectores hacia las columnas vecinas */}
      {hasLeft ? (
        <span className="absolute right-full top-1/2 h-px w-3 bg-border" aria-hidden />
      ) : null}
      {hasRight ? (
        <span className="absolute left-full top-1/2 h-px w-3 bg-border" aria-hidden />
      ) : null}
      <div
        className={cn(
          'w-40 rounded-lg border bg-card p-1 shadow-sm',
          isLocked ? 'border-success/50' : 'border-border',
        )}
      >
        <div className="flex items-center justify-between px-1 pb-0.5 text-[10px] text-muted-foreground">
          <span>P{match.number}</span>
          {isLocked ? (
            <span className="font-semibold text-success">● Real</span>
          ) : (
            <span>{formatShortDate(match.kickoffUTC)}</span>
          )}
        </div>
        <TeamRow
          teamId={homeId}
          label={placeholderForSlot(match.home)}
          isWinner={winnerId !== null && winnerId === homeId}
          isFavorite={homeId !== null && homeId === favoriteId}
          goals={off ? off.homeGoals : null}
          clickable={!isLocked && homeId !== null}
          onPick={() => pick(homeId)}
        />
        <TeamRow
          teamId={awayId}
          label={placeholderForSlot(match.away)}
          isWinner={winnerId !== null && winnerId === awayId}
          isFavorite={awayId !== null && awayId === favoriteId}
          goals={off ? off.awayGoals : null}
          clickable={!isLocked && awayId !== null}
          onPick={() => pick(awayId)}
        />
        {homeId && awayId && !isLocked ? (
          <ForecastBar ratings={ratings} homeId={homeId} awayId={awayId} className="mt-1 px-1" />
        ) : null}
      </div>
    </div>
  );
}

export function BracketTree({
  view,
  favoriteId,
  locked,
  official,
  ratings,
}: {
  view: BracketView;
  favoriteId: string | null;
  locked: Set<string>;
  official: Record<string, OfficialResult>;
  ratings: RatingTable;
}) {
  const { columns, thirdPlace } = useMemo(() => buildBracketColumns(), []);
  const paneRef = useRef<HTMLDivElement>(null);
  const [paneH, setPaneH] = useState<number | null>(null);

  // El árbol vive en un panel de scroll 2D acotado: así los títulos de columna
  // (sticky top-0) quedan fijos al desplazarse. La altura se calcula para llenar
  // desde el panel hasta arriba de la barra inferior, sin que scrollee la página.
  // Un ResizeObserver sobre el body recalcula ante CUALQUIER cambio de layout de lo
  // que está arriba (banner de resultados/campeón, nota de grupos, etc.), no solo
  // cuando cambian los resultados reales.
  useEffect(() => {
    const recompute = () => {
      const el = paneRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      const reserveBottom = 88; // barra de navegación inferior + respiro
      setPaneH(Math.max(260, window.innerHeight - top - reserveBottom));
    };
    recompute();
    const raf = requestAnimationFrame(recompute);
    window.addEventListener('resize', recompute);
    const ro = new ResizeObserver(recompute);
    ro.observe(document.body);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', recompute);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="px-4 pb-6">
      <p className="mb-2 text-xs text-muted-foreground">
        Tocá el equipo que pasa en cada cruce. Deslizá → para ver toda la llave.
      </p>
      <div
        ref={paneRef}
        style={paneH ? { height: `${paneH}px` } : undefined}
        className="no-scrollbar -mx-4 overflow-auto overscroll-contain px-4"
      >
        <div className="flex min-w-max items-stretch gap-2">
          {columns.map((col, colIdx) => (
            <div key={col.key} className="flex flex-col">
              <div className="sticky top-0 z-10 mb-1 bg-background pb-1 pt-1 text-center text-xs font-semibold text-muted-foreground">
                {col.label}
              </div>
              <div className="flex flex-1 flex-col justify-around gap-2">
                {col.matches.map((m) => (
                  <MatchCell
                    key={m.id}
                    match={m}
                    view={view}
                    favoriteId={favoriteId}
                    locked={locked}
                    official={official}
                    ratings={ratings}
                    hasLeft={colIdx > 0}
                    hasRight={colIdx < columns.length - 1}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {thirdPlace ? (
        <div className="mt-4">
          <p className="mb-1 text-center text-xs font-semibold text-muted-foreground">
            Tercer puesto
          </p>
          <div className="mx-auto max-w-[10.5rem]">
            <MatchCell
              match={thirdPlace}
              view={view}
              favoriteId={favoriteId}
              locked={locked}
              official={official}
              ratings={ratings}
              hasLeft={false}
              hasRight={false}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

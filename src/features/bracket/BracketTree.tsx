'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Match, OfficialResult } from '@/types';
import type { BracketView } from '@/lib/bracket';
import type { RatingTable } from '@/lib/predict';
import { buildBracketColumns, type BracketColumn } from '@/lib/bracketLayout';
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
      {/* Conectores horizontales hacia las columnas vecinas */}
      {hasLeft ? (
        <span className="absolute right-full top-1/2 h-px w-3 bg-border" aria-hidden />
      ) : null}
      {hasRight ? (
        <span className="absolute left-full top-1/2 h-px w-3 bg-border" aria-hidden />
      ) : null}
      <div
        className={cn(
          'w-40 min-h-[94px] rounded-lg border bg-card p-1 shadow-sm',
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

/** Columna de una de las dos mitades del árbol V. */
function HalfColumn({
  col,
  side,
  roundKey,
  isFirst,
  isLast,
  view,
  favoriteId,
  locked,
  official,
  ratings,
  collapsed,
  canCollapse,
  onToggleCollapse,
}: {
  col: BracketColumn;
  side: 'left' | 'right';
  roundKey: BracketColumn['key'];
  isFirst: boolean;
  isLast: boolean;
  view: BracketView;
  favoriteId: string | null;
  locked: Set<string>;
  official: Record<string, OfficialResult>;
  ratings: RatingTable;
  collapsed: boolean;
  canCollapse: boolean;
  onToggleCollapse: () => void;
}) {
  // Conectores horizontales:
  // Mitad izquierda: sin conector izquierdo en R32, siempre conector derecho.
  // Mitad derecha: siempre conector izquierdo, sin conector derecho en R32.
  const hasLeft = side === 'left' ? !isFirst : true;
  const hasRight = side === 'left' ? true : !isLast;

  return (
    <div
      data-round={side === 'right' ? roundKey + '-right' : roundKey}
      className="flex flex-col"
    >
      {/* Encabezado de columna con botón de colapsar */}
      <div className="sticky top-0 z-10 mb-1 flex items-center justify-center gap-1 bg-background pb-1 pt-1 text-center text-xs font-semibold text-muted-foreground">
        <span>{col.label}</span>
        {canCollapse ? (
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expandir ronda' : 'Colapsar ronda'}
            className="rounded p-0.5 hover:text-foreground"
          >
            {collapsed ? '▸' : '▾'}
          </button>
        ) : null}
      </div>

      {collapsed ? (
        /* Vista colapsada: solo un chip con el recuento */
        <div className="flex w-40 flex-1 items-center justify-center">
          <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] text-success">
            {col.matches.length}/{col.matches.length} ✓
          </span>
        </div>
      ) : col.key === 'R32' ? (
        /* R32 agrupa de a pares para dibujar los conectores verticales bracket-pair-l/r.
           Con min-h-[94px] en todos los cards, los 8 cards × 94px llenan exactamente la
           columna (sin free space en justify-around) → el R16, QF y SF quedan centrados
           entre sus pares feeder porque el math de justify-around individual coincide. */
        <div className="flex flex-1 flex-col gap-2">
          {col.matches.reduce<Match[][]>((pairs, m, i) => {
            if (i % 2 === 0) pairs.push([m]);
            else pairs[pairs.length - 1].push(m);
            return pairs;
          }, []).map((pair) => (
            <div key={pair[0].id} className={side === 'left' ? 'bracket-pair-l' : 'bracket-pair-r'}>
              {pair.map((match) => (
                <MatchCell
                  key={match.id}
                  match={match}
                  view={view}
                  favoriteId={favoriteId}
                  locked={locked}
                  official={official}
                  ratings={ratings}
                  hasLeft={hasLeft}
                  hasRight={hasRight}
                />
              ))}
            </div>
          ))}
        </div>
      ) : (
        /* R16/QF/SF: cards individuales con justify-around. Cada card queda centrado
           entre el par de cards de la ronda anterior gracias a que todos tienen min-h-[94px]. */
        <div className="flex flex-1 flex-col justify-around gap-2">
          {col.matches.map((match) => (
            <MatchCell
              key={match.id}
              match={match}
              view={view}
              favoriteId={favoriteId}
              locked={locked}
              official={official}
              ratings={ratings}
              hasLeft={hasLeft}
              hasRight={hasRight}
            />
          ))}
        </div>
      )}
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
  const [collapsedRounds, setCollapsedRounds] = useState<Set<string>>(new Set());

  // columns[0..3] = R32, R16, QF, SF  |  columns[4] = final
  const dataColumns = columns.slice(0, 4);
  const finalCol = columns[4];

  // Mitad izquierda: rama M101, primeras n/2 tarjetas de cada columna.
  const leftCols = dataColumns.map((col) => ({
    ...col,
    matches: col.matches.slice(0, col.matches.length / 2),
  }));

  // Mitad derecha: rama M102, invertida para que SF quede más cerca del centro.
  const rightCols = [...dataColumns].reverse().map((col) => ({
    ...col,
    matches: col.matches.slice(col.matches.length / 2),
  }));

  // Una ronda es colapsable cuando TODOS sus partidos (ambas mitades) están jugados.
  const isRoundComplete = (key: BracketColumn['key']): boolean => {
    const col = dataColumns.find((c) => c.key === key);
    return !!col && col.matches.every((m) => official[m.id]?.status === 'FINISHED');
  };

  const toggleRound = (key: string) => {
    setCollapsedRounds((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // Calcula la altura del panel para llenar el viewport sin que scrollee la página.
  // ResizeObserver detecta cambios de layout arriba (banner de campeón, etc.).
  useEffect(() => {
    const recompute = () => {
      const el = paneRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      const reserveBottom = 88;
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

  // Auto-scroll al centro (Final) al montar: centra horizontal y verticalmente para que
  // la Final quede visible en el primer vistazo. El usuario puede scrollear en cualquier
  // dirección para ver las rondas anteriores.
  useEffect(() => {
    const pane = paneRef.current;
    if (!pane) return;
    const target = pane.querySelector<HTMLElement>('[data-round="final"]');
    if (!target) return;
    const raf = requestAnimationFrame(() => {
      const scrollLeft = Math.max(
        0,
        target.offsetLeft - (pane.offsetWidth - target.offsetWidth) / 2,
      );
      // Centra verticalmente usando getBoundingClientRect para posicionamiento exacto.
      // Busca el match card de la Final y lo ubica al 35% desde el tope del pane,
      // dejando espacio abajo para que el usuario sepa que puede scrollear.
      const finalCard = target.querySelector<HTMLElement>('.relative.shrink-0');
      let scrollTop = Math.max(0, (pane.scrollHeight - pane.offsetHeight) / 2);
      if (finalCard) {
        const paneRect = pane.getBoundingClientRect();
        const cardRect = finalCard.getBoundingClientRect();
        const cardCenterInContent =
          cardRect.top - paneRect.top + pane.scrollTop + finalCard.offsetHeight / 2;
        scrollTop = Math.max(0, cardCenterInContent - pane.offsetHeight * 0.35);
      }
      pane.scrollTo({ left: scrollLeft, top: scrollTop, behavior: 'auto' });
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const finalMatch = finalCol?.matches[0];

  return (
    <div className="px-4 pb-6">
      <p className="mb-2 text-xs text-muted-foreground">← Deslizá para ver toda la llave →</p>
      <div
        ref={paneRef}
        style={paneH ? { height: `${paneH}px` } : undefined}
        className="no-scrollbar -mx-4 overflow-auto overscroll-contain px-4"
      >
        <div className="flex min-w-max items-stretch gap-2">
          {/* Mitad izquierda: R32_L → R16_L → QF_L → SF_L */}
          {leftCols.map((col, i) => (
            <HalfColumn
              key={col.key}
              col={col}
              side="left"
              roundKey={col.key}
              isFirst={i === 0}
              isLast={i === leftCols.length - 1}
              view={view}
              favoriteId={favoriteId}
              locked={locked}
              official={official}
              ratings={ratings}
              collapsed={collapsedRounds.has(col.key)}
              canCollapse={isRoundComplete(col.key)}
              onToggleCollapse={() => toggleRound(col.key)}
            />
          ))}

          {/* Centro: Final */}
          {finalMatch ? (
            <div data-round="final" className="flex flex-col">
              <div className="sticky top-0 z-10 mb-1 bg-background pb-1 pt-1 text-center text-xs font-semibold text-muted-foreground">
                {finalCol.label}
              </div>
              <div className="flex flex-1 flex-col justify-around">
                <MatchCell
                  match={finalMatch}
                  view={view}
                  favoriteId={favoriteId}
                  locked={locked}
                  official={official}
                  ratings={ratings}
                  hasLeft
                  hasRight
                />
              </div>
            </div>
          ) : null}

          {/* Mitad derecha: SF_R → QF_R → R16_R → R32_R */}
          {rightCols.map((col, i) => (
            <HalfColumn
              key={col.key + '-right'}
              col={col}
              side="right"
              roundKey={col.key}
              isFirst={i === 0}
              isLast={i === rightCols.length - 1}
              view={view}
              favoriteId={favoriteId}
              locked={locked}
              official={official}
              ratings={ratings}
              collapsed={collapsedRounds.has(col.key)}
              canCollapse={isRoundComplete(col.key)}
              onToggleCollapse={() => toggleRound(col.key)}
            />
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

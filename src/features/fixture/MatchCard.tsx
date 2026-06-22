'use client';

import type { Match, OfficialResult } from '@/types';
import type { BracketView } from '@/lib/bracket';
import { teamsById } from '@/data/teams';
import { getVenue } from '@/data/venues';
import { formatTime, liveWindowMs, pastLiveWindow } from '@/lib/dates';
import { liveStatus } from '@/lib/liveClock';
import { useNow } from '@/lib/useNow';
import { cn } from '@/lib/cn';
import { sideInfo } from '@/features/shared/matchDisplay';
import { RadioControl } from './RadioControl';

interface MatchCardProps {
  match: Match;
  view: BracketView;
  favoriteId: string | null;
  /** Resultado REAL del partido (si ya se jugó o está en juego). */
  official?: OfficialResult;
  /** Mostrar el control de radio (solo en el próximo partido a disputarse). */
  showRadio?: boolean;
  onClick?: () => void;
}

function Side({
  teamId,
  label,
  score,
  favorite,
  winner,
}: {
  teamId: string | null;
  label: string;
  score?: number;
  favorite: boolean;
  winner: boolean;
}) {
  const team = teamId ? teamsById[teamId] : null;
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex min-w-0 items-center gap-2.5">
        <span className="text-xl leading-none" aria-hidden="true">
          {team ? team.flag : '🏳️'}
        </span>
        <span
          className={cn(
            'truncate',
            team ? 'font-semibold' : 'text-sm italic text-muted-foreground',
            favorite && 'text-primary',
            winner && 'font-bold',
          )}
        >
          {label}
        </span>
        {favorite ? (
          <span aria-hidden className="text-xs">
            ⭐
          </span>
        ) : null}
      </span>
      {score !== undefined ? (
        <span className={cn('tabular shrink-0 text-lg font-bold', winner && 'text-primary')}>
          {score}
        </span>
      ) : null}
    </div>
  );
}

export function MatchCard({ match, view, favoriteId, official, showRadio, onClick }: MatchCardProps) {
  const home = sideInfo(match, 'home', view);
  const away = sideInfo(match, 'away', view);
  const venue = getVenue(match.venueId);
  const resolved = view.knockout[match.id];
  const winnerId = resolved?.winnerTeamId ?? null;
  const stageLabel = match.stage === 'group' ? `Grupo ${match.group}` : match.label;

  const rawLive = official?.status === 'IN_PLAY' || official?.status === 'PAUSED';
  // Refresco lento (30s): solo para recalcular el cap por etapa mientras está en vivo.
  const now = useNow(rawLive, 30000);
  // Margen máximo "en vivo" según la etapa: pasado eso ya terminó (lag del feed).
  const maxLive = liveWindowMs(match.stage);
  const overdue = rawLive && pastLiveWindow(match.kickoffUTC, now, maxLive);
  const finished = official?.status === 'FINISHED' || overdue;
  const live = rawLive && !overdue;
  const played = finished || live;
  const liveInfo = live ? liveStatus(official, match.kickoffUTC, now, maxLive) : null;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border bg-card shadow-sm',
        live ? 'border-destructive/60 ring-1 ring-destructive/20' : 'border-border',
      )}
    >
      <button
        onClick={onClick}
        className="block w-full p-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <div className="mb-2 flex items-center justify-between">
        {finished ? (
          <span className="rounded-md bg-success/15 px-2 py-0.5 text-sm font-semibold text-success">
            ● Finalizado
          </span>
        ) : live ? (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-destructive/15 px-2 py-0.5 text-sm font-semibold text-destructive">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" aria-hidden />
            EN VIVO
            {liveInfo ? (
              <span className="font-medium text-destructive/70">· {liveInfo.label}</span>
            ) : null}
          </span>
        ) : (
          <span className="tabular rounded-md bg-muted px-2 py-0.5 text-sm font-semibold">
            {formatTime(match.kickoffUTC)}
          </span>
        )}
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {stageLabel}
        </span>
      </div>

      <div className="space-y-1.5">
        <Side
          teamId={home.teamId}
          label={home.label}
          score={played ? official!.homeGoals : undefined}
          favorite={home.teamId === favoriteId && favoriteId !== null}
          winner={winnerId !== null && home.teamId === winnerId}
        />
        <Side
          teamId={away.teamId}
          label={away.label}
          score={played ? official!.awayGoals : undefined}
          favorite={away.teamId === favoriteId && favoriteId !== null}
          winner={winnerId !== null && away.teamId === winnerId}
        />
      </div>

        {venue ? (
          <p className="mt-2 truncate text-xs text-muted-foreground">
            {venue.stadium} · {venue.city}
          </p>
        ) : null}
      </button>
      {showRadio ? <RadioControl kickoffUTC={match.kickoffUTC} /> : null}
    </div>
  );
}

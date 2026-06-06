'use client';

import type { Match } from '@/types';
import type { BracketView } from '@/lib/bracket';
import { teamsById } from '@/data/teams';
import { getVenue } from '@/data/venues';
import { formatTime } from '@/lib/dates';
import { cn } from '@/lib/cn';
import { sideInfo } from '@/features/shared/matchDisplay';

interface MatchCardProps {
  match: Match;
  view: BracketView;
  favoriteId: string | null;
  result?: { homeGoals: number; awayGoals: number };
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

export function MatchCard({ match, view, favoriteId, result, onClick }: MatchCardProps) {
  const home = sideInfo(match, 'home', view);
  const away = sideInfo(match, 'away', view);
  const venue = getVenue(match.venueId);
  const resolved = view.knockout[match.id];
  const winnerId = resolved?.winnerTeamId ?? null;
  const stageLabel = match.stage === 'group' ? `Grupo ${match.group}` : match.label;

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border border-border bg-card p-3 text-left shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="tabular rounded-md bg-muted px-2 py-0.5 text-sm font-semibold">
          {formatTime(match.kickoffUTC)}
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {stageLabel}
        </span>
      </div>

      <div className="space-y-1.5">
        <Side
          teamId={home.teamId}
          label={home.label}
          score={result?.homeGoals}
          favorite={home.teamId === favoriteId && favoriteId !== null}
          winner={winnerId !== null && home.teamId === winnerId}
        />
        <Side
          teamId={away.teamId}
          label={away.label}
          score={result?.awayGoals}
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
  );
}

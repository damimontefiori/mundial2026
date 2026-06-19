'use client';

import type { Match, OfficialResult } from '@/types';
import type { BracketView } from '@/lib/bracket';
import { Sheet } from '@/components/Sheet';
import { Button } from '@/components/ui';
import { CalendarIcon } from '@/components/icons';
import { TeamBadge } from '@/components/TeamBadge';
import { teamsById } from '@/data/teams';
import { getVenue } from '@/data/venues';
import { formatLongDate, formatTime, isPast, pastLiveWindow } from '@/lib/dates';
import { cn } from '@/lib/cn';
import { sideInfo } from '@/features/shared/matchDisplay';
import { buildICS, downloadICS, matchToEvent } from '@/lib/ics';

interface MatchDetailSheetProps {
  match: Match | null;
  view: BracketView;
  official?: OfficialResult;
  open: boolean;
  onClose: () => void;
}

export function MatchDetailSheet({ match, view, official, open, onClose }: MatchDetailSheetProps) {
  const home = match ? sideInfo(match, 'home', view) : null;
  const away = match ? sideInfo(match, 'away', view) : null;
  const venue = match ? getVenue(match.venueId) : null;
  const homeTeam = home?.teamId ? teamsById[home.teamId] : null;
  const awayTeam = away?.teamId ? teamsById[away.teamId] : null;

  const rawLive = official?.status === 'IN_PLAY' || official?.status === 'PAUSED';
  // Un partido "en juego" 3+ h después del inicio ya terminó: se trata como final.
  const overdue = rawLive && match != null && pastLiveWindow(match.kickoffUTC);
  const finished = official?.status === 'FINISHED' || overdue;
  const live = rawLive && !overdue;
  const played = finished || live;
  const past = match ? isPast(match.kickoffUTC) : false;

  const addToCalendar = () => {
    if (!match || !home || !away) return;
    const event = matchToEvent(match, home.label, away.label);
    downloadICS(`partido-${match.number}`, buildICS([event]));
  };

  return (
    <Sheet open={open} onClose={onClose} title={match ? `Partido ${match.number}` : ''}>
      {match && home && away ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <TeamBadge team={homeTeam} placeholder={home.label} size="lg" />
              <span className="shrink-0 text-sm font-semibold text-muted-foreground">vs</span>
              <TeamBadge team={awayTeam} placeholder={away.label} size="lg" reverse />
            </div>
            {played && official ? (
              <p className="mt-3 flex items-center justify-center gap-2 text-center">
                <span className="tabular text-2xl font-bold tabular-nums">
                  {official.homeGoals} – {official.awayGoals}
                </span>
                <span
                  className={cn(
                    'text-xs font-semibold',
                    finished ? 'text-success' : 'text-destructive',
                  )}
                >
                  {finished ? '● Finalizado' : '● EN VIVO'}
                </span>
              </p>
            ) : null}
          </div>

          <dl className="space-y-2 text-sm">
            <Row
              label="Etapa"
              value={match.stage === 'group' ? `Grupo ${match.group}` : (match.label ?? '')}
            />
            <Row label="Fecha" value={capitalize(formatLongDate(match.kickoffUTC))} />
            <Row label="Hora (Argentina)" value={`${formatTime(match.kickoffUTC)} h`} />
            {venue ? <Row label="Estadio" value={`${venue.stadium}, ${venue.city}`} /> : null}
          </dl>

          <Button onClick={addToCalendar} className="w-full" disabled={past}>
            <CalendarIcon className="h-5 w-5" />
            Agregar al calendario
          </Button>
          {past ? (
            <p className="text-center text-xs text-muted-foreground">
              El partido ya comenzó — no se puede agregar al calendario.
            </p>
          ) : null}
        </div>
      ) : null}
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

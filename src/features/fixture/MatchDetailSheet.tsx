'use client';

import type { Match } from '@/types';
import type { BracketView } from '@/lib/bracket';
import { Sheet } from '@/components/Sheet';
import { Button } from '@/components/ui';
import { CalendarIcon } from '@/components/icons';
import { TeamBadge } from '@/components/TeamBadge';
import { teamsById } from '@/data/teams';
import { getVenue } from '@/data/venues';
import { formatLongDate, formatTime } from '@/lib/dates';
import { sideInfo } from '@/features/shared/matchDisplay';
import { buildICS, downloadICS, matchToEvent } from '@/lib/ics';

interface MatchDetailSheetProps {
  match: Match | null;
  view: BracketView;
  open: boolean;
  onClose: () => void;
}

export function MatchDetailSheet({ match, view, open, onClose }: MatchDetailSheetProps) {
  const home = match ? sideInfo(match, 'home', view) : null;
  const away = match ? sideInfo(match, 'away', view) : null;
  const venue = match ? getVenue(match.venueId) : null;
  const homeTeam = home?.teamId ? teamsById[home.teamId] : null;
  const awayTeam = away?.teamId ? teamsById[away.teamId] : null;

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

          <Button onClick={addToCalendar} className="w-full">
            <CalendarIcon className="h-5 w-5" />
            Agregar al calendario
          </Button>
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

'use client';

import { useState } from 'react';
import type { GroupId, GroupResult } from '@/types';
import { GROUP_IDS } from '@/types';
import type { RatingTable } from '@/lib/predict';
import { matchesOfGroup } from '@/data/matches';
import { teamsById } from '@/data/teams';
import { computeGroupStandings, groupProgress, isGroupComplete } from '@/lib/standings';
import { formatShortDate, formatTime } from '@/lib/dates';
import { cn } from '@/lib/cn';
import { usePreferencesStore } from '@/store/preferences';
import { useSimulationStore } from '@/store/simulation';
import { Card } from '@/components/ui';
import { CheckIcon, MinusIcon, PlusIcon } from '@/components/icons';
import { StandingsTable } from './StandingsTable';
import { GroupForecast } from './Forecast';

function Stepper({
  value,
  onDec,
  onInc,
  disabled = false,
}: {
  value: number | null;
  onDec: () => void;
  onInc: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        onClick={onDec}
        disabled={disabled || value === null || value === 0}
        aria-label="Restar gol"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-muted disabled:opacity-40"
      >
        <MinusIcon className="h-4 w-4" />
      </button>
      <span className="tabular w-6 text-center text-lg font-bold">{value ?? '–'}</span>
      <button
        onClick={onInc}
        disabled={disabled}
        aria-label="Sumar gol"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-muted disabled:opacity-40"
      >
        <PlusIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

export function GroupsPanel({
  results,
  locked,
  ratings,
}: {
  results: Record<string, GroupResult>;
  locked: Set<string>;
  ratings: RatingTable;
}) {
  const setGroupResult = useSimulationStore((s) => s.setGroupResult);
  const favoriteId = usePreferencesStore((s) => s.favoriteTeamId);
  const [selected, setSelected] = useState<GroupId>('A');

  const matches = matchesOfGroup(selected);
  const standings = computeGroupStandings(selected, results);
  const progress = groupProgress(selected, results);

  const bump = (matchId: string, side: 'home' | 'away', delta: number) => {
    const current = results[matchId] ?? { homeGoals: 0, awayGoals: 0 };
    const next = { ...current };
    if (side === 'home') next.homeGoals = Math.max(0, current.homeGoals + delta);
    else next.awayGoals = Math.max(0, current.awayGoals + delta);
    setGroupResult(matchId, next);
  };

  return (
    <div className="px-4 pb-6">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {GROUP_IDS.map((g) => (
          <button
            key={g}
            onClick={() => setSelected(g)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors',
              selected === g
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            {g}
            {isGroupComplete(g, results) ? <CheckIcon className="h-3.5 w-3.5" /> : null}
          </button>
        ))}
      </div>

      <Card className="mt-3 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold">Grupo {selected}</h2>
          <span className="tabular text-sm text-muted-foreground">{progress}/6 partidos</span>
        </div>
        <StandingsTable rows={standings} complete={progress === 6} favoriteId={favoriteId} />
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-success/60" /> Clasifica
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-warning/60" /> Puede ser mejor 3.º
          </span>
        </div>
      </Card>

      <h3 className="mb-2 mt-5 px-1 text-sm font-semibold text-muted-foreground">
        Cargá los resultados
      </h3>
      <div className="space-y-2.5">
        {matches.map((m) => {
          const result = results[m.id];
          const isLocked = locked.has(m.id);
          const homeId = m.home.kind === 'team' ? m.home.teamId : '';
          const awayId = m.away.kind === 'team' ? m.away.teamId : '';
          const home = teamsById[homeId];
          const away = teamsById[awayId];
          return (
            <div
              key={m.id}
              className={cn(
                'rounded-2xl border bg-card p-3',
                isLocked ? 'border-success/50' : 'border-border',
              )}
            >
              <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span>Jornada {m.matchday}</span>
                {isLocked ? (
                  <span className="font-semibold text-success">● Resultado real</span>
                ) : (
                  <span className="tabular">
                    {formatShortDate(m.kickoffUTC)} · {formatTime(m.kickoffUTC)}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'flex min-w-0 items-center gap-2',
                      favoriteId === homeId && 'text-primary',
                    )}
                  >
                    <span className="text-xl" aria-hidden="true">
                      {home?.flag}
                    </span>
                    <span className="truncate font-semibold">{home?.name}</span>
                  </span>
                  <Stepper
                    value={result ? result.homeGoals : null}
                    disabled={isLocked}
                    onDec={() => bump(m.id, 'home', -1)}
                    onInc={() => bump(m.id, 'home', 1)}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'flex min-w-0 items-center gap-2',
                      favoriteId === awayId && 'text-primary',
                    )}
                  >
                    <span className="text-xl" aria-hidden="true">
                      {away?.flag}
                    </span>
                    <span className="truncate font-semibold">{away?.name}</span>
                  </span>
                  <Stepper
                    value={result ? result.awayGoals : null}
                    disabled={isLocked}
                    onDec={() => bump(m.id, 'away', -1)}
                    onInc={() => bump(m.id, 'away', 1)}
                  />
                </div>
              </div>
              {!result && !isLocked && homeId && awayId ? (
                <GroupForecast ratings={ratings} homeId={homeId} awayId={awayId} />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

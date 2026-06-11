'use client';

import { useState } from 'react';
import type { Stage, OfficialResult } from '@/types';
import type { BracketView } from '@/lib/bracket';
import type { RatingTable } from '@/lib/predict';
import { knockoutStageMatches } from '@/data/matches';
import { teamsById } from '@/data/teams';
import { formatShortDate, formatTime } from '@/lib/dates';
import { cn } from '@/lib/cn';
import { usePreferencesStore } from '@/store/preferences';
import { useSimulationStore } from '@/store/simulation';
import { SegmentedControl } from '@/components/ui';
import { TrophyIcon } from '@/components/icons';
import { placeholderForSlot } from '@/features/shared/matchDisplay';
import type { Match } from '@/types';
import { BracketTree } from './BracketTree';
import { ForecastBar } from './Forecast';

const ROUNDS: { key: string; label: string; stages: Stage[] }[] = [
  { key: 'R32', label: '16avos', stages: ['R32'] },
  { key: 'R16', label: 'Octavos', stages: ['R16'] },
  { key: 'QF', label: 'Cuartos', stages: ['QF'] },
  { key: 'SF', label: 'Semis', stages: ['SF'] },
  { key: 'F', label: 'Final', stages: ['third', 'final'] },
];

function TeamPick({
  teamId,
  label,
  selected,
  isFavorite,
  goals,
  disabled,
  onPick,
}: {
  teamId: string | null;
  label: string;
  selected: boolean;
  isFavorite: boolean;
  goals: number | null;
  disabled: boolean;
  onPick: () => void;
}) {
  const team = teamId ? teamsById[teamId] : null;
  return (
    <button
      onClick={onPick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors disabled:cursor-default',
        selected
          ? 'border-primary bg-primary/10'
          : 'border-border hover:bg-muted disabled:hover:bg-transparent',
      )}
    >
      <span className="text-xl leading-none" aria-hidden="true">
        {team ? team.flag : '🏳️'}
      </span>
      <span
        className={cn(
          'flex-1 truncate',
          team ? 'font-semibold' : 'text-sm italic text-muted-foreground',
          selected && 'text-primary',
          isFavorite && !selected && 'text-primary',
        )}
      >
        {label}
      </span>
      {isFavorite ? <span aria-hidden>⭐</span> : null}
      {goals !== null ? (
        <span className="tabular text-lg font-bold tabular-nums">{goals}</span>
      ) : null}
      {selected && goals === null ? (
        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
          Pasa
        </span>
      ) : null}
    </button>
  );
}

function MatchPickCard({
  match,
  view,
  favoriteId,
  isLocked,
  official,
  ratings,
}: {
  match: Match;
  view: BracketView;
  favoriteId: string | null;
  isLocked: boolean;
  official?: OfficialResult;
  ratings: RatingTable;
}) {
  const setPick = useSimulationStore((s) => s.setPick);
  const clearPick = useSimulationStore((s) => s.clearPick);
  const resolved = view.knockout[match.id];
  const homeId = resolved?.homeTeamId ?? null;
  const awayId = resolved?.awayTeamId ?? null;
  const winnerId = resolved?.winnerTeamId ?? null;

  const pick = (teamId: string | null) => {
    if (!teamId || isLocked) return;
    if (winnerId === teamId) clearPick(match.id);
    else setPick(match.id, teamId);
  };

  return (
    <div
      className={cn(
        'rounded-2xl border bg-card p-3',
        isLocked ? 'border-success/50' : 'border-border',
      )}
    >
      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium">
          {match.label} · P{match.number}
        </span>
        {isLocked ? (
          <span className="font-semibold text-success">● Resultado real</span>
        ) : (
          <span className="tabular">
            {formatShortDate(match.kickoffUTC)} · {formatTime(match.kickoffUTC)}
          </span>
        )}
      </div>
      <div className="space-y-2">
        <TeamPick
          teamId={homeId}
          label={homeId ? (teamsById[homeId]?.name ?? homeId) : placeholderForSlot(match.home)}
          selected={winnerId !== null && winnerId === homeId}
          isFavorite={homeId !== null && homeId === favoriteId}
          goals={official ? official.homeGoals : null}
          disabled={isLocked || !homeId}
          onPick={() => pick(homeId)}
        />
        <TeamPick
          teamId={awayId}
          label={awayId ? (teamsById[awayId]?.name ?? awayId) : placeholderForSlot(match.away)}
          selected={winnerId !== null && winnerId === awayId}
          isFavorite={awayId !== null && awayId === favoriteId}
          goals={official ? official.awayGoals : null}
          disabled={isLocked || !awayId}
          onPick={() => pick(awayId)}
        />
      </div>
      {homeId && awayId && !isLocked ? (
        <ForecastBar ratings={ratings} homeId={homeId} awayId={awayId} className="mt-2 px-1" />
      ) : null}
    </div>
  );
}

export function KnockoutPanel({
  view,
  locked,
  official,
  ratings,
}: {
  view: BracketView;
  locked: Set<string>;
  official: Record<string, OfficialResult>;
  ratings: RatingTable;
}) {
  const favoriteId = usePreferencesStore((s) => s.favoriteTeamId);
  const [mode, setMode] = useState<'tree' | 'list'>('tree');
  const [round, setRound] = useState('R32');
  const activeRound = ROUNDS.find((r) => r.key === round) ?? ROUNDS[0];
  const roundMatches = knockoutStageMatches.filter((m) => activeRound.stages.includes(m.stage));

  const championId = view.knockout['M104']?.winnerTeamId ?? null;
  const champion = championId ? teamsById[championId] : null;

  return (
    <div className="pb-2">
      <div className="px-4">
        {champion ? (
          <div className="mb-3 flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-4">
            <TrophyIcon className="h-8 w-8 text-accent" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Campeón del Mundo
              </p>
              <p className="text-lg font-bold">
                {champion.flag} {champion.name}
              </p>
            </div>
          </div>
        ) : null}

        {!view.allGroupsComplete ? (
          <p className="mb-3 rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            Completá los 12 grupos para que se definan los cruces. Mientras tanto verás los cupos
            (1.º A, Mejor 3.º, etc.).
          </p>
        ) : null}

        <SegmentedControl
          options={[
            { value: 'tree', label: 'Árbol' },
            { value: 'list', label: 'Lista' },
          ]}
          value={mode}
          onChange={setMode}
        />
      </div>

      {mode === 'tree' ? (
        <div className="mt-3">
          <BracketTree
            view={view}
            favoriteId={favoriteId}
            locked={locked}
            official={official}
            ratings={ratings}
          />
        </div>
      ) : (
        <div className="px-4">
          <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
            {ROUNDS.map((r) => (
              <button
                key={r.key}
                onClick={() => setRound(r.key)}
                className={cn(
                  'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors',
                  round === r.key
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="mt-3 space-y-2.5 pb-4">
            {roundMatches.map((m) => (
              <MatchPickCard
                key={m.id}
                match={m}
                view={view}
                favoriteId={favoriteId}
                isLocked={locked.has(m.id)}
                official={official[m.id]}
                ratings={ratings}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

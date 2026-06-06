'use client';

import { useMemo, useState } from 'react';
import type { GroupId, Match } from '@/types';
import { GROUP_IDS } from '@/types';
import { matches } from '@/data/matches';
import { teamsById } from '@/data/teams';
import { computeBracket } from '@/lib/bracket';
import { capitalizeDate, dayKey, formatLongDate } from '@/lib/dates';
import { buildICS, downloadICS, matchToEvent } from '@/lib/ics';
import { usePreferencesStore } from '@/store/preferences';
import { useSimulationStore } from '@/store/simulation';
import { PageHeader } from '@/components/PageHeader';
import { Chip, EmptyState, IconButton } from '@/components/ui';
import { CalendarIcon, DownloadIcon, StarIcon } from '@/components/icons';
import { TeamPickerSheet } from '@/features/shared/TeamPickerSheet';
import { involvesFavorite, sideInfo } from '@/features/shared/matchDisplay';
import { MatchCard } from './MatchCard';
import { MatchDetailSheet } from './MatchDetailSheet';

type Filter = 'all' | 'finals' | GroupId;

export function FixtureView() {
  const groupResults = useSimulationStore((s) => s.groupResults);
  const knockoutPicks = useSimulationStore((s) => s.knockoutPicks);
  const favoriteId = usePreferencesStore((s) => s.favoriteTeamId);
  const setFavorite = usePreferencesStore((s) => s.setFavorite);

  const view = useMemo(
    () => computeBracket(groupResults, knockoutPicks),
    [groupResults, knockoutPicks],
  );

  const [filter, setFilter] = useState<Filter>('all');
  const [onlyFavorite, setOnlyFavorite] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [detail, setDetail] = useState<Match | null>(null);

  const favoriteTeam = favoriteId ? teamsById[favoriteId] : null;

  const list = useMemo(() => {
    let result = matches;
    if (filter === 'finals') result = result.filter((m) => m.stage !== 'group');
    else if (filter !== 'all') result = result.filter((m) => m.group === filter);
    if (onlyFavorite && favoriteId) {
      result = result.filter((m) => involvesFavorite(m, view, favoriteId));
    }
    return [...result].sort(
      (a, b) =>
        new Date(a.kickoffUTC).getTime() - new Date(b.kickoffUTC).getTime() || a.number - b.number,
    );
  }, [filter, onlyFavorite, favoriteId, view]);

  const days = useMemo(() => {
    const map = new Map<string, Match[]>();
    for (const m of list) {
      const key = dayKey(m.kickoffUTC);
      const bucket = map.get(key);
      if (bucket) bucket.push(m);
      else map.set(key, [m]);
    }
    return [...map.entries()];
  }, [list]);

  const exportIcs = () => {
    const events = list.map((m) => {
      const home = sideInfo(m, 'home', view);
      const away = sideInfo(m, 'away', view);
      return matchToEvent(m, home.label, away.label);
    });
    if (events.length > 0) downloadICS('mundial2026', buildICS(events));
  };

  return (
    <>
      <PageHeader
        title="Partidos"
        subtitle="Horarios de Argentina 🇦🇷"
        actions={
          <>
            <IconButton
              label="Elegir equipo favorito"
              variant={favoriteTeam ? 'secondary' : 'ghost'}
              onClick={() => setPickerOpen(true)}
            >
              {favoriteTeam ? (
                <span className="text-lg">{favoriteTeam.flag}</span>
              ) : (
                <StarIcon className="h-5 w-5" />
              )}
            </IconButton>
            <IconButton label="Exportar al calendario" onClick={exportIcs}>
              <DownloadIcon className="h-5 w-5" />
            </IconButton>
          </>
        }
      />

      <div className="px-4 py-3">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
            Todos
          </Chip>
          <Chip active={filter === 'finals'} onClick={() => setFilter('finals')}>
            Finales
          </Chip>
          {GROUP_IDS.map((g) => (
            <Chip key={g} active={filter === g} onClick={() => setFilter(g)}>
              Grupo {g}
            </Chip>
          ))}
        </div>

        {favoriteTeam ? (
          <div className="mt-2">
            <Chip active={onlyFavorite} onClick={() => setOnlyFavorite((v) => !v)}>
              <span>{favoriteTeam.flag}</span> Solo {favoriteTeam.name}
            </Chip>
          </div>
        ) : null}
      </div>

      <div className="space-y-5 px-4 pb-6">
        {days.length === 0 ? (
          <EmptyState
            icon={<CalendarIcon className="h-10 w-10" />}
            title="No hay partidos"
            description="Probá con otro filtro."
          />
        ) : (
          days.map(([key, dayMatches]) => (
            <section key={key}>
              <h2 className="sticky top-[3.75rem] z-10 -mx-4 bg-background/85 px-4 py-1.5 text-sm font-semibold capitalize text-muted-foreground backdrop-blur">
                {capitalizeDate(formatLongDate(dayMatches[0].kickoffUTC))}
              </h2>
              <div className="mt-2 space-y-2.5">
                {dayMatches.map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    view={view}
                    favoriteId={favoriteId}
                    result={m.stage === 'group' ? groupResults[m.id] : undefined}
                    onClick={() => setDetail(m)}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <TeamPickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedId={favoriteId}
        onSelect={setFavorite}
      />
      <MatchDetailSheet
        match={detail}
        view={view}
        open={detail !== null}
        onClose={() => setDetail(null)}
      />
    </>
  );
}

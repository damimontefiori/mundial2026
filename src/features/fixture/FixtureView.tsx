'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { GroupId, Match } from '@/types';
import { GROUP_IDS } from '@/types';
import { matches } from '@/data/matches';
import { teamsById } from '@/data/teams';
import { computeBracket } from '@/lib/bracket';
import { mergeOfficial } from '@/lib/officialResults';
import { capitalizeDate, dayKey, formatLongDate, isPast } from '@/lib/dates';
import { buildICS, downloadICS, matchToEvent } from '@/lib/ics';
import { useNow } from '@/lib/useNow';
import { RADIO_ENABLED, activeRadioMatchId } from '@/lib/radio';
import { usePreferencesStore } from '@/store/preferences';
import { useResultsStore } from '@/store/results';
import { PageHeader } from '@/components/PageHeader';
import { Button, Chip, EmptyState, IconButton } from '@/components/ui';
import { CalendarIcon, DownloadIcon, StarIcon } from '@/components/icons';
import { TeamPickerSheet } from '@/features/shared/TeamPickerSheet';
import { involvesFavorite, sideInfo } from '@/features/shared/matchDisplay';
import { MatchCard } from './MatchCard';
import { MatchDetailSheet } from './MatchDetailSheet';

type Filter = 'all' | 'finals' | GroupId;

export function FixtureView() {
  const official = useResultsStore((s) => s.official);
  const favoriteId = usePreferencesStore((s) => s.favoriteTeamId);
  const setFavorite = usePreferencesStore((s) => s.setFavorite);

  // El fixture refleja los resultados REALES: la llave (clasificados/cruces) se
  // resuelve solo con `official`. Lo que falta jugar muestra los cupos (1.º A, etc.).
  const { groupResults, picks } = useMemo(() => mergeOfficial({}, {}, official), [official]);
  const view = useMemo(() => computeBracket(groupResults, picks), [groupResults, picks]);

  // Control de radio: se muestra SOLO en el próximo partido a disputarse (global, sin
  // importar el filtro). Tick lento (60 s) para avanzar al siguiente al terminar uno.
  const radioNow = useNow(RADIO_ENABLED, 60_000);
  const sortedAll = useMemo(
    () =>
      [...matches].sort(
        (a, b) =>
          new Date(a.kickoffUTC).getTime() - new Date(b.kickoffUTC).getTime() || a.number - b.number,
      ),
    [],
  );
  const radioMatchId = useMemo(
    () => (RADIO_ENABLED ? activeRadioMatchId(sortedAll, official, radioNow) : null),
    [sortedAll, official, radioNow],
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

  // Al abrir el tab, saltar (instantáneo) al día de hoy o, si no hay, al próximo con
  // partidos. `days` viene ascendente, así que el primero con key >= hoy es el objetivo.
  const didScrollRef = useRef(false);
  useEffect(() => {
    if (didScrollRef.current || days.length === 0) return;
    didScrollRef.current = true;
    const todayKey = dayKey(new Date().toISOString());
    const target = days.find(([k]) => k >= todayKey)?.[0] ?? days[days.length - 1][0];
    requestAnimationFrame(() => {
      document
        .getElementById(`day-${target}`)
        ?.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
  }, [days]);

  // Solo se exportan/agregan al calendario los partidos que todavía no empezaron.
  const upcoming = useMemo(() => list.filter((m) => !isPast(m.kickoffUTC)), [list]);

  const exportIcs = () => {
    const events = upcoming.map((m) => {
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
            <Button
              size="sm"
              variant="secondary"
              onClick={exportIcs}
              disabled={upcoming.length === 0}
              title="Exportar los próximos partidos al calendario"
            >
              <DownloadIcon className="h-4 w-4" />
              Calendario
            </Button>
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
            <section key={key} id={`day-${key}`} className="scroll-mt-[var(--header-h)]">
              <h2 className="sticky top-[var(--header-h)] z-10 -mx-4 bg-background/85 px-4 py-1.5 text-sm font-semibold capitalize text-muted-foreground backdrop-blur">
                {capitalizeDate(formatLongDate(dayMatches[0].kickoffUTC))}
              </h2>
              <div className="mt-2 space-y-2.5">
                {dayMatches.map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    view={view}
                    favoriteId={favoriteId}
                    official={official[m.id]}
                    showRadio={m.id === radioMatchId}
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
        official={detail ? official[detail.id] : undefined}
        open={detail !== null}
        onClose={() => setDetail(null)}
      />
    </>
  );
}

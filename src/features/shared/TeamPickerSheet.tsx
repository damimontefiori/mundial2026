'use client';

import { useMemo, useState } from 'react';
import { Sheet } from '@/components/Sheet';
import { CheckIcon, SearchIcon, StarIcon } from '@/components/icons';
import { groups } from '@/data/groups';
import { teamsById } from '@/data/teams';
import { cn } from '@/lib/cn';

interface TeamPickerSheetProps {
  open: boolean;
  onClose: () => void;
  selectedId: string | null;
  onSelect: (teamId: string | null) => void;
}

const norm = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

/** Hoja para elegir el equipo favorito, con búsqueda y agrupado por grupo. */
export function TeamPickerSheet({ open, onClose, selectedId, onSelect }: TeamPickerSheetProps) {
  const [query, setQuery] = useState('');

  const filteredGroups = useMemo(() => {
    const q = norm(query.trim());
    return groups
      .map((g) => ({
        id: g.id,
        teams: g.teamIds.map((id) => teamsById[id]).filter((t) => !q || norm(t.name).includes(q)),
      }))
      .filter((g) => g.teams.length > 0);
  }, [query]);

  const choose = (id: string | null) => {
    onSelect(id);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Tu equipo">
      <div className="relative mb-3">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          inputMode="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar equipo…"
          className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <button
        onClick={() => choose(null)}
        className={cn(
          'mb-3 flex w-full items-center justify-between rounded-xl border border-border px-3 py-2.5 text-left',
          !selectedId && 'border-primary',
        )}
      >
        <span className="text-sm font-medium text-muted-foreground">Sin equipo favorito</span>
        {!selectedId ? <CheckIcon className="h-5 w-5 text-primary" /> : null}
      </button>

      <div className="space-y-4">
        {filteredGroups.map((g) => (
          <div key={g.id}>
            <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Grupo {g.id}
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {g.teams.map((t) => {
                const selected = t.id === selectedId;
                return (
                  <button
                    key={t.id}
                    onClick={() => choose(t.id)}
                    className={cn(
                      'flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-colors',
                      selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted',
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-xl" aria-hidden="true">
                        {t.flag}
                      </span>
                      <span className="font-semibold">{t.name}</span>
                    </span>
                    {selected ? <StarIcon className="h-5 w-5 fill-primary text-primary" /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Sheet>
  );
}

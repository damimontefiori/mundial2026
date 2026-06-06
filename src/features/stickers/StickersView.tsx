'use client';

import { useMemo, useRef, useState } from 'react';
import { stickerAlbum } from '@/data/stickers';
import { cn } from '@/lib/cn';
import { useStickersStore } from '@/store/stickers';
import { PageHeader } from '@/components/PageHeader';
import { Card, ProgressBar, SegmentedControl } from '@/components/ui';
import { SearchIcon } from '@/components/icons';

type Mode = 'have' | 'addRepe' | 'subRepe';

function Cell({
  n,
  count,
  mode,
  highlighted,
  onAct,
}: {
  n: number;
  count: number;
  mode: Mode;
  highlighted: boolean;
  onAct: (n: number) => void;
}) {
  const owned = count > 0;
  return (
    <button
      id={`fig-${n}`}
      onClick={() => onAct(n)}
      aria-pressed={owned}
      aria-label={`Figurita ${n}${owned ? ', la tengo' : ', me falta'}${count > 1 ? `, ${count} repetidas` : ''}`}
      className={cn(
        'relative flex aspect-square items-center justify-center rounded-lg border text-sm font-semibold transition-colors',
        owned
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-muted-foreground hover:bg-muted',
        highlighted && 'ring-2 ring-accent ring-offset-2 ring-offset-background',
      )}
    >
      {n}
      {count > 1 ? (
        <span className="absolute -right-1 -top-1 rounded-full bg-accent px-1 text-[0.6rem] font-bold text-accent-foreground">
          ×{count}
        </span>
      ) : null}
    </button>
  );
}

export function StickersView() {
  const owned = useStickersStore((s) => s.owned);
  const toggle = useStickersStore((s) => s.toggle);
  const increment = useStickersStore((s) => s.increment);
  const decrement = useStickersStore((s) => s.decrement);
  const markRange = useStickersStore((s) => s.markRange);

  const [mode, setMode] = useState<Mode>('have');
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [search, setSearch] = useState('');
  const [highlight, setHighlight] = useState<number | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stats = useMemo(() => {
    const total = stickerAlbum.total;
    let have = 0;
    let repes = 0;
    for (let n = 1; n <= total; n++) {
      const c = owned[n] ?? 0;
      if (c > 0) have += 1;
      if (c > 1) repes += c - 1;
    }
    return { total, have, missing: total - have, repes };
  }, [owned]);

  const act = (n: number) => {
    if (mode === 'have') toggle(n);
    else if (mode === 'addRepe') increment(n);
    else decrement(n);
  };

  const onSearch = (value: string) => {
    setSearch(value);
    const n = parseInt(value, 10);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!Number.isNaN(n) && n >= 1 && n <= stickerAlbum.total) {
      searchTimer.current = setTimeout(() => {
        setHighlight(n);
        document
          .getElementById(`fig-${n}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => setHighlight(null), 1800);
      }, 250);
    }
  };

  return (
    <>
      <PageHeader title="Figuritas" subtitle={`Tenés ${stats.have} de ${stats.total}`} />

      <div className="space-y-4 px-4 py-3">
        <Card className="p-4">
          <div className="mb-2 flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold">
                {stats.have}
                <span className="text-base font-medium text-muted-foreground">
                  {' '}
                  / {stats.total}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                {Math.round((stats.have / stats.total) * 100)}% del álbum
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold text-warning">Faltan {stats.missing}</p>
              <p className="text-muted-foreground">Repes: {stats.repes}</p>
            </div>
          </div>
          <ProgressBar value={stats.have / stats.total} />
        </Card>

        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            inputMode="numeric"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Buscar figurita por número…"
            className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2">
          <SegmentedControl
            className="flex-1"
            options={[
              { value: 'have', label: 'Tengo' },
              { value: 'addRepe', label: '+ Repe' },
              { value: 'subRepe', label: '− Repe' },
            ]}
            value={mode}
            onChange={setMode}
          />
          <button
            onClick={() => setOnlyMissing((v) => !v)}
            className={cn(
              'shrink-0 rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
              onlyMissing
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground',
            )}
          >
            Solo faltan
          </button>
        </div>
      </div>

      <div className="space-y-5 px-4 pb-6">
        {stickerAlbum.sections.map((section) => {
          const numbers: number[] = [];
          for (let n = section.from; n <= section.to; n++) {
            if (!onlyMissing || (owned[n] ?? 0) === 0) numbers.push(n);
          }
          let sectionHave = 0;
          for (let n = section.from; n <= section.to; n++)
            if ((owned[n] ?? 0) > 0) sectionHave += 1;
          const sectionTotal = section.to - section.from + 1;

          return (
            <section key={section.id}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate font-bold">{section.title}</h2>
                  <p className="tabular text-xs text-muted-foreground">
                    #{section.from}–{section.to} · {sectionHave}/{sectionTotal}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => markRange(section.from, section.to, true)}
                    className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => markRange(section.from, section.to, false)}
                    className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                  >
                    Limpiar
                  </button>
                </div>
              </div>

              {numbers.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
                  ¡Sección completa! 🎉
                </p>
              ) : (
                <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-8">
                  {numbers.map((n) => (
                    <Cell
                      key={n}
                      n={n}
                      count={owned[n] ?? 0}
                      mode={mode}
                      highlighted={highlight === n}
                      onAct={act}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}

'use client';

import { useMemo, useRef, useState } from 'react';
import { stickerAlbum, baseStickerCodes } from '@/data/stickers';
import { cn } from '@/lib/cn';
import { useStickersStore } from '@/store/stickers';
import { PageHeader } from '@/components/PageHeader';
import { Card, ProgressBar, SegmentedControl } from '@/components/ui';
import { SearchIcon } from '@/components/icons';

type Mode = 'have' | 'addRepe' | 'subRepe';

/** Todos los códigos del álbum (incluida la promo), para la búsqueda. */
const allCodes = stickerAlbum.sections.flatMap((s) => s.codes);

function Cell({
  code,
  count,
  highlighted,
  onAct,
}: {
  code: string;
  count: number;
  highlighted: boolean;
  onAct: (code: string) => void;
}) {
  const owned = count > 0;
  return (
    <button
      id={`fig-${code}`}
      onClick={() => onAct(code)}
      aria-pressed={owned}
      aria-label={`Figurita ${code}${owned ? ', la tengo' : ', me falta'}${count > 1 ? `, ${count} repetidas` : ''}`}
      className={cn(
        'relative flex aspect-square items-center justify-center rounded-lg border text-xs font-bold transition-colors',
        owned
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-muted-foreground hover:bg-muted',
        highlighted && 'ring-2 ring-accent ring-offset-2 ring-offset-background',
      )}
    >
      {code}
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
  const markCodes = useStickersStore((s) => s.markCodes);

  const [mode, setMode] = useState<Mode>('have');
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [search, setSearch] = useState('');
  const [highlight, setHighlight] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Progreso sobre el set base (980), sin contar la promo Coca-Cola.
  const stats = useMemo(() => {
    const total = baseStickerCodes.length;
    let have = 0;
    let repes = 0;
    for (const code of baseStickerCodes) {
      const c = owned[code] ?? 0;
      if (c > 0) have += 1;
      if (c > 1) repes += c - 1;
    }
    return { total, have, missing: total - have, repes };
  }, [owned]);

  const act = (code: string) => {
    if (mode === 'have') toggle(code);
    else if (mode === 'addRepe') increment(code);
    else decrement(code);
  };

  const onSearch = (value: string) => {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const q = value.trim().toUpperCase();
    if (!q) return;
    searchTimer.current = setTimeout(() => {
      const match = allCodes.find((c) => c === q) ?? allCodes.find((c) => c.startsWith(q));
      if (!match) return;
      setHighlight(match);
      document.getElementById(`fig-${match}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setHighlight(null), 1800);
    }, 250);
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
                <span className="text-base font-medium text-muted-foreground"> / {stats.total}</span>
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
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Buscar por código (ej. MEX1, FWC1, CC3)…"
            className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-3 text-base uppercase outline-none placeholder:normal-case focus-visible:ring-2 focus-visible:ring-ring"
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
          const visible = section.codes.filter(
            (code) => !onlyMissing || (owned[code] ?? 0) === 0,
          );
          const sectionHave = section.codes.filter((code) => (owned[code] ?? 0) > 0).length;
          const sectionTotal = section.codes.length;
          const firstCode = section.codes[0];
          const lastCode = section.codes[section.codes.length - 1];

          return (
            <section key={section.id}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate font-bold">{section.title}</h2>
                  <p className="tabular text-xs text-muted-foreground">
                    {firstCode}–{lastCode} · {sectionHave}/{sectionTotal}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => markCodes(section.codes, true)}
                    className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => markCodes(section.codes, false)}
                    className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                  >
                    Limpiar
                  </button>
                </div>
              </div>

              {visible.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
                  ¡Sección completa! 🎉
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
                  {visible.map((code) => (
                    <Cell
                      key={code}
                      code={code}
                      count={owned[code] ?? 0}
                      highlighted={highlight === code}
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

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { StickerSection } from '@/types';
import { stickerAlbum, baseStickerCodes } from '@/data/stickers';
import { STAR_STICKERS, STAR_IMAGES, type StarSticker } from '@/data/starStickers';
import { teamsById } from '@/data/teams';
import { cn } from '@/lib/cn';
import { useStickersStore } from '@/store/stickers';
import { shareViaWhatsApp } from '@/lib/share';
import {
  buildMissingMessage,
  buildRepeatedMessage,
  hasMissing,
  hasRepeated,
} from '@/lib/stickerShare';
import { PageHeader } from '@/components/PageHeader';
import { Sheet } from '@/components/Sheet';
import { Button, Card, ProgressBar, SegmentedControl } from '@/components/ui';
import { SearchIcon, WhatsAppIcon } from '@/components/icons';
import { StickerCelebration } from './StickerCelebration';

type Mode = 'have' | 'addRepe' | 'subRepe';
type TeamStickerSection = StickerSection & { teamId: string };

/** Todos los códigos del álbum (incluida la promo), para la búsqueda. */
const allCodes = stickerAlbum.sections.flatMap((s) => s.codes);
const isTeamSection = (section: StickerSection): section is TeamStickerSection =>
  section.kind === 'team' && typeof section.teamId === 'string';
const teamSections = stickerAlbum.sections.filter(isTeamSection);
const norm = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();

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
  const [celebrate, setCelebrate] = useState<StarSticker | null>(null);
  const [completedTeamId, setCompletedTeamId] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTarget = useRef<string | null>(null);
  const completedTeam = completedTeamId ? teamsById[completedTeamId] : null;

  // Precarga (una vez) las imágenes de las estrellas para que el festejo sea instantáneo.
  useEffect(() => {
    STAR_IMAGES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

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
    const wasOwned = (owned[code] ?? 0) > 0;
    const section = teamSections.find((s) => s.codes.includes(code));
    const wasSectionComplete = section?.codes.every((c) => (owned[c] ?? 0) > 0) ?? false;
    const current = owned[code] ?? 0;
    const nextCount =
      mode === 'have'
        ? current > 0
          ? 0
          : 1
        : mode === 'addRepe'
          ? current + 1
          : Math.max(0, current - 1);
    if (mode === 'have') toggle(code);
    else if (mode === 'addRepe') increment(code);
    else decrement(code);
    // Festejo al CONSEGUIR (de "no la tengo" → "la tengo") una figurita estrella.
    if (mode !== 'subRepe' && !wasOwned && STAR_STICKERS[code]) {
      setCelebrate(STAR_STICKERS[code]);
    }
    if (
      section &&
      mode !== 'subRepe' &&
      !wasSectionComplete &&
      section.codes.every((c) => (c === code ? nextCount : (owned[c] ?? 0)) > 0)
    ) {
      setCompletedTeamId(section.teamId);
    }
  };

  // "Todas" / "Limpiar" piden confirmación: un toque accidental podría borrar el
  // progreso de toda una sección.
  const confirmMark = (section: StickerSection, owned: boolean) => {
    const msg = owned
      ? `¿Marcar como completas las ${section.codes.length} figuritas de ${section.title}?`
      : `¿Borrar tus figuritas de ${section.title}? Vas a perder las marcadas y las repes de esta sección.`;
    const wasComplete = section.codes.every(
      (code) => (useStickersStore.getState().owned[code] ?? 0) > 0,
    );
    if (window.confirm(msg)) {
      markCodes(section.codes, owned);
      if (owned && isTeamSection(section) && !wasComplete) setCompletedTeamId(section.teamId);
    }
  };

  const findSearchMatch = (query: string): { code: string; sectionId?: string } | null => {
    const codeQuery = query.trim().toUpperCase();
    const codeMatch =
      allCodes.find((c) => c === codeQuery) ?? allCodes.find((c) => c.startsWith(codeQuery));
    if (codeMatch) return { code: codeMatch };

    const countryQuery = norm(query);
    if (!countryQuery) return null;
    const section = teamSections.find((s) => {
      const team = teamsById[s.teamId];
      return (
        norm(team.name).includes(countryQuery) ||
        norm(team.fifaCode).includes(countryQuery) ||
        norm(team.id).includes(countryQuery)
      );
    });
    if (!section) return null;
    return {
      code:
        section.codes.find((code) => !onlyMissing || (owned[code] ?? 0) === 0) ?? section.codes[0],
      sectionId: section.id,
    };
  };

  const onSearch = (value: string) => {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const q = value.trim();
    if (!q) {
      lastTarget.current = null;
      setHighlight(null);
      return;
    }
    searchTimer.current = setTimeout(() => {
      const match = findSearchMatch(q);
      if (!match) return;
      setHighlight(match.code);
      const target =
        document.getElementById(`fig-${match.code}`) ??
        (match.sectionId ? document.getElementById(`fig-section-${match.sectionId}`) : null);
      lastTarget.current = target?.id ?? null;
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setHighlight(null), 1800);
    }, 250);
  };

  // Al salir del buscador (en móvil, al cerrar el teclado), algunos navegadores resetean
  // el scroll al tope: lo re-posicionamos en la última figurita encontrada, tras el
  // reacomodo del viewport, para no perder el lugar.
  const onSearchBlur = () => {
    const targetId = lastTarget.current;
    if (!targetId) return;
    setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ block: 'center' });
    }, 300);
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

        <div>
          <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Compartir por WhatsApp
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              disabled={!hasRepeated(owned)}
              onClick={() => shareViaWhatsApp(buildRepeatedMessage(owned))}
            >
              <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
              Repetidas
            </Button>
            <Button
              variant="outline"
              disabled={!hasMissing(owned)}
              onClick={() => shareViaWhatsApp(buildMissingMessage(owned))}
            >
              <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
              Faltantes
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-5 px-4 pb-6">
        {/* Buscador + controles de modo, fijos: quedan pegados bajo el header al hacer
            scroll (sticky dentro de este contenedor, que abarca toda la lista). */}
        <div className="sticky top-[var(--header-h)] z-20 -mx-4 space-y-2 border-b border-border bg-background/95 px-4 py-2 backdrop-blur">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              onBlur={onSearchBlur}
              placeholder="Buscar por código, país o selección…"
              className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-3 text-base uppercase outline-none placeholder:normal-case focus-visible:ring-2 focus-visible:ring-ring"
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

        {stickerAlbum.sections.map((section) => {
          const visible = section.codes.filter((code) => !onlyMissing || (owned[code] ?? 0) === 0);
          const sectionHave = section.codes.filter((code) => (owned[code] ?? 0) > 0).length;
          const sectionTotal = section.codes.length;
          const firstCode = section.codes[0];
          const lastCode = section.codes[section.codes.length - 1];

          return (
            <section key={section.id} id={`fig-section-${section.id}`}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate font-bold">{section.title}</h2>
                  <p className="tabular text-xs text-muted-foreground">
                    {firstCode}–{lastCode} · {sectionHave}/{sectionTotal}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => confirmMark(section, true)}
                    className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => confirmMark(section, false)}
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

      <StickerCelebration
        key={celebrate?.code}
        star={celebrate}
        onClose={() => setCelebrate(null)}
      />
      <Sheet
        open={completedTeam !== null}
        onClose={() => setCompletedTeamId(null)}
        title="¡País completo!"
      >
        {completedTeam ? (
          <div className="space-y-4 text-center">
            <div className="text-5xl" aria-hidden>
              {completedTeam.flag}
            </div>
            <div>
              <p className="text-lg font-bold">Completaste {completedTeam.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ya tenés las 20 figuritas de esta selección.
              </p>
            </div>
            <Button className="w-full" onClick={() => setCompletedTeamId(null)}>
              Genial
            </Button>
          </div>
        ) : null}
      </Sheet>
    </>
  );
}

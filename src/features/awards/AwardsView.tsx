'use client';

import { useMemo, type ReactNode } from 'react';
import type { ScorerEntry } from '@/types';
import { useAwardsStore } from '@/store/awards';
import { useResultsStore } from '@/store/results';
import { mergeOfficial } from '@/lib/officialResults';
import { computeBracket } from '@/lib/bracket';
import {
  computeGoalkeeping,
  computePrizeMoney,
  isYoungPlayer,
  PRIZE_TIERS,
  type GkRow,
} from '@/lib/awards';
import { getTeam } from '@/data/teams';
import { goalkeeperOf } from '@/data/goalkeepers';
import { formatShortDate, formatTime } from '@/lib/dates';
import { PageHeader } from '@/components/PageHeader';
import { TeamBadge } from '@/components/TeamBadge';
import { Card, EmptyState } from '@/components/ui';
import { TrophyIcon, StarIcon, UsersIcon } from '@/components/icons';

const SCORERS_SHOWN = 10;
const YOUNG_SHOWN = 3;
const GK_SHOWN = 8;

export function AwardsView() {
  const scorers = useAwardsStore((s) => s.scorers);
  const awardsUpdatedAt = useAwardsStore((s) => s.updatedAt);
  const official = useResultsStore((s) => s.official);

  // Llave/standings reales (solo resultados oficiales, sin la simulación del usuario).
  const view = useMemo(() => {
    const { groupResults, picks } = mergeOfficial({}, {}, official);
    return computeBracket(groupResults, picks);
  }, [official]);

  const goalkeeping = useMemo(() => computeGoalkeeping(official, view), [official, view]);
  const prize = useMemo(() => computePrizeMoney(view), [view]);
  const young = useMemo(() => scorers.filter(isYoungPlayer).slice(0, YOUNG_SHOWN), [scorers]);

  return (
    <>
      <PageHeader title="Premios" subtitle="Candidatos, en tiempo real" />

      <div className="mx-auto max-w-app space-y-3 px-4 py-3 pb-6">
        {awardsUpdatedAt ? (
          <p className="px-1 text-xs text-muted-foreground">
            Goleadores actualizados: {formatShortDate(awardsUpdatedAt)} · {formatTime(awardsUpdatedAt)}
          </p>
        ) : null}

        {/* 1) Botín de Oro */}
        <AwardSection icon={<TrophyIcon className="h-5 w-5" />} title="Botín de Oro" hint="Máximos goleadores">
          {scorers.length === 0 ? (
            <EmptyState title="Todavía no hay goleadores" description="Aparecen cuando empiecen los goles." />
          ) : (
            <ol className="divide-y divide-border/60">
              {scorers.slice(0, SCORERS_SHOWN).map((s, i) => (
                <ScorerRow key={`${s.playerName}-${s.teamId}-${i}`} rank={i + 1} scorer={s} />
              ))}
            </ol>
          )}
        </AwardSection>

        {/* 2) Guante de Oro */}
        <AwardSection
          icon={<UsersIcon className="h-5 w-5" />}
          title="Guante de Oro"
          hint="Valla menos vencida · arquero titular"
        >
          {goalkeeping.length === 0 ? (
            <EmptyState title="Aún no hay partidos jugados" description="Se calcula con los goles recibidos." />
          ) : (
            <ol className="divide-y divide-border/60">
              {goalkeeping.slice(0, GK_SHOWN).map((row, i) => (
                <GkRowItem key={row.teamId} rank={i + 1} row={row} />
              ))}
            </ol>
          )}
        </AwardSection>

        {/* 3) Mejor Jugador Joven (estimación) */}
        <AwardSection
          icon={<StarIcon className="h-5 w-5" />}
          title="Mejor Jugador Joven"
          hint="Sub-21 (nacidos en 2005 o después)"
          status="Estimación"
        >
          {young.length === 0 ? (
            <EmptyState title="Sin goleadores jóvenes aún" description="Se estima entre los goleadores sub-21." />
          ) : (
            <ol className="divide-y divide-border/60">
              {young.map((s, i) => (
                <ScorerRow key={`y-${s.playerName}-${s.teamId}-${i}`} rank={i + 1} scorer={s} />
              ))}
            </ol>
          )}
          <p className="pt-2 text-[0.7rem] text-muted-foreground">
            El premio oficial lo define la FIFA por votación; esto es una estimación por goles.
          </p>
        </AwardSection>

        {/* 4) Dinero por fase */}
        <AwardSection
          icon={<TrophyIcon className="h-5 w-5" />}
          title="Dinero por fase"
          hint="Premio garantizado por ronda"
          status="aprox."
        >
          <ul className="divide-y divide-border/60">
            {PRIZE_TIERS.map((t) => (
              <li key={t.key} className="flex items-center justify-between py-1.5 text-sm">
                <span className="text-muted-foreground">{t.label}</span>
                <span className="font-semibold tabular-nums">US$ {t.millions}M</span>
              </li>
            ))}
          </ul>
          {prize.length > 0 ? (
            <div className="mt-2 border-t border-border/60 pt-2">
              <p className="mb-1 text-xs font-medium text-muted-foreground">Clasificados a eliminatorias</p>
              <ul className="space-y-1.5">
                {prize.map((row) => (
                  <li key={row.teamId} className="flex items-center justify-between gap-2">
                    <TeamBadge team={getTeam(row.teamId)} size="sm" />
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {row.label} · US$ {row.millions}M
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="pt-2 text-[0.7rem] text-muted-foreground">
              Se actualiza cuando empiecen las eliminatorias. Montos de referencia.
            </p>
          )}
        </AwardSection>

        {/* 5) Balón de Oro (institucional) */}
        <AwardSection icon={<StarIcon className="h-5 w-5" />} title="Balón de Oro" status="Se define en la final">
          <p className="text-sm text-muted-foreground">
            Al mejor jugador del torneo. Lo elige el Grupo de Estudio Técnico de la FIFA y se
            anuncia al cierre del Mundial.
          </p>
        </AwardSection>
      </div>
    </>
  );
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

function AwardSection({
  icon,
  title,
  hint,
  status,
  children,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  status?: string;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
        <span className="shrink-0 text-primary">{icon}</span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-bold">{title}</h2>
          {hint ? <p className="truncate text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {status ? (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[0.7rem] font-medium text-muted-foreground">
            {status}
          </span>
        ) : null}
      </div>
      <div className="px-4 py-2">{children}</div>
    </Card>
  );
}

function ScorerRow({ rank, scorer }: { rank: number; scorer: ScorerEntry }) {
  const team = scorer.teamId ? getTeam(scorer.teamId) : null;
  return (
    <li className="flex items-center gap-3 py-2">
      <span className="w-5 shrink-0 text-center text-sm font-bold tabular-nums text-muted-foreground">
        {rank}
      </span>
      <span className="text-xl leading-none" aria-hidden>
        {team?.flag ?? '🏳️'}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{scorer.playerName}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {team?.name ?? scorer.teamName}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="text-lg font-bold tabular-nums">{scorer.goals}</span>
        <span className="block text-[0.7rem] text-muted-foreground">
          {scorer.assists != null ? `${scorer.assists} asist.` : '— asist.'} · {scorer.playedMatches} PJ
        </span>
      </span>
    </li>
  );
}

function GkRowItem({ rank, row }: { rank: number; row: GkRow }) {
  const team = getTeam(row.teamId);
  const keeper = goalkeeperOf(row.teamId);
  return (
    <li className="flex items-center gap-3 py-2">
      <span className="w-5 shrink-0 text-center text-sm font-bold tabular-nums text-muted-foreground">
        {rank}
      </span>
      <span className="text-xl leading-none" aria-hidden>
        {team?.flag ?? '🏳️'}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{team?.name ?? row.teamId}</span>
        {keeper ? (
          <span className="block truncate text-xs text-muted-foreground">🧤 {keeper}</span>
        ) : null}
      </span>
      <span className="shrink-0 text-right">
        <span className="text-base font-bold tabular-nums">{row.cleanSheets}</span>
        <span className="block text-[0.7rem] text-muted-foreground">
          vallas inv. · {row.goalsAgainst} GC · {row.played} PJ
        </span>
      </span>
    </li>
  );
}

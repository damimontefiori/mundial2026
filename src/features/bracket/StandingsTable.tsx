'use client';

import type { StandingRow } from '@/types';
import { teamsById } from '@/data/teams';
import { cn } from '@/lib/cn';

/** Tabla de posiciones de un grupo. Resalta 1.º-2.º (clasifican) y 3.º (posible mejor tercero). */
export function StandingsTable({
  rows,
  complete,
  favoriteId,
}: {
  rows: StandingRow[];
  complete: boolean;
  favoriteId?: string | null;
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-xs uppercase tracking-wide text-muted-foreground">
          <th className="w-6 pb-1 text-left font-medium">#</th>
          <th className="pb-1 text-left font-medium">Equipo</th>
          <th className="w-8 pb-1 text-center font-medium">PJ</th>
          <th className="w-9 pb-1 text-center font-medium">DG</th>
          <th className="w-9 pb-1 text-center font-medium">Pts</th>
        </tr>
      </thead>
      <tbody className="tabular">
        {rows.map((row, i) => {
          const team = teamsById[row.teamId];
          const pos = row.rank ?? i + 1;
          const qualifies = pos <= 2;
          const maybeThird = pos === 3;
          return (
            <tr key={row.teamId} className="border-t border-border/60">
              <td className="py-1.5">
                <span
                  className={cn(
                    'inline-flex h-5 w-5 items-center justify-center rounded-md text-xs font-bold',
                    qualifies && 'bg-success/15 text-success',
                    maybeThird && 'bg-warning/15 text-warning',
                    !qualifies && !maybeThird && 'text-muted-foreground',
                  )}
                >
                  {pos}
                </span>
              </td>
              <td className="py-1.5">
                <span className="flex items-center gap-2">
                  <span className="text-base" aria-hidden="true">
                    {team?.flag}
                  </span>
                  <span
                    className={cn(
                      'font-semibold',
                      favoriteId && row.teamId === favoriteId && 'text-primary',
                    )}
                  >
                    {team?.fifaCode}
                  </span>
                </span>
              </td>
              <td className="py-1.5 text-center text-muted-foreground">{row.played}</td>
              <td className="py-1.5 text-center">
                {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
              </td>
              <td className="py-1.5 text-center font-bold">{row.points}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

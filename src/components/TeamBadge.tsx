import type { Team } from '@/types';
import { cn } from '@/lib/cn';

interface TeamBadgeProps {
  team?: Team | null;
  /** Texto a mostrar cuando el equipo aún no está definido. */
  placeholder?: string;
  highlight?: boolean;
  size?: 'sm' | 'md' | 'lg';
  reverse?: boolean;
  className?: string;
}

const flagSize: Record<NonNullable<TeamBadgeProps['size']>, string> = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl',
};

const textSize: Record<NonNullable<TeamBadgeProps['size']>, string> = {
  sm: 'text-sm',
  md: 'text-[0.95rem]',
  lg: 'text-base',
};

/** Muestra la bandera + nombre de un equipo (o un placeholder de cupo). */
export function TeamBadge({
  team,
  placeholder = 'A definir',
  highlight = false,
  size = 'md',
  reverse = false,
  className,
}: TeamBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex min-w-0 items-center gap-2',
        reverse && 'flex-row-reverse',
        className,
      )}
    >
      <span className={cn('shrink-0 leading-none', flagSize[size])} aria-hidden="true">
        {team ? team.flag : '🏳️'}
      </span>
      <span
        className={cn(
          'truncate',
          textSize[size],
          team ? 'font-semibold' : 'italic text-muted-foreground',
          highlight && 'text-primary',
        )}
      >
        {team ? team.name : placeholder}
      </span>
    </span>
  );
}

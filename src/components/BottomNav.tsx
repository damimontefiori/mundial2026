'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { BracketIcon, CalendarIcon, GridIcon, MoreIcon, TrophyIcon } from './icons';

const items = [
  { href: '/', label: 'Partidos', Icon: CalendarIcon, isActive: (p: string) => p === '/' },
  {
    href: '/llave',
    label: 'Llave',
    Icon: BracketIcon,
    isActive: (p: string) => p.startsWith('/llave'),
  },
  {
    href: '/figuritas',
    label: 'Figus',
    Icon: GridIcon,
    isActive: (p: string) => p.startsWith('/figuritas'),
  },
  {
    href: '/premios',
    label: 'Premios',
    Icon: TrophyIcon,
    isActive: (p: string) => p.startsWith('/premios'),
  },
  { href: '/mas', label: 'Más', Icon: MoreIcon, isActive: (p: string) => p.startsWith('/mas') },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/90 backdrop-blur-lg"
      aria-label="Navegación principal"
    >
      <ul className="mx-auto flex max-w-app items-stretch justify-around">
        {items.map(({ href, label, Icon, isActive }) => {
          const active = isActive(pathname);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-[4.25rem] flex-col items-center justify-center gap-1 text-[0.7rem] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className={cn('h-6 w-6', active && 'scale-105')} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

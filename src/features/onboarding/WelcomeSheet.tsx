'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Sheet } from '@/components/Sheet';
import { Button } from '@/components/ui';
import {
  BracketIcon,
  CheckIcon,
  ChevronRightIcon,
  ForecastIcon,
  GridIcon,
  LinkedInIcon,
} from '@/components/icons';

/** Una funcionalidad explicada: ícono coloreado + título + descripción. */
function Feature({
  icon,
  tint,
  title,
  children,
}: {
  icon: ReactNode;
  tint: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          tint,
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}

/**
 * Guía de bienvenida: explica a un usuario nuevo las funciones clave (simular la
 * llave, el pronóstico del modelo y los resultados reales que se autocompletan).
 * Se usa como onboarding la primera vez (`firstRun`) y desde "Más → ¿Cómo funciona?".
 */
export function WelcomeSheet({
  open,
  onClose,
  firstRun = false,
}: {
  open: boolean;
  onClose: () => void;
  firstRun?: boolean;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="¿Cómo funciona?">
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Tu Mundial 2026, a tu manera: simulá los resultados, seguí la llave hasta el campeón y
          mirá cómo se ajusta solo con lo que pasa en la cancha.
        </p>

        <div className="space-y-4">
          <Feature
            icon={<BracketIcon className="h-5 w-5 text-primary" />}
            tint="bg-primary/10"
            title="Simulá tu Mundial"
          >
            Cargá el marcador de cada partido de grupos y elegí quién avanza en cada cruce, hasta
            levantar la copa.
          </Feature>

          <Feature
            icon={<ForecastIcon className="h-5 w-5 text-accent" />}
            tint="bg-accent/15"
            title="Pronóstico inteligente"
          >
            Con el botón de proyectar, la app completa lo que falta según el nivel de cada selección
            (ataque, defensa y ranking). No es al azar: te muestra el resultado más probable.
          </Feature>

          <Feature
            icon={<CheckIcon className="h-5 w-5 text-success" />}
            tint="bg-success/15"
            title="Resultados en tiempo real"
          >
            A medida que se juegan los partidos, los resultados reales se cargan solos, quedan fijos
            y recalibran los pronósticos de lo que viene.
          </Feature>

          <Feature
            icon={<GridIcon className="h-5 w-5 text-warning" />}
            tint="bg-warning/15"
            title="Álbum de figuritas"
          >
            Llevá la cuenta de las que tenés, las repes y las que te faltan, y compartí por WhatsApp
            tus repetidas y faltantes para arreglar los cambios.
          </Feature>
        </div>

        <a
          href="https://www.linkedin.com/in/damian-montefiori/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2.5 transition-colors hover:bg-muted"
        >
          <LinkedInIcon className="h-5 w-5 shrink-0 text-[#0a66c2]" />
          <span className="min-w-0">
            <span className="block text-xs text-muted-foreground">Hecho con ⚽ por</span>
            <span className="block font-semibold leading-tight">Damián Montefiori</span>
          </span>
          <ChevronRightIcon className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
        </a>

        {firstRun ? (
          <Button className="w-full" onClick={onClose}>
            Empezar
          </Button>
        ) : null}
      </div>
    </Sheet>
  );
}

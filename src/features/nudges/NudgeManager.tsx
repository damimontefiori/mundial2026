'use client';

import { useEffect, useRef, useState } from 'react';
import { usePreferencesStore } from '@/store/preferences';
import { useAuthStore } from '@/store/auth';
import { usePwaStore, isStandalone } from '@/store/pwa';
import { Sheet } from '@/components/Sheet';
import { Button } from '@/components/ui';
import { DownloadIcon, UsersIcon } from '@/components/icons';

type Nudge = 'install' | 'auth';

// Cadencia suave: primera sugerencia en la apertura 3, luego cada 4 (3, 7, 11, …).
const START = 3;
const EVERY = 4;
const SHOW_DELAY_MS = 1500;

/** Decide qué sugerir (o nada) en esta apertura. Alterna instalar/login si aplican ambos. */
function pickNudge(opts: {
  launchCount: number;
  installed: boolean;
  canInstall: boolean;
  authEnabled: boolean;
  signedIn: boolean;
}): Nudge | null {
  const { launchCount, installed, canInstall, authEnabled, signedIn } = opts;
  if (launchCount < START || (launchCount - START) % EVERY !== 0) return null;
  const wantInstall = !installed && canInstall;
  const wantAuth = authEnabled && !signedIn;
  if (wantInstall && wantAuth) return ((launchCount - START) / EVERY) % 2 === 0 ? 'install' : 'auth';
  if (wantInstall) return 'install';
  if (wantAuth) return 'auth';
  return null;
}

/**
 * Sugiere ocasionalmente instalar la app o iniciar sesión (sin sofocar): solo en
 * algunas aperturas y solo si todavía aplica. Se monta una vez en Providers.
 */
export function NudgeManager() {
  const launchCount = usePreferencesStore((s) => s.launchCount);
  const authStatus = useAuthStore((s) => s.status);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const promptInstall = usePwaStore((s) => s.promptInstall);
  const [active, setActive] = useState<Nudge | null>(null);
  const decided = useRef(false);

  useEffect(() => {
    if (decided.current) return;
    if (launchCount <= 0) return; // esperar al registro de apertura (post-hidratación)
    if (authStatus === 'loading') return; // esperar a que resuelva el login
    decided.current = true;
    // Pequeña espera: da tiempo a que llegue beforeinstallprompt y no es abrupto al abrir.
    const t = window.setTimeout(() => {
      const auth = useAuthStore.getState();
      const kind = pickNudge({
        launchCount,
        installed: isStandalone(),
        canInstall: usePwaStore.getState().canInstall,
        authEnabled: auth.status !== 'disabled',
        signedIn: auth.status === 'signedIn',
      });
      if (kind) setActive(kind);
    }, SHOW_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [launchCount, authStatus]);

  const close = () => setActive(null);

  return (
    <Sheet
      open={active !== null}
      onClose={close}
      title={active === 'install' ? 'Instalá la app' : 'Guardá tu progreso'}
    >
      {active === 'install' ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <DownloadIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold">Mundial 2026 en tu pantalla de inicio</p>
              <p className="text-sm text-muted-foreground">
                Acceso directo como una app, a pantalla completa y funcionando sin conexión.
              </p>
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => {
              void promptInstall();
              close();
            }}
          >
            <DownloadIcon className="h-5 w-5" />
            Instalar ahora
          </Button>
          <button
            onClick={close}
            className="w-full py-1 text-sm font-medium text-muted-foreground"
          >
            Ahora no
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <UsersIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold">No pierdas tus figuritas ni tu llave</p>
              <p className="text-sm text-muted-foreground">
                Iniciá sesión y guardá tu progreso en tu cuenta para usarlo desde cualquier
                dispositivo.
              </p>
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => {
              void signInWithGoogle().catch(() => undefined);
              close();
            }}
          >
            Continuar con Google
          </Button>
          <button
            onClick={close}
            className="w-full py-1 text-sm font-medium text-muted-foreground"
          >
            Ahora no
          </button>
        </div>
      )}
    </Sheet>
  );
}

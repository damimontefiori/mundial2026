'use client';

import { useEffect, useState } from 'react';
import { teamsById } from '@/data/teams';
import { stickerAlbum } from '@/data/stickers';
import { cn } from '@/lib/cn';
import { usePreferencesStore } from '@/store/preferences';
import { useSimulationStore } from '@/store/simulation';
import { useStickersStore } from '@/store/stickers';
import { useAuthStore } from '@/store/auth';
import { useHydrated } from '@/lib/useHydrated';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, SegmentedControl } from '@/components/ui';
import {
  ChevronRightIcon,
  DownloadIcon,
  InfoIcon,
  LinkedInIcon,
  MonitorIcon,
  MoonIcon,
  StarIcon,
  SunIcon,
  UsersIcon,
} from '@/components/icons';
import { TeamPickerSheet } from '@/features/shared/TeamPickerSheet';
import { WelcomeSheet } from '@/features/onboarding/WelcomeSheet';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h2>
  );
}

export function SettingsView() {
  const hydrated = useHydrated();
  const theme = usePreferencesStore((s) => s.theme);
  const setTheme = usePreferencesStore((s) => s.setTheme);
  const favoriteId = usePreferencesStore((s) => s.favoriteTeamId);
  const setFavorite = usePreferencesStore((s) => s.setFavorite);
  const resetSimulation = useSimulationStore((s) => s.resetAll);
  const resetStickers = useStickersStore((s) => s.reset);

  const authStatus = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const syncState = useAuthStore((s) => s.syncState);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const signOut = useAuthStore((s) => s.signOut);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch {
      // Popup cancelado o bloqueado: no hacemos nada (el usuario puede reintentar).
    }
  };

  const [pickerOpen, setPickerOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  const favorite = favoriteId ? teamsById[favoriteId] : null;

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  const confirmReset = (message: string, fn: () => void) => {
    if (window.confirm(message)) fn();
  };

  return (
    <>
      <PageHeader title="Más" subtitle="Ajustes y preferencias" />

      <div className="space-y-6 px-4 py-4">
        {/* Guía / cómo funciona */}
        <section>
          <SectionTitle>Guía</SectionTitle>
          <Card>
            <button
              onClick={() => setHelpOpen(true)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <InfoIcon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-semibold">¿Cómo funciona?</span>
                  <span className="block text-sm text-muted-foreground">
                    Pronósticos, llave y resultados en vivo
                  </span>
                </span>
              </span>
              <ChevronRightIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
            </button>
          </Card>
        </section>

        {/* Equipo favorito */}
        <section>
          <SectionTitle>Tu equipo</SectionTitle>
          <Card>
            <button
              onClick={() => setPickerOpen(true)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
            >
              <span className="flex items-center gap-3">
                {hydrated && favorite ? (
                  <span className="text-2xl">{favorite.flag}</span>
                ) : (
                  <StarIcon className="h-6 w-6 text-muted-foreground" />
                )}
                <span>
                  <span className="block font-semibold">
                    {hydrated && favorite ? favorite.name : 'Elegí tu equipo'}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    Se destaca en el fixture y la llave
                  </span>
                </span>
              </span>
              <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
            </button>
          </Card>
        </section>

        {/* Tema */}
        <section>
          <SectionTitle>Apariencia</SectionTitle>
          <Card className="p-3">
            <SegmentedControl
              options={[
                {
                  value: 'light',
                  label: (
                    <span className="flex items-center justify-center gap-1.5">
                      <SunIcon className="h-4 w-4" /> Claro
                    </span>
                  ),
                },
                {
                  value: 'dark',
                  label: (
                    <span className="flex items-center justify-center gap-1.5">
                      <MoonIcon className="h-4 w-4" /> Oscuro
                    </span>
                  ),
                },
                {
                  value: 'system',
                  label: (
                    <span className="flex items-center justify-center gap-1.5">
                      <MonitorIcon className="h-4 w-4" /> Auto
                    </span>
                  ),
                },
              ]}
              value={hydrated ? theme : 'system'}
              onChange={setTheme}
            />
          </Card>
        </section>

        {/* Cuenta / sincronización */}
        {authStatus !== 'disabled' ? (
          <section>
            <SectionTitle>Cuenta</SectionTitle>
            {authStatus === 'signedIn' && user ? (
              <Card className="space-y-3 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    <UsersIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{user.displayName ?? 'Tu cuenta'}</p>
                    <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {syncState === 'syncing'
                    ? 'Sincronizando…'
                    : syncState === 'error'
                      ? '⚠ Sin conexión — se reintenta al cambiar algo'
                      : '● Datos sincronizados en tu cuenta'}
                </p>
                <Button variant="outline" className="w-full" onClick={() => void signOut()}>
                  Cerrar sesión
                </Button>
              </Card>
            ) : (
              <Card className="space-y-3 p-4">
                <p className="text-sm text-muted-foreground">
                  Guardá tus figuritas y tu llave en tu cuenta y accedé desde cualquier dispositivo.
                </p>
                <Button
                  className="w-full"
                  disabled={authStatus === 'loading'}
                  onClick={handleSignIn}
                >
                  Continuar con Google
                </Button>
              </Card>
            )}
          </section>
        ) : null}

        {/* Prode (futuro) */}
        <section>
          <SectionTitle>Prode con amigos</SectionTitle>
          <Card className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <UsersIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold">
                Próximamente{' '}
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">
                  Pronto
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                Vas a poder crear ligas, invitar amigos y competir con tus pronósticos.
              </p>
            </div>
          </Card>
        </section>

        {/* Instalar */}
        {installEvent ? (
          <section>
            <SectionTitle>App</SectionTitle>
            <Card className="p-3">
              <Button onClick={install} className="w-full">
                <DownloadIcon className="h-5 w-5" />
                Instalar en mi teléfono
              </Button>
            </Card>
          </section>
        ) : null}

        {/* Datos */}
        <section>
          <SectionTitle>Mis datos</SectionTitle>
          <Card className="divide-y divide-border">
            <button
              onClick={() =>
                confirmReset('¿Borrar toda tu simulación de grupos y llave?', resetSimulation)
              }
              className="w-full px-4 py-3.5 text-left font-medium text-destructive"
            >
              Reiniciar simulación
            </button>
            <button
              onClick={() => confirmReset('¿Borrar tu progreso de figuritas?', resetStickers)}
              className="w-full px-4 py-3.5 text-left font-medium text-destructive"
            >
              Reiniciar figuritas
            </button>
          </Card>
          <p className="mt-2 px-1 text-xs text-muted-foreground">
            {authStatus === 'signedIn'
              ? 'Tus datos se guardan en tu cuenta de Google y en este dispositivo.'
              : 'Todo se guarda en este dispositivo. Iniciá sesión para sincronizarlo en tu cuenta.'}
          </p>
        </section>

        {/* Acerca de */}
        <section>
          <SectionTitle>Acerca de</SectionTitle>
          <Card className="space-y-2 p-4 text-sm text-muted-foreground">
            <p>
              <span className="font-semibold text-foreground">Mundial 2026</span> · versión 0.1.0
            </p>
            <p>
              Horarios en hora de Argentina (UTC−3). El álbum tiene {stickerAlbum.total} figuritas.
            </p>
            <p>
              Equipos, grupos y calendario provienen del{' '}
              <strong>sorteo oficial de la FIFA</strong> (5 de diciembre de 2025). Los resultados los
              simulás vos.
            </p>
            <a
              href="https://www.linkedin.com/in/damian-montefiori/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex items-center gap-2 border-t border-border pt-3 font-medium text-foreground transition-colors hover:text-primary"
            >
              <LinkedInIcon className="h-4 w-4 shrink-0 text-[#0a66c2]" />
              Desarrollado por Damián Montefiori
            </a>
          </Card>
        </section>
      </div>

      <TeamPickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedId={favoriteId}
        onSelect={setFavorite}
      />
      <WelcomeSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}

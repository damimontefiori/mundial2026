'use client';

import { useState } from 'react';
import { teamsById } from '@/data/teams';
import { stickerAlbum } from '@/data/stickers';
import { cn } from '@/lib/cn';
import { shareApp } from '@/lib/share';
import { usePreferencesStore } from '@/store/preferences';
import { useSimulationStore } from '@/store/simulation';
import { useStickersStore } from '@/store/stickers';
import { useAuthStore } from '@/store/auth';
import { usePwaStore } from '@/store/pwa';
import { useHydrated } from '@/lib/useHydrated';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, SegmentedControl } from '@/components/ui';
import {
  ChevronRightIcon,
  CloseIcon,
  DownloadIcon,
  InfoIcon,
  LinkedInIcon,
  MonitorIcon,
  MoonIcon,
  ShareIcon,
  StarIcon,
  SunIcon,
  UsersIcon,
} from '@/components/icons';
import { TeamPickerSheet } from '@/features/shared/TeamPickerSheet';
import { WelcomeSheet } from '@/features/onboarding/WelcomeSheet';

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
  const authError = useAuthStore((s) => s.authError);
  const clearAuthError = useAuthStore((s) => s.clearAuthError);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const signOut = useAuthStore((s) => s.signOut);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      // El mensaje legible ya quedó en authError (store); logueamos para diagnóstico.
      console.error('[auth] sign-in failed:', err);
    }
  };

  const [pickerOpen, setPickerOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const canInstall = usePwaStore((s) => s.canInstall);
  const promptInstall = usePwaStore((s) => s.promptInstall);

  const favorite = favoriteId ? teamsById[favoriteId] : null;

  const confirmReset = (message: string, fn: () => void) => {
    if (window.confirm(message)) fn();
  };

  const handleShareApp = async () => {
    setShareMessage(null);
    try {
      const result = await shareApp();
      setShareMessage(
        result === 'copied' ? 'Link copiado para compartir.' : 'Listo para compartir.',
      );
      window.setTimeout(() => setShareMessage(null), 2500);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setShareMessage('No se pudo compartir. Probá de nuevo.');
    }
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
                    Pronósticos, premios, radio y resultados en vivo
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
                {authError ? (
                  <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <span className="min-w-0 flex-1">{authError}</span>
                    <button
                      onClick={clearAuthError}
                      aria-label="Descartar"
                      className="-mr-1 -mt-0.5 shrink-0 rounded p-0.5 hover:bg-destructive/10"
                    >
                      <CloseIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </Card>
            )}
          </section>
        ) : null}

        {/* App */}
        <section>
          <SectionTitle>App</SectionTitle>
          <Card className="divide-y divide-border p-3">
            {canInstall ? (
              <div className="pb-3">
                <Button onClick={() => void promptInstall()} className="w-full">
                  <DownloadIcon className="h-5 w-5" />
                  Instalar en mi teléfono
                </Button>
              </div>
            ) : null}
            <div className={cn(canInstall && 'pt-3')}>
              <Button
                onClick={() => void handleShareApp()}
                variant={canInstall ? 'outline' : 'primary'}
                className="w-full"
              >
                <ShareIcon className="h-5 w-5" />
                Compartir esta App
              </Button>
              {shareMessage ? (
                <p className="mt-2 text-center text-xs text-muted-foreground">{shareMessage}</p>
              ) : null}
            </div>
          </Card>
        </section>

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
              <span className="font-semibold text-foreground">Mundial 2026</span> · versión 3.0
            </p>
            <p>
              Horarios en hora de Argentina (UTC−3). El álbum tiene {stickerAlbum.total} figuritas.
            </p>
            <p>
              Equipos, grupos y calendario provienen del <strong>sorteo oficial de la FIFA</strong>{' '}
              (5 de diciembre de 2025). Los resultados los simulás vos.
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

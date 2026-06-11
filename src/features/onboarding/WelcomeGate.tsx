'use client';

import { useEffect, useState } from 'react';
import { usePreferencesStore } from '@/store/preferences';
import { WelcomeSheet } from './WelcomeSheet';

/**
 * Abre la guía de bienvenida una sola vez (primer uso). Espera a que el store
 * persistido termine de rehidratar para no mostrarla a quien ya la vio: el flag
 * `onboardingSeenAt` vive en localStorage y se rehidrata recién en el cliente.
 */
export function WelcomeGate() {
  const [open, setOpen] = useState(false);
  const markSeen = usePreferencesStore((s) => s.markOnboardingSeen);

  useEffect(() => {
    const decide = () => {
      if (!usePreferencesStore.getState().onboardingSeenAt) setOpen(true);
    };
    // `skipHydration: true` ⇒ puede que aún no haya rehidratado cuando corre este
    // efecto (Providers la dispara en paralelo). Cubrimos ambos casos.
    if (usePreferencesStore.persist.hasHydrated()) {
      decide();
      return;
    }
    return usePreferencesStore.persist.onFinishHydration(decide);
  }, []);

  const close = () => {
    markSeen();
    setOpen(false);
  };

  return <WelcomeSheet open={open} onClose={close} firstRun />;
}

'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firebaseEnabled } from '@/lib/firebase';
import { useAuthStore } from '@/store/auth';
import { useStickersStore } from '@/store/stickers';
import { useSimulationStore } from '@/store/simulation';
import { usePreferencesStore } from '@/store/preferences';
import { push, reconcileOnLogin } from '@/lib/cloudSync';

/**
 * Arranca la sincronización en la nube cuando hay sesión. Debe montarse en
 * Providers DESPUÉS de rehidratar los stores locales.
 *
 * - Escucha el estado de auth y lo refleja en `useAuthStore`.
 * - Al iniciar sesión: reconcilia (la nube gana en el primer enlace; LWW si no).
 * - Mientras hay sesión: cada cambio en los 3 stores hace un upsert con debounce.
 */
export function useCloudSync(): void {
  useEffect(() => {
    if (!firebaseEnabled || !auth) return;

    const { setUser } = useAuthStore.getState();
    let unsubStores: Array<() => void> = [];
    let timer: ReturnType<typeof setTimeout> | null = null;

    // Finalizar un posible login por redirect (móvil/PWA) y capturar su error.
    void useAuthStore.getState().completeRedirect();

    const teardownStores = () => {
      unsubStores.forEach((u) => u());
      unsubStores = [];
      if (timer) clearTimeout(timer);
      timer = null;
    };

    const startStoreSync = (uid: string) => {
      const onChange = () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => void push(uid), 800);
      };
      unsubStores = [
        useStickersStore.subscribe(onChange),
        useSimulationStore.subscribe(onChange),
        usePreferencesStore.subscribe(onChange),
      ];
    };

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      teardownStores();
      if (!user) return;
      // Reconciliar ANTES de suscribir, para que aplicar el remoto no dispare un push.
      await reconcileOnLogin(user.uid);
      startStoreSync(user.uid);
    });

    return () => {
      unsubAuth();
      teardownStores();
    };
  }, []);
}

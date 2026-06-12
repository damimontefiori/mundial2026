'use client';

import { useEffect } from 'react';
import { usePreferencesStore } from '@/store/preferences';
import { useSimulationStore } from '@/store/simulation';
import { useStickersStore } from '@/store/stickers';
import { useResultsStore } from '@/store/results';
import { useCloudSync } from '@/hooks/useCloudSync';

function applyTheme(theme: 'light' | 'dark' | 'system'): void {
  const prefersDark =
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = theme === 'dark' || (theme === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', dark);
}

/**
 * Providers de cliente: rehidrata los stores persistidos, mantiene el tema
 * sincronizado y registra el service worker (PWA) en producción.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const theme = usePreferencesStore((s) => s.theme);

  // Rehidratación manual (los stores usan skipHydration para ser SSR-safe).
  useEffect(() => {
    useSimulationStore.persist.rehydrate();
    useStickersStore.persist.rehydrate();
    usePreferencesStore.persist.rehydrate();
    // Resultados reales (archivo estático). Falla en silencio si no existe.
    void useResultsStore.getState().load();
  }, []);

  // Resultados en vivo: re-traer results.json al volver a la app (foco/visibilidad)
  // y cada 2 min mientras esté visible, para que los resultados reales se actualicen
  // sin recargar a mano. El SW sirve /results.json network-first ⇒ trae lo más fresco.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') void useResultsStore.getState().refresh();
    };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    const id = window.setInterval(refresh, 120_000);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
      window.clearInterval(id);
    };
  }, []);

  // Sincronización en la nube (si hay sesión). Se monta después de rehidratar:
  // el hook solo actúa tras el login, así que el orden con el efecto de arriba
  // es seguro (ambos corren en el mount del cliente).
  useCloudSync();

  // Tema: aplica y escucha cambios del sistema cuando está en "system".
  useEffect(() => {
    applyTheme(theme);
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  // Service worker (offline / instalable). Solo en producción.
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    const onLoad = () => navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    window.addEventListener('load', onLoad);
    // Cuando un SW nuevo toma control (al actualizar de v1 a v2), re-traer resultados:
    // el SW nuevo sirve /results.json network-first, así cerramos de inmediato la ventana
    // en la que el SW viejo todavía serviría una versión cacheada vieja.
    const onControllerChange = () => void useResultsStore.getState().refresh();
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    return () => {
      window.removeEventListener('load', onLoad);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  return <>{children}</>;
}

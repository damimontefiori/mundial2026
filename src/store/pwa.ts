'use client';

import { create } from 'zustand';

/**
 * Estado PWA (no persistido): captura el evento `beforeinstallprompt` para poder
 * ofrecer la instalación con un toque, tanto desde "Más" como desde la sugerencia
 * ocasional (NudgeManager). El listener se registra una sola vez en Providers.
 */

/** `beforeinstallprompt` no está en los tipos estándar del DOM. */
export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PwaState {
  /** Evento diferido para disparar el prompt nativo (o null si no está disponible). */
  installPrompt: InstallPromptEvent | null;
  /** true cuando el navegador permite instalar (capturamos beforeinstallprompt). */
  canInstall: boolean;
  setPrompt: (e: InstallPromptEvent | null) => void;
  /** Dispara el prompt nativo de instalación; lo consume (un solo uso). */
  promptInstall: () => Promise<void>;
}

export const usePwaStore = create<PwaState>((set, get) => ({
  installPrompt: null,
  canInstall: false,
  setPrompt: (e) => set({ installPrompt: e, canInstall: e !== null }),
  promptInstall: async () => {
    const e = get().installPrompt;
    if (!e) return;
    await e.prompt();
    await e.userChoice;
    set({ installPrompt: null, canInstall: false });
  },
}));

/** ¿La app ya corre instalada (standalone)? */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

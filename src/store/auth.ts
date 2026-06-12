'use client';

import { create } from 'zustand';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { auth, firebaseEnabled } from '@/lib/firebase';

export type AuthStatus = 'disabled' | 'loading' | 'signedIn' | 'signedOut';
export type SyncState = 'idle' | 'syncing' | 'error';

const errCode = (e: unknown): string =>
  typeof e === 'object' && e !== null && 'code' in e ? String((e as { code: unknown }).code) : '';

/** Marca (sessionStorage) de que iniciamos un login por redirect, para diagnosticar el retorno. */
const REDIRECT_FLAG = 'm26-auth-redirect';

/** Si el popup se cierra antes de esto, no fue el usuario: fue el entorno (COOP, PWA). */
const POPUP_INSTANT_CLOSE_MS = 1200;

/**
 * En móvil y en una PWA instalada (display standalone) el popup de Google suele
 * abrirse y cerrarse solo sin completar el login. Ahí usamos redirect directo.
 */
function shouldUseRedirect(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  const standalone =
    window.matchMedia?.('(display-mode: standalone)')?.matches === true ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  const mobile = /Android|iPhone|iPad|iPod/i.test(ua);
  // iPadOS 13+ se hace pasar por un Mac de escritorio: lo detectamos por el táctil.
  const iPadAsMac = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  return standalone || mobile || iPadAsMac;
}

/** Códigos donde el popup directamente no se pudo abrir/usar: conviene caer a redirect. */
const POPUP_UNUSABLE = new Set([
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment',
]);

/** Mensaje claro en español (también sirve para diagnosticar al desarrollador). */
export function friendlyAuthError(code: string): string {
  switch (code) {
    case 'auth/unauthorized-domain':
      return 'Este dominio no está autorizado para el login. Agregalo en Firebase → Authentication → Settings → Authorized domains.';
    case 'auth/popup-blocked':
      return 'El navegador bloqueó la ventana de Google. Permití ventanas emergentes y probá de nuevo.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Se cerró la ventana de Google antes de terminar. Probá de nuevo.';
    case 'auth/network-request-failed':
      return 'Sin conexión con Google. Revisá tu internet y probá de nuevo.';
    case 'auth/operation-not-supported-in-this-environment':
    case 'auth/web-storage-unsupported':
      return 'Tu navegador bloquea el almacenamiento necesario para el login (modo incógnito o cookies de terceros bloqueadas).';
    case '':
      return 'No se pudo iniciar sesión. Probá de nuevo.';
    default:
      return `No se pudo iniciar sesión (${code}).`;
  }
}

/** Inicia el login por redirect, dejando una marca para diagnosticar el retorno. */
async function startRedirect(provider: GoogleAuthProvider): Promise<void> {
  if (!auth) return;
  try {
    sessionStorage?.setItem(REDIRECT_FLAG, '1');
  } catch {
    // sessionStorage no disponible (incógnito estricto): seguimos igual.
  }
  await signInWithRedirect(auth, provider);
}

/**
 * Estado de autenticación + sincronización. La sesión la maneja Firebase Auth
 * (persistida por el SDK); este store solo expone el usuario y el estado a la UI.
 * Si Firebase no está configurado, `status` queda en 'disabled' y no se muestra login.
 */
interface AuthState {
  user: User | null;
  status: AuthStatus;
  syncState: SyncState;
  /** Último error de login en mensaje legible (para mostrar en la UI). */
  authError: string | null;
  setUser: (user: User | null) => void;
  setSyncState: (s: SyncState) => void;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  /** Completa un login por redirect al volver a la app (y captura/diagnostica su error). */
  completeRedirect: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: firebaseEnabled ? 'loading' : 'disabled',
  syncState: 'idle',
  authError: null,

  setUser: (user) => set({ user, status: user ? 'signedIn' : 'signedOut' }),
  setSyncState: (syncState) => set({ syncState }),
  clearAuthError: () => set({ authError: null }),

  signInWithGoogle: async () => {
    if (!auth) return;
    set({ authError: null });
    const provider = new GoogleAuthProvider();

    // Móvil / PWA instalada: redirect directo (el popup no funciona de forma confiable).
    if (shouldUseRedirect()) {
      try {
        await startRedirect(provider);
      } catch (err) {
        set({ authError: friendlyAuthError(errCode(err)) });
        throw err;
      }
      return;
    }

    // Desktop: popup. Caemos a redirect SOLO si el popup no es viable o se cerró solo.
    const startedAt = Date.now();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      const code = errCode(err);
      // Doble clic: un intento más nuevo canceló a éste; el nuevo sigue su curso.
      if (code === 'auth/cancelled-popup-request') return;
      // Se cerró tan rápido que no fue el usuario (COOP / PWA de escritorio) → redirect.
      // Si el usuario lo cerró a propósito (tardó), mostramos el mensaje sin redirigir.
      const closedInstantly =
        code === 'auth/popup-closed-by-user' && Date.now() - startedAt < POPUP_INSTANT_CLOSE_MS;
      if (POPUP_UNUSABLE.has(code) || closedInstantly) {
        try {
          await startRedirect(provider);
          return;
        } catch (err2) {
          set({ authError: friendlyAuthError(errCode(err2)) });
          throw err2;
        }
      }
      set({ authError: friendlyAuthError(code) });
      throw err;
    }
  },

  completeRedirect: async () => {
    if (!auth) return;
    let pending = false;
    try {
      pending = sessionStorage?.getItem(REDIRECT_FLAG) === '1';
      sessionStorage?.removeItem(REDIRECT_FLAG);
    } catch {
      // sessionStorage no disponible: no podemos diagnosticar, seguimos.
    }
    try {
      const result = await getRedirectResult(auth);
      // Volvimos de un redirect que iniciamos, pero no hay sesión: el handshake se cortó
      // (cookies de terceros bloqueadas / Safari ITP / se abrió fuera de la PWA). En vez
      // de quedar deslogueados sin explicación, avisamos el motivo más probable.
      if (pending && !result) {
        set({
          authError:
            'No se pudo completar el login. Tu navegador puede estar bloqueando cookies de terceros (Safari/incógnito). Probá en otro navegador o desactivá esa restricción.',
        });
      }
    } catch (err) {
      set({ authError: friendlyAuthError(errCode(err)) });
    }
  },

  signOut: async () => {
    if (!auth) return;
    await fbSignOut(auth);
  },
}));

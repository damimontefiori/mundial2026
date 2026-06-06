'use client';

import { create } from 'zustand';
import { GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, type User } from 'firebase/auth';
import { auth, firebaseEnabled } from '@/lib/firebase';

export type AuthStatus = 'disabled' | 'loading' | 'signedIn' | 'signedOut';
export type SyncState = 'idle' | 'syncing' | 'error';

/**
 * Estado de autenticación + sincronización. La sesión la maneja Firebase Auth
 * (persistida por el SDK); este store solo expone el usuario y el estado a la UI.
 * Si Firebase no está configurado, `status` queda en 'disabled' y no se muestra login.
 */
interface AuthState {
  user: User | null;
  status: AuthStatus;
  syncState: SyncState;
  setUser: (user: User | null) => void;
  setSyncState: (s: SyncState) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: firebaseEnabled ? 'loading' : 'disabled',
  syncState: 'idle',

  setUser: (user) => set({ user, status: user ? 'signedIn' : 'signedOut' }),
  setSyncState: (syncState) => set({ syncState }),

  signInWithGoogle: async () => {
    if (!auth) return;
    await signInWithPopup(auth, new GoogleAuthProvider());
  },

  signOut: async () => {
    if (!auth) return;
    await fbSignOut(auth);
  },
}));

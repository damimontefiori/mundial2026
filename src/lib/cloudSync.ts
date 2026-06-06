import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { GroupResult } from '@/types';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/auth';
import { useStickersStore } from '@/store/stickers';
import { useSimulationStore } from '@/store/simulation';
import { usePreferencesStore } from '@/store/preferences';

/**
 * Sincronización local ↔ nube (Firestore). Los datos del usuario se guardan como
 * UN documento `userState/{uid}`. Reutiliza los stores Zustand existentes vía
 * `getState()`/`setState()` (no los reescribe). El tema NO se sincroniza.
 *
 * Conflicto: last-write-wins por `updatedAt`. Como un dispositivo recién enlazado
 * no tiene historial de sync (`lastSync = 0`), la nube gana en el primer enlace
 * (decisión del usuario), pero NO se pisan ediciones locales más nuevas (offline).
 */
export interface CloudSnapshot {
  stickers: { owned: Record<string, number> };
  simulation: { groupResults: Record<string, GroupResult>; knockoutPicks: Record<string, string> };
  preferences: { favoriteTeamId: string | null };
  updatedAt?: number;
}

const LAST_SYNC_KEY = 'm26-lastSync';

function getLastSync(): number {
  if (typeof localStorage === 'undefined') return 0;
  return Number(localStorage.getItem(LAST_SYNC_KEY)) || 0;
}

function setLastSync(n: number): void {
  if (typeof localStorage !== 'undefined') localStorage.setItem(LAST_SYNC_KEY, String(n));
}

export function snapshotFromStores(): CloudSnapshot {
  return {
    stickers: { owned: useStickersStore.getState().owned },
    simulation: {
      groupResults: useSimulationStore.getState().groupResults,
      knockoutPicks: useSimulationStore.getState().knockoutPicks,
    },
    preferences: { favoriteTeamId: usePreferencesStore.getState().favoriteTeamId },
  };
}

export function applyRemoteToStores(remote: CloudSnapshot): void {
  useStickersStore.setState({ owned: remote.stickers?.owned ?? {} });
  useSimulationStore.setState({
    groupResults: remote.simulation?.groupResults ?? {},
    knockoutPicks: remote.simulation?.knockoutPicks ?? {},
  });
  // Solo el equipo favorito (no se toca el tema).
  usePreferencesStore.setState({ favoriteTeamId: remote.preferences?.favoriteTeamId ?? null });
}

async function pull(uid: string): Promise<CloudSnapshot | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'userState', uid));
  return snap.exists() ? (snap.data() as CloudSnapshot) : null;
}

/** Sube el estado local a la nube. */
export async function push(uid: string): Promise<void> {
  if (!db) return;
  const { setSyncState } = useAuthStore.getState();
  setSyncState('syncing');
  try {
    const updatedAt = Date.now();
    await setDoc(doc(db, 'userState', uid), { ...snapshotFromStores(), updatedAt }, { merge: true });
    setLastSync(updatedAt);
    setSyncState('idle');
  } catch {
    setSyncState('error');
  }
}

/**
 * Reconciliación al iniciar sesión / cargar con sesión:
 * - sin doc remoto → sube lo local (primer enlace).
 * - doc remoto más nuevo que el último sync → la nube gana (aplica remoto).
 * - si no → lo local es más nuevo (ediciones offline) → sube local.
 */
export async function reconcileOnLogin(uid: string): Promise<void> {
  if (!db) return;
  const { setSyncState } = useAuthStore.getState();
  setSyncState('syncing');
  try {
    const remote = await pull(uid);
    if (!remote) {
      await push(uid);
      return;
    }
    if ((remote.updatedAt ?? 0) > getLastSync()) {
      applyRemoteToStores(remote);
      setLastSync(remote.updatedAt ?? Date.now());
      setSyncState('idle');
    } else {
      await push(uid);
    }
  } catch {
    setSyncState('error');
  }
}

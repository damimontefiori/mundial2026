'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Colección de figuritas del usuario (local-first).
 * `owned[n]` = cantidad de figuritas número `n` (0 = no la tengo, >1 = repetidas).
 */
interface StickersState {
  version: number;
  owned: Record<number, number>;
  /** Alterna tener/no tener (0 ↔ 1). */
  toggle: (n: number) => void;
  /** Fija la cantidad exacta (no negativa). */
  setCount: (n: number, count: number) => void;
  increment: (n: number) => void;
  decrement: (n: number) => void;
  /** Marca un rango como obtenido (1 c/u) sin pisar repetidas existentes. */
  markRange: (from: number, to: number, owned: boolean) => void;
  reset: () => void;
}

export const useStickersStore = create<StickersState>()(
  persist(
    (set) => ({
      version: 1,
      owned: {},

      toggle: (n) => set((s) => ({ owned: { ...s.owned, [n]: (s.owned[n] ?? 0) > 0 ? 0 : 1 } })),

      setCount: (n, count) =>
        set((s) => ({ owned: { ...s.owned, [n]: Math.max(0, Math.floor(count)) } })),

      increment: (n) => set((s) => ({ owned: { ...s.owned, [n]: (s.owned[n] ?? 0) + 1 } })),

      decrement: (n) =>
        set((s) => ({ owned: { ...s.owned, [n]: Math.max(0, (s.owned[n] ?? 0) - 1) } })),

      markRange: (from, to, owned) =>
        set((s) => {
          const next = { ...s.owned };
          for (let i = from; i <= to; i++) {
            if (owned) next[i] = Math.max(1, next[i] ?? 0);
            else next[i] = 0;
          }
          return { owned: next };
        }),

      reset: () => set({ owned: {} }),
    }),
    {
      name: 'm26-stickers',
      version: 1,
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ version: s.version, owned: s.owned }),
    },
  ),
);

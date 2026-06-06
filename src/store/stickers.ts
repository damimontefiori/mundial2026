'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Colección de figuritas del usuario (local-first).
 * `owned[code]` = cantidad de la figurita `code` (ej. "MEX1"). 0 = no la tengo,
 * >1 = repetidas.
 */
interface StickersState {
  version: number;
  owned: Record<string, number>;
  /** Alterna tener/no tener (0 ↔ 1). */
  toggle: (code: string) => void;
  /** Fija la cantidad exacta (no negativa). */
  setCount: (code: string, count: number) => void;
  increment: (code: string) => void;
  decrement: (code: string) => void;
  /** Marca un conjunto de códigos como obtenido (1 c/u) sin pisar repetidas. */
  markCodes: (codes: string[], owned: boolean) => void;
  reset: () => void;
}

export const useStickersStore = create<StickersState>()(
  persist(
    (set) => ({
      version: 2,
      owned: {},

      toggle: (code) =>
        set((s) => ({ owned: { ...s.owned, [code]: (s.owned[code] ?? 0) > 0 ? 0 : 1 } })),

      setCount: (code, count) =>
        set((s) => ({ owned: { ...s.owned, [code]: Math.max(0, Math.floor(count)) } })),

      increment: (code) => set((s) => ({ owned: { ...s.owned, [code]: (s.owned[code] ?? 0) + 1 } })),

      decrement: (code) =>
        set((s) => ({ owned: { ...s.owned, [code]: Math.max(0, (s.owned[code] ?? 0) - 1) } })),

      markCodes: (codes, owned) =>
        set((s) => {
          const next = { ...s.owned };
          for (const code of codes) {
            if (owned) next[code] = Math.max(1, next[code] ?? 0);
            else next[code] = 0;
          }
          return { owned: next };
        }),

      reset: () => set({ owned: {} }),
    }),
    {
      name: 'm26-stickers',
      version: 2,
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ version: s.version, owned: s.owned }),
      // v1 usaba claves numéricas (índices 1..N), incompatibles con los códigos
      // oficiales (MEX1, FWC1, …): se descarta la colección vieja.
      migrate: (_persisted, version) => {
        if (version < 2) return { version: 2, owned: {} } as Partial<StickersState>;
        return _persisted as Partial<StickersState>;
      },
    },
  ),
);

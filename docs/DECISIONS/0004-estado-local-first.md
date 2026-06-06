# ADR 0004 — Estado local-first con Zustand + persist

- **Estado**: Aceptada
- **Fecha**: 2026-06

## Contexto

En la v1 no hay backend. El usuario debe poder simular la llave, marcar figuritas y elegir su equipo
favorito, y que todo eso **persista** entre sesiones, funcione **offline** y sin cuentas.

## Decisión

Guardar el estado del usuario en **`localStorage`** mediante **Zustand** con el middleware
**`persist`**. Tres stores: `simulation`, `stickers`, `preferences`. Cada uno con `version` para
migraciones y `skipHydration: true` para ser SSR-safe (rehidratación manual en `Providers`).

## Alternativas consideradas

- **Context + useReducer + localStorage a mano**: más código repetido y propenso a errores de
  hidratación.
- **IndexedDB**: innecesario para volúmenes chicos; `localStorage` alcanza.
- **Redux Toolkit**: demasiado para este tamaño.

## Consecuencias

- ➕ Persistencia simple, offline y sin backend; updates inmediatos.
- ➕ Shapes compatibles con el futuro Prode (mismas claves de partido).
- ➖ Cuidado con la **hidratación**: se usa `skipHydration` + rehidratación en el cliente y
  `useHydrated()` donde el primer render no debe depender de datos guardados.
- ➖ El estado es por dispositivo (sin multi-dispositivo hasta el Prode).

## Implementación

- `src/store/*.ts` (con `partialize` y `version`).
- Rehidratación y tema en `src/components/Providers.tsx`.
- Hook `src/lib/useHydrated.ts` para gatear UI sensible a hidratación.

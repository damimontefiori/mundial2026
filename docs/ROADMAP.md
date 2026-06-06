# Roadmap

Fases en orden de dependencia. ✅ = hecho en esta entrega.

## Fase 0 — Cimientos ✅

- Scaffold Next + TS + Tailwind, ESLint/Prettier, Vitest.
- App shell: layout, navegación inferior, tema claro/oscuro, PWA (manifest + service worker).
- Documentación del ciclo de vida (`docs/`).

## Fase 1 — Datos y lógica ✅

- Tipos de dominio (`src/types`).
- Datasets curados (equipos, grupos, sedes, 104 partidos, figuritas) + validación con Zod.
- Lógica pura testeada: `standings` (desempates FIFA) y `bracket` (terceros + progresión).

## Fase 2 — Fixture (Prioridad 3) ✅

- Lista por día con hora AR, filtros por grupo y por equipo favorito, detalle y exportación `.ics`.

## Fase 3 — Llave / Simulador (Prioridad 1) ✅

- Carga de resultados de grupos, tablas automáticas, mejores terceros, asignación a Dieciseisavos y
  progresión hasta el campeón. “Simular todo”.

## Fase 4 — Figuritas (Prioridad 2) ✅

- Grilla de obtenidas/repetidas/faltantes, progreso, buscador y acciones por sección.

## Fase 5 — Pulido y PWA ✅

- Equipo favorito global, tema, instalación PWA, offline, ajustes y reinicio de datos.

## Fase 6 — Prode con amigos (FUTURO)

- Supabase (Postgres + Auth + RLS), ligas con código de invitación, predicciones por partido y de la
  llave, reglas de puntaje y tabla de posiciones. Diseño en
  [FEATURES/04-prode-futuro.md](FEATURES/04-prode-futuro.md).

## Mejoras candidatas (sin sobrecargar)

- Reemplazo de datasets por datos oficiales (ver `DATA_SOURCES.md`).
- Compartir la llave como imagen/enlace.
- Resultados en vivo (con cache y fallback offline).
- Notificaciones de partidos (requiere capa de push/backend).

## Definición de “listo” por feature

- Tipos correctos, lint limpio, tests de la lógica nueva, build OK.
- Probado a 360px, en claro/oscuro y offline.
- Docs actualizados si cambia el comportamiento.

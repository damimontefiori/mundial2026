# Guía para GitHub Copilot — Mundial 2026

Asistís en una **PWA mobile-first** (Next.js App Router + TypeScript) para el Mundial 2026.
Respondé y escribí comentarios/copys de UI en **español (Argentina)**.

## Principios

- **Mobile-first y UX primero.** Todo se diseña para una mano y pantalla chica. Contenedor central
  `max-w-app` (32rem), navegación inferior, áreas táctiles ≥ 40px.
- **Local-first.** En la v1 no hay backend: el estado del usuario vive en `localStorage` vía
  Zustand `persist`. No agregues llamadas de red ni cuentas.
- **Simple y robusto.** La lógica del torneo vive en `src/lib` como **funciones puras** sin React y
  **con tests**. No metas reglas de negocio en componentes.
- **Sin sobre-ingeniería.** Agregá solo lo pedido. No crees abstracciones para un solo uso.

## Arquitectura (capas)

```
data/  (datasets curados) → lib/ (lógica pura) → store/ (estado) → features|components (UI)
```

- `src/types`: modelo de dominio. La fuente de verdad de los tipos.
- `src/data`: datos estáticos (equipos, grupos, sedes, 104 partidos, figuritas) + `validate.ts`.
- `src/lib`: `standings.ts`, `bracket.ts`, `dates.ts`, `ics.ts`, `cn.ts`. Puro y testeado.
- `src/store`: `simulation`, `stickers`, `preferences` (Zustand + persist, `skipHydration: true`).
- `src/features/<feature>`: UI por feature. `src/components`: UI compartida.

## Convenciones

- TypeScript estricto. Importá con alias `@/` (ej. `@/lib/bracket`).
- Estilos solo con clases de Tailwind y los **tokens** de color (`bg-card`, `text-muted-foreground`,
  `text-primary`, etc.). No hardcodees colores hex; respetá claro/oscuro.
- Componentes con estado o hooks → `'use client'`. Las páginas (`app/**/page.tsx`) son finas y
  delegan en `features/.../*View.tsx`.
- Fechas: guardá en **UTC ISO**; mostrá siempre en **hora de Argentina** con helpers de
  `@/lib/dates` (no formatees fechas a mano).
- Estado persistido: actualizá inmutablemente y mantené el shape mapeable al futuro Prode (Supabase).

## Antes de dar por terminado

Tiene que pasar **todo**:

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

- Si tocás `src/data` o `src/lib`, agregá/actualizá tests. La integridad de datos se valida en
  `src/data/validate.ts` (104 partidos, 12×4 equipos, figuritas contiguas…).
- No crees archivos `.md` de “resumen de cambios”. Actualizá los docs existentes en `docs/` si
  cambia el comportamiento.

## Datos

Los datasets son **ilustrativos**. Para actualizarlos con info oficial seguí
[docs/DATA_SOURCES.md](../docs/DATA_SOURCES.md). La estructura de la llave y la asignación de mejores
terceros están en `src/data/matches.ts` y `src/lib/bracket.ts` (con tests).

## Prode (futuro)

No lo implementes salvo que se pida. El diseño está en
[docs/FEATURES/04-prode-futuro.md](../docs/FEATURES/04-prode-futuro.md) y
[docs/DECISIONS/0003-supabase-prode.md](../docs/DECISIONS/0003-supabase-prode.md). Mantené los
shapes de `store/` compatibles con ese modelo.

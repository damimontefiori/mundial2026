# ADR 0001 — Stack: Next.js + TypeScript + Tailwind en Vercel

- **Estado**: Aceptada
- **Fecha**: 2026-06

## Contexto

Necesitamos una PWA mobile-first, simple y robusta, mayormente usada en celulares, que corra en
planes gratuitos y que tenga un camino claro hacia un backend (Prode) en el futuro.

## Decisión

Usar **Next.js (App Router) + TypeScript + Tailwind CSS**, desplegado en **Vercel (Hobby)**. Estado
con **Zustand**, fechas con **date-fns/-tz**, validación con **Zod**, tests con **Vitest**.

## Alternativas consideradas

- **Astro / SPA con Vite**: excelentes para sitios estáticos, pero la app es muy interactiva
  (simulador con estado) y queremos dejar listo el salto al Prode; React + Next encaja mejor.
- **SvelteKit / otros**: válidos, pero Next + Vercel ofrece el free tier y la DX más directa para
  este caso, y el equipo lo conoce.

## Consecuencias

- ➕ SSG rápido, PWA, y evolución natural a server/DB para el Prode.
- ➕ Ecosistema grande y deploy gratis con previews por PR.
- ➖ Algo más de peso que una SPA mínima; se mitiga con páginas estáticas y bundles chicos.
- ➖ `next lint` quedará deprecado en Next 16: migrar a ESLint CLI cuando toque.

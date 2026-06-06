# AGENTS.md

Guía genérica para agentes de IA que trabajen en este repositorio. Complementa a
[`.github/copilot-instructions.md`](.github/copilot-instructions.md).

## Qué es

PWA mobile-first (Next.js App Router + TypeScript + Tailwind) para el Mundial 2026: fixture con
horarios de Argentina, simulador de la llave y álbum de figuritas. Local-first (sin backend en la
v1). Idioma del producto: **español (Argentina)**.

## Setup

```bash
npm install
npm run dev
```

Requisitos: Node ≥ 20.

## Comandos de verificación (correlos siempre antes de terminar)

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint (next lint)
npm test            # vitest run
npm run build       # build de producción
```

## Mapa del código

| Carpeta           | Responsabilidad                                                        |
| ----------------- | --------------------------------------------------------------------- |
| `src/types`       | Modelo de dominio (fuente de verdad de los tipos).                    |
| `src/data`        | Datasets curados + `validate.ts` (integridad).                       |
| `src/lib`         | Lógica pura y testeada: `standings`, `bracket`, `dates`, `ics`.      |
| `src/store`       | Estado local-first (Zustand + persist).                              |
| `src/features`    | UI por feature (fixture, bracket, stickers, settings, shared).       |
| `src/components`  | UI compartida (nav, tema, primitivos, sheet, iconos).               |
| `src/app`         | Rutas del App Router (páginas finas).                                |
| `public`          | `manifest.webmanifest`, `sw.js`, iconos, `offline.html`.            |
| `docs`            | Documentación de todo el ciclo de vida.                              |

## Reglas de oro

1. **La lógica del torneo va en `src/lib`** como funciones puras, con tests. Nunca en componentes.
2. **No agregues backend ni red en la v1.** El estado del usuario es local (`localStorage`).
3. **Mobile-first y accesible.** Tokens de Tailwind para soportar claro/oscuro; nada de hex sueltos.
4. **Fechas en UTC, se muestran en hora AR** con `@/lib/dates`.
5. **Datos = ilustrativos.** Actualizalos siguiendo `docs/DATA_SOURCES.md` y mantené verde
   `src/data/validate.ts`.
6. **No crees `.md` de resumen de cambios.** Actualizá los docs existentes si cambia el comportamiento.

## Seguridad

- Sin secretos en el repo. Las variables de Supabase (futuro Prode) van en `.env.local` y se listan
  en `.env.example`.
- Validá entradas en los bordes (datasets con Zod en `validate.ts`).

## Dónde está cada cosa

- Reglas de la llave y mejores terceros: `src/lib/bracket.ts` (+ `bracket.test.ts`).
- Desempates de grupo (FIFA): `src/lib/standings.ts` (+ `standings.test.ts`).
- Generación de los 104 partidos: `src/data/matches.ts`.
- Diseño del Prode futuro: `docs/FEATURES/04-prode-futuro.md`.

# Mundial 2026 ⚽️🇦🇷

PWA mobile-first para vivir el Mundial 2026: **fixture con horarios de Argentina**, un
**simulador de la llave** que se autocompleta y un **álbum de figuritas** para saber cuáles te
faltan. Funciona **sin conexión** y se **instala** como app. Pensada para correr 100% en planes
gratuitos.

> ✅ **Datos oficiales.** Equipos, grupos y calendario del sorteo oficial de la FIFA
> (Washington D.C., 5/12/2025) y numeración de figuritas del checklist oficial Panini (set base 980).
> Ver [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md).

## Funcionalidades

1. **Llave / Bracket** (prioridad 1): cargás resultados de la fase de grupos, las tablas se calculan
   solas (con los desempates de FIFA), se definen los 8 mejores terceros y la llave se completa
   automáticamente. Podés simular cruces hasta el campeón. _Botón “simular todo” para llenar al azar._
2. **Figuritas** (prioridad 2): grilla del álbum para marcar las que tenés, contar repetidas y ver
   cuántas te faltan, con buscador por número.
3. **Fixture** (prioridad 3): todos los partidos con día y hora de Argentina, filtros por grupo y por
   tu equipo, y exportación a calendario (`.ics`).
4. **Prode con amigos** (futuro): diseñado en el modelo de datos, todavía no implementado.

Extras: equipo favorito destacado, modo claro/oscuro, instalación PWA y uso offline.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · Zustand · date-fns · Zod · Vitest. Hosting en
Vercel (free). Ver [docs/TECH_STACK.md](docs/TECH_STACK.md).

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:3000
```

Scripts:

| Script               | Qué hace                                    |
| -------------------- | ------------------------------------------- |
| `npm run dev`        | Servidor de desarrollo                      |
| `npm run build`      | Build de producción                         |
| `npm start`          | Sirve el build                              |
| `npm run typecheck`  | Chequeo de tipos (`tsc --noEmit`)           |
| `npm run lint`       | ESLint                                      |
| `npm test`           | Tests (Vitest)                              |
| `npm run format`     | Prettier                                    |

> El service worker (offline/instalable) solo se registra en **producción**, no en `dev`.

## Estructura

```
src/
├─ app/         Rutas (App Router): / (partidos), /llave, /figuritas, /mas
├─ components/  UI compartida (nav, tema, primitivos, sheet)
├─ features/    Cada feature: fixture, bracket, stickers, settings, shared
├─ lib/         Lógica pura y testeada (standings, bracket, dates, ics)
├─ data/        Datasets curados (equipos, grupos, sedes, partidos, figuritas)
├─ store/       Estado local-first (Zustand + persist en localStorage)
└─ types/       Modelo de dominio
```

## Documentación

Todo el ciclo de vida está documentado en [`docs/`](docs/):
[PRD](docs/PRD.md) · [Arquitectura](docs/ARCHITECTURE.md) · [Stack](docs/TECH_STACK.md) ·
[Modelo de datos](docs/DATA_MODEL.md) · [Fuentes de datos](docs/DATA_SOURCES.md) ·
[UI/UX](docs/UI_UX.md) · [Roadmap](docs/ROADMAP.md) · [Testing](docs/TESTING.md) ·
[Deploy](docs/DEPLOYMENT.md) · [Features](docs/FEATURES) · [Decisiones (ADR)](docs/DECISIONS).

Para contribuir, ver [CONTRIBUTING.md](CONTRIBUTING.md). Guía para agentes de IA:
[AGENTS.md](AGENTS.md).

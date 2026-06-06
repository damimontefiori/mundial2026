# Stack tecnológico

Elegido para una app **mayormente móvil**, simple, robusta y **100% en planes gratuitos**.

## Resumen

| Capa            | Elección                          | Por qué                                                        |
| --------------- | --------------------------------- | -------------------------------------------------------------- |
| Framework       | **Next.js (App Router)**          | React + SSG, PWA, y camino claro al backend del Prode.        |
| Lenguaje        | **TypeScript** (estricto)         | Seguridad de tipos en dominio y lógica.                       |
| UI / estilos    | **Tailwind CSS** + tokens propios | Mobile-first, claro/oscuro, sin CSS suelto.                   |
| Estado          | **Zustand** + `persist`           | Mínimo boilerplate; persistencia local-first sencilla.        |
| Fechas          | **date-fns** + **date-fns-tz**    | Formateo en hora de Argentina sin reinventar nada.            |
| Validación      | **Zod**                           | Integridad de datasets en `validate.ts`.                      |
| Tests           | **Vitest**                        | Rápido; ideal para la lógica pura de la llave.                |
| Lint / formato  | **ESLint** + **Prettier**         | Calidad y estilo consistente.                                 |
| Hosting         | **Vercel (Hobby)**                | Deploy gratis de Next.js, HTTPS y CDN.                        |
| Backend (futuro)| **Supabase (free)**              | Postgres + Auth + RLS para el Prode.                          |

## PWA sin plugin de build

El offline e instalable se logran con un **service worker propio** (`public/sw.js`) y un manifest,
registrados desde el cliente. Evitamos dependencias de build (Serwist/next-pwa) y conflictos de
tipos, manteniendo el control total y un build más robusto.

## Por qué no…

- **Astro / SPA pura**: la app es muy interactiva (simulador con estado); Next + React encaja mejor
  y deja lista la evolución al Prode.
- **Una API de fútbol en vivo**: los free tiers tienen límites y puntos de falla. Con el sorteo ya
  hecho, **datos curados** en el repo es más robusto, gratis y offline.
- **Redux / otras libs de estado**: Zustand alcanza y sobra para este tamaño.

## Límites de los planes gratuitos (a tener en cuenta)

- **Vercel Hobby**: para uso personal/no comercial; suficiente para esta app estática.
- **Supabase free** (cuando se use): ~500 MB de base, pausa por inactividad. Diseñar el Prode
  teniéndolo en cuenta (datos compactos, lectura cacheable).

## Notas de seguridad de dependencias

`npm audit` puede reportar vulnerabilidades **moderadas** en herramientas de build/desarrollo (p. ej.
el PostCSS que Next empaqueta o el dev-server de esbuild). No afectan el runtime de producción. Se
revisan en cada actualización de dependencias; no se hace `--force` porque degradaría Next.

## Versiones

Ver [`package.json`](../package.json). Node ≥ 20.

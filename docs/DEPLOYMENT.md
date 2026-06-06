# Deploy

## Resumen

App estática (SSG) de Next.js. Se publica gratis en **Vercel (Hobby)**. No requiere variables de
entorno en la v1 (es local-first).

## Opción recomendada: Vercel

1. Subí el repo a GitHub.
2. En [vercel.com](https://vercel.com), **Add New → Project** e importá el repo.
3. Framework: **Next.js** (autodetectado). Build: `next build`. Sin variables de entorno.
4. **Deploy**. Cada push a `main` genera un deploy de producción; las ramas/PRs generan previews.

## Build local

```bash
npm run build
npm start         # sirve el build en http://localhost:3000
```

> Para probar en otro puerto: `npx next start -p 4321`.

## PWA en producción

- El service worker (`public/sw.js`) **solo se registra en producción** (no en `dev`).
- Tras el primer deploy, la app es instalable y funciona offline.
- Al cambiar `sw.js`, se sirve con `Cache-Control: max-age=0` (ver `next.config.mjs`) para que se
  actualice. Si cambiás la estrategia de caché, subí la versión del cache (`m26-cache-v1`).

## Checklist post-deploy

- [ ] Las 4 rutas responden 200 (`/`, `/llave`, `/figuritas`, `/mas`).
- [ ] `/manifest.webmanifest`, `/sw.js`, `/icon.svg` accesibles.
- [ ] Instalable (aparece “Agregar a pantalla de inicio”).
- [ ] Offline OK tras la primera carga.
- [ ] Lighthouse PWA/mobile en verde.

## CI

GitHub Actions corre en cada push/PR: `typecheck`, `lint`, `test` y `build`
(ver `.github/workflows/ci.yml`).

## Resultados reales (job programado)

`.github/workflows/update-results.yml` trae los resultados del torneo y commitea
`public/results.json` (el push redeploya Vercel). Para activarlo:

1. Conseguí un token gratis en [football-data.org](https://www.football-data.org/client/register).
2. En GitHub: **Settings → Secrets and variables → Actions → New repository secret**,
   nombre `FOOTBALL_DATA_TOKEN`.
3. El workflow corre cada 30 min **solo entre el 10/06 y el 20/07/2026** (ventana del torneo) y
   también a mano desde **Actions → Actualizar resultados → Run workflow**.

> El token vive solo en Secrets (CI), **nunca** como variable de Vercel ni en el cliente.
> Para probar localmente: `FOOTBALL_DATA_TOKEN=xxx npm run update:results`.

## Futuro: backend del Prode (Supabase)

Cuando se implemente la Fase 6:

1. Crear proyecto en Supabase (free) y aplicar el esquema de
   [DATA_MODEL.md](DATA_MODEL.md) / [FEATURES/04-prode-futuro.md](FEATURES/04-prode-futuro.md).
2. Configurar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ver `.env.example`) en
   Vercel.
3. Activar RLS y políticas por usuario/liga.

> Tener en cuenta los límites del free tier (pausa por inactividad, tamaño de base).

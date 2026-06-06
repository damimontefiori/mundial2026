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

## Login con Google + sync en la nube (Firebase)

Opcional: sin las env vars, la app funciona 100% local (sin botón de login). Setup gratis (Firebase
Spark, no se pausa). Ver [DECISIONS/0005-firebase-auth-sync.md](DECISIONS/0005-firebase-auth-sync.md).

1. **Firebase Console** → crear proyecto (plan Spark, sin tarjeta).
2. **Authentication → Sign-in method** → habilitar **Google**.
3. **Firestore Database** → crear (modo producción) → pegar las security rules:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /userState/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```

4. **Project settings → Your apps → Web** → copiar el config y cargar en Vercel las 4 vars
   `NEXT_PUBLIC_FIREBASE_*` (Production + Preview + Development; ver `.env.example`).
5. **Authentication → Settings → Authorized domains** → agregar el dominio de Vercel
   (`<tu-app>.vercel.app` y/o el custom). `localhost` ya viene autorizado.

> La config web de Firebase es **pública** por diseño: la seguridad la dan las security rules + los
> dominios autorizados. No usar credenciales de Admin SDK en el cliente.

> El Prode con ligas (futuro) está diseñado en
> [FEATURES/04-prode-futuro.md](FEATURES/04-prode-futuro.md); si se construye, reevaluar el backend
> (ver ADR 0005).

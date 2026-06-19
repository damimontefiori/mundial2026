# Operación: actualización de resultados

## Cómo funciona (sin cambios de arquitectura)

```
cron externo (cada 30 min)  ──POST workflow_dispatch──▶  GitHub Actions
  (cron-job.org + PAT)                                    update-results.yml
                                                              │
                          fetch football-data.org → public/results.json
                                                              │ git push
                                                              ▼
                                            Vercel redeploy  →  /results.json
                                                              ▲ poll cada 2 min
                                                         cliente (PWA)
```

## Por qué un cron externo

Los `schedule` de GitHub Actions **no son confiables** para cadencias frecuentes: se
encolan best-effort y se postergan/saltean (medido: el cron `*/30` corría en la práctica
**cada 2–5 h**). `workflow_dispatch` disparado por API **sí** corre puntual. Por eso la
cadencia de 30 min la maneja un pinger externo y el `schedule` del workflow quedó solo
como red de seguridad esparcida (cada 6 h).

## Setup del pinger (una sola vez)

1. **PAT fine-grained** (GitHub → Settings → Developer settings → Fine-grained tokens):
   - Solo el repo `mundial2026`.
   - Permiso **Actions: Read and write**.
   - Con fecha de expiración (renovar al vencer).

2. **cron-job.org** (gratis) → nuevo cronjob:
   - **URL:** `https://api.github.com/repos/damimontefiori/mundial2026/actions/workflows/update-results.yml/dispatches`
   - **Método:** `POST`
   - **Headers:**
     - `Authorization: Bearer <PAT>`
     - `Accept: application/vnd.github+json`
     - `X-GitHub-Api-Version: 2022-11-28`
   - **Body:** `{"ref":"main"}`
   - **Schedule:** cada 30 min.
   - (Opcional) limitar el rango de fechas al torneo, o desactivar el cronjob después del 20/07/2026.

   Alternativas equivalentes: Cloudflare Worker con Cron Trigger, o UptimeRobot.

## Costo (repo privado, tier gratuito 2000 min/mes)

Cada corrida es de un solo tiro (~1 min facturable mínimo). Pinger 48/día + fallback 6/día
≈ **~1.560 min/mes**, holgado bajo los 2.000 gratis. La "ventana del torneo" del workflow
hace que las corridas fuera de fecha terminen en segundos.

## Verificación

- En **Actions** debe verse el workflow corriendo cada ~30 min (event: `workflow_dispatch`).
- Un cambio real de estado/marcador debe reflejarse en la app en ≤ ~30 min (incluye el
  redeploy de Vercel y el poll de 2 min del cliente).
- Aunque se pierda un disparo, el cliente deja de mostrar "EN VIVO" pasadas ~3 h del inicio
  (cap en `src/lib/dates.ts` → `pastLiveWindow`).

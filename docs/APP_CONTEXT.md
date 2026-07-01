# Contexto de la aplicacion

Fecha de analisis: 2026-07-01.

Este documento resume el estado real de la aplicacion para mantener contexto tecnico y de producto
sin tener que reconstruirlo desde cero en cada cambio. No reemplaza a los documentos de arquitectura,
features o ADR; funciona como mapa operativo para navegar el repo, detectar impactos y evitar romper
los flujos principales.

## Resumen ejecutivo

Mundial 2026 es una PWA mobile-first hecha con Next.js App Router, TypeScript, Tailwind, Zustand y
Vitest. El producto principal es una app para seguir el Mundial 2026 desde Argentina: fixture en hora
AR, simulador de llave, album de figuritas, premios en vivo y ajustes personales.

La arquitectura partio como local-first, pero el estado actual incluye dos integraciones opcionales
sin servidor propio:

- Resultados y goleadores reales: un workflow de GitHub Actions consulta football-data.org con un
  secret, genera `public/results.json` y `public/awards.json`, y Vercel redeploya esos archivos.
- Login y sincronizacion: Firebase Auth + Firestore opcional. Si faltan variables de entorno, la app
  sigue funcionando 100% local y no muestra login.

La regla central de mantenimiento sigue siendo la misma: la logica de torneo y datos vive en
`src/lib` y `src/data` como codigo puro y testeado; React solo presenta, toma input y conecta stores.

## Producto actual

### Rutas visibles

| Ruta | Tab | Proposito |
| --- | --- | --- |
| `/` | Partidos | Fixture completo, horarios AR, filtros, detalle, calendario, radio del proximo partido. |
| `/llave` | Llave | Simulacion de eliminatorias con resultados reales bloqueados, pronostico predictivo. Solo muestra la llave (sin selector Grupos). |
| `/premios` | Premios | Botin de Oro, Guante de Oro, Mejor Jugador Joven estimado, premios por fase, Records de Messi. |
| `/figuritas` | Figus | Album Panini, faltantes, repetidas, busqueda mejorada, compartir por WhatsApp, festejos de estrellas y festejo de pais completo. |
| `/mas` | Mas | Guia, favorito, tema, cuenta/sync, instalar PWA, compartir app, reinicio de datos y acerca de. |

Nota: algunos docs historicos todavia hablan de 4 tabs y v1 sin backend. El codigo actual tiene 5
tabs y capacidades opcionales de resultados, premios, radio y Firebase.

### Experiencia principal

- El usuario abre la app y ve `Partidos` agrupados por dia, con scroll al dia actual o proximo.
- Puede elegir equipo favorito; se resalta en fixture y llave, y habilita filtro de partidos propios.
- La app muestra resultados reales si `public/results.json` esta poblado. Los partidos finalizados se
  bloquean y pisan la simulacion local.
- En `Llave`, la vista muestra directamente el arbol de eliminatorias (sin selector Grupos/Llave).
  El arbol hace auto-scroll horizontal a la ronda activa del torneo. El usuario puede tocar
  selecciones para simular avances; los partidos reales quedan bloqueados.
- `Premios` tiene dos tabs: `Premios` (Botin, Guante, Joven, Dinero, Balon) y `Records de Messi`
  (metricas historicas comparadas con datos vivos del torneo).
- `Figuritas` celebra al completar un pais (Sheet con bandera) y al conseguir una figurita estrella.
- `Mas` incluye boton de compartir la app (Web Share API con fallback a clipboard).

## Arquitectura

### Capas

```text
src/types  ->  src/data  ->  src/lib  ->  src/store  ->  src/features / src/components  ->  src/app
 dominio       datasets      logica        estado        UI por feature / primitivos       rutas
```

Dependencias esperadas:

- `src/types`: fuente de verdad del dominio; no depende de React.
- `src/data`: datasets curados y helpers de acceso; valida integridad con Zod.
- `src/lib`: reglas puras y testeables: standings, bracket, prediccion, fechas, ICS, resultados,
  premios, radio, share, messiRecords.
- `src/store`: Zustand. Los stores persistidos usan `persist`, `skipHydration: true` y rehidratacion
  manual en `Providers`.
- `src/features`: UI con estado/hook por feature. Debe llamar a `src/lib`, no reimplementar reglas.
- `src/components`: primitivos compartidos, navegacion, sheet, header, badges e iconos.
- `src/app`: paginas finas del App Router que delegan en `features`.

### Shell de la app

- `src/app/layout.tsx` define metadata, manifest, viewport (con `maximumScale: 1, userScalable: false`
  para bloquear zoom accidental en mobile), script anti-flash de tema, `Providers`, contenedor
  `max-w-app`, `BottomNav` y `WelcomeGate`.
- `src/components/Providers.tsx` hace el trabajo de cliente global:
  - rehidrata stores persistidos;
  - registra apertura (`launchCount`);
  - carga `results.json` y `awards.json`;
  - refresca resultados/premios en foco, visibility change y cada 2 min;
  - captura `beforeinstallprompt`;
  - para el radio en `pagehide` y `beforeunload` (evita que el stream quede colgado al salir);
  - monta `useCloudSync`;
  - aplica tema y registra el service worker en produccion.

## Estado y persistencia

### Stores persistidos

| Store | Key localStorage | Contenido | Observaciones |
| --- | --- | --- | --- |
| `simulation` | `m26-simulation` | `groupResults`, `knockoutPicks`, `forecastApplied` | Shape compatible con Prode futuro; `simulateRest` usa `projectSimulation`. |
| `stickers` | `m26-stickers` | `owned: Record<StickerCode, number>` | Version 2 migra desde claves numericas viejas descartando coleccion anterior. |
| `preferences` | `m26-preferences` | favorito, tema, onboarding, aperturas | Version 2 pone Argentina como favorito por defecto si no habia favorito. |

### Stores no persistidos

| Store | Funcion |
| --- | --- |
| `results` | Carga/refresca resultados reales desde `/results.json`. No degrada si llega un JSON vacio tras tener datos buenos. |
| `awards` | Carga/refresca goleadores desde `/awards.json`. Replica el guard anti-degradacion del store de resultados. |
| `auth` | Expone Firebase Auth, estado de sync, errores amigables y login/logout con Google. |
| `pwa` | Guarda el `beforeinstallprompt` diferido y permite disparar instalacion nativa. |
| `radioPlayer` | Singleton global del audio de radio. Estado: `idle \| connecting \| playing \| error`. Expone `play()` y `stop()`. HTMLAudioElement fuera del store (modulo-level), timeout de 30 s para conexion. |

### Sync en la nube

Firebase es opcional y client-only. La inicializacion vive en `src/lib/firebase.ts`; si faltan
`NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` o `NEXT_PUBLIC_FIREBASE_PROJECT_ID`,
`firebaseEnabled` queda falso y la UI de cuenta no aparece.

El documento remoto es `userState/{uid}`:

```ts
{
  stickers: { owned },
  simulation: { groupResults, knockoutPicks },
  preferences: { favoriteTeamId },
  updatedAt: number
}
```

El tema no se sincroniza. En el primer enlace, si existe remoto mas nuevo que `m26-lastSync`, gana la
nube. Luego se usa last-write-wins por `updatedAt`. Los cambios locales suben con debounce de 800 ms.

## Datos

### Datasets curados

- `src/data/teams.ts`: 48 equipos oficiales, `id` igual al codigo FIFA, banderas en emoji.
- `src/data/groups.ts`: 12 grupos de 4 equipos.
- `src/data/venues.ts`: 16 sedes reales, con timezone de referencia.
- `src/data/matches.ts`: 104 partidos oficiales, numerados `M1` a `M104`:
  - 72 de grupos;
  - 16 R32;
  - 8 R16;
  - 4 QF;
  - 2 SF;
  - tercer puesto;
  - final.
- `src/data/stickers.ts`: set base Panini de 980 figuritas mas promo Coca-Cola (`CC1`-`CC12`).
- `src/data/ratings.ts`: linea base del motor predictivo por equipo.
- `src/data/goalkeepers.ts`: arqueros titulares estaticos para el Guante de Oro.
- `src/data/starStickers.ts`: figuritas estrella con imagen WebP en `public/stars`.

### Validacion de datos

`src/data/validate.ts` verifica estructura y consistencia:

- 48 equipos unicos y ratings para cada equipo.
- 16 sedes.
- 12 grupos, cada equipo en un unico grupo.
- 104 partidos, numeracion 1..104, referencias validas y conteos por etapa.
- figuritas con codigos unicos, total base 980 y 48 secciones de equipo de 20 codigos.

`src/data/data.test.ts` corre esta validacion y tambien chequea estructura de grupos/fixture.

## Logica de torneo

### Tablas de grupo

`src/lib/standings.ts` calcula filas con PJ, PG, PE, PP, GF, GC, DG, puntos y rank. Criterios:

1. puntos;
2. diferencia de gol;
3. goles a favor;
4. puntos entre empatados;
5. diferencia de gol entre empatados;
6. goles a favor entre empatados;
7. desempate deterministico por id de equipo.

Tambien expone `isGroupComplete` y `groupProgress`.

### Llave

`src/lib/bracket.ts` construye `BracketView`:

- standings por grupo;
- completitud por grupo;
- ranking de terceros;
- 8 mejores terceros clasificados si todos los grupos estan completos;
- asignacion de terceros a R32: **primero intenta `OFFICIAL_THIRD_ALLOCATIONS`** (tabla hardcodeada
  con la asignacion real de FIFA para combinaciones conocidas de grupos calificados, ej. BDEFIJKL);
  si no hay coincidencia, cae al backtracking deterministico. Esto es importante: el backtracking
  puede no coincidir con la asignacion oficial de FIFA, por lo que las combinaciones ya jugadas
  deben incluirse en `OFFICIAL_THIRD_ALLOCATIONS`;
- resolucion de cruces por `groupWinner`, `groupRunnerUp`, `thirdFrom`, `winnerOf` y `loserOf`.

La progresion se procesa por numero de partido, asi cada `winnerOf`/`loserOf` ya esta disponible.
El campeon se lee de `view.knockout['M104']`.

### Resultados oficiales vs simulacion

`src/lib/officialResults.ts` mezcla estado del usuario con resultados reales:

- partidos `FINISHED` de grupo pisan `groupResults` y quedan en `locked`;
- partidos `FINISHED` de eliminatorias con `winnerCode` pisan `picks` y quedan en `locked`;
- resultados `IN_PLAY` o `PAUSED` se muestran en fixture/premios, pero no bloquean simulacion hasta
  estar finalizados.

Este merge se usa en `FixtureView`, `BracketView`, `AwardsView` y `projectSimulation`.

## Motor predictivo

El motor vive en `src/lib/predict.ts` y esta documentado por `docs/DECISIONS/0006-prode-predictivo.md`.
Es puro, deterministico y no usa azar.

Piezas:

- `baselineRatings`: arranca desde `src/data/ratings.ts`.
- `expectedGoals`: calcula lambda de Poisson con ataque, defensa rival y factor de localia anfitrion.
- `forecastMatch`: produce xG, marcador mas probable y probabilidades local/empate/visitante.
- `advanceProbabilities`: reparte el empate en eliminatorias segun fuerza relativa.
- `adjustRatingsFromOfficial`: recalibra Elo + ataque/defensa con resultados reales en orden.
- `projectSimulation`: respeta resultados reales y entradas del usuario, rellena grupos faltantes y
  elige ganadores proyectados en eliminatorias.

Implicancia de producto: el boton `Pronostico` no equivale a "simular al azar". Completa con el
marcador mas probable y tiende a favorecer favoritos; las probabilidades se muestran como ayuda de
decision.

## Resultados, premios y job operativo

### Pipeline

```text
cron externo / workflow_dispatch
  -> GitHub Actions update-results.yml
  -> npm run update:results
  -> football-data.org
  -> public/results.json + public/awards.json
  -> commit a main
  -> redeploy de Vercel
  -> cliente refresca cada 2 min y en foco/visibilitychange
```

`scripts/fetch-results.ts` requiere `FOOTBALL_DATA_TOKEN` solo en CI/local. El token nunca llega al
cliente ni a Vercel. La ventana del workflow es 2026-06-10 a 2026-07-20.

### Mapeo de API

`src/lib/ingestApiResults.ts` convierte football-data.org al formato interno:

- equipos se resuelven por `tla` o variantes de nombre;
- grupos se mapean por par de equipos;
- eliminatorias se anclan por el lado sembrado en R32 y despues se propagan con ganadores reales;
- evita publicar `FINISHED` sin goles numericos para no bloquear falsos 0-0;
- orienta goles y entretiempo a nuestro home/away;
- `mapStatus` incluye `case 'LIVE':` (football-data usa "LIVE", no "IN_PLAY" para partidos en curso).

`src/lib/ingestAwards.ts` arma el ranking de goleadores para `awards.json` y ordena por goles,
asistencias, menos partidos y nombre.

### Premios en UI

`src/features/awards/AwardsView.tsx` tiene dos tabs mediante `SegmentedControl`:

**Tab "Premios":**
- goleadores de `awards` para Botin de Oro;
- `computeGoalkeeping` para Guante de Oro por vallas invictas, goles recibidos y PJ;
- `isYoungPlayer` para estimar Mejor Jugador Joven con corte `2005-01-01`;
- `computePrizeMoney` para dinero por fase segun la llave real resuelta;
- festejos especiales (`StickerCelebration`) al tocar Messi o Dibu en las listas.

**Tab "Records de Messi":**
- `computeMessiRecords(scorers, official, view)` en `src/lib/messiRecords.ts` devuelve un
  `MessiRecordsDashboard` con dos grupos: `chasing` (marcas que buscaba alcanzar) y `extending`
  (records propios que agranda en cada partido).
- Cada metrica (`MessiRecordMetric`) tiene `baseline`, `live` (delta del torneo), `current`, `record`,
  `progressMax`, `status` (pending/tied/broken/extended/unavailable) y `statusLabel`.
- `src/features/awards/MessiRecordsPanel.tsx` renderiza los dos grupos con `ProgressBar`.

## Fixture y calendario

`src/features/fixture/FixtureView.tsx` muestra todos los partidos ordenados por `kickoffUTC` y
agrupados por dia en hora Argentina. Usa `computeBracket` con resultados reales solamente para poder
resolver cupos de eliminatorias reales en el fixture sin mezclar la simulacion privada del usuario.

Capacidades clave:

- filtros: todos, finales, Grupo A-L;
- filtro por favorito si hay favorito;
- detalle en `MatchDetailSheet`;
- exportacion `.ics` de partidos proximos filtrados;
- scroll inicial al dia actual/proximo;
- marcador y estado real si existe (`IN_PLAY`, `PAUSED`, `FINISHED`);
- control de radio solo en el proximo partido no terminado.

Fechas:

- los datasets guardan UTC ISO;
- `src/lib/dates.ts` formatea siempre en `America/Argentina/Buenos_Aires`;
- no formatear fechas a mano en componentes.

ICS:

- `src/lib/ics.ts` arma eventos con 2 h de duracion fija;
- genera archivos en cliente con `Blob` y descarga local.

Radio:

- `src/lib/radio.ts` define stream URL, flag `NEXT_PUBLIC_RADIO_ENABLED`, nombre y ventana de 30 min.
- `src/store/radioPlayer.ts` (NO persistido): singleton global del `HTMLAudioElement` a nivel modulo.
  `play()` arranca el stream, `stop(next?)` pausa y libera `src`. El estado se propaga via Zustand.
  Timeout de 30 s en `connecting` antes de marcar `error`.
- `RadioControl` lee `useRadioPlayerStore` (ya no maneja audio localmente). Muestra aviso sutil
  fuera de la ventana de 30 min; boton play/stop dentro de la ventana.
- `Providers` escucha `pagehide`/`beforeunload` para llamar `stop()` al salir de la app.
- `activeRadioMatchId` elige el primer partido que todavia no termino, con backstop por ventana viva.

## Llave

`src/features/bracket/BracketView.tsx` ya no tiene selector Grupos/Llave; muestra siempre el arbol
de eliminatorias (`KnockoutPanel`). Tampoco muestra el banner "Resultados reales" (se elimino para
dar protagonismo al contenido). El banner de pronostico aplicado (`forecastApplied`) se mantiene.

`src/features/bracket/KnockoutPanel.tsx` muestra una pista de simulacion cuando todos los grupos
estan completos: "Toca una seleccion para simular quien avanza."

`src/features/bracket/BracketTree.tsx` calcula la ronda activa (`currentRoundKey`) en base a partidos
no finalizados y fechas de inicio, y hace auto-scroll horizontal al columna de esa ronda al montar.
Se actualiza cada 60 s con `useNow`. Cada columna lleva `data-round` para el scroll target.

## Figuritas

El album usa codigos oficiales, no indices numericos. El estado es `owned[code] = cantidad`.

Funciones de UI:

- modos `Tengo`, `+ Repe`, `- Repe`;
- progreso sobre `baseStickerCodes` (980, sin promo Coca-Cola);
- buscador mejorado: por codigo exacto o prefijo; por nombre de pais normalizado (sin acentos);
  scroll al resultado y highlight con ring por 1.8 s;
- re-posicionamiento del scroll al cerrar el teclado virtual en mobile (`onBlur`);
- filtro `Solo faltan`;
- acciones por seccion `Todas` y `Limpiar` con confirmacion;
- compartir faltantes y repetidas por WhatsApp (`src/lib/stickerShare.ts` + `src/lib/share.ts`);
- festejo con confeti e imagen al conseguir una figurita estrella;
- festejo con Sheet (bandera + mensaje) al completar las 20 figuritas de un pais.

Riesgo de mantenimiento: la migracion v2 de `stickers` descarta colecciones viejas con claves
numericas. No volver a mezclar indices secuenciales con codigos oficiales.

## Onboarding, nudges y ajustes

- `WelcomeGate` abre `WelcomeSheet` una sola vez tras hidratacion si no hay `onboardingSeenAt`.
- `WelcomeSheet` tambien se abre desde `Mas -> Como funciona`.
- `NudgeManager` se monta en `Providers` y sugiere instalar o iniciar sesion en aperturas 3, 7, 11,
  alternando si aplican ambas.
- `SettingsView` concentra favorito, tema, cuenta, install prompt, compartir app y resets.
  La seccion "App" agrupa instalar (si disponible) y compartir (siempre visible). `shareApp()` en
  `src/lib/share.ts` usa `navigator.share` con fallback a `clipboard.writeText`.
- El tema se inicializa antes de pintar en `layout.tsx` y luego se mantiene desde `Providers`.

## PWA y offline

- Manifest: `public/manifest.webmanifest`.
- Service worker: `public/sw.js`, cache `m26-cache-v2`.
- Registro solo en produccion desde `Providers`.
- Viewport: `maximumScale: 1, userScalable: false` (bloquea zoom accidental en iOS/Android).

Estrategias:

- navegaciones: network-first, fallback a ruta cacheada u `offline.html`;
- `/results.json`: network-first, fallback a cache;
- otros assets del mismo origen: stale-while-revalidate.

Observacion: `sw.js` trata `results.json` de forma especial, pero no tiene rama especial para
`awards.json`; hoy awards cae en stale-while-revalidate. Si se necesita frescura equivalente para
premios, conviene agregarlo explicitamente.

## UI y convenciones

- App mobile-first, contenedor `max-w-app` de 32rem.
- Bottom nav fija con safe-area y 5 destinos.
- `PageHeader` sticky con altura `--header-h`.
- Tokens Tailwind sobre CSS variables HSL en `src/app/globals.css`.
- Claro/oscuro con clase `.dark`, nunca hardcodear hex en UI nueva salvo casos deliberados como
  colores de marca o confeti.
- Primitivos en `src/components/ui.tsx`: `Button`, `IconButton`, `Card`, `SegmentedControl`, `Chip`,
  `ProgressBar`, `EmptyState`.
- `Sheet` usa portal, bloqueo de scroll y cierre con Escape/backdrop.
- Iconos propios en `src/components/icons.tsx`; no hay libreria de iconos instalada. Iconos
  disponibles al 2026-07-01: todos los anteriores mas `ShareIcon`, `PlayIcon`, `StopIcon`, `RadioIcon`.

## Tests y calidad

Scripts declarados:

```bash
npm run typecheck
npm run lint
npm test                                      # vitest con --no-file-parallelism (flakiness conocida)
npm run build
```

Cobertura actual observada:

- datos: `data.test.ts`, `starStickers.test.ts`;
- torneo: `standings.test.ts`, `bracket.test.ts` (incluye tests de `allocateThirds` con tabla
  oficial), `bracketLayout.test.ts`;
- prediccion: `predict.test.ts`;
- resultados/premios: `officialResults.test.ts`, `ingestApiResults.test.ts`, `ingestAwards.test.ts`,
  `awards.test.ts`, `messiRecords.test.ts`;
- fechas/estado en vivo/radio: `dates.test.ts`, `liveClock.test.ts`, `radio.test.ts`;
- compartir figuritas: `stickerShare.test.ts`.

Nota: vitest 4.1.8 falla intermitentemente con paralelismo de archivos. Siempre correr con
`--no-file-parallelism`. El script `npm test` ya lo incluye.

Antes de cerrar cambios relevantes, correr todo. Si el cambio toca solo docs, al menos correr Prettier
o `npm run format:check` sobre el archivo/documentacion tocada.

## Deploy y configuracion

- Hosting esperado: Vercel Hobby.
- Node requerido: >= 20.
- CI: `.github/workflows/ci.yml` corre install, typecheck, lint, test y build.
- Resultados: `.github/workflows/update-results.yml` corre en ventana de torneo y por dispatch.
- Variables:
  - `FOOTBALL_DATA_TOKEN`: solo CI/local para `npm run update:results`.
  - `NEXT_PUBLIC_FIREBASE_API_KEY`.
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`.
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`.
  - `NEXT_PUBLIC_FIREBASE_APP_ID`.
  - `NEXT_PUBLIC_RADIO_STREAM_URL` opcional.
  - `NEXT_PUBLIC_RADIO_ENABLED=false` para apagar radio.

## Inconsistencias documentales a vigilar

Estas no son necesariamente bugs de producto, pero si se toca documentacion general conviene
normalizarlas:

- `README.md` todavia dice que "simular todo" llena al azar; el codigo actual usa pronostico
  predictivo deterministico.
- `docs/PRD.md` y algunos textos de arquitectura hablan de v1 sin backend/red; hoy hay fetch de
  archivos estaticos generados por CI y Firebase opcional.
- `docs/UI_UX.md` menciona navegacion de 4 destinos; `BottomNav` tiene 5 con `Premios`.
- `docs/TECH_STACK.md` mantiene Supabase como backend futuro; ADR 0005 supersede Supabase para auth
  + sync actual con Firebase, pero el Prode de ligas sigue abierto.
- `docs/DATA_SOURCES.md` deja "Datos en vivo" como futuro opcional, aunque resultados reales ya estan
  implementados como archivos estaticos generados por workflow.
- `BracketView` ya no tiene el tab "Grupos"; cualquier referencia a ese selector en docs es obsoleta.

## Puntos sensibles al modificar

- Cambios en `src/data/matches.ts` impactan fixture, bracket, resultados reales, ICS, premios y tests
  de integridad. Mantener numeracion oficial y referencias `winnerOf`/`loserOf` consistentes.
- Cambios en `MatchSlot` o `Stage` requieren revisar `bracket`, `matchDisplay`, `ingestApiResults`,
  premios, UI de fixture/llave y tests.
- Cambios en stores persistidos requieren version/migracion y cuidado con `skipHydration`.
- Cambios en `results.json`/mapeo oficial pueden bloquear la simulacion del usuario; mantener guards
  anti-regresion y tests sinteticos.
- Cambios en prediccion deben preservar determinismo salvo decision explicita de producto.
- Cambios en PWA/cache deben subir version de cache si la estrategia cambia.
- Cambios de UI deben conservar mobile-first, area tactil comoda, tokens de color y compatibilidad
  claro/oscuro.
- Al agregar nuevas combinaciones de terceros calificados (nuevas rondas de R32), agregar la
  asignacion oficial en `OFFICIAL_THIRD_ALLOCATIONS` en `src/lib/bracket.ts` para que el bracket
  refleje la asignacion real de FIFA en lugar del backtracking deterministico.
- `radioPlayer` es un singleton a nivel modulo (no React): el `HTMLAudioElement` vive fuera del
  store. No duplicar la instancia ni crear otro elemento audio en ningun componente.

## Guia rapida para agregar features

1. Definir si es data, logica pura, estado o UI. Evitar poner reglas de negocio en componentes.
2. Si toca torneo/datos, editar `src/lib`/`src/data` y agregar o actualizar tests.
3. Si necesita persistencia local, agregar version/migracion del store y rehidratacion segura.
4. Si necesita datos externos, preferir pipeline CI/archivo estatico o integracion opcional; no meter
   secrets en cliente.
5. Mantener copy en espanol de Argentina.
6. Validar con `typecheck`, `lint`, `test` y `build` antes de terminar cambios de codigo.

## Archivos de referencia principal

- Producto: `README.md`, `docs/PRD.md`, `docs/ROADMAP.md`.
- Arquitectura: `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/TECH_STACK.md`.
- Datos: `docs/DATA_SOURCES.md`, `src/data/validate.ts`.
- Resultados: `docs/OPERACION_RESULTADOS.md`, `scripts/fetch-results.ts`.
- Firebase: `docs/DECISIONS/0005-firebase-auth-sync.md`.
- Prediccion: `docs/DECISIONS/0006-prode-predictivo.md`, `docs/Prode_Rendimiento_Predictivo.md`.
- Testing: `docs/TESTING.md`, `vitest.config.ts`.
- APIs externas: `docs/APIs_Futbol_Mundial_2026.md`, `docs/Integracion-Info_Mundial2026.md`.
- Radio: `docs/integracion-radio-am910-node-tsx.md`.
- Arqueros: `docs/arqueros_titulares_mundial_2026_confirmados.md`.

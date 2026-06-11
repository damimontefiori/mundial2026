# ADR 0006 — Motor predictivo para la simulación de la llave

- **Estado**: Aceptada (implementada).
- **Fecha**: 2026-06

## Contexto

La pantalla **Llave** tenía un botón "Simular todo al azar" que rellenaba los partidos faltantes con
goles `Math.random()` y elegía ganadores de eliminatorias a cara o cruz. Era reproducible solo por
casualidad y no aportaba ninguna señal: no distinguía a España de Curazao.

Se quiere reemplazarlo por una **proyección basada en el rendimiento** de equipos y jugadores, con
"cierto grado de certeza", y que **se auto-actualice** con los resultados reales que van sucediendo
(los mismos que ya trae `public/results.json`, ver [ADR sobre resultados](../../.github/workflows/update-results.yml)).
La base teórica es [docs/Prode_Rendimiento_Predictivo.md](../Prode_Rendimiento_Predictivo.md).

## Decisión

Un motor **determinístico y puro** (`src/lib/predict.ts`), sin React, en tres capas:

1. **Línea base** (`src/data/ratings.ts`): por selección, `fifaPoints`, `marketValue`, `OVR`,
   `attack`, `defense` (0–100) tomados del informe. Es el estado en t=0 ("vaselina").

2. **Proyección** (Poisson):
   - Goles esperados `λ = 1.35 · (Ataque/75) · ((150 − Defensa_rival)/Defensa_rival)`
     — reproduce el ejemplo del informe (Francia Atk 94 vs Arabia Def 64 = 2.27).
   - Marcador proyectado = **moda de Poisson** (`floor(λ)`): el resultado más probable
     (decisión de producto: "más probable / chalk", no muestreo aleatorio).
   - Probabilidades de resultado (local/empate/visitante) a partir de la matriz de Poisson →
     son el "grado de certeza" que se muestra en pantalla.
   - **Localía** del anfitrión (MEX/USA/CAN): +100 Elo y ×1.10 a su `λ`.

3. **Retroalimentación** (`adjustRatingsFromOfficial`): por cada resultado **real** jugado, en orden,
   - **Elo** `R' = R + K·G·(S−E)`, con `K=60`, `E` logística (±100 localía) y multiplicador por
     diferencia de goles `G` (1 / 1.5 / 1.75 / (11+d)/8 para 4+);
   - **retropropagación de la sorpresa de xG**: el que marca por encima de su xG sube su `attack` y
     baja la `defense` del rival (y viceversa), con los atributos previos al partido.
   Devuelve una tabla nueva (no muta la base). Las proyecciones de los partidos siguientes usan esa
   tabla recalibrada → así "contemplan los resultados reales que van sucediendo".

**Integración**: `useSimulationStore.simulateRest` llama a `projectSimulation(userGroups, userPicks,
official)`, que respeta los resultados reales (bloqueados) y lo cargado por el usuario, y rellena el
resto con la proyección. El contrato (campos, locks) es idéntico al anterior; solo cambió el "relleno".
La UI (`Forecast.tsx`) muestra el marcador proyectado + confianza en grupos y una barra de probabilidad
de avance en cada cruce.

## Alternativas consideradas

- **Muestreo Monte Carlo** (sortear marcadores según la distribución): da variedad y upsets realistas,
  pero reintroduce azar. Se eligió la **moda determinística** por pedido explícito de "certeza".
  El motor ya expone las probabilidades, así que migrar a muestreo con semilla fija es un cambio chico
  si en el futuro se quiere un bracket menos "chalk".
- **Solo Elo** (sin Poisson): da probabilidades de avance pero no marcadores; el Prode necesita el
  marcador exacto de grupos para las tablas y desempates.

## Consecuencias

- ➕ La simulación tiene sentido futbolístico y es 100% reproducible y testeada (`src/lib/predict.test.ts`).
- ➕ Auto-actualización sin estado persistido: los ratings se recalculan desde la base + `results.json`
  en cada proyección (stateless, robusto).
- ➖ La proyección "más probable" tiende a marcadores bajos (muchos 1-0/1-1) y a un bracket favorable a
  los favoritos; es esperable para la moda de Poisson. Los parámetros (`LEARNING_RATE`, `K_FACTOR`,
  `HOST_GOAL_FACTOR`) son tunables en un solo lugar.
- ➖ La línea base es una transcripción curada del informe; si se actualizan ratings, editar `ratings.ts`.

## Enlaces

- Implementación: `src/lib/predict.ts`, `src/data/ratings.ts`, `src/features/bracket/Forecast.tsx`.
- Base teórica: [../Prode_Rendimiento_Predictivo.md](../Prode_Rendimiento_Predictivo.md).
- Simulador: [../FEATURES/02-llave-simulador.md](../FEATURES/02-llave-simulador.md).

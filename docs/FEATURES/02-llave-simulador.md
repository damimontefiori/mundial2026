# Feature 02 — Llave / Simulador (Prioridad 1)

## Objetivo

Que el usuario **arme y simule** el Mundial: cargar resultados de grupos, ver las tablas calcularse
solas y completar la llave hasta el campeón.

## Alcance

- **Fase de grupos**: por cada grupo, cargar los 6 marcadores con steppers `−/＋`. La tabla se calcula
  en vivo con los **desempates de FIFA** y marca clasificados (1.º-2.º) y posible mejor 3.º.
- **Mejores terceros**: con los 12 grupos completos, clasifican los **8 mejores**.
- **Dieciseisavos (R32)**: cada tercero se asigna a su llave **sin revancha de grupo**.
- **Eliminatorias**: tocar el equipo que “Pasa” en cada cruce; la llave se propaga
  R32 → Octavos → Cuartos → Semis → Final (+ 3.er puesto). Dos vistas:
  - **Árbol** (default): llave visual en columnas con scroll horizontal y conectores.
  - **Lista**: selector ronda por ronda (mejor para editar en mobile).
- **Campeón**: banner cuando se define la final.
- **Atajos**: “Proyectar resultados” (completa lo que falte con el **modelo predictivo**, no al azar:
  marcador más probable por Ataque/Defensa + Poisson, y ganador proyectado de cada cruce) y “Reiniciar”.
- **Pronóstico en pantalla**: cada partido sin cargar muestra el marcador proyectado y la confianza;
  cada cruce de eliminatorias, una barra con la probabilidad de avance de cada lado. El motor se
  **recalibra con los resultados reales** que se van jugando. Ver
  [ADR 0006](../DECISIONS/0006-prode-predictivo.md).
- **Resultados reales** (opcional): si existe `public/results.json` poblado, los partidos
  ya jugados se **autocompletan y quedan bloqueados** (no editables) y vos simulás el resto.
  Ver [DATA_SOURCES.md](../DATA_SOURCES.md#resultados-reales-auto-completado).

## Dónde está

- UI: `src/features/bracket/` (`BracketView`, `GroupsPanel`, `KnockoutPanel`, `BracketTree`,
  `StandingsTable`).
- Lógica (pura, testeada): `src/lib/standings.ts`, `src/lib/bracket.ts`, `src/lib/bracketLayout.ts`
  (orden del árbol) y `src/lib/officialResults.ts` (merge real + simulación).
- Estado: `src/store/simulation.ts` (`groupResults`, `knockoutPicks`) y `src/store/results.ts`
  (resultados reales, `public/results.json`).

## Reglas (resumen)

1. **Tabla de grupo**: puntos → DG → GF → (entre empatados) puntos/DG/GF directos → desempate
   determinístico. (`computeGroupStandings`)
2. **Terceros**: se rankean los 12 (puntos/DG/GF) y clasifican 8. (`computeBracket`)
3. **Asignación a R32**: backtracking determinístico que respeta los grupos permitidos por cada cupo
   (siempre hay solución). (`allocateThirds`)
4. **Progresión**: se procesan los partidos en orden de número; `winnerOf`/`loserOf` se resuelven con
   los picks. (`resolveKnockout`)

## Estados

- Grupos incompletos: la pestaña Llave muestra cupos (“1.º A”, “Mejor 3.º”) y avisa que falta
  completar los 12 grupos.
- Picks reversibles: volver a tocar al elegido **deshace** el pick (y limpia las rondas siguientes
  que dependían de él, al recalcular).

## Proyección predictiva

El botón "Proyectar resultados" usa `src/lib/predict.ts` (motor puro): línea base de Ataque/Defensa/Elo
por selección (`src/data/ratings.ts`), goles esperados por Poisson, marcador más probable y, como
retroalimentación, recalibra Elo + atributos con cada resultado real jugado. Diseño completo y fórmulas
en [ADR 0006](../DECISIONS/0006-prode-predictivo.md) y la base teórica en
[Prode_Rendimiento_Predictivo.md](../Prode_Rendimiento_Predictivo.md).

## Tests

`src/lib/standings.test.ts`, `src/lib/bracket.test.ts` y `src/lib/predict.test.ts`
(ver [TESTING.md](../TESTING.md)).

## Notas de datos

La estructura de cruces vive en `src/data/matches.ts`. La regla de terceros es **data-driven**: para
reproducir la tabla oficial de la FIFA, restringí los grupos permitidos de cada cupo `thirdFrom`.

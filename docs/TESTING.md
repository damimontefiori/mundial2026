# Testing

## Filosofía

La **robustez** vive en la lógica pura (`src/lib`) y en la integridad de los datos (`src/data`). Ahí
ponemos el foco de los tests. La UI se mantiene fina y se valida sobre todo a mano (mobile, claro/
oscuro, offline).

## Herramientas

- **Vitest** (entorno `jsdom`, `globals: true`). Config en `vitest.config.ts`, setup en
  `vitest.setup.ts` (alias `@/`).

```bash
npm test          # corrida única
npm run test:watch
```

## Qué cubrimos hoy

- **`src/data/data.test.ts`**
  - `validateData()` sin problemas (datasets consistentes).
  - 104 partidos numerados 1..104.
  - Cada grupo: 6 partidos, 3 jornadas, cada equipo juega 3.
- **`src/lib/standings.test.ts`**
  - Orden por puntos / DG / GF.
  - Desempate **head-to-head** ante igualdad total.
  - Progreso y completitud de grupo.
- **`src/lib/bracket.test.ts`**
  - Con grupos incompletos no se resuelven los cruces ni hay campeón.
  - Con los 12 grupos completos: clasifican 8 terceros y los Dieciseisavos quedan definidos.
  - La asignación de terceros respeta los grupos permitidos (sin revancha de grupo).
  - Jugando toda la llave se obtiene un campeón (y 3.er puesto).
  - `allocateThirds` encuentra asignación válida para combinaciones de 8 de 12.

## Buenas prácticas al agregar tests

- Si tocás `src/data` o `src/lib`, **agregá o actualizá** tests.
- Construí escenarios con los `id` reales de partidos (ej. `G-A-1`) para los grupos.
- Para la llave, podés autogenerar resultados (ver helper `fullGroupResults` en el test) en vez de
  cargar 72 marcadores a mano.

## Manual / QA

Checklist antes de publicar:

- [ ] 360px de ancho: nada se corta ni desborda.
- [ ] Claro y oscuro.
- [ ] Fixture en hora AR correcta; `.ics` importa bien en Google Calendar.
- [ ] Simular todo define un campeón; reset borra el estado.
- [ ] Figuritas: marcar/repes/faltan + buscador.
- [ ] Offline: tras la primera visita, las pantallas visitadas cargan sin conexión.
- [ ] Lighthouse (PWA + mobile) en verde.

## Futuro

- Tests de componentes con Testing Library para vistas críticas.
- E2E con Playwright para los flujos principales (cargar grupo → ver llave → simular).

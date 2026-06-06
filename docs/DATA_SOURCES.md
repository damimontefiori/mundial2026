# Fuentes de datos y cómo actualizarlas

> ✅ **Equipos, grupos, calendario y figuritas son oficiales.** Provienen del sorteo final de la FIFA
> (Washington D.C., 5 de diciembre de 2025), del calendario oficial confirmado tras el sorteo y del
> checklist oficial del álbum Panini (ver `numeracion_oficial_mundial_2026_VERIFICADA.md`).

## Qué es oficial y qué es de ejemplo

| Dato                         | Estado en el repo             | Fuente                          |
| ---------------------------- | ----------------------------- | ------------------------------- |
| Formato (48 equipos, 12×4)   | ✅ Correcto                   | FIFA                            |
| 16 sedes (`venues.ts`)       | ✅ Reales                     | FIFA / sitios de las sedes      |
| 48 equipos (`teams.ts`)      | ✅ Oficial (sorteo 5/12/2025) | Clasificación oficial FIFA      |
| Grupos (`groups.ts`)         | ✅ Oficial (sorteo 5/12/2025) | Sorteo oficial                  |
| 104 partidos (`matches.ts`)  | ✅ Calendario oficial FIFA    | Calendario oficial FIFA         |
| Figuritas (`stickers.ts`)    | ✅ Oficial (set base 980)     | Checklist oficial Panini        |

## Proceso de actualización

1. **Equipos** → `src/data/teams.ts`. Mantené `id` = código FIFA. Confederaciones correctas
   (cupos 2026: UEFA 16, CAF 9, AFC 8, CONMEBOL 6, CONCACAF 6, OFC 1, repechaje 2).
2. **Grupos** → `src/data/groups.ts`. 12 grupos × 4. Cada equipo en un solo grupo.
3. **Partidos** → `src/data/matches.ts`. Para la fase de grupos, ajustá fechas/sedes. Para la
   estructura de la llave, mantené los cupos (`groupWinner`, `thirdFrom`, `winnerOf`, …) salvo que
   cambie el formato.
4. **Figuritas** → `src/data/stickers.ts`. Numeración oficial **por código** (no secuencial). Cada
   sección tiene `codes: string[]`; las de equipo van `XXX1`–`XXX20`. Fuente:
   `numeracion_oficial_mundial_2026_VERIFICADA.md`.
5. **Validá**:

   ```bash
   npm test
   ```

   `src/data/validate.ts` chequea: 48 equipos únicos, 16 sedes, 12 grupos de 4, 104 partidos
   numerados 1..104, referencias válidas (sedes/equipos/partidos) y figuritas (códigos únicos, 980
   del set base, 48 equipos × 20).

## Asignación de mejores terceros (Dieciseisavos)

La FIFA puede publicar una tabla que asigna cada uno de los 8 mejores terceros a una llave concreta.
En este repo, cada cupo de tercero (`thirdFrom`) admite cualquier grupo **salvo el del rival** (para
evitar revancha de grupo), y `allocateThirds` (en `src/lib/bracket.ts`) resuelve la asignación de
forma determinística. Es **data-driven**: si querés reproducir la tabla oficial, restringí los
`groups` permitidos de cada cupo en `matches.ts` y los tests seguirán validando la consistencia.

## Resultados reales (auto-completado)

Los **resultados de los partidos** (no el sorteo/calendario) se completan solos a medida que se
juegan, sin backend y sin exponer ninguna API key:

1. Un job programado (`.github/workflows/update-results.yml`) corre cada 30 min durante el torneo,
   llama a **football-data.org** (token gratis en `Secrets` del repo) y escribe `public/results.json`
   con los resultados indexados por nuestro id de partido (M1..M104).
2. El push dispara el redeploy automático en Vercel. El cliente solo hace `fetch('/results.json')`
   (mismo origen, sin key, cacheable por el service worker → sigue andando offline).
3. En la app, los partidos `FINISHED` **pisan y bloquean** la simulación del usuario; el resto se
   sigue simulando. El token **nunca** llega al navegador (el fetch ocurre en CI).

| Pieza | Archivo |
| --- | --- |
| Mapeo API → nuestro formato (puro, testeado) | `src/lib/ingestApiResults.ts` |
| Merge real + simulación (puro, testeado) | `src/lib/officialResults.ts` |
| Script de actualización (`npm run update:results`) | `scripts/fetch-results.ts` |
| Estado en el cliente | `src/store/results.ts` |
| Datos servidos | `public/results.json` |

**Mapeo de ids** (la API no expone el número oficial 1..104): los partidos de grupos se mapean por el
par de equipos (se enfrentan una sola vez); las eliminatorias se anclan por el lado sembrado (1.º/2.º
de grupo) y se propagan con los ganadores reales de cada ronda. Ver tests en
`src/lib/ingestApiResults.test.ts`.

> ⚠️ El script no se puede validar 100% hasta que haya partidos jugados (la API recién devuelve
> resultados durante el torneo). La lógica de mapeo sí está cubierta por tests con datos sintéticos.

## Horarios

Las horas se definen pensando en **hora de Argentina (UTC−3, sin horario de verano)** y se guardan
como UTC ISO. No cambies eso: la UI siempre muestra en hora AR vía `@/lib/dates`.

## Datos en vivo (futuro, opcional)

La v1 no consume APIs. Si en el futuro se quieren resultados en tiempo real, evaluar una fuente con
free tier y cachearla; mantener los datasets como fallback offline.

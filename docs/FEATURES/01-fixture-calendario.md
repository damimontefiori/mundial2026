# Feature 01 — Fixture / Calendario (Prioridad 3)

## Objetivo

Que el hincha sepa **cuándo juega cada equipo**, en **hora de Argentina**, y pueda agregarlo a su
calendario.

## Alcance

- Listado de los **104 partidos** agrupados por día (encabezado sticky por fecha).
- **Hora de Argentina** (UTC−3) en cada partido.
- **Filtros**: Todos, Finales, y por grupo (A–L).
- **Equipo favorito**: chip “Solo mi equipo” para ver únicamente sus partidos (grupos + cruces donde
  participa).
- **Detalle de partido** (bottom sheet): etapa, fecha larga, hora AR, estadio y botón “Agregar al
  calendario”.
- **Exportar `.ics`**: del conjunto filtrado (uno o muchos partidos).

## Dónde está

- UI: `src/features/fixture/` (`FixtureView`, `MatchCard`, `MatchDetailSheet`).
- Helpers: `src/features/shared/matchDisplay.ts` (resuelve cupos a equipos/labels).
- Fechas: `src/lib/dates.ts`. Calendario: `src/lib/ics.ts`.
- Datos: `src/data/matches.ts`, `src/data/venues.ts`.

## Comportamiento clave

- Los partidos de eliminatorias muestran el **equipo resuelto** si la simulación ya lo define; si no,
  el **cupo** (“1.º A”, “Mejor 3.º”, “Ganador P73”).
- El marcador simulado de un partido de grupos aparece como referencia (se edita en la Llave).
- Orden por fecha/hora real (`kickoffUTC`), agrupado por día AR.

## Estados

- Sin resultados: knockout con placeholders; sin marcadores.
- Con favorito elegido: se resalta con ⭐ y se habilita el filtro.
- Filtro sin resultados: `EmptyState`.

## Futuro

- Resultados en vivo (con cache/fallback).
- Recordatorios/notificaciones (requiere push).

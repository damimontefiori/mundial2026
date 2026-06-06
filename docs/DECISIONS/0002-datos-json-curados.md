# ADR 0002 — Datos curados en el repo (no API en vivo)

- **Estado**: Aceptada
- **Fecha**: 2026-06

## Contexto

La app necesita equipos, grupos, sedes, 104 partidos y el álbum de figuritas. El sorteo del Mundial
ya ocurrió, así que la mayoría de los datos son **estáticos**. Evaluamos consumir una API de fútbol.

## Decisión

Mantener los datos como **datasets curados en TypeScript** dentro de `src/data`, con validación de
integridad (`validate.ts` + Zod) y tests. Sin llamadas de red en la v1.

## Alternativas consideradas

- **API de fútbol en vivo**: aporta resultados en tiempo real, pero los free tiers tienen límites de
  requests, latencia y puntos de falla; además rompe el modo offline.
- **CMS/headless**: innecesario para datos que cambian poco y que el formato ya define.

## Consecuencias

- ➕ Gratis, **offline**, rápido y robusto; sin dependencias externas en runtime.
- ➕ Integridad garantizada por tests (104 partidos, 12×4 equipos, 980 figuritas con códigos únicos).
- ➖ Hay que **actualizar a mano** con la info oficial (proceso en `DATA_SOURCES.md`).
- ➖ No hay resultados en vivo en la v1 (queda como mejora futura con cache + fallback).

## Notas

Equipos, grupos y calendario son los **oficiales** del sorteo de la FIFA (5/12/2025) y la numeración
de figuritas es la del **checklist oficial Panini** (set base 980; ver `DATA_SOURCES.md` y
`numeracion_oficial_mundial_2026_VERIFICADA.md`).

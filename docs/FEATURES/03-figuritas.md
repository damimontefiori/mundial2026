# Feature 03 — Figuritas (Prioridad 2)

## Objetivo

Que el coleccionista marque las figuritas que **tiene** y vea de un vistazo cuáles le **faltan** y
cuántas **repetidas** tiene.

## Alcance

- **Grilla del álbum** por secciones (especiales, estadios, 48 equipos, leyendas).
- **Marcar obtenidas** (tap) y **gestionar repetidas** con los modos: Tengo / ＋Repe / −Repe.
- **Progreso**: tarjeta con “tenés X de TOTAL”, porcentaje, faltantes y repetidas; barra de progreso.
- **Buscador por número**: salta y resalta la figurita.
- **Filtro “Solo faltan”**: muestra únicamente lo que falta.
- **Acciones por sección**: “Todas” (marcar) / “Limpiar”.

## Dónde está

- UI: `src/features/stickers/StickersView.tsx`.
- Estado: `src/store/stickers.ts` (`owned: Record<number, cantidad>`).
- Datos: `src/data/stickers.ts` (`StickerAlbum` con secciones contiguas).

## Modelo

- `owned[n]` = cantidad de la figurita `n` (0 = falta, 1 = la tengo, >1 = repetidas).
- `total`, `have`, `missing` y `repes` se derivan recorriendo `1..total`.

## Estados

- Sección completa: mensaje “¡Sección completa! 🎉”.
- “Solo faltan” activo: las obtenidas se ocultan.

## Notas de datos

La numeración es **de ejemplo**. Para usar la oficial de Panini, ajustá `stickers.ts` (cantidad por
equipo y secciones), manteniendo cobertura `1..total` sin huecos (lo valida `validate.ts`).

## Futuro

- Listas de “repetidas para cambiar” y “las que busco” para facilitar intercambios.

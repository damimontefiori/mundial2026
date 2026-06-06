# Feature 03 — Figuritas (Prioridad 2)

## Objetivo

Que el coleccionista marque las figuritas que **tiene** y vea de un vistazo cuáles le **faltan** y
cuántas **repetidas** tiene.

## Alcance

- **Grilla del álbum** por secciones (apertura `00`/`FWC1-8`, 48 equipos, Museo FIFA, promo Coca-Cola).
- **Marcar obtenidas** (tap) y **gestionar repetidas** con los modos: Tengo / ＋Repe / −Repe.
- **Progreso**: tarjeta con “tenés X de 980”, porcentaje, faltantes y repetidas; barra de progreso.
- **Buscador por código**: salta y resalta la figurita (ej. `MEX1`, `FWC1`, `CC3`).
- **Filtro “Solo faltan”**: muestra únicamente lo que falta.
- **Acciones por sección**: “Todas” (marcar) / “Limpiar”.

## Dónde está

- UI: `src/features/stickers/StickersView.tsx`.
- Estado: `src/store/stickers.ts` (`owned: Record<código, cantidad>`).
- Datos: `src/data/stickers.ts` (`StickerAlbum` con secciones de **códigos**).

## Modelo

- Numeración oficial **por código** (no secuencial): `MEX1`, `FWC1`, `00`, `CC3`…
- `owned[code]` = cantidad de esa figurita (0 = falta, 1 = la tengo, >1 = repetidas).
- El progreso se calcula sobre el **set base (980)**; la promo Coca-Cola (`CC1-12`) es una sección
  aparte que no suma al total base.

## Estados

- Sección completa: mensaje “¡Sección completa! 🎉”.
- “Solo faltan” activo: las obtenidas se ocultan.

## Notas de datos

Numeración **oficial verificada** (ver `docs/numeracion_oficial_mundial_2026_VERIFICADA.md`): set base
980 = `00` + `FWC1-8` (9) + 48×20 selecciones (960) + `FWC9-19` Museo FIFA (11), más promo `CC1-12`.
`validate.ts` chequea códigos únicos, 980 base y 48 equipos × 20.

## Futuro

- Listas de “repetidas para cambiar” y “las que busco” para facilitar intercambios.

# UI / UX

## Principios

- **Mobile-first**: diseñado para una mano y pantallas chicas (referencia 360px). Contenedor central
  `max-w-app` (32rem) centrado; el contenido nunca se estira de más en tablet/desktop.
- **Navegación inferior** fija de 4 destinos, alcanzable con el pulgar.
- **Áreas táctiles ≥ 40px**, foco visible, contraste suficiente.
- **Rápido y offline**: estático, sin spinners de red; el estado es local e instantáneo.
- **Argentina-céntrico**: español, hora AR, equipo favorito destacado con ⭐.

## Navegación

| Tab          | Ruta          | Contenido                                |
| ------------ | ------------- | ---------------------------------------- |
| Partidos     | `/`           | Fixture con horarios AR.                  |
| Llave        | `/llave`      | Simulador de grupos + eliminatorias.      |
| Figus        | `/figuritas`  | Álbum de figuritas.                       |
| Más          | `/mas`        | Ajustes, favorito, tema, Prode (futuro).  |

## Sistema de diseño

- **Tokens de color** (CSS variables HSL) en `src/app/globals.css`, mapeados en `tailwind.config.ts`:
  `background`, `foreground`, `card`, `muted`, `border`, `primary` (celeste), `accent` (dorado),
  `success`, `warning`, `destructive`. Cada token tiene su variante en `.dark`.
- **Modo claro/oscuro/automático**: clase `.dark` en `<html>`. Se aplica antes de pintar (script
  inline) para evitar el “flash”.
- **Tipografía**: stack de sistema (sin descargas de fuentes → build offline y carga instantánea).
  Números con `tabular-nums` en marcadores y tablas.
- **Primitivos** en `src/components/ui.tsx`: `Button`, `IconButton`, `Card`, `SegmentedControl`,
  `Chip`, `ProgressBar`, `EmptyState`. Iconos SVG propios en `src/components/icons.tsx` (sin librería).
- **Bottom sheet** (`src/components/Sheet.tsx`) para acciones contextuales (detalle de partido,
  elegir equipo).

## Patrones por pantalla

- **Fixture**: chips de filtro con scroll horizontal; partidos agrupados por día con encabezado
  sticky; tarjeta de partido con hora, equipos (favorito resaltado), marcador simulado y sede.
- **Llave**: `SegmentedControl` Grupos/Llave. En Grupos, selector de grupo + tabla + steppers
  `−/＋` por equipo. En Llave, selector de ronda y tarjetas donde se toca al equipo que “Pasa”.
- **Figuritas**: tarjeta de progreso, buscador por número, modos Tengo/＋Repe/−Repe, filtro “Solo
  faltan”, grilla por secciones con acciones Todas/Limpiar.
- **Más**: lista de ajustes en `Card`s agrupadas.

## Accesibilidad

- Roles y `aria-*` en nav, tabs, diálogos, progressbar y celdas de figuritas.
- Foco visible (`focus-visible:ring`), cierre de sheets con `Escape`, etiquetas en botones de ícono.
- No se bloquea el zoom; respeta `prefers-color-scheme`.

## Layout (wireframe textual)

```
┌───────────────────────────┐
│ Header sticky (título)     │
├───────────────────────────┤
│ Filtros / controles        │
│ Contenido (scroll)         │
│   …tarjetas / grillas…     │
├───────────────────────────┤
│ [Partidos][Llave][Figus][+]│  ← bottom nav (safe-area)
└───────────────────────────┘
```

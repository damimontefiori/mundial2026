# PRD — Mundial 2026

Documento de requisitos de producto. Define el _qué_ y el _para quién_.

## Visión

Una app simple, rápida y linda para **vivir el Mundial 2026 desde el celular**: saber cuándo juega
cada equipo (en hora argentina), simular la llave de principio a fin y completar el álbum de
figuritas. Más adelante, competir en un **Prode con amigos**.

## Usuarios

- **El hincha** que quiere ver el fixture de su selección y no perderse los partidos.
- **El simulador** que disfruta armar la llave y predecir al campeón.
- **El coleccionista** de figuritas que necesita saber qué le falta.
- (Futuro) **El grupo de amigos** que arma un Prode.

## Objetivos y métricas de éxito

- Cargar el fixture y entender “cuándo juega mi equipo” en < 5 segundos.
- Simular un torneo completo sin fricción (incluyendo un “simular todo”).
- Saber cuántas figuritas faltan de un vistazo.
- PWA instalable, utilizable **offline**, Lighthouse PWA/mobile en verde.
- Costo de operación: **$0** (planes gratuitos).

## Alcance v1 (local-first, sin backend)

Prioridades (en orden, como las pidió el usuario):

1. **Llave / Bracket** con autocompletado y simulaciones.
2. **Figuritas**: grilla de obtenidas/faltantes.
3. **Fixture** con fechas y horarios de Argentina.
4. **Prode con amigos** → **fuera de la v1** (solo se diseña el modelo de datos).

Extras incluidos (sin recargar la experiencia): equipo favorito destacado, exportar a calendario
(`.ics`), tabla de grupos automática, modo oscuro, offline/instalable.

### Requisitos funcionales

- **RF-1 Fixture**: listar 104 partidos con día/hora AR; filtrar por grupo y por equipo favorito;
  ver detalle; exportar `.ics` (uno o varios).
- **RF-2 Grupos**: cargar resultados; calcular tabla con desempates oficiales; marcar completitud.
- **RF-3 Llave**: definir 1.º/2.º + 8 mejores terceros; asignar terceros a Dieciseisavos sin
  revancha de grupo; elegir ganadores hasta la final; mostrar campeón.
- **RF-4 Figuritas**: marcar obtenidas, contar repetidas, ver faltantes y progreso; buscar por
  número; acciones por sección (todas/limpiar).
- **RF-5 Preferencias**: equipo favorito, tema, instalación PWA, reinicio de datos.

### Requisitos no funcionales

- **Mobile-first** (360px de ancho como referencia), accesible (contraste, foco, ARIA, tap ≥ 40px).
- **Local-first**: estado en `localStorage`; sin cuentas ni red.
- **Performance**: estático (SSG), First Load JS acotado; interacción fluida.
- **Offline**: app utilizable sin conexión tras la primera visita.
- **Idioma**: español (Argentina). **Zona horaria**: America/Argentina/Buenos_Aires.

## Fuera de alcance (v1)

- Resultados en vivo / datos en tiempo real.
- Cuentas de usuario, multi-dispositivo, notificaciones push.
- Compartir la llave como imagen.

## Riesgos / supuestos

- **Datos oficiales**: equipos, grupos y calendario son del sorteo oficial de la FIFA (5/12/2025);
  ver `DATA_SOURCES.md` para fuentes y proceso de actualización.
- **Asignación de terceros**: se implementa una regla determinística sin revancha de grupo; si la
  FIFA publica una tabla específica, se ajusta el dataset (es data-driven).
- **Figuritas**: numeración **oficial** del álbum Panini (set base 980, códigos `MEX1`, `FWC1`, …).

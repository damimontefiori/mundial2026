# Changelog

Todas las novedades relevantes de este proyecto se documentan acá.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa
[Versionado Semántico](https://semver.org/lang/es/).

## [No publicado]

### Agregado

- **Fixture** con los 104 partidos, horarios de Argentina, filtros por grupo y por equipo favorito,
  detalle de partido y exportación a calendario (`.ics`).
- **Llave / Simulador**: carga de resultados de grupos, tablas con desempates de FIFA, ranking de
  mejores terceros, asignación automática a Dieciseisavos y progresión hasta el campeón. Botón
  “simular todo”.
- **Figuritas**: grilla del álbum con marcado de obtenidas/repetidas, progreso, buscador por número
  y acciones por sección.
- **Ajustes**: equipo favorito, tema claro/oscuro/automático, instalación PWA, reinicio de datos.
- **PWA**: manifest, service worker propio (offline + instalable) y página offline.
- Lógica pura testeada (`standings`, `bracket`) y validación de datos (`validate.ts`) con Vitest.
- Documentación completa del ciclo de vida en `docs/`.

### Pendiente

- Reemplazar los datasets ilustrativos por la información oficial de la FIFA
  (ver [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md)).
- **Prode con amigos** (Fase 6): diseñado, no implementado.

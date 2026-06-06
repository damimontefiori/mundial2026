# ADR 0005 — Firebase (Auth + Firestore) para login y sync

- **Estado**: Aceptada (implementada). **Supersede** a [0003](0003-supabase-prode.md).
- **Fecha**: 2026-06

## Contexto

Se quiere (1) login con Google y (2) persistir los datos del usuario (figuritas, simulación, equipo
favorito) en la nube para acceder desde cualquier dispositivo, gratis y con mínima complejidad. La
app es local-first (Zustand + localStorage), 100% client-side, PWA en Vercel.

El alcance actual NO es el Prode con ligas (eso queda para más adelante): solo auth + sincronizar el
estado propio del usuario.

## Decisión

Adoptar **Firebase Spark** (Auth con Google + Firestore), usado **client-only** (SDK modular, sin
middleware, sin rutas server, sin Cloud Functions). Un único documento por usuario:
`userState/{uid}` con `stickers`, `simulation`, `preferences`, `updatedAt` (ver
[../DATA_MODEL.md](../DATA_MODEL.md)). Sync: la nube gana en el primer enlace; last-write-wins por
`updatedAt` después. Login **opcional** (la app sigue funcionando sin sesión).

## Por qué Firebase y no Supabase (0003)

- **Supabase Free pausa el proyecto tras ~7 días de inactividad** y queda inaccesible hasta
  despausarlo a mano → inaceptable para una app estacional que debe quedar andando sola.
- **Firebase Spark no se pausa**; Auth con Google es gratis e ilimitada; Firestore (50k lecturas /
  20k escrituras por día) sobra para un doc por usuario.
- El SDK de Firebase está pensado para uso **client-only** con security rules → encaja con la
  arquitectura local-first sin agregar piezas de servidor.

## Consecuencias

- ➕ Gratis y sin mantenimiento (no se pausa). Login y sync con pocas piezas (1 dependencia, 1 colección).
- ➕ La seguridad es por security rules (`request.auth.uid == uid`); la config web es pública por diseño.
- ➖ Firestore es NoSQL: el **futuro Prode relacional** (ligas, miembros, rankings con joins) sería
  más natural en SQL. Si se construye, **reevaluar** (se puede modelar en Firestore o volver a
  Postgres para esa parte). El diseño relacional de [04-prode-futuro.md](../FEATURES/04-prode-futuro.md)
  queda como referencia, no como compromiso.

## Enlaces

- Implementación: `src/lib/firebase.ts`, `src/store/auth.ts`, `src/lib/cloudSync.ts`, `src/hooks/useCloudSync.ts`.
- Deploy y setup: [../DEPLOYMENT.md](../DEPLOYMENT.md).

# ADR 0003 — Supabase para el Prode (futuro)

- **Estado**: Propuesta (no implementada en la v1)
- **Fecha**: 2026-06

## Contexto

La Fase 6 (Prode con amigos) necesita cuentas, ligas privadas, predicciones por usuario, resultados
y una tabla de posiciones. Debe seguir entrando en planes gratuitos.

## Decisión

Adoptar **Supabase** (Postgres + Auth + Row Level Security) cuando se implemente el Prode. Diseñar el
modelo desde ahora para que el estado local de la v1 mapee a las tablas (mismas claves de
`match_id`).

## Alternativas consideradas

- **Firebase (Firestore)**: tiempo real fácil, pero el modelo del Prode es relacional (ligas,
  miembros, predicciones, puntajes) y encaja mejor en SQL; RLS de Supabase simplifica el acceso.
- **Backend propio**: más control, pero más costo/– mantenimiento; innecesario para este alcance.

## Consecuencias

- ➕ Relacional + Auth + RLS en free tier; SQL claro para puntajes y rankings.
- ➕ El estado local ya es compatible → migración sin reescribir la lógica de la llave.
- ➖ Límites del free tier (tamaño de base, **pausa por inactividad**): diseñar datos compactos y
  lecturas cacheables.
- ➖ Suma autenticación y reglas: se aborda recién en la Fase 6.

## Enlaces

- Diseño funcional: [../FEATURES/04-prode-futuro.md](../FEATURES/04-prode-futuro.md)
- Esquema: [../DATA_MODEL.md](../DATA_MODEL.md)

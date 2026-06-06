# Feature 04 — Prode con amigos (FUTURO)

> **No implementado en la v1.** Este documento es el diseño para que la v1 quede preparada.

## Objetivo

Competir con amigos pronosticando resultados de partidos y la llave, con ligas privadas y tabla de
posiciones.

## Experiencia (boceto)

- Crear una **liga** y compartir un **código de invitación**.
- Cada usuario carga sus **predicciones** (marcador por partido y/o su llave) **antes del cierre**.
- Al jugarse los partidos, se calculan **puntos** y se actualiza la **tabla de la liga**.

## Por qué Supabase

Postgres + Auth + Row Level Security en free tier. Encaja con el modelo relacional (ligas,
miembros, predicciones, resultados) y permite reglas de acceso por usuario/liga. Ver
[DECISIONS/0003-supabase-prode.md](../DECISIONS/0003-supabase-prode.md).

## Esquema propuesto

```sql
profiles(id pk, display_name, avatar_url)
leagues(id pk, name, owner_id fk, invite_code unique, scoring_rules jsonb, created_at)
league_members(league_id fk, user_id fk, role, primary key(league_id, user_id))
predictions(id pk, user_id fk, match_id, pred_home int, pred_away int, locked_at timestamptz)
bracket_predictions(id pk, user_id fk, league_id fk, picks_json jsonb)
results(match_id pk, actual_home int, actual_away int)
```

- `match_id` es el **mismo `id`** del dataset (`src/data/matches.ts`), así el estado local y el
  remoto comparten claves.
- `predictions` ↔ `simulation.groupResults`; `bracket_predictions.picks_json` ↔
  `simulation.knockoutPicks`.

## Reglas (RLS)

- Un usuario ve/edita **sus** predicciones hasta `locked_at` (cierre del partido).
- Los miembros de una liga ven las predicciones de los demás **después** del cierre y la tabla.
- Solo el `owner` administra la liga.

## Puntaje (ejemplo configurable)

- Resultado exacto: 3 pts · acierto de ganador/empate: 1 pt · bonus por fases de la llave.

## Sincronización con el estado local

La v1 ya guarda la simulación local con claves compatibles. Al implementar el Prode:

1. Login (Supabase Auth).
2. “Subir mi simulación” → inserta `predictions` / `bracket_predictions` desde el store.
3. Lectura cacheable de la tabla de la liga.

No hay que reescribir la lógica de la llave: `src/lib/bracket.ts` sigue calculando; el Prode agrega
puntaje y persistencia remota.

## Consideraciones del free tier

Datos compactos, lecturas cacheadas y tener en cuenta la pausa por inactividad de Supabase.

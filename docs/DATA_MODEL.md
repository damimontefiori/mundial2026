# Modelo de datos

## 1) Datasets curados (`src/data`)

Tipos en [`src/types`](../src/types/index.ts). Integridad validada en
[`src/data/validate.ts`](../src/data/validate.ts) (corre en los tests).

### Equipos — `teams.ts`

`{ id, name, fifaCode, confederation, flag, isPlaceholder? }` — 48 equipos. `id` = código FIFA.
Banderas en emoji (livianas y offline).

### Grupos — `groups.ts`

`{ id: 'A'..'L', teamIds: [4] }` — 12 grupos. El orden es la posición de bombo.

### Sedes — `venues.ts`

`{ id, city, country, stadium, timezone }` — 16 sedes reales (USA/CAN/MEX).

### Partidos — `matches.ts`

`{ id, number, stage, matchday?, group?, kickoffUTC, venueId, home, away, label? }` — **104**.
Los lados (`home`/`away`) son **cupos** (`MatchSlot`):

| `kind`           | Significado                                  |
| ---------------- | -------------------------------------------- |
| `team`           | Equipo concreto (fase de grupos).            |
| `groupWinner`    | 1.º de un grupo.                             |
| `groupRunnerUp`  | 2.º de un grupo.                             |
| `thirdFrom`      | Mejor 3.º proveniente de un set de grupos.   |
| `winnerOf`       | Ganador de otro partido.                     |
| `loserOf`        | Perdedor de otro partido (3.er puesto).      |

Las fechas se guardan en **UTC ISO**; se generan desde horarios de Argentina (ver el archivo) y se
muestran con `@/lib/dates`.

> La estructura de la llave (qué cupo alimenta a cuál) está codificada en estos cupos y la usa
> `src/lib/bracket.ts`. La asignación de mejores terceros admite cualquier grupo salvo el del rival.

### Figuritas — `stickers.ts`

`StickerAlbum { total, sections: StickerSection[] }`, con
`StickerSection { id, title, kind, codes: string[], teamId? }`. Numeración **oficial por código**
(no secuencial): `00`, `FWC1`, `MEX1`, `CC3`… `total` = set base (980); las secciones de equipo
llevan 20 códigos (`XXX1`–`XXX20`). Validado: códigos únicos, 980 base, 48×20.

## 2) Estado local (`src/store`, Zustand + persist)

Persistido en `localStorage`. Cada store tiene `version` para migraciones.

### `simulation` (`m26-simulation`)

```ts
{
  version: number;
  groupResults: Record<MatchId, { homeGoals: number; awayGoals: number }>;
  knockoutPicks: Record<MatchId, TeamId>; // ganador elegido por cruce
}
```

### `stickers` (`m26-stickers`)

```ts
{ version: number; owned: Record<StickerCode, number> } // "MEX1" → cantidad (0 = falta, >1 = repe)
```

### `preferences` (`m26-preferences`)

```ts
{ version: number; favoriteTeamId: string | null; theme: 'light' | 'dark' | 'system' }
```

## 3) Esquema futuro del Prode (Supabase) — diseño, no implementado

Pensado para mapear desde el estado local. Detalle en
[FEATURES/04-prode-futuro.md](FEATURES/04-prode-futuro.md).

```sql
profiles(id, display_name, avatar_url)
leagues(id, name, owner_id, invite_code, scoring_rules, created_at)
league_members(league_id, user_id, role)
predictions(id, user_id, match_id, pred_home, pred_away, locked_at)      -- ↔ groupResults
bracket_predictions(id, user_id, league_id, picks_json)                  -- ↔ knockoutPicks
results(match_id, actual_home, actual_away)
```

Reglas RLS: cada usuario ve/edita sus predicciones hasta el cierre (`locked_at`); los miembros de
una liga ven la tabla de posiciones. El `match_id` es el mismo `id` del dataset, así el modelo local
y el remoto comparten claves.

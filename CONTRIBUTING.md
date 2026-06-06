# Cómo contribuir

¡Gracias por sumarte! Esta guía resume el flujo de trabajo.

## Requisitos

- Node ≥ 20 y npm.
- Conocer las convenciones de [`.github/copilot-instructions.md`](.github/copilot-instructions.md).

## Flujo

1. Creá una rama desde `main`:
   - `feat/<tema>` para features, `fix/<tema>` para arreglos, `docs/<tema>` para documentación.
2. Hacé cambios chicos y enfocados.
3. Antes de abrir el PR, asegurate de que pase **todo**:

   ```bash
   npm run typecheck && npm run lint && npm test && npm run build
   ```

4. Abrí un Pull Request describiendo el _qué_ y el _por qué_.

## Estilo de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(bracket): permitir reordenar terceros por enfrentamiento directo
fix(fixture): corregir hora AR en partidos de medianoche
docs(data): actualizar grupos con el sorteo oficial
test(standings): cubrir empate triple en puntos
```

Tipos: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`.

## Reglas de código

- **Lógica de negocio en `src/lib`** (pura, con tests). Componentes solo presentación + estado de UI.
- TypeScript estricto; sin `any` salvo casos justificados.
- Estilos con clases de Tailwind y tokens de color; respetá claro/oscuro.
- Mobile-first: áreas táctiles ≥ 40px, probá a 360px de ancho.
- Si tocás `src/data` o `src/lib`, **agregá o actualizá tests**. `src/data/validate.ts` debe quedar
  sin problemas.

## Actualizar datos del torneo

Seguí [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md). Cambiá solo los archivos de `src/data` y corré
los tests (`npm test`) para validar la integridad (104 partidos, 12×4 equipos, figuritas contiguas).

## Documentación

- Actualizá los docs de `docs/` cuando cambie el comportamiento.
- No agregues archivos `.md` de “resumen de cambios”: la historia vive en Git y en `CHANGELOG.md`.

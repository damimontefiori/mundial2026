'use client';

import { useMemo } from 'react';
import { computeBracket } from '@/lib/bracket';
import { mergeOfficial } from '@/lib/officialResults';
import { adjustRatingsFromOfficial } from '@/lib/predict';
import { useSimulationStore } from '@/store/simulation';
import { useResultsStore } from '@/store/results';
import { PageHeader } from '@/components/PageHeader';
import { Button, IconButton } from '@/components/ui';
import { ForecastIcon, ResetIcon } from '@/components/icons';
import { KnockoutPanel } from './KnockoutPanel';

export function BracketView() {
  const userGroupResults = useSimulationStore((s) => s.groupResults);
  const userPicks = useSimulationStore((s) => s.knockoutPicks);
  const simulateRest = useSimulationStore((s) => s.simulateRest);
  const resetAll = useSimulationStore((s) => s.resetAll);
  const forecastApplied = useSimulationStore((s) => s.forecastApplied);
  const official = useResultsStore((s) => s.official);

  // Efectivo = simulación del usuario + resultados reales (estos pisan y bloquean).
  const { groupResults, picks, locked } = useMemo(
    () => mergeOfficial(userGroupResults, userPicks, official),
    [userGroupResults, userPicks, official],
  );
  const view = useMemo(() => computeBracket(groupResults, picks), [groupResults, picks]);

  // Ratings recalibrados con los resultados reales: alimentan los pronósticos en pantalla.
  const ratings = useMemo(() => adjustRatingsFromOfficial(official), [official]);

  const handleReset = () => {
    if (window.confirm('¿Querés borrar toda tu simulación (grupos y llave)?')) resetAll();
  };

  const handleForecast = () => {
    if (
      window.confirm(
        'Vas a completar los partidos que faltan con el PRONÓSTICO del modelo (el resultado más ' +
          'probable según el nivel de cada selección). Es una proyección, no resultados reales: ' +
          'vas a poder editarla o reiniciarla cuando quieras.',
      )
    ) {
      simulateRest(official);
    }
  };

  return (
    <>
      <PageHeader
        title="Llave"
        subtitle="Simulá tu Mundial"
        actions={
          <>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleForecast}
              title="Proyectar resultados con el modelo predictivo"
            >
              <ForecastIcon className="h-4 w-4" />
              Pronóstico
            </Button>
            <IconButton label="Reiniciar simulación" onClick={handleReset}>
              <ResetIcon className="h-5 w-5" />
            </IconButton>
          </>
        }
      />

      {forecastApplied ? (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-xs text-muted-foreground">
          <ForecastIcon className="h-4 w-4 shrink-0 text-accent" aria-hidden />
          <span className="flex-1">
            <span className="font-semibold text-accent">Pronóstico aplicado</span> — los partidos
            sin jugar muestran una proyección del modelo, no resultados reales. Editá lo que quieras
            o reiniciá con ↺.
          </span>
        </div>
      ) : null}

      <div className="mt-2">
        <KnockoutPanel view={view} locked={locked} official={official} ratings={ratings} />
      </div>
    </>
  );
}

import type { MessiRecordMetric, MessiRecordsDashboard } from '@/lib/messiRecords';
import { cn } from '@/lib/cn';
import { formatShortDate, formatTime } from '@/lib/dates';
import { Card, ProgressBar } from '@/components/ui';
import { StarIcon, TrophyIcon, UsersIcon } from '@/components/icons';

interface MessiRecordsPanelProps {
  dashboard: MessiRecordsDashboard;
  awardsUpdatedAt: string | null;
  resultsUpdatedAt: string | null;
}

export function MessiRecordsPanel({
  dashboard,
  awardsUpdatedAt,
  resultsUpdatedAt,
}: MessiRecordsPanelProps) {
  return (
    <div className="space-y-3">
      <Card className="overflow-hidden">
        <div className="border-b border-border/60 bg-primary/10 px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-card text-2xl shadow-sm">
              🇦🇷
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Récords de Messi
              </p>
              <h2 className="text-lg font-bold leading-tight">
                La carrera histórica de Leo en 2026
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Base histórica + datos vivos del torneo actual. Algunas métricas dependen de lo que
                expone la API.
              </p>
            </div>
          </div>
        </div>
        {awardsUpdatedAt || resultsUpdatedAt ? (
          <p className="border-t border-border/60 px-4 py-2 text-[0.7rem] text-muted-foreground">
            Goles/asistencias:{' '}
            {awardsUpdatedAt
              ? `${formatShortDate(awardsUpdatedAt)} · ${formatTime(awardsUpdatedAt)}`
              : 's/d'}
            <span className="mx-1">·</span>
            Resultados:{' '}
            {resultsUpdatedAt
              ? `${formatShortDate(resultsUpdatedAt)} · ${formatTime(resultsUpdatedAt)}`
              : 's/d'}
          </p>
        ) : null}
      </Card>

      <RecordGroup
        icon={<TrophyIcon className="h-4 w-4" />}
        title="Récords a romper"
        subtitle="Marcas donde todavía había una cima por alcanzar al iniciar 2026."
        records={dashboard.chasing}
      />

      <RecordGroup
        icon={<StarIcon className="h-4 w-4" />}
        title="Récords a extender"
        subtitle="Marcas propias que se agrandan con cada partido o gol en este Mundial."
        records={dashboard.extending}
      />
    </div>
  );
}

function RecordGroup({
  icon,
  title,
  subtitle,
  records,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  records: MessiRecordMetric[];
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <span className="text-primary">{icon}</span>
        <div className="min-w-0">
          <h2 className="font-bold">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-2">
        {records.map((record) => (
          <RecordCard key={record.id} record={record} />
        ))}
      </div>
    </section>
  );
}

function RecordCard({ record }: { record: MessiRecordMetric }) {
  const progressValue = record.current ?? record.baseline;
  const progress = progressValue / record.progressMax;

  return (
    <Card className="overflow-hidden">
      <div className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-primary">
            {record.category === 'chasing' ? (
              <TrophyIcon className="h-5 w-5" />
            ) : (
              <UsersIcon className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold leading-tight">{record.title}</h3>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-[0.68rem] font-semibold',
                  statusClass(record.status),
                )}
              >
                {record.statusLabel}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{record.detail}</p>
          </div>
        </div>

        <div className="rounded-xl bg-muted/50 p-3">
          <div className="mb-2 flex items-end justify-between gap-3">
            <div>
              <p className="text-[0.7rem] font-medium text-muted-foreground">Estado actual</p>
              <p className="text-2xl font-black tabular-nums">
                {record.current ?? `${record.baseline}+`}{' '}
                <span className="text-sm font-semibold text-muted-foreground">{record.unit}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[0.7rem] font-medium text-muted-foreground">Marca</p>
              <p className="text-sm font-bold">{record.record}</p>
            </div>
          </div>
          <ProgressBar value={progress} />
          <div className="mt-2 flex items-center justify-between text-[0.7rem] text-muted-foreground">
            <span>Base {record.baseline}</span>
            <span>{record.live === null ? 'Dato vivo s/d' : `+${record.live} vivo`}</span>
          </div>
        </div>

        {record.note ? <p className="text-[0.7rem] text-muted-foreground">{record.note}</p> : null}
      </div>
    </Card>
  );
}

function statusClass(status: MessiRecordMetric['status']): string {
  switch (status) {
    case 'broken':
      return 'bg-success/15 text-success';
    case 'tied':
      return 'bg-primary/15 text-primary';
    case 'extended':
      return 'bg-accent/20 text-accent-foreground';
    case 'unavailable':
      return 'bg-warning/15 text-warning';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

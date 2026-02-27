import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Clock, Plus, Trash2, CheckCircle2,
  XCircle, Loader2, CalendarClock, Play
} from 'lucide-react';
import { useScheduledImports, type ScheduledImport } from '@/hooks/useScheduledImports';
import { formatDistanceToNow, format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { cn } from '@/lib/utils';
import { ScheduleFormDialog, type ScheduleFormData } from './ScheduleFormDialog';

const FREQUENCY_OPTIONS = [
  { value: 'hourly', label: 'Toutes les heures' },
  { value: 'daily', label: 'Quotidien' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuel' },
] as const;

export function ImportScheduler() {
  const {
    schedules, isLoading, createSchedule, isCreating,
    toggleActive, deleteSchedule, executeNow, isExecuting,
  } = useScheduledImports();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreate = (data: ScheduleFormData) => {
    createSchedule({
      name: data.name,
      source_type: data.source_type as ScheduledImport['source_type'],
      source_url: data.source_url,
      frequency: data.frequency as ScheduledImport['frequency'],
      description: data.description,
      is_active: data.active,
    });
    setDialogOpen(false);
  };

  const activeCount = schedules.filter(s => s.is_active).length;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CalendarClock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Imports planifiés</CardTitle>
              <CardDescription>
                {activeCount > 0
                  ? `${activeCount} import${activeCount > 1 ? 's' : ''} actif${activeCount > 1 ? 's' : ''}`
                  : 'Aucun import planifié'}
              </CardDescription>
            </div>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Planifier
          </Button>
          <ScheduleFormDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onSubmit={handleCreate}
            mode="create"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarClock className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Aucun import planifié</p>
            <p className="text-xs mt-1">Cliquez sur "Planifier" pour créer un import récurrent</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map(schedule => (
              <ScheduleRow
                key={schedule.id}
                schedule={schedule}
                onToggle={() => toggleActive(schedule.id)}
                onDelete={() => deleteSchedule(schedule.id)}
                onExecute={() => executeNow(schedule.id)}
                isExecuting={isExecuting}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScheduleRow({
  schedule, onToggle, onDelete, onExecute, isExecuting,
}: {
  schedule: ScheduledImport;
  onToggle: () => void;
  onDelete: () => void;
  onExecute: () => void;
  isExecuting: boolean;
}) {
  const freqLabel = FREQUENCY_OPTIONS.find(f => f.value === schedule.frequency)?.label || schedule.frequency;
  const isActive = schedule.is_active;

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg border transition-colors',
      isActive ? 'border-border' : 'border-border/50 opacity-60'
    )}>
      <Switch checked={isActive} onCheckedChange={onToggle} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{schedule.name}</span>
          <Badge variant="outline" className="text-[10px] h-4 shrink-0">{schedule.source_type}</Badge>
        </div>
        <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {freqLabel}</span>
          {schedule.next_run_at && isActive && (
            <span>Prochain : {formatDistanceToNow(new Date(schedule.next_run_at), { addSuffix: true, locale: getDateFnsLocale() })}</span>
          )}
          {schedule.last_run_at && (
            <span className="flex items-center gap-1">
              {schedule.last_run_status === 'completed' ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              ) : schedule.last_run_status === 'failed' ? (
                <XCircle className="h-3 w-3 text-destructive" />
              ) : null}
              {format(new Date(schedule.last_run_at), 'dd/MM HH:mm')}
            </span>
          )}
          {schedule.products_imported > 0 && <span>{schedule.products_imported} produits</span>}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onExecute} disabled={isExecuting}>
          {isExecuting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

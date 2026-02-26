import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
  Clock, Plus, Trash2, CheckCircle2,
  XCircle, Loader2, CalendarClock, Link2, FileSpreadsheet, Play
} from 'lucide-react';
import { useScheduledImports, type ScheduledImport } from '@/hooks/useScheduledImports';
import { formatDistanceToNow, format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { cn } from '@/lib/utils';

const FREQUENCY_OPTIONS = [
  { value: 'hourly', label: 'Toutes les heures' },
  { value: 'daily', label: 'Quotidien' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuel' },
] as const;

const SOURCE_TYPE_OPTIONS = [
  { value: 'url', label: 'URL produit', icon: Link2 },
  { value: 'feed', label: 'Feed CSV/XML', icon: FileSpreadsheet },
  { value: 'csv', label: 'CSV', icon: FileSpreadsheet },
  { value: 'api', label: 'API', icon: Link2 },
] as const;

export function ImportScheduler() {
  const {
    schedules, isLoading, createSchedule, isCreating,
    toggleActive, deleteSchedule, executeNow, isExecuting,
  } = useScheduledImports();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    source_type: 'url' as 'url' | 'csv' | 'xml' | 'api' | 'feed',
    source_url: '',
    frequency: 'daily' as 'hourly' | 'daily' | 'weekly' | 'monthly',
    description: '',
  });

  const handleCreate = () => {
    if (!form.name || !form.source_url) return;
    createSchedule({
      name: form.name,
      source_type: form.source_type,
      source_url: form.source_url,
      frequency: form.frequency,
      description: form.description,
      is_active: true,
    });
    setDialogOpen(false);
    setForm({ name: '', source_type: 'url', source_url: '', frequency: 'daily', description: '' });
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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Planifier</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Nouvel import planifié</DialogTitle>
                <DialogDescription>Configurez un import récurrent automatique</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input placeholder="Ex: Sync catalogue AliExpress" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type de source</Label>
                    <Select value={form.source_type} onValueChange={(v: any) => setForm(f => ({ ...f, source_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SOURCE_TYPE_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fréquence</Label>
                    <Select value={form.frequency} onValueChange={(v: any) => setForm(f => ({ ...f, frequency: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FREQUENCY_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>URL source</Label>
                  <Input placeholder="https://example.com/products.csv" value={form.source_url} onChange={e => setForm(f => ({ ...f, source_url: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Description (optionnel)</Label>
                  <Input placeholder="Mise à jour quotidienne du catalogue" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                <Button onClick={handleCreate} disabled={isCreating || !form.name || !form.source_url}>
                  {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Créer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                <CheckCircle2 className="h-3 w-3 text-green-500" />
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

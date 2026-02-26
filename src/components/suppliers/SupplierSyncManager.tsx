import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useSupplierAPI } from '@/hooks/useSupplierAPI';
import { useSupplierRealtime } from '@/hooks/useSupplierRealtime';
import { 
  RefreshCw, 
  Play, 
  Pause, 
  Clock, 
  Calendar,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Settings,
  Zap,
  Package,
  TrendingUp,
  X
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

interface SupplierSyncManagerProps {
  supplierId: string;
  supplierName: string;
}

const SYNC_SCHEDULES = [
  { value: '0 */1 * * *', label: 'Toutes les heures' },
  { value: '0 */3 * * *', label: 'Toutes les 3 heures' },
  { value: '0 */6 * * *', label: 'Toutes les 6 heures' },
  { value: '0 */12 * * *', label: 'Toutes les 12 heures' },
  { value: '0 0 * * *', label: 'Une fois par jour (minuit)' },
  { value: '0 8 * * *', label: 'Une fois par jour (8h)' },
  { value: '0 0 * * 0', label: 'Une fois par semaine' },
];

const SYNC_TYPES = [
  { value: 'full', label: 'Synchronisation complète', icon: RefreshCw, description: 'Tous les produits, prix et stocks' },
  { value: 'incremental', label: 'Incrémentale', icon: TrendingUp, description: 'Uniquement les changements récents' },
  { value: 'stock_only', label: 'Stocks uniquement', icon: Package, description: 'Mise à jour des quantités' },
  { value: 'price_only', label: 'Prix uniquement', icon: Zap, description: 'Mise à jour des prix' },
];

export function SupplierSyncManager({ supplierId, supplierName }: SupplierSyncManagerProps) {
  const [selectedSyncType, setSelectedSyncType] = useState<string>('full');
  const [selectedSchedule, setSelectedSchedule] = useState<string>('0 */6 * * *');
  const [isScheduleEnabled, setIsScheduleEnabled] = useState(false);

  const { 
    startSync, 
    cancelSync, 
    upsertSchedule,
    useSyncJobs, 
    useSyncSchedules,
    isStartingSync 
  } = useSupplierAPI();
  
  const { activeJobs } = useSupplierRealtime();
  const { data: syncJobs = [] } = useSyncJobs(supplierId);
  const { data: schedules = [] } = useSyncSchedules();

  const currentSchedule = schedules.find(s => s.supplier_id === supplierId);
  const activeSyncJob = activeJobs.find(j => j.supplier_id === supplierId);
  const recentJobs = syncJobs.slice(0, 5);

  const handleStartSync = () => {
    startSync({
      supplierId,
      supplierName,
      syncType: selectedSyncType as any,
    });
  };

  const handleCancelSync = () => {
    if (activeSyncJob) {
      cancelSync(activeSyncJob.id);
    }
  };

  const handleSaveSchedule = () => {
    upsertSchedule({
      supplierId,
      supplierName,
      schedule: selectedSchedule,
      syncType: selectedSyncType,
      isActive: isScheduleEnabled,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Terminé</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800"><Loader2 className="h-3 w-3 mr-1 animate-spin" />En cours</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Échoué</Badge>;
      case 'cancelled':
        return <Badge variant="outline"><X className="h-3 w-3 mr-1" />Annulé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Synchronisation manuelle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Synchronisation Manuelle
          </CardTitle>
          <CardDescription>
            Lancez une synchronisation immédiate des produits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Type de sync */}
          <div className="grid grid-cols-2 gap-3">
            {SYNC_TYPES.map((type) => (
              <div
                key={type.value}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedSyncType === type.value 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedSyncType(type.value)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <type.icon className={`h-4 w-4 ${selectedSyncType === type.value ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="font-medium text-sm">{type.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{type.description}</p>
              </div>
            ))}
          </div>

          {/* Sync active */}
          {activeSyncJob && (
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Synchronisation en cours</span>
                {getStatusBadge(activeSyncJob.status)}
              </div>
              <Progress 
                value={activeSyncJob.total_items ? (activeSyncJob.processed_items / activeSyncJob.total_items) * 100 : 0} 
                className="h-2"
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {activeSyncJob.processed_items || 0} / {activeSyncJob.total_items || '?'} éléments
                </span>
                <Button variant="ghost" size="sm" onClick={handleCancelSync}>
                  <X className="h-4 w-4 mr-1" />
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {/* Bouton de sync */}
          <Button 
            className="w-full" 
            onClick={handleStartSync}
            disabled={isStartingSync || !!activeSyncJob}
          >
            {isStartingSync ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Démarrage...
              </>
            ) : activeSyncJob ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Synchronisation en cours...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Lancer la synchronisation
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Planification automatique */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Synchronisation Automatique
          </CardTitle>
          <CardDescription>
            Planifiez des synchronisations régulières
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="schedule-toggle" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Activer la planification
            </Label>
            <Switch
              id="schedule-toggle"
              checked={isScheduleEnabled}
              onCheckedChange={setIsScheduleEnabled}
            />
          </div>

          {isScheduleEnabled && (
            <>
              <Separator />
              
              <div className="space-y-3">
                <Label>Fréquence</Label>
                <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SYNC_SCHEDULES.map((schedule) => (
                      <SelectItem key={schedule.value} value={schedule.value}>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {schedule.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Type de synchronisation</Label>
                <Select value={selectedSyncType} onValueChange={setSelectedSyncType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SYNC_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSaveSchedule} className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                Sauvegarder le planning
              </Button>

              {currentSchedule && (
                <div className="p-3 rounded-lg bg-muted/50 text-sm">
                  <p className="text-muted-foreground">
                    Planning actuel: {SYNC_SCHEDULES.find(s => s.value === currentSchedule.cron_expression)?.label || currentSchedule.cron_expression}
                  </p>
                  {currentSchedule.last_run_at && (
                    <p className="text-muted-foreground">
                      Dernière exécution: {formatDistanceToNow(new Date(currentSchedule.last_run_at), { addSuffix: true, locale: getDateFnsLocale() })}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Historique des synchronisations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique</CardTitle>
          <CardDescription>Dernières synchronisations</CardDescription>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune synchronisation récente
            </p>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job: any) => (
                <div key={job.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(job.status)}
                      <span className="text-sm font-medium capitalize">{job.job_type}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {job.products_processed || 0} produits traités
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      {format(new Date(job.created_at), 'dd MMM HH:mm', { locale: getDateFnsLocale() })}
                    </p>
                    {job.completed_at && (
                      <p className="text-xs text-muted-foreground">
                        Durée: {Math.round((new Date(job.completed_at).getTime() - new Date(job.started_at || job.created_at).getTime()) / 1000)}s
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

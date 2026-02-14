/**
 * AutomationScheduler - Cron/schedule management for workflows
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Clock, Calendar, Plus, Trash2, Play, Pause,
  RefreshCw, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Schedule {
  id: string;
  workflowName: string;
  frequency: 'every_5min' | 'every_15min' | 'every_30min' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'cron';
  cronExpression?: string;
  timeOfDay?: string;
  dayOfWeek?: string;
  isActive: boolean;
  lastRun?: string;
  nextRun?: string;
  successCount: number;
  failureCount: number;
}

const FREQ_LABELS: Record<string, string> = {
  every_5min: 'Toutes les 5 min',
  every_15min: 'Toutes les 15 min',
  every_30min: 'Toutes les 30 min',
  hourly: 'Toutes les heures',
  daily: 'Quotidien',
  weekly: 'Hebdomadaire',
  monthly: 'Mensuel',
  cron: 'Expression Cron',
};

const DEFAULT_SCHEDULES: Schedule[] = [
  {
    id: '1', workflowName: 'Sync Stock Fournisseur', frequency: 'hourly',
    isActive: true, lastRun: new Date(Date.now() - 1800000).toISOString(),
    nextRun: new Date(Date.now() + 1800000).toISOString(),
    successCount: 720, failureCount: 3,
  },
  {
    id: '2', workflowName: 'Repricing Concurrentiel', frequency: 'every_30min',
    isActive: true, lastRun: new Date(Date.now() - 600000).toISOString(),
    nextRun: new Date(Date.now() + 1200000).toISOString(),
    successCount: 1440, failureCount: 12,
  },
  {
    id: '3', workflowName: 'Rapport Performance', frequency: 'daily', timeOfDay: '09:00',
    isActive: true, lastRun: new Date(Date.now() - 43200000).toISOString(),
    nextRun: new Date(Date.now() + 43200000).toISOString(),
    successCount: 30, failureCount: 0,
  },
  {
    id: '4', workflowName: 'Nettoyage Paniers Abandonnés', frequency: 'daily', timeOfDay: '02:00',
    isActive: false, lastRun: new Date(Date.now() - 172800000).toISOString(),
    successCount: 14, failureCount: 1,
  },
  {
    id: '5', workflowName: 'Analyse Tendances', frequency: 'weekly', dayOfWeek: 'monday', timeOfDay: '08:00',
    isActive: true, lastRun: new Date(Date.now() - 500000000).toISOString(),
    nextRun: new Date(Date.now() + 200000000).toISOString(),
    successCount: 4, failureCount: 0,
  },
];

export function AutomationScheduler() {
  const [schedules, setSchedules] = useState<Schedule[]>(DEFAULT_SCHEDULES);

  const toggleSchedule = (id: string) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
    const schedule = schedules.find(s => s.id === id);
    toast.success(schedule?.isActive ? 'Planning désactivé' : 'Planning activé');
  };

  const deleteSchedule = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
    toast.info('Planning supprimé');
  };

  const runNow = (id: string) => {
    const schedule = schedules.find(s => s.id === id);
    toast.success(`Exécution manuelle lancée: ${schedule?.workflowName}`);
    setSchedules(prev => prev.map(s => s.id === id ? {
      ...s,
      lastRun: new Date().toISOString(),
      successCount: s.successCount + 1
    } : s));
  };

  const formatNextRun = (nextRun?: string) => {
    if (!nextRun) return '—';
    const d = new Date(nextRun);
    const now = Date.now();
    const diff = d.getTime() - now;
    if (diff < 0) return 'En retard';
    if (diff < 60000) return `${Math.round(diff / 1000)}s`;
    if (diff < 3600000) return `${Math.round(diff / 60000)}min`;
    if (diff < 86400000) return `${Math.round(diff / 3600000)}h`;
    return `${Math.round(diff / 86400000)}j`;
  };

  const activeCount = schedules.filter(s => s.isActive).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Planification
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {activeCount}/{schedules.length} actifs
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <AnimatePresence>
          {schedules.map((schedule) => {
            const successRate = schedule.successCount + schedule.failureCount > 0
              ? Math.round((schedule.successCount / (schedule.successCount + schedule.failureCount)) * 100)
              : 100;

            return (
              <motion.div
                key={schedule.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "border rounded-lg p-4 transition-all",
                  !schedule.isActive && "opacity-60"
                )}
              >
                <div className="flex items-center gap-3">
                  <Switch
                    checked={schedule.isActive}
                    onCheckedChange={() => toggleSchedule(schedule.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{schedule.workflowName}</span>
                      <Badge variant="outline" className="text-[10px]">
                        <Clock className="h-2.5 w-2.5 mr-0.5" />
                        {FREQ_LABELS[schedule.frequency]}
                      </Badge>
                      {schedule.timeOfDay && (
                        <Badge variant="secondary" className="text-[10px]">
                          {schedule.timeOfDay}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      {schedule.isActive && schedule.nextRun && (
                        <span className="flex items-center gap-1">
                          <RefreshCw className="h-3 w-3" />
                          Prochain: {formatNextRun(schedule.nextRun)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        {schedule.successCount}
                      </span>
                      {schedule.failureCount > 0 && (
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                          {schedule.failureCount}
                        </span>
                      )}
                      <span>Fiabilité: {successRate}%</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => runNow(schedule.id)}
                      disabled={!schedule.isActive}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-500"
                      onClick={() => deleteSchedule(schedule.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

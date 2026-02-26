import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar, Clock, Plus, Play, Trash2, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

interface Schedule {
  id: string;
  rule_id: string;
  rule_name: string;
  frequency: string;
  time_of_day: string;
  day_of_week?: number;
  is_active: boolean;
  next_run_at: string;
}

export function RepricingSchedulePanel() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    rule_id: '',
    frequency: 'daily',
    time_of_day: '09:00',
    day_of_week: 1,
    is_active: true
  });

  const { data: rules = [] } = useQuery({
    queryKey: ['repricing-rules-list'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from('pricing_rules')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('is_active', true);
      return data || [];
    }
  });

  const handleCreate = () => {
    if (!formData.rule_id) return;
    const rule = rules.find(r => r.id === formData.rule_id);
    const newSchedule: Schedule = {
      id: `sched_${Date.now()}`,
      rule_id: formData.rule_id,
      rule_name: rule?.name || 'Règle',
      frequency: formData.frequency,
      time_of_day: formData.time_of_day,
      day_of_week: formData.day_of_week,
      is_active: formData.is_active,
      next_run_at: new Date(Date.now() + 86400000).toISOString()
    };
    setSchedules([...schedules, newSchedule]);
    setShowCreateDialog(false);
    toast.success('Planification créée');
  };

  const toggleSchedule = (id: string) => {
    setSchedules(schedules.map(s => 
      s.id === id ? { ...s, is_active: !s.is_active } : s
    ));
  };

  const deleteSchedule = (id: string) => {
    setSchedules(schedules.filter(s => s.id !== id));
    toast.success('Planification supprimée');
  };

  const getFrequencyLabel = (freq: string) => {
    const labels: Record<string, string> = {
      hourly: 'Toutes les heures',
      daily: 'Quotidien',
      weekly: 'Hebdomadaire',
    };
    return labels[freq] || freq;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Planification</h3>
          <p className="text-sm text-muted-foreground">Automatisez vos règles</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle
        </Button>
      </div>

      {schedules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune planification</h3>
            <p className="text-muted-foreground">Planifiez l'exécution automatique</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule) => (
            <Card key={schedule.id} className={!schedule.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={schedule.is_active}
                      onCheckedChange={() => toggleSchedule(schedule.id)}
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{schedule.rule_name}</span>
                        <Badge variant="outline">{getFrequencyLabel(schedule.frequency)}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {schedule.time_of_day}
                        </span>
                        <span>
                          Prochaine: {format(new Date(schedule.next_run_at), 'dd/MM HH:mm', { locale: getDateFnsLocale() })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSchedule(schedule.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle planification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Règle</Label>
              <Select value={formData.rule_id} onValueChange={(v) => setFormData({ ...formData, rule_id: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {rules.map((rule: any) => (
                    <SelectItem key={rule.id} value={rule.id}>{rule.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fréquence</Label>
              <Select value={formData.frequency} onValueChange={(v) => setFormData({ ...formData, frequency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Quotidien</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Heure</Label>
              <Input type="time" value={formData.time_of_day} onChange={(e) => setFormData({ ...formData, time_of_day: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={!formData.rule_id}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

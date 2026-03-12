/**
 * CRMActivityTimeline — Chronologie interactive des interactions client
 * Affiche appels, emails, réunions, notes avec filtrage et création
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCRMActivities, type CRMActivity } from '@/hooks/useCRMActivities';
import { formatDistanceToNow } from 'date-fns';
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, Mail, Calendar, MessageSquare, CheckSquare, Send,
  Plus, Filter, Clock, CheckCircle2, XCircle, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const activityConfig = {
  call: { icon: Phone, label: 'Appel', color: 'text-blue-600', bg: 'bg-blue-100' },
  email: { icon: Mail, label: 'Email', color: 'text-green-600', bg: 'bg-green-100' },
  meeting: { icon: Calendar, label: 'Réunion', color: 'text-purple-600', bg: 'bg-purple-100' },
  note: { icon: MessageSquare, label: 'Note', color: 'text-amber-600', bg: 'bg-amber-100' },
  task: { icon: CheckSquare, label: 'Tâche', color: 'text-orange-600', bg: 'bg-orange-100' },
  sms: { icon: Send, label: 'SMS', color: 'text-pink-600', bg: 'bg-pink-100' },
};

const statusConfig = {
  scheduled: { label: 'Planifié', icon: Clock, color: 'text-blue-600' },
  completed: { label: 'Terminé', icon: CheckCircle2, color: 'text-green-600' },
  cancelled: { label: 'Annulé', icon: XCircle, color: 'text-red-600' },
};

interface Props {
  leadId?: string;
}

export function CRMActivityTimeline({ leadId }: Props) {
  const { activities, isLoading, createActivity, updateActivity, isCreating } = useCRMActivities(leadId);
  const locale = useDateFnsLocale();
  const [filter, setFilter] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({
    activity_type: 'note' as CRMActivity['activity_type'],
    subject: '',
    description: '',
    status: 'completed' as CRMActivity['status'],
  });

  const filtered = filter === 'all'
    ? activities
    : activities.filter(a => a.activity_type === filter);

  const handleCreate = () => {
    if (!newActivity.subject) return;
    createActivity({ ...newActivity, lead_id: leadId });
    setNewActivity({ activity_type: 'note', subject: '', description: '', status: 'completed' });
    setIsAddOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {Object.entries(activityConfig).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="secondary">{filtered.length} activité(s)</Badge>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle activité</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={newActivity.activity_type}
                    onValueChange={v => setNewActivity(p => ({ ...p, activity_type: v as any }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(activityConfig).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Statut</Label>
                  <Select
                    value={newActivity.status}
                    onValueChange={v => setNewActivity(p => ({ ...p, status: v as any }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Sujet *</Label>
                <Input
                  value={newActivity.subject}
                  onChange={e => setNewActivity(p => ({ ...p, subject: e.target.value }))}
                  placeholder="Ex: Appel de suivi client"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newActivity.description}
                  onChange={e => setNewActivity(p => ({ ...p, description: e.target.value }))}
                  placeholder="Détails de l'activité..."
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsAddOpen(false)} className="flex-1">
                  Annuler
                </Button>
                <Button onClick={handleCreate} disabled={isCreating} className="flex-1">
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Créer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

        <AnimatePresence mode="popLayout">
          {filtered.map((activity, i) => {
            const cfg = activityConfig[activity.activity_type] || activityConfig.note;
            const stCfg = statusConfig[activity.status] || statusConfig.completed;
            const Icon = cfg.icon;
            const StatusIcon = stCfg.icon;

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.05 }}
                className="relative pl-14 pb-6 group"
              >
                {/* Icon */}
                <div className={cn(
                  "absolute left-3 w-7 h-7 rounded-full flex items-center justify-center ring-4 ring-background",
                  cfg.bg
                )}>
                  <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
                </div>

                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">{cfg.label}</Badge>
                          <div className={cn("flex items-center gap-1 text-xs", stCfg.color)}>
                            <StatusIcon className="h-3 w-3" />
                            {stCfg.label}
                          </div>
                        </div>
                        <h4 className="font-medium text-sm">{activity.subject}</h4>
                        {activity.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {activity.description}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale })}
                      </span>
                    </div>

                    {/* Complete action for scheduled */}
                    {activity.status === 'scheduled' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 text-xs gap-1"
                        onClick={() => updateActivity({
                          id: activity.id,
                          status: 'completed',
                          completed_at: new Date().toISOString(),
                        })}
                      >
                        <CheckCircle2 className="h-3 w-3" /> Marquer terminé
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground pl-14">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucune activité enregistrée</p>
            <p className="text-xs">Cliquez sur "Ajouter" pour enregistrer votre première interaction</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Sprint 17: Smart Alerts Engine
 * Threshold-based triggers with priority scoring and notification center
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bell, AlertTriangle, TrendingDown, Package, DollarSign, 
  Plus, Check, X, Clock, Zap, ShieldAlert 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ALERT_TYPES = [
  { id: 'stock_low', label: 'Stock bas', icon: Package, color: 'text-orange-500', description: 'Alerte quand le stock passe sous un seuil' },
  { id: 'revenue_drop', label: 'Baisse revenus', icon: TrendingDown, color: 'text-red-500', description: 'Alerte si les revenus chutent de X%' },
  { id: 'margin_alert', label: 'Marge faible', icon: DollarSign, color: 'text-amber-500', description: 'Alerte quand la marge passe sous un seuil' },
  { id: 'order_spike', label: 'Pic de commandes', icon: Zap, color: 'text-emerald-500', description: 'Alerte lors d\'un volume inhabituel' },
  { id: 'security_event', label: 'Événement sécurité', icon: ShieldAlert, color: 'text-red-600', description: 'Activité suspecte détectée' },
];

export function SmartAlertsEngine() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAlert, setNewAlert] = useState({ alert_type: 'stock_low', threshold_value: 10, threshold_percent: 0, is_enabled: true });

  // Fetch alert configurations
  const { data: alertConfigs } = useQuery({
    queryKey: ['alert-configurations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('alert_configurations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch active alerts
  const { data: activeAlerts } = useQuery({
    queryKey: ['active-alerts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('active_alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Create alert config
  const createAlert = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('alert_configurations').insert({
        user_id: user.id,
        alert_type: newAlert.alert_type,
        threshold_value: newAlert.threshold_value,
        threshold_percent: newAlert.threshold_percent,
        is_enabled: newAlert.is_enabled,
        channels: ['in_app'],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-configurations'] });
      setShowCreateDialog(false);
      toast({ title: 'Alerte créée', description: 'La règle d\'alerte a été configurée.' });
    },
  });

  // Toggle alert
  const toggleAlert = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from('alert_configurations').update({ is_enabled: enabled }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alert-configurations'] }),
  });

  // Acknowledge alert
  const acknowledgeAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase.from('active_alerts').update({ 
        acknowledged: true, 
        acknowledged_at: new Date().toISOString(),
        status: 'acknowledged' 
      }).eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['active-alerts'] }),
  });

  const getSeverityColor = (severity: string | null) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default: return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    }
  };

  return (
    <div className="space-y-4">
      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Alertes Actives
              {(activeAlerts?.length || 0) > 0 && (
                <Badge variant="destructive" className="text-xs">{activeAlerts?.length}</Badge>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {!activeAlerts?.length ? (
            <div className="text-center py-6 text-muted-foreground">
              <Check className="h-10 w-10 mx-auto mb-2 text-emerald-500 opacity-50" />
              <p className="font-medium">Aucune alerte active</p>
              <p className="text-sm">Tout fonctionne normalement</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {activeAlerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn("flex items-center gap-3 p-3 rounded-lg border", getSeverityColor(alert.severity))}
                  >
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{alert.title}</p>
                      <p className="text-xs opacity-80">{alert.message}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className="text-[10px]">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(alert.created_at || '').toLocaleDateString('fr-FR')}
                      </Badge>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => acknowledgeAlert.mutate(alert.id)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Configurations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Règles d'Alerte</CardTitle>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nouvelle règle</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Créer une règle d'alerte</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Type d'alerte</Label>
                    <Select value={newAlert.alert_type} onValueChange={(v) => setNewAlert(p => ({ ...p, alert_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ALERT_TYPES.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Seuil (valeur)</Label>
                      <Input type="number" value={newAlert.threshold_value} onChange={(e) => setNewAlert(p => ({ ...p, threshold_value: +e.target.value }))} />
                    </div>
                    <div>
                      <Label>Seuil (%)</Label>
                      <Input type="number" value={newAlert.threshold_percent} onChange={(e) => setNewAlert(p => ({ ...p, threshold_percent: +e.target.value }))} />
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => createAlert.mutate()} disabled={createAlert.isPending}>
                    Créer la règle
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {!alertConfigs?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune règle configurée</p>
          ) : (
            <div className="space-y-2">
              {alertConfigs.map((config) => {
                const type = ALERT_TYPES.find(t => t.id === config.alert_type);
                const Icon = type?.icon || Bell;
                return (
                  <div key={config.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-border transition-colors">
                    <Icon className={cn("h-4 w-4", type?.color || 'text-muted-foreground')} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{type?.label || config.alert_type}</p>
                      <p className="text-xs text-muted-foreground">
                        Seuil: {config.threshold_value || '—'} | {config.threshold_percent || 0}%
                      </p>
                    </div>
                    <Switch
                      checked={config.is_enabled ?? true}
                      onCheckedChange={(v) => toggleAlert.mutate({ id: config.id, enabled: v })}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

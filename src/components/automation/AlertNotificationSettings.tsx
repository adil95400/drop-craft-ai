import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, MessageSquare, AlertTriangle, TrendingDown, Package, DollarSign } from 'lucide-react';

interface AlertConfig {
  email_enabled: boolean;
  email_address: string;
  slack_enabled: boolean;
  slack_webhook_url: string;
  in_app_enabled: boolean;
  alerts: {
    stock_out: boolean;
    stock_low: boolean;
    price_increase: boolean;
    margin_drop: boolean;
    sync_failure: boolean;
  };
  thresholds: {
    low_stock: number;
    margin_drop_percent: number;
    price_increase_percent: number;
  };
}

const DEFAULT_CONFIG: AlertConfig = {
  email_enabled: true,
  email_address: '',
  slack_enabled: false,
  slack_webhook_url: '',
  in_app_enabled: true,
  alerts: {
    stock_out: true,
    stock_low: true,
    price_increase: true,
    margin_drop: true,
    sync_failure: true,
  },
  thresholds: {
    low_stock: 5,
    margin_drop_percent: 10,
    price_increase_percent: 5,
  },
};

export function AlertNotificationSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: savedConfig } = useQuery({
    queryKey: ['alert-notification-config', user?.id],
    queryFn: async () => {
      if (!user?.id) return DEFAULT_CONFIG;
      const { data } = await supabase
        .from('alert_configurations')
        .select('*')
        .eq('user_id', user.id)
        .eq('alert_type', 'price_stock_automation')
        .maybeSingle();
      if (data?.conditions) {
        return { ...DEFAULT_CONFIG, ...(data.conditions as any) } as AlertConfig;
      }
      return DEFAULT_CONFIG;
    },
    enabled: !!user,
  });

  const [config, setConfig] = useState<AlertConfig | null>(null);
  const activeConfig = config || savedConfig || DEFAULT_CONFIG;

  const updateField = <K extends keyof AlertConfig>(key: K, value: AlertConfig[K]) => {
    setConfig({ ...activeConfig, [key]: value });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('alert_configurations')
        .upsert({
          user_id: user.id,
          alert_type: 'price_stock_automation',
          is_enabled: true,
          conditions: activeConfig as any,
          channels: [
            ...(activeConfig.email_enabled ? ['email'] : []),
            ...(activeConfig.slack_enabled ? ['slack'] : []),
            ...(activeConfig.in_app_enabled ? ['in_app'] : []),
          ],
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,alert_type' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-notification-config'] });
      toast({ title: 'Préférences d\'alertes sauvegardées' });
      setConfig(null);
    },
    onError: () => toast({ title: 'Erreur', variant: 'destructive' }),
  });

  const ALERT_TYPES = [
    { key: 'stock_out' as const, icon: Package, label: 'Rupture de stock', desc: 'Quand le stock fournisseur tombe à 0', color: 'text-destructive' },
    { key: 'stock_low' as const, icon: AlertTriangle, label: 'Stock bas', desc: `Quand le stock passe sous ${activeConfig.thresholds.low_stock} unités`, color: 'text-yellow-500' },
    { key: 'price_increase' as const, icon: TrendingDown, label: 'Hausse prix fournisseur', desc: `Variation > ${activeConfig.thresholds.price_increase_percent}%`, color: 'text-destructive' },
    { key: 'margin_drop' as const, icon: DollarSign, label: 'Baisse de marge', desc: `Marge diminue de > ${activeConfig.thresholds.margin_drop_percent}%`, color: 'text-destructive' },
    { key: 'sync_failure' as const, icon: AlertTriangle, label: 'Échec de sync', desc: 'Erreur lors de la synchronisation', color: 'text-destructive' },
  ];

  return (
    <div className="space-y-4">
      {/* Notification channels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Canaux de notification
          </CardTitle>
          <CardDescription>Choisissez comment recevoir vos alertes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* In-app */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Notifications in-app</p>
                <p className="text-xs text-muted-foreground">Alertes dans l'interface Drop Craft AI</p>
              </div>
            </div>
            <Switch
              checked={activeConfig.in_app_enabled}
              onCheckedChange={(v) => updateField('in_app_enabled', v)}
            />
          </div>

          {/* Email */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">Alertes par email</p>
                  <p className="text-xs text-muted-foreground">Recevez un email pour chaque alerte critique</p>
                </div>
              </div>
              <Switch
                checked={activeConfig.email_enabled}
                onCheckedChange={(v) => updateField('email_enabled', v)}
              />
            </div>
            {activeConfig.email_enabled && (
              <Input
                placeholder="votre@email.com"
                value={activeConfig.email_address}
                onChange={(e) => updateField('email_address', e.target.value)}
                className="max-w-sm"
              />
            )}
          </div>

          {/* Slack */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">Alertes Slack</p>
                  <p className="text-xs text-muted-foreground">Envoyez les alertes dans un canal Slack</p>
                </div>
              </div>
              <Switch
                checked={activeConfig.slack_enabled}
                onCheckedChange={(v) => updateField('slack_enabled', v)}
              />
            </div>
            {activeConfig.slack_enabled && (
              <Input
                placeholder="https://hooks.slack.com/services/..."
                value={activeConfig.slack_webhook_url}
                onChange={(e) => updateField('slack_webhook_url', e.target.value)}
                className="max-w-lg"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alert types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Types d'alertes</CardTitle>
          <CardDescription>Activez ou désactivez les alertes individuellement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {ALERT_TYPES.map((alertType) => {
            const Icon = alertType.icon;
            return (
              <div key={alertType.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition">
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${alertType.color}`} />
                  <div>
                    <p className="font-medium text-sm">{alertType.label}</p>
                    <p className="text-xs text-muted-foreground">{alertType.desc}</p>
                  </div>
                </div>
                <Switch
                  checked={activeConfig.alerts[alertType.key]}
                  onCheckedChange={(v) =>
                    updateField('alerts', { ...activeConfig.alerts, [alertType.key]: v })
                  }
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seuils d'alerte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Seuil stock bas (unités)</Label>
              <Input
                type="number"
                min={1}
                value={activeConfig.thresholds.low_stock}
                onChange={(e) =>
                  updateField('thresholds', { ...activeConfig.thresholds, low_stock: +e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hausse prix fournisseur (%)</Label>
              <Input
                type="number"
                min={1}
                value={activeConfig.thresholds.price_increase_percent}
                onChange={(e) =>
                  updateField('thresholds', { ...activeConfig.thresholds, price_increase_percent: +e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Baisse de marge (%)</Label>
              <Input
                type="number"
                min={1}
                value={activeConfig.thresholds.margin_drop_percent}
                onChange={(e) =>
                  updateField('thresholds', { ...activeConfig.thresholds, margin_drop_percent: +e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      {config && (
        <div className="flex justify-end">
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            Sauvegarder les préférences
          </Button>
        </div>
      )}
    </div>
  );
}

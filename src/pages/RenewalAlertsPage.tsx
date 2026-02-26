import { useState } from 'react';
import { useRenewalAlerts } from '@/hooks/useRenewalAlerts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, BellRing, Check, RefreshCw, Mail, Smartphone } from 'lucide-react';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

const ALERT_TYPE_LABELS: Record<string, string> = {
  '30_days': '30 jours avant',
  '7_days': '7 jours avant',
  '3_days': '3 jours avant',
  '1_day': '1 jour avant',
  'expired': 'Expiré',
};

export default function RenewalAlertsPage() {
  const {
    alerts, preferences, unreadCount, isLoading,
    updatePreferences, markRead, checkRenewal, isChecking,
  } = useRenewalAlerts();

  const [localPrefs, setLocalPrefs] = useState<Record<string, boolean | string> | null>(null);
  const currentPrefs = localPrefs || preferences || {};

  const handlePrefChange = (key: string, value: boolean | string) => {
    const updated = { ...currentPrefs, [key]: value };
    setLocalPrefs(updated);
    updatePreferences(updated as any);
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alertes de Renouvellement</h1>
          <p className="text-muted-foreground">Soyez notifié avant l'expiration de votre abonnement</p>
        </div>
        <Button onClick={() => checkRenewal()} disabled={isChecking} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
          Vérifier maintenant
        </Button>
      </div>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Préférences de notification
          </CardTitle>
          <CardDescription>Choisissez quand et comment être alerté</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">30 jours avant</p>
              <p className="text-sm text-muted-foreground">Premier rappel</p>
            </div>
            <Switch
              checked={!!currentPrefs.alert_30_days}
              onCheckedChange={(v) => handlePrefChange('alert_30_days', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">7 jours avant</p>
              <p className="text-sm text-muted-foreground">Rappel intermédiaire</p>
            </div>
            <Switch
              checked={!!currentPrefs.alert_7_days}
              onCheckedChange={(v) => handlePrefChange('alert_7_days', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">3 jours avant</p>
              <p className="text-sm text-muted-foreground">Rappel urgent</p>
            </div>
            <Switch
              checked={!!currentPrefs.alert_3_days}
              onCheckedChange={(v) => handlePrefChange('alert_3_days', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">1 jour avant</p>
              <p className="text-sm text-muted-foreground">Dernier rappel</p>
            </div>
            <Switch
              checked={!!currentPrefs.alert_1_day}
              onCheckedChange={(v) => handlePrefChange('alert_1_day', v)}
            />
          </div>

          <div className="border-t pt-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Canal de notification</p>
              <p className="text-sm text-muted-foreground">Comment recevoir les alertes</p>
            </div>
            <Select
              value={(currentPrefs.channel as string) || 'both'}
              onValueChange={(v) => handlePrefChange('channel', v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_app">
                  <span className="flex items-center gap-2"><Smartphone className="h-3 w-3" /> In-app</span>
                </SelectItem>
                <SelectItem value="email">
                  <span className="flex items-center gap-2"><Mail className="h-3 w-3" /> Email</span>
                </SelectItem>
                <SelectItem value="both">
                  <span className="flex items-center gap-2"><BellRing className="h-3 w-3" /> Les deux</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alerts list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            Historique des alertes
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Aucune alerte pour le moment</p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    alert.is_read ? 'bg-muted/30' : 'bg-primary/5 border-primary/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-full ${alert.is_read ? 'bg-muted' : 'bg-primary/10'}`}>
                      <Bell className={`h-4 w-4 ${alert.is_read ? 'text-muted-foreground' : 'text-primary'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        Renouvellement {ALERT_TYPE_LABELS[alert.alert_type] || alert.alert_type}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Expiration : {format(new Date(alert.subscription_end_date), 'dd MMM yyyy', { locale: getDateFnsLocale() })}
                        {' · '}
                        Envoyé le {format(new Date(alert.sent_at), 'dd MMM yyyy HH:mm', { locale: getDateFnsLocale() })}
                      </p>
                    </div>
                  </div>
                  {!alert.is_read && (
                    <Button size="sm" variant="ghost" onClick={() => markRead(alert.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

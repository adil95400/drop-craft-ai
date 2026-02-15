/**
 * Sprint 9: Alert Preferences Panel
 * User-scoped notification preferences saved to notification_preferences table
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';
import { Settings, Mail, Bell, MessageSquare, Package, TrendingDown, Gauge, Zap, ShoppingCart } from 'lucide-react';

interface Preferences {
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  categories: Record<string, boolean>;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  digest_frequency: string;
}

const defaultPrefs: Preferences = {
  email_enabled: true,
  push_enabled: true,
  sms_enabled: false,
  categories: {
    stock_low: true,
    price_change: true,
    quota_warning: true,
    order_anomaly: true,
    sync_failure: true,
    seo_alert: true,
  },
  quiet_hours_start: null,
  quiet_hours_end: null,
  digest_frequency: 'instant',
};

const categoryMeta: Record<string, { label: string; icon: React.ReactNode; desc: string }> = {
  stock_low: { label: 'Stock faible', icon: <Package className="h-4 w-4" />, desc: 'Quand un produit passe sous le seuil minimum' },
  price_change: { label: 'Variation de prix', icon: <TrendingDown className="h-4 w-4" />, desc: 'Changements de prix significatifs détectés' },
  quota_warning: { label: 'Quotas', icon: <Gauge className="h-4 w-4" />, desc: 'Alertes à 80% et 100% d\'utilisation' },
  order_anomaly: { label: 'Anomalies commandes', icon: <ShoppingCart className="h-4 w-4" />, desc: 'Commandes inhabituelles ou erreurs' },
  sync_failure: { label: 'Échecs de synchronisation', icon: <Zap className="h-4 w-4" />, desc: 'Problèmes avec les connecteurs tiers' },
  seo_alert: { label: 'SEO', icon: <TrendingDown className="h-4 w-4" />, desc: 'Dégradation du score SEO produit' },
};

export default function AlertPreferencesPanel() {
  const { user } = useUnifiedAuth();
  const [prefs, setPrefs] = useState<Preferences>(defaultPrefs);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPrefs({
            email_enabled: data.email_enabled ?? true,
            push_enabled: data.push_enabled ?? true,
            sms_enabled: data.sms_enabled ?? false,
            categories: (data.categories as Record<string, boolean>) ?? defaultPrefs.categories,
            quiet_hours_start: data.quiet_hours_start,
            quiet_hours_end: data.quiet_hours_end,
            digest_frequency: data.digest_frequency ?? 'instant',
          });
        }
      });
  }, [user?.id]);

  const save = async () => {
    if (!user?.id) return;
    setSaving(true);
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        email_enabled: prefs.email_enabled,
        push_enabled: prefs.push_enabled,
        sms_enabled: prefs.sms_enabled,
        categories: prefs.categories as any,
        digest_frequency: prefs.digest_frequency,
        quiet_hours_start: prefs.quiet_hours_start,
        quiet_hours_end: prefs.quiet_hours_end,
      }, { onConflict: 'user_id' });
    setSaving(false);
    if (error) {
      toast.error('Erreur lors de la sauvegarde');
    } else {
      toast.success('Préférences sauvegardées');
    }
  };

  return (
    <div className="space-y-6">
      {/* Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Canaux de notification
          </CardTitle>
          <CardDescription>Choisissez comment recevoir vos alertes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">In-app (temps réel)</p>
                <p className="text-xs text-muted-foreground">Notifications dans l'application</p>
              </div>
            </div>
            <Switch checked={prefs.push_enabled} onCheckedChange={(v) => setPrefs(p => ({ ...p, push_enabled: v }))} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-xs text-muted-foreground">Résumé par email</p>
              </div>
            </div>
            <Switch checked={prefs.email_enabled} onCheckedChange={(v) => setPrefs(p => ({ ...p, email_enabled: v }))} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">SMS (critiques uniquement)</p>
                <p className="text-xs text-muted-foreground">Pour les alertes de priorité critique</p>
              </div>
            </div>
            <Switch checked={prefs.sms_enabled} onCheckedChange={(v) => setPrefs(p => ({ ...p, sms_enabled: v }))} />
          </div>

          <div className="pt-2">
            <label className="text-sm font-medium mb-1 block">Fréquence du digest email</label>
            <Select value={prefs.digest_frequency} onValueChange={(v) => setPrefs(p => ({ ...p, digest_frequency: v }))}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Instantané</SelectItem>
                <SelectItem value="hourly">Toutes les heures</SelectItem>
                <SelectItem value="daily">Quotidien</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Types d'alertes</CardTitle>
          <CardDescription>Activez ou désactivez les catégories d'alertes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {Object.entries(categoryMeta).map(([key, meta]) => (
              <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {meta.icon}
                  <div>
                    <p className="text-sm font-medium">{meta.label}</p>
                    <p className="text-xs text-muted-foreground">{meta.desc}</p>
                  </div>
                </div>
                <Switch
                  checked={prefs.categories[key] ?? true}
                  onCheckedChange={(v) =>
                    setPrefs(p => ({ ...p, categories: { ...p.categories, [key]: v } }))
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
        {saving ? 'Sauvegarde...' : 'Sauvegarder les préférences'}
      </Button>
    </div>
  );
}

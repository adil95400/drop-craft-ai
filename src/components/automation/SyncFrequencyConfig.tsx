import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, RefreshCw, Zap, Shield } from 'lucide-react';

const FREQUENCIES = [
  { value: '5', label: '5 minutes', description: 'Temps réel (haute fréquence)' },
  { value: '15', label: '15 minutes', description: 'Recommandé (par défaut)' },
  { value: '30', label: '30 minutes', description: 'Standard' },
  { value: '60', label: '1 heure', description: 'Économique' },
  { value: '120', label: '2 heures', description: 'Basse fréquence' },
];

export function SyncFrequencyConfig() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['sync-config', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('platform_sync_configs')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'supplier_sync')
        .maybeSingle();
      return data || { sync_frequency: '15', is_active: true, sync_type: 'full' };
    },
    enabled: !!user,
  });

  const updateConfig = useMutation({
    mutationFn: async (updates: { sync_frequency?: string; is_active?: boolean; sync_type?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('platform_sync_configs')
        .upsert({
          user_id: user.id,
          platform: 'supplier_sync',
          sync_frequency: updates.sync_frequency || config?.sync_frequency || '15',
          is_active: updates.is_active ?? config?.is_active ?? true,
          sync_type: updates.sync_type || config?.sync_type || 'full',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,platform' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-config'] });
      toast({ title: 'Configuration sauvegardée' });
    },
    onError: () => toast({ title: 'Erreur', variant: 'destructive' }),
  });

  const currentFreq = config?.sync_frequency || '15';
  const isActive = config?.is_active ?? true;
  const syncType = config?.sync_type || 'full';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Fréquence de synchronisation
        </CardTitle>
        <CardDescription>Configurez l'intervalle de vérification des stocks et prix fournisseurs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/disable */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <RefreshCw className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
            <div>
              <p className="font-medium text-sm">Synchronisation automatique</p>
              <p className="text-xs text-muted-foreground">Vérification périodique des fournisseurs</p>
            </div>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={(checked) => updateConfig.mutate({ is_active: checked })}
          />
        </div>

        {/* Frequency selector */}
        <div className="space-y-2">
          <Label>Intervalle de synchronisation</Label>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {FREQUENCIES.map((freq) => (
              <button
                key={freq.value}
                onClick={() => updateConfig.mutate({ sync_frequency: freq.value })}
                disabled={!isActive}
                className={`p-3 rounded-lg border text-left transition-all ${
                  currentFreq === freq.value
                    ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                } ${!isActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <p className="font-medium text-sm">{freq.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{freq.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Sync type */}
        <div className="space-y-2">
          <Label>Type de synchronisation</Label>
          <Select
            value={syncType}
            onValueChange={(v) => updateConfig.mutate({ sync_type: v })}
            disabled={!isActive}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Complète (stocks + prix)
                </div>
              </SelectItem>
              <SelectItem value="stock_only">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Stocks uniquement
                </div>
              </SelectItem>
              <SelectItem value="price_only">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Prix uniquement
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Info banner */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
          <p>
            <strong>Note :</strong> La synchronisation cron système s'exécute toutes les 15 minutes.
            Une fréquence plus basse signifie que certains cycles seront ignorés.
            Une fréquence de 5 min n'est effective que si le cron est configuré en conséquence.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

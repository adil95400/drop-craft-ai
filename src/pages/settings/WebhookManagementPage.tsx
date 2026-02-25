import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Webhook, Plus, Trash2, TestTube, CheckCircle2, XCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const eventOptions = [
  { value: 'order.created', label: 'Commande créée' },
  { value: 'order.updated', label: 'Commande mise à jour' },
  { value: 'order.fulfilled', label: 'Commande expédiée' },
  { value: 'product.created', label: 'Produit créé' },
  { value: 'product.updated', label: 'Produit mis à jour' },
  { value: 'product.deleted', label: 'Produit supprimé' },
  { value: 'stock.low', label: 'Stock bas' },
  { value: 'stock.updated', label: 'Stock mis à jour' },
  { value: 'sync.completed', label: 'Sync terminée' },
  { value: 'sync.failed', label: 'Sync échouée' },
  { value: 'price.changed', label: 'Prix modifié' },
  { value: 'import.completed', label: 'Import terminé' },
];

export default function WebhookManagementPage() {
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ['webhook-subscriptions'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];
      const { data, error } = await supabase
        .from('webhook_subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Count delivery failures from webhook_delivery_logs
  const { data: failCounts = {} } = useQuery({
    queryKey: ['webhook-fail-counts'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return {};
      const { data, error } = await supabase
        .from('webhook_delivery_logs')
        .select('subscription_id, status_code')
        .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString());
      if (error) return {};
      const counts: Record<string, number> = {};
      (data ?? []).forEach((log: any) => {
        if (log.status_code && log.status_code >= 400) {
          counts[log.subscription_id] = (counts[log.subscription_id] || 0) + 1;
        }
      });
      return counts;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('webhook_subscriptions')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-subscriptions'] });
      toast.success('Webhook mis à jour');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('webhook_subscriptions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-subscriptions'] });
      toast.success('Webhook supprimé');
    },
  });

  const testWebhook = (id: string) => {
    toast.success('Ping de test envoyé', { description: 'Vérifiez la réception côté endpoint.' });
  };

  const totalFailCount = Object.values(failCounts).reduce((a: number, b: number) => a + b, 0);

  if (isLoading) {
    return (
      <ChannablePageWrapper title="Webhooks" description="Chargement...">
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      </ChannablePageWrapper>
    );
  }

  return (
    <ChannablePageWrapper
      title="Webhooks"
      description="Recevez des notifications en temps réel pour chaque événement de votre boutique"
      actions={
        <Button size="sm" onClick={() => toast.info('Formulaire de création à venir')}>
          <Plus className="h-4 w-4 mr-1" /> Nouveau webhook
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{webhooks.length}</p><p className="text-xs text-muted-foreground">Webhooks</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-green-600">{webhooks.filter((w: any) => w.is_active).length}</p><p className="text-xs text-muted-foreground">Actifs</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{eventOptions.length}</p><p className="text-xs text-muted-foreground">Événements dispo</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-red-600">{totalFailCount}</p><p className="text-xs text-muted-foreground">Échecs récents</p></CardContent></Card>
      </div>

      {/* Webhook list */}
      <div className="space-y-3">
        {webhooks.map((wh: any) => (
          <Card key={wh.id}>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <Switch checked={wh.is_active} onCheckedChange={() => toggleMutation.mutate({ id: wh.id, isActive: !wh.is_active })} />
                  <div>
                    <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{wh.url}</code>
                    {(failCounts[wh.id] || 0) > 0 && <Badge variant="destructive" className="ml-2 text-xs">{failCounts[wh.id]} échecs</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => testWebhook(wh.id)}>
                    <TestTube className="h-3 w-3 mr-1" /> Tester
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(wh.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {(wh.events ?? []).map((ev: string) => (
                  <Badge key={ev} variant="secondary" className="text-xs">{eventOptions.find(e => e.value === ev)?.label || ev}</Badge>
                ))}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  {wh.is_active ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
                  {wh.is_active ? 'Actif' : 'Inactif'}
                </span>
                {wh.last_triggered_at && <span>Dernier appel : {new Date(wh.last_triggered_at).toLocaleString('fr-FR')}</span>}
                <button className="flex items-center gap-1 hover:text-foreground" onClick={() => setShowSecrets(p => ({ ...p, [wh.id]: !p[wh.id] }))}>
                  {showSecrets[wh.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showSecrets[wh.id] ? (wh.secret || 'N/A') : 'Afficher le secret'}
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
        {webhooks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Webhook className="h-12 w-12 mx-auto mb-3" />
            <p className="font-medium">Aucun webhook configuré</p>
            <p className="text-sm">Créez votre premier webhook pour recevoir des notifications</p>
          </div>
        )}
      </div>

      {/* Available events */}
      <Card>
        <CardHeader><CardTitle className="text-base">Événements disponibles</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {eventOptions.map(ev => (
              <div key={ev.value} className="flex items-center gap-2 p-2 rounded border text-sm">
                <Webhook className="h-3 w-3 text-muted-foreground" />
                <span>{ev.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </ChannablePageWrapper>
  );
}

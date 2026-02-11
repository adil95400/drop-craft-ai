import { useState } from 'react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Webhook, Plus, Trash2, TestTube, CheckCircle2, XCircle, Copy, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  secret: string;
  lastTriggered: string | null;
  failCount: number;
}

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

const mockWebhooks: WebhookConfig[] = [
  { id: '1', url: 'https://api.monsite.com/webhooks/orders', events: ['order.created', 'order.fulfilled'], active: true, secret: 'whsec_abc123...', lastTriggered: '2026-02-11 14:30', failCount: 0 },
  { id: '2', url: 'https://zapier.com/hooks/catch/12345', events: ['product.created', 'product.updated'], active: true, secret: 'whsec_def456...', lastTriggered: '2026-02-10 09:15', failCount: 0 },
  { id: '3', url: 'https://slack.com/api/webhook/xyz', events: ['stock.low', 'sync.failed'], active: false, secret: 'whsec_ghi789...', lastTriggered: null, failCount: 3 },
];

export default function WebhookManagementPage() {
  const [webhooks, setWebhooks] = useState(mockWebhooks);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const toggleWebhook = (id: string) => {
    setWebhooks(prev => prev.map(w => w.id === id ? { ...w, active: !w.active } : w));
    toast.success('Webhook mis à jour');
  };

  const testWebhook = (id: string) => {
    toast.success('Ping de test envoyé', { description: 'Vérifiez la réception côté endpoint.' });
  };

  const deleteWebhook = (id: string) => {
    setWebhooks(prev => prev.filter(w => w.id !== id));
    toast.success('Webhook supprimé');
  };

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
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-green-600">{webhooks.filter(w => w.active).length}</p><p className="text-xs text-muted-foreground">Actifs</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{eventOptions.length}</p><p className="text-xs text-muted-foreground">Événements dispo</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-red-600">{webhooks.reduce((a, w) => a + w.failCount, 0)}</p><p className="text-xs text-muted-foreground">Échecs récents</p></CardContent></Card>
      </div>

      {/* Webhook list */}
      <div className="space-y-3">
        {webhooks.map((wh) => (
          <Card key={wh.id}>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <Switch checked={wh.active} onCheckedChange={() => toggleWebhook(wh.id)} />
                  <div>
                    <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{wh.url}</code>
                    {wh.failCount > 0 && <Badge variant="destructive" className="ml-2 text-xs">{wh.failCount} échecs</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => testWebhook(wh.id)}>
                    <TestTube className="h-3 w-3 mr-1" /> Tester
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteWebhook(wh.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {wh.events.map(ev => (
                  <Badge key={ev} variant="secondary" className="text-xs">{eventOptions.find(e => e.value === ev)?.label || ev}</Badge>
                ))}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  {wh.active ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
                  {wh.active ? 'Actif' : 'Inactif'}
                </span>
                {wh.lastTriggered && <span>Dernier appel : {wh.lastTriggered}</span>}
                <button className="flex items-center gap-1 hover:text-foreground" onClick={() => setShowSecrets(p => ({ ...p, [wh.id]: !p[wh.id] }))}>
                  {showSecrets[wh.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showSecrets[wh.id] ? wh.secret : 'Afficher le secret'}
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
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

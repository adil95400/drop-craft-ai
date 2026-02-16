/**
 * Sprint 22: Webhooks Outgoing Management Page
 */
import { useState } from 'react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Webhook, Plus, Trash2, CheckCircle2, XCircle, Clock, 
  RefreshCw, Copy, Eye, EyeOff, AlertCircle, Zap, Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ChannableStatsGrid } from '@/components/channable';
import { ChannableStat } from '@/components/channable/types';

interface WebhookEndpoint {
  id: string;
  url: string;
  secret: string;
  events: string[];
  enabled: boolean;
  lastTriggered: string | null;
  successRate: number;
  totalDeliveries: number;
  createdAt: string;
}

const AVAILABLE_EVENTS = [
  { id: 'order.created', label: 'Commande créée', category: 'Commandes' },
  { id: 'order.shipped', label: 'Commande expédiée', category: 'Commandes' },
  { id: 'order.delivered', label: 'Commande livrée', category: 'Commandes' },
  { id: 'order.cancelled', label: 'Commande annulée', category: 'Commandes' },
  { id: 'product.created', label: 'Produit créé', category: 'Produits' },
  { id: 'product.updated', label: 'Produit mis à jour', category: 'Produits' },
  { id: 'product.deleted', label: 'Produit supprimé', category: 'Produits' },
  { id: 'stock.low', label: 'Stock bas', category: 'Inventaire' },
  { id: 'stock.out', label: 'Rupture de stock', category: 'Inventaire' },
  { id: 'sync.completed', label: 'Synchronisation terminée', category: 'Système' },
  { id: 'sync.failed', label: 'Synchronisation échouée', category: 'Système' },
  { id: 'import.completed', label: 'Import terminé', category: 'Système' },
];

const defaultEndpoints: WebhookEndpoint[] = [
  {
    id: '1', url: 'https://api.myerp.com/webhooks/orders', secret: 'whsec_abc123...', 
    events: ['order.created', 'order.shipped'], enabled: true, lastTriggered: '2026-02-16T10:30:00Z',
    successRate: 98.5, totalDeliveries: 1247, createdAt: '2026-01-15',
  },
  {
    id: '2', url: 'https://hooks.slack.com/services/T00/B00/xxx', secret: 'whsec_def456...',
    events: ['stock.low', 'stock.out', 'sync.failed'], enabled: true, lastTriggered: '2026-02-16T08:15:00Z',
    successRate: 100, totalDeliveries: 89, createdAt: '2026-02-01',
  },
];

export default function WebhooksOutgoingPage() {
  const [endpoints, setEndpoints] = useState(defaultEndpoints);
  const [showCreate, setShowCreate] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newEvents, setNewEvents] = useState<string[]>([]);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const stats: ChannableStat[] = [
    { label: 'Endpoints actifs', value: endpoints.filter(e => e.enabled).length.toString(), icon: Webhook, color: 'primary' },
    { label: 'Livraisons totales', value: endpoints.reduce((s, e) => s + e.totalDeliveries, 0).toString(), icon: Zap, color: 'success' },
    { label: 'Taux de succès', value: `${(endpoints.reduce((s, e) => s + e.successRate, 0) / (endpoints.length || 1)).toFixed(1)}%`, icon: CheckCircle2, color: 'success' },
    { label: 'Événements configurés', value: AVAILABLE_EVENTS.length.toString(), icon: Globe, color: 'info' },
  ];

  const toggleEndpoint = (id: string) => {
    setEndpoints(prev => prev.map(e => e.id === id ? { ...e, enabled: !e.enabled } : e));
  };

  const deleteEndpoint = (id: string) => {
    setEndpoints(prev => prev.filter(e => e.id !== id));
    toast.success('Webhook supprimé');
  };

  const createEndpoint = () => {
    if (!newUrl || newEvents.length === 0) {
      toast.error('URL et au moins un événement requis');
      return;
    }
    const newEndpoint: WebhookEndpoint = {
      id: Date.now().toString(), url: newUrl, secret: `whsec_${Math.random().toString(36).slice(2, 14)}`,
      events: newEvents, enabled: true, lastTriggered: null, successRate: 100, totalDeliveries: 0, createdAt: new Date().toISOString(),
    };
    setEndpoints(prev => [...prev, newEndpoint]);
    setNewUrl(''); setNewEvents([]); setShowCreate(false);
    toast.success('Webhook créé avec succès');
  };

  const toggleEvent = (eventId: string) => {
    setNewEvents(prev => prev.includes(eventId) ? prev.filter(e => e !== eventId) : [...prev, eventId]);
  };

  const testEndpoint = (endpoint: WebhookEndpoint) => {
    toast.success(`Test envoyé à ${endpoint.url}`);
  };

  return (
    <ChannablePageWrapper
      title="Webhooks Sortants"
      subtitle="Communication"
      description="Configurez des webhooks pour envoyer des événements en temps réel à vos systèmes externes"
      heroImage="notifications"
      badge={{ label: `${endpoints.filter(e => e.enabled).length} actifs`, icon: Webhook }}
      actions={
        <Button className="gap-2" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Ajouter un webhook
        </Button>
      }
    >
      <ChannableStatsGrid stats={stats} columns={4} compact />

      <div className="space-y-4">
        {endpoints.map((endpoint, index) => (
          <motion.div key={endpoint.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-lg ${endpoint.enabled ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                    <Webhook className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-sm font-mono truncate max-w-md">{endpoint.url}</code>
                      <Badge variant={endpoint.enabled ? 'default' : 'secondary'}>
                        {endpoint.enabled ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {endpoint.events.map(ev => (
                        <Badge key={ev} variant="outline" className="text-[10px]">{ev}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        {endpoint.successRate}% succès
                      </span>
                      <span>{endpoint.totalDeliveries} livraisons</span>
                      {endpoint.lastTriggered && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Dernier: {new Date(endpoint.lastTriggered).toLocaleString('fr-FR')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-muted-foreground">Secret:</span>
                      <code className="font-mono text-muted-foreground">
                        {showSecrets[endpoint.id] ? endpoint.secret : '••••••••••••'}
                      </code>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setShowSecrets(prev => ({ ...prev, [endpoint.id]: !prev[endpoint.id] }))}>
                        {showSecrets[endpoint.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { navigator.clipboard.writeText(endpoint.secret); toast.success('Secret copié'); }}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={endpoint.enabled} onCheckedChange={() => toggleEndpoint(endpoint.id)} />
                    <Button variant="outline" size="sm" onClick={() => testEndpoint(endpoint)}>
                      <RefreshCw className="h-3.5 w-3.5 mr-1" /> Test
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteEndpoint(endpoint.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau Webhook</DialogTitle>
            <DialogDescription>Configurez un endpoint pour recevoir les événements</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>URL de destination *</Label>
              <Input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://api.example.com/webhooks" type="url" />
            </div>
            <div className="space-y-2">
              <Label>Événements à écouter *</Label>
              <div className="grid grid-cols-1 gap-1 max-h-60 overflow-y-auto border rounded-lg p-3">
                {Object.entries(
                  AVAILABLE_EVENTS.reduce((acc, ev) => {
                    if (!acc[ev.category]) acc[ev.category] = [];
                    acc[ev.category].push(ev);
                    return acc;
                  }, {} as Record<string, typeof AVAILABLE_EVENTS>)
                ).map(([category, events]) => (
                  <div key={category} className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground pt-2">{category}</p>
                    {events.map(ev => (
                      <label key={ev.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer">
                        <Checkbox checked={newEvents.includes(ev.id)} onCheckedChange={() => toggleEvent(ev.id)} />
                        <span className="text-sm">{ev.label}</span>
                        <code className="text-[10px] text-muted-foreground ml-auto">{ev.id}</code>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button onClick={createEndpoint}>Créer le webhook</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ChannablePageWrapper>
  );
}

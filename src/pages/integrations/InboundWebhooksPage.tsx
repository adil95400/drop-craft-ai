/**
 * InboundWebhooksPage — Manage inbound webhook endpoints and view event logs
 */
import { useState } from 'react';
import { SEO } from '@/components/SEO';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Webhook, Plus, Copy, Trash2, CheckCircle2, XCircle, Clock,
  AlertTriangle, Eye, RefreshCw, Shield, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { useWebhookEndpoints, useWebhookEvents, type WebhookEndpoint, type WebhookEvent } from '@/hooks/useWebhookEndpoints';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const PLATFORMS = [
  { value: 'shopify', label: 'Shopify' },
  { value: 'woocommerce', label: 'WooCommerce' },
  { value: 'amazon', label: 'Amazon' },
  { value: 'ebay', label: 'eBay' },
  { value: 'etsy', label: 'Etsy' },
  { value: 'generic', label: 'Générique' },
];

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  received: { icon: <Clock className="h-3 w-3" />, color: 'bg-info/10 text-info' },
  processing: { icon: <RefreshCw className="h-3 w-3 animate-spin" />, color: 'bg-warning/10 text-warning' },
  processed: { icon: <CheckCircle2 className="h-3 w-3" />, color: 'bg-success/10 text-success' },
  failed: { icon: <XCircle className="h-3 w-3" />, color: 'bg-destructive/10 text-destructive' },
};

function getWebhookUrl(endpointId: string) {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'jsmwckzrmqecwwrswwrz';
  return `https://${projectId}.supabase.co/functions/v1/inbound-webhook?endpoint_id=${endpointId}`;
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success('Copié dans le presse-papier');
}

function CreateEndpointDialog({ onCreate }: { onCreate: (data: { name: string; platform: string }) => void }) {
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('shopify');
  const [open, setOpen] = useState(false);

  const handleCreate = () => {
    if (!name.trim()) return toast.error('Nom requis');
    onCreate({ name: name.trim(), platform });
    setName('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau webhook
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer un endpoint webhook</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Nom</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Shopify Commandes Production"
            />
          </div>
          <div>
            <Label>Plateforme</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLATFORMS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreate} className="w-full">Créer l'endpoint</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EndpointCard({ endpoint, onToggle, onDelete }: {
  endpoint: WebhookEndpoint;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [showSecret, setShowSecret] = useState(false);
  const webhookUrl = getWebhookUrl(endpoint.id);

  return (
    <Card className="border border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Webhook className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{endpoint.name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">{endpoint.platform}</Badge>
                {endpoint.last_triggered_at && (
                  <span className="text-xs text-muted-foreground">
                    Dernier appel : {formatDistanceToNow(new Date(endpoint.last_triggered_at), { addSuffix: true, locale: fr })}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{endpoint.trigger_count} appels</Badge>
            <Switch
              checked={endpoint.is_active}
              onCheckedChange={(v) => onToggle(endpoint.id, v)}
            />
            <Button variant="ghost" size="icon" onClick={() => onDelete(endpoint.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* URL */}
        <div>
          <Label className="text-xs text-muted-foreground">URL du webhook</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input value={webhookUrl} readOnly className="font-mono text-xs bg-muted/30" />
            <Button variant="outline" size="icon" onClick={() => copyToClipboard(webhookUrl)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Secret */}
        <div>
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Shield className="h-3 w-3" /> Clé secrète (HMAC)
          </Label>
          <div className="flex items-center gap-2 mt-1">
            <Input
              type={showSecret ? 'text' : 'password'}
              value={endpoint.secret_key}
              readOnly
              className="font-mono text-xs bg-muted/30"
            />
            <Button variant="outline" size="icon" onClick={() => setShowSecret(!showSecret)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => copyToClipboard(endpoint.secret_key)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EventRow({ event }: { event: WebhookEvent }) {
  const [expanded, setExpanded] = useState(false);
  const statusCfg = STATUS_CONFIG[event.status] || STATUS_CONFIG.received;

  return (
    <div className="border-b border-border/40 last:border-0">
      <button
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Badge className={`text-xs gap-1 ${statusCfg.color}`}>
            {statusCfg.icon}
            {event.status}
          </Badge>
          <Badge variant="outline" className="text-xs">{event.platform}</Badge>
          <span className="text-sm font-mono truncate">{event.event_type}</span>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
          {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: fr })}
        </span>
      </button>
      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          {event.error_message && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertTriangle className="h-4 w-4" />
              {event.error_message}
            </div>
          )}
          <div>
            <Label className="text-xs text-muted-foreground">Payload</Label>
            <pre className="bg-muted/40 rounded-md p-3 text-xs overflow-auto max-h-48 font-mono">
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InboundWebhooksPage() {
  const { t: tPages } = useTranslation('pages');
  const { endpoints, isLoading, createEndpoint, toggleEndpoint, deleteEndpoint } = useWebhookEndpoints();
  const { data: events = [], isLoading: eventsLoading } = useWebhookEvents();

  const stats = {
    total: endpoints.length,
    active: endpoints.filter(e => e.is_active).length,
    totalEvents: events.length,
    failed: events.filter(e => e.status === 'failed').length,
  };

  return (
    <>
      <SEO
        title="Webhooks Entrants | Shopopti+"
        description="Recevez les notifications marketplace en temps réel via des webhooks entrants sécurisés"
        path="/integrations/webhooks"
      />
      <ChannablePageWrapper
        title={tPages('webhooksEntrants.title')}
        description="Recevez les notifications de vos marketplaces en temps réel (commandes, stock, prix)"
        heroImage="integrations"
        badge={{ label: 'Temps réel', icon: Zap }}
      >
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Endpoints', value: stats.total, icon: Webhook },
            { label: 'Actifs', value: stats.active, icon: CheckCircle2 },
            { label: 'Événements reçus', value: stats.totalEvents, icon: Zap },
            { label: 'En erreur', value: stats.failed, icon: AlertTriangle },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="endpoints" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="endpoints" className="gap-2">
                <Webhook className="h-4 w-4" />Endpoints
              </TabsTrigger>
              <TabsTrigger value="events" className="gap-2">
                <Zap className="h-4 w-4" />Journal des événements
              </TabsTrigger>
            </TabsList>
            <CreateEndpointDialog
              onCreate={({ name, platform }) => createEndpoint.mutate({ name, platform })}
            />
          </div>

          <TabsContent value="endpoints">
            {isLoading ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">Chargement...</CardContent></Card>
            ) : endpoints.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Webhook className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Aucun webhook configuré</h3>
                  <p className="text-muted-foreground mb-4">
                    Créez un endpoint pour recevoir les notifications de vos marketplaces en temps réel.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {endpoints.map(ep => (
                  <EndpointCard
                    key={ep.id}
                    endpoint={ep}
                    onToggle={(id, active) => toggleEndpoint.mutate({ id, is_active: active })}
                    onDelete={(id) => {
                      if (confirm('Supprimer cet endpoint ? Tous les événements associés seront perdus.')) {
                        deleteEndpoint.mutate(id);
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Événements récents</CardTitle>
                <CardDescription>Les 100 derniers webhooks reçus</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {eventsLoading ? (
                  <div className="py-8 text-center text-muted-foreground">Chargement...</div>
                ) : events.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    Aucun événement reçu pour le moment
                  </div>
                ) : (
                  <ScrollArea className="max-h-[600px]">
                    {events.map(ev => <EventRow key={ev.id} event={ev} />)}
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}

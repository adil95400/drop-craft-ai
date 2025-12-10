import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Zap, Plus, Play, Pause, Trash2, ExternalLink, Copy, CheckCircle2, XCircle, Clock, RefreshCw, Settings, Send, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface WebhookIntegration {
  id: string;
  name: string;
  webhookUrl: string;
  triggerEvent: string;
  isActive: boolean;
  lastTriggered?: string;
  successCount: number;
  failureCount: number;
  createdAt: string;
  headers?: Record<string, string>;
}

const triggerEvents = [
  { value: 'new_customer', label: 'Nouveau client inscrit' },
  { value: 'new_order', label: 'Nouvelle commande' },
  { value: 'order_shipped', label: 'Commande expédiée' },
  { value: 'cart_abandoned', label: 'Panier abandonné' },
  { value: 'product_low_stock', label: 'Stock faible' },
  { value: 'campaign_sent', label: 'Campagne envoyée' },
  { value: 'review_received', label: 'Nouvel avis reçu' },
  { value: 'refund_requested', label: 'Remboursement demandé' },
  { value: 'custom', label: 'Événement personnalisé' }
];

const mockWebhooks: WebhookIntegration[] = [
  {
    id: '1',
    name: 'Slack - Nouvelles commandes',
    webhookUrl: 'https://hooks.zapier.com/hooks/catch/123456/abcdef',
    triggerEvent: 'new_order',
    isActive: true,
    lastTriggered: '2024-02-10T14:30:00',
    successCount: 1245,
    failureCount: 3,
    createdAt: '2024-01-01'
  },
  {
    id: '2',
    name: 'Google Sheets - Clients',
    webhookUrl: 'https://hooks.zapier.com/hooks/catch/789012/ghijkl',
    triggerEvent: 'new_customer',
    isActive: true,
    lastTriggered: '2024-02-10T12:15:00',
    successCount: 892,
    failureCount: 0,
    createdAt: '2024-01-15'
  },
  {
    id: '3',
    name: 'Mailchimp - Paniers abandonnés',
    webhookUrl: 'https://hooks.zapier.com/hooks/catch/345678/mnopqr',
    triggerEvent: 'cart_abandoned',
    isActive: false,
    lastTriggered: '2024-02-08T09:45:00',
    successCount: 456,
    failureCount: 12,
    createdAt: '2024-01-20'
  },
  {
    id: '4',
    name: 'Notion - Avis clients',
    webhookUrl: 'https://hooks.zapier.com/hooks/catch/901234/stuvwx',
    triggerEvent: 'review_received',
    isActive: true,
    lastTriggered: '2024-02-09T16:20:00',
    successCount: 234,
    failureCount: 1,
    createdAt: '2024-02-01'
  }
];

export function ZapierWebhooks() {
  const [webhooks, setWebhooks] = useState<WebhookIntegration[]>(mockWebhooks);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookIntegration | null>(null);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    webhookUrl: '',
    triggerEvent: ''
  });

  const toggleWebhook = (id: string) => {
    setWebhooks(webhooks.map(w => {
      if (w.id === id) {
        const newStatus = !w.isActive;
        toast.success(`Webhook ${newStatus ? 'activé' : 'désactivé'}`);
        return { ...w, isActive: newStatus };
      }
      return w;
    }));
  };

  const deleteWebhook = (id: string) => {
    setWebhooks(webhooks.filter(w => w.id !== id));
    toast.success('Webhook supprimé');
  };

  const handleCreate = () => {
    const webhook: WebhookIntegration = {
      id: Date.now().toString(),
      name: newWebhook.name,
      webhookUrl: newWebhook.webhookUrl,
      triggerEvent: newWebhook.triggerEvent,
      isActive: true,
      successCount: 0,
      failureCount: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setWebhooks([webhook, ...webhooks]);
    setIsCreateOpen(false);
    setNewWebhook({ name: '', webhookUrl: '', triggerEvent: '' });
    toast.success('Webhook créé avec succès');
  };

  const handleTest = async (webhook: WebhookIntegration) => {
    setSelectedWebhook(webhook);
    setIsTestOpen(true);
    setTestResult(null);

    // Simulate webhook test
    try {
      await fetch(webhook.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors',
        body: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString(),
          event: webhook.triggerEvent,
          source: 'ShopOpti'
        })
      });
      setTestResult('success');
      toast.success('Test envoyé ! Vérifiez votre Zap.');
    } catch (error) {
      setTestResult('error');
      toast.error('Erreur lors du test');
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copiée');
  };

  const getEventLabel = (event: string) => {
    return triggerEvents.find(e => e.value === event)?.label || event;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-orange-500" />
            Webhooks & Intégrations
          </h2>
          <p className="text-muted-foreground">
            Connectez ShopOpti à Zapier, Make, n8n et plus
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau webhook
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un webhook</DialogTitle>
              <DialogDescription>
                Connectez un service externe via webhook
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nom de l'intégration</Label>
                <Input
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                  placeholder="Ex: Slack - Notifications commandes"
                />
              </div>
              <div className="space-y-2">
                <Label>URL du webhook</Label>
                <Input
                  value={newWebhook.webhookUrl}
                  onChange={(e) => setNewWebhook({ ...newWebhook, webhookUrl: e.target.value })}
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                />
                <p className="text-xs text-muted-foreground">
                  Obtenez cette URL dans Zapier, Make ou votre service d'automatisation
                </p>
              </div>
              <div className="space-y-2">
                <Label>Événement déclencheur</Label>
                <Select
                  value={newWebhook.triggerEvent}
                  onValueChange={(v) => setNewWebhook({ ...newWebhook, triggerEvent: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un événement..." />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerEvents.map((event) => (
                      <SelectItem key={event.value} value={event.value}>
                        {event.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleCreate} 
                  disabled={!newWebhook.name || !newWebhook.webhookUrl || !newWebhook.triggerEvent}
                >
                  Créer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Webhooks actifs</p>
            <p className="text-2xl font-bold">{webhooks.filter(w => w.isActive).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Appels réussis (24h)</p>
            <p className="text-2xl font-bold text-green-600">
              {webhooks.reduce((acc, w) => acc + w.successCount, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Échecs (24h)</p>
            <p className="text-2xl font-bold text-red-600">
              {webhooks.reduce((acc, w) => acc + w.failureCount, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Taux de succès</p>
            <p className="text-2xl font-bold">
              {((webhooks.reduce((acc, w) => acc + w.successCount, 0) / 
                (webhooks.reduce((acc, w) => acc + w.successCount + w.failureCount, 0) || 1)) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => window.open('https://zapier.com/app/zaps', '_blank')}>
          <Zap className="h-4 w-4 mr-2" />
          Ouvrir Zapier
          <ExternalLink className="h-3 w-3 ml-2" />
        </Button>
        <Button variant="outline" onClick={() => window.open('https://make.com/en/integrations', '_blank')}>
          Ouvrir Make
          <ExternalLink className="h-3 w-3 ml-2" />
        </Button>
      </div>

      {/* Webhooks List */}
      <div className="space-y-4">
        {webhooks.map((webhook) => (
          <Card key={webhook.id} className={!webhook.isActive ? 'opacity-60' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${webhook.isActive ? 'bg-orange-100 text-orange-600' : 'bg-muted'}`}>
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{webhook.name}</h3>
                      <Badge variant={webhook.isActive ? 'default' : 'secondary'}>
                        {webhook.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Déclencheur: <span className="font-medium">{getEventLabel(webhook.triggerEvent)}</span>
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <code className="bg-muted px-2 py-1 rounded max-w-[300px] truncate">
                        {webhook.webhookUrl}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => copyUrl(webhook.webhookUrl)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={webhook.isActive}
                    onCheckedChange={() => toggleWebhook(webhook.id)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTest(webhook)}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Tester
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => deleteWebhook(webhook.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-6 mt-4 pt-4 border-t text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Dernier appel: {webhook.lastTriggered ? formatDate(webhook.lastTriggered) : 'Jamais'}</span>
                </div>
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{webhook.successCount} réussis</span>
                </div>
                {webhook.failureCount > 0 && (
                  <div className="flex items-center gap-1 text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span>{webhook.failureCount} échecs</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Test Result Dialog */}
      <Dialog open={isTestOpen} onOpenChange={setIsTestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test du webhook</DialogTitle>
            <DialogDescription>
              {selectedWebhook?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            {testResult === null && (
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                <p>Envoi en cours...</p>
              </div>
            )}
            {testResult === 'success' && (
              <div className="flex flex-col items-center gap-3 text-green-600">
                <CheckCircle2 className="h-12 w-12" />
                <p className="font-medium">Requête envoyée avec succès !</p>
                <p className="text-sm text-muted-foreground text-center">
                  Vérifiez votre Zap ou service d'automatisation pour confirmer la réception.
                </p>
              </div>
            )}
            {testResult === 'error' && (
              <div className="flex flex-col items-center gap-3 text-red-600">
                <XCircle className="h-12 w-12" />
                <p className="font-medium">Erreur lors de l'envoi</p>
                <p className="text-sm text-muted-foreground text-center">
                  Vérifiez l'URL du webhook et réessayez.
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setIsTestOpen(false)}>Fermer</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help Card */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Comment configurer un webhook ?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Créez un nouveau Zap dans Zapier (ou scénario dans Make)</p>
          <p>2. Choisissez "Webhooks by Zapier" comme déclencheur</p>
          <p>3. Sélectionnez "Catch Hook" et copiez l'URL générée</p>
          <p>4. Collez cette URL ici et choisissez l'événement déclencheur</p>
          <p>5. Testez le webhook pour vérifier la connexion</p>
        </CardContent>
      </Card>
    </div>
  );
}

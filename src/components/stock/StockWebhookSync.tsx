import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Webhook, Zap, CheckCircle, XCircle, Clock, Copy, RefreshCw, Plus, Trash2, TestTube } from 'lucide-react';
import { toast } from 'sonner';

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggered?: string;
  successRate: number;
}

export function StockWebhookSync() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([
    {
      id: '1',
      name: 'Stock Update - Shopify',
      url: 'https://mystore.myshopify.com/admin/api/webhooks/stock',
      events: ['stock.updated', 'stock.low'],
      isActive: true,
      lastTriggered: '2024-01-15T10:30:00Z',
      successRate: 98.5
    },
    {
      id: '2',
      name: 'Inventory Sync - WooCommerce',
      url: 'https://mystore.com/wp-json/wc/v3/webhooks/inventory',
      events: ['stock.updated', 'stock.depleted'],
      isActive: true,
      lastTriggered: '2024-01-15T10:25:00Z',
      successRate: 95.2
    }
  ]);

  const [showNewWebhook, setShowNewWebhook] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [] as string[]
  });

  const availableEvents = [
    { value: 'stock.updated', label: 'Stock mis à jour' },
    { value: 'stock.low', label: 'Stock faible' },
    { value: 'stock.depleted', label: 'Rupture de stock' },
    { value: 'stock.replenished', label: 'Stock réapprovisionné' },
    { value: 'transfer.created', label: 'Transfert créé' },
    { value: 'transfer.completed', label: 'Transfert terminé' }
  ];

  const webhookEndpoint = `https://api.shopopti.com/webhooks/stock/${crypto.randomUUID().slice(0, 8)}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié dans le presse-papiers');
  };

  const toggleWebhook = (id: string) => {
    setWebhooks(prev => prev.map(w => 
      w.id === id ? { ...w, isActive: !w.isActive } : w
    ));
    toast.success('Webhook mis à jour');
  };

  const testWebhook = (webhook: WebhookConfig) => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1500)),
      {
        loading: 'Test du webhook en cours...',
        success: `Webhook "${webhook.name}" testé avec succès`,
        error: 'Échec du test'
      }
    );
  };

  const deleteWebhook = (id: string) => {
    setWebhooks(prev => prev.filter(w => w.id !== id));
    toast.success('Webhook supprimé');
  };

  const addWebhook = () => {
    if (!newWebhook.name || !newWebhook.url) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const webhook: WebhookConfig = {
      id: crypto.randomUUID(),
      ...newWebhook,
      isActive: true,
      successRate: 100
    };

    setWebhooks(prev => [...prev, webhook]);
    setNewWebhook({ name: '', url: '', events: [] });
    setShowNewWebhook(false);
    toast.success('Webhook créé avec succès');
  };

  return (
    <div className="space-y-6">
      {/* Endpoint entrant */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Endpoint de réception (Incoming)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Utilisez cette URL pour recevoir les mises à jour de stock de vos fournisseurs ou systèmes externes.
          </p>
          
          <div className="flex items-center gap-2">
            <Input value={webhookEndpoint} readOnly className="font-mono text-sm" />
            <Button variant="outline" size="icon" onClick={() => copyToClipboard(webhookEndpoint)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">1,234</div>
              <div className="text-xs text-muted-foreground">Événements reçus (24h)</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">99.8%</div>
              <div className="text-xs text-muted-foreground">Taux de succès</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">45ms</div>
              <div className="text-xs text-muted-foreground">Latence moyenne</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">5</div>
              <div className="text-xs text-muted-foreground">Sources actives</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhooks sortants */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-primary" />
            Webhooks sortants (Outgoing)
          </CardTitle>
          <Button onClick={() => setShowNewWebhook(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau webhook
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showNewWebhook && (
            <Card className="border-dashed">
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nom</Label>
                    <Input 
                      placeholder="Ex: Sync Shopify"
                      value={newWebhook.name}
                      onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>URL de destination</Label>
                    <Input 
                      placeholder="https://..."
                      value={newWebhook.url}
                      onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Événements déclencheurs</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableEvents.map(event => (
                      <Badge 
                        key={event.value}
                        variant={newWebhook.events.includes(event.value) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          setNewWebhook(prev => ({
                            ...prev,
                            events: prev.events.includes(event.value)
                              ? prev.events.filter(e => e !== event.value)
                              : [...prev.events, event.value]
                          }));
                        }}
                      >
                        {event.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={addWebhook}>Créer</Button>
                  <Button variant="outline" onClick={() => setShowNewWebhook(false)}>Annuler</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {webhooks.map(webhook => (
            <div key={webhook.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <Switch 
                  checked={webhook.isActive} 
                  onCheckedChange={() => toggleWebhook(webhook.id)}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{webhook.name}</span>
                    {webhook.isActive ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Actif
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactif
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono truncate max-w-md">
                    {webhook.url}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {webhook.lastTriggered ? new Date(webhook.lastTriggered).toLocaleString('fr-FR') : 'Jamais'}
                    </span>
                    <span>Succès: {webhook.successRate}%</span>
                    <span>{webhook.events.length} événement(s)</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => testWebhook(webhook)}>
                  <TestTube className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteWebhook(webhook.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

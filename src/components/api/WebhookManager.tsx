import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Webhook, Plus, Trash2, TestTube, Activity, CheckCircle, XCircle } from 'lucide-react';

interface WebhookSubscription {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
}

const AVAILABLE_EVENTS = [
  { value: 'product.created', label: 'Produit créé' },
  { value: 'product.updated', label: 'Produit modifié' },
  { value: 'product.deleted', label: 'Produit supprimé' },
  { value: 'order.created', label: 'Commande créée' },
  { value: 'order.updated', label: 'Commande modifiée' },
  { value: 'order.cancelled', label: 'Commande annulée' },
  { value: 'customer.created', label: 'Client créé' },
  { value: 'customer.updated', label: 'Client modifié' },
  { value: 'inventory.low', label: 'Stock faible' },
  { value: 'sync.completed', label: 'Synchronisation terminée' }
];

export function WebhookManager() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [] as string[]
  });

  const queryClient = useQueryClient();

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['webhook-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as WebhookSubscription[];
    }
  });

  const { data: deliveryLogs } = useQuery({
    queryKey: ['webhook-delivery-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_delivery_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    }
  });

  const createWebhookMutation = useMutation({
    mutationFn: async () => {
      const arr = new Uint8Array(24);
      crypto.getRandomValues(arr);
      const secret = `whsec_${Array.from(arr, b => b.toString(16).padStart(2, '0')).join('')}`;
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('webhook_subscriptions').insert({
        url: newWebhook.url,
        events: newWebhook.events,
        secret,
        is_active: true,
        user_id: user!.id
      } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-subscriptions'] });
      toast.success('Webhook créé avec succès');
      setIsCreateOpen(false);
      setNewWebhook({ name: '', url: '', events: [] });
    },
    onError: () => {
      toast.error('Erreur lors de la création du webhook');
    }
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('webhook_subscriptions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-subscriptions'] });
      toast.success('Webhook supprimé');
    }
  });

  const toggleWebhookMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('webhook_subscriptions')
        .update({ is_active: !isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-subscriptions'] });
      toast.success('Statut mis à jour');
    }
  });

  const testWebhookMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Test': 'true'
        },
        body: JSON.stringify({
          event: 'webhook.test',
          timestamp: new Date().toISOString(),
          data: { message: 'Test webhook from Drop Craft AI' }
        })
      });

      if (!response.ok) throw new Error('Test failed');
      return response;
    },
    onSuccess: () => {
      toast.success('Test webhook envoyé avec succès');
    },
    onError: () => {
      toast.error('Échec du test webhook');
    }
  });

  const toggleEvent = (event: string) => {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  const getDeliveryStats = (webhookId: string) => {
    const logs = deliveryLogs?.filter(log => log.subscription_id === webhookId) || [];
    const total = logs.length;
    const successful = logs.filter(log => log.status_code && log.status_code < 400).length;
    const failed = total - successful;
    return { total, successful, failed };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhooks sortants
              </CardTitle>
              <CardDescription>
                Recevez des notifications en temps réel pour les événements importants
              </CardDescription>
            </div>
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Créer un webhook</DialogTitle>
                  <DialogDescription>
                    Configurez les événements que vous souhaitez recevoir
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label>Nom du webhook</Label>
                    <Input
                      placeholder="Ex: Production Webhook"
                      value={newWebhook.name}
                      onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>URL de destination</Label>
                    <Input
                      placeholder="https://votre-serveur.com/webhook"
                      value={newWebhook.url}
                      onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label className="mb-3 block">Événements à écouter</Label>
                    <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 border rounded">
                      {AVAILABLE_EVENTS.map((event) => (
                        <div key={event.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={event.value}
                            checked={newWebhook.events.includes(event.value)}
                            onCheckedChange={() => toggleEvent(event.value)}
                          />
                          <Label htmlFor={event.value} className="cursor-pointer text-sm">
                            {event.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={() => createWebhookMutation.mutate()} 
                    disabled={!newWebhook.name || !newWebhook.url || newWebhook.events.length === 0 || createWebhookMutation.isPending}
                  >
                    {createWebhookMutation.isPending ? 'Création...' : 'Créer'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <p>Chargement...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Événements</TableHead>
                  <TableHead>Statistiques</TableHead>
                  <TableHead>Dernière activité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks?.map((webhook) => {
                  const stats = getDeliveryStats(webhook.id);
                  return (
                    <TableRow key={webhook.id}>
                      <TableCell>
                        <p className="font-medium">{webhook.name}</p>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {webhook.url}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.slice(0, 2).map((event) => (
                            <Badge key={event} variant="secondary" className="text-xs">
                              {event.split('.')[1]}
                            </Badge>
                          ))}
                          {webhook.events.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{webhook.events.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{stats.successful}</span>
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-sm">{stats.failed}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {webhook.last_triggered_at ? (
                          <span className="text-sm">
                            {new Date(webhook.last_triggered_at).toLocaleDateString('fr-FR')}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Jamais</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleWebhookMutation.mutate({ id: webhook.id, isActive: webhook.is_active })}
                        >
                          {webhook.is_active ? (
                            <Badge className="bg-green-500">Actif</Badge>
                          ) : (
                            <Badge variant="secondary">Inactif</Badge>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => testWebhookMutation.mutate(webhook.url)}
                            disabled={testWebhookMutation.isPending}
                          >
                            <TestTube className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteWebhookMutation.mutate(webhook.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

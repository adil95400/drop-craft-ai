import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Webhook, RefreshCw, Plus, Trash2, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useShopifyWebhooks } from '@/hooks/useShopifyWebhooks';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

interface WebhookManagerProps {
  integrationId: string;
}

const AVAILABLE_TOPICS = [
  { value: 'products/create', label: 'Produit créé', category: 'Produits' },
  { value: 'products/update', label: 'Produit modifié', category: 'Produits' },
  { value: 'products/delete', label: 'Produit supprimé', category: 'Produits' },
  { value: 'orders/create', label: 'Commande créée', category: 'Commandes' },
  { value: 'orders/updated', label: 'Commande modifiée', category: 'Commandes' },
  { value: 'orders/cancelled', label: 'Commande annulée', category: 'Commandes' },
  { value: 'inventory_levels/update', label: 'Inventaire mis à jour', category: 'Inventaire' },
  { value: 'customers/create', label: 'Client créé', category: 'Clients' },
  { value: 'customers/update', label: 'Client modifié', category: 'Clients' },
];

export function WebhookManager({ integrationId }: WebhookManagerProps) {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const {
    webhooks,
    events,
    isLoading,
    eventsLoading,
    refetch,
    registerWebhooks,
    unregisterWebhooks,
    syncWebhooks,
    isRegistering,
    isUnregistering,
    isSyncing,
  } = useShopifyWebhooks(integrationId);

  const handleToggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const handleRegisterSelected = () => {
    if (selectedTopics.length === 0) return;
    registerWebhooks({ integrationId, topics: selectedTopics });
    setSelectedTopics([]);
  };

  const handleUnregisterWebhook = (topic: string) => {
    unregisterWebhooks({ integrationId, topics: [topic] });
  };

  const handleSyncWebhooks = () => {
    syncWebhooks(integrationId);
  };

  const registeredTopics = new Set(webhooks.map(w => w.topic));
  const availableToRegister = AVAILABLE_TOPICS.filter(t => !registeredTopics.has(t.value));

  // Group topics by category
  const topicsByCategory = availableToRegister.reduce((acc, topic) => {
    if (!acc[topic.category]) {
      acc[topic.category] = [];
    }
    acc[topic.category].push(topic);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_TOPICS>);

  const getEventStatusIcon = (event: any) => {
    if (event.processed) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (event.error_message) return <AlertTriangle className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      {/* Active Webhooks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhooks actifs
              </CardTitle>
              <CardDescription>
                {webhooks.length} webhook(s) enregistré(s) pour recevoir les mises à jour en temps réel
              </CardDescription>
            </div>
            <Button
              onClick={handleSyncWebhooks}
              variant="outline"
              size="sm"
              disabled={isSyncing}
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Synchroniser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Webhook className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun webhook actif</p>
              <p className="text-sm mt-1">Enregistrez des webhooks ci-dessous pour recevoir les mises à jour en temps réel</p>
            </div>
          ) : (
            <div className="space-y-2">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
                        {webhook.topic}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Créé {formatDistanceToNow(new Date(webhook.created_at), { addSuffix: true, locale: getDateFnsLocale() })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                      ID: {webhook.webhook_id}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleUnregisterWebhook(webhook.topic)}
                    variant="ghost"
                    size="sm"
                    disabled={isUnregistering}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Register New Webhooks */}
      {availableToRegister.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Enregistrer de nouveaux webhooks
            </CardTitle>
            <CardDescription>
              Sélectionnez les événements pour lesquels vous souhaitez recevoir des notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(topicsByCategory).map(([category, topics]) => (
              <div key={category}>
                <h4 className="font-medium text-foreground mb-3">{category}</h4>
                <div className="grid gap-3">
                  {topics.map((topic) => (
                    <label
                      key={topic.value}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedTopics.includes(topic.value)}
                        onCheckedChange={() => handleToggleTopic(topic.value)}
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-foreground">{topic.label}</span>
                        <p className="text-xs text-muted-foreground">{topic.value}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {selectedTopics.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-sm text-muted-foreground">
                  {selectedTopics.length} webhook(s) sélectionné(s)
                </span>
                <Button
                  onClick={handleRegisterSelected}
                  disabled={isRegistering}
                >
                  {isRegistering ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Enregistrer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Webhook Events */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Événements récents</CardTitle>
              <CardDescription>
                Historique des webhooks reçus et leur statut de traitement
              </CardDescription>
            </div>
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              disabled={eventsLoading}
            >
              <RefreshCw className={`h-4 w-4 ${eventsLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun événement webhook reçu</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {events.slice(0, 20).map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 border rounded-lg text-sm"
                >
                  <div className="mt-1">
                    {getEventStatusIcon(event)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {event.event_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: getDateFnsLocale() })}
                      </span>
                    </div>
                    {event.error_message && (
                      <p className="text-xs text-destructive truncate">
                        Erreur: {event.error_message}
                      </p>
                    )}
                    {event.processed && event.processed_at && (
                      <p className="text-xs text-muted-foreground">
                        Traité {formatDistanceToNow(new Date(event.processed_at), { addSuffix: true, locale: getDateFnsLocale() })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

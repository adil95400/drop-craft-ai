import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Webhook, DollarSign, Package, ShoppingCart, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface WebhookEvent {
  id: string;
  subscription_id: string;
  event_type: string;
  payload: any;
  status_code: number;
  created_at: string;
  delivered_at: string;
}

export function WebhookMonitor() {
  const [webhooks, setWebhooks] = useState<WebhookEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    price_updates: 0,
    stock_updates: 0,
    order_updates: 0,
    errors: 0
  });

  const loadWebhooks = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('webhook_delivery_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setWebhooks(data);
      
      // Calculer stats
      const stats = {
        total: data.length,
        price_updates: data.filter(w => w.event_type.includes('price')).length,
        stock_updates: data.filter(w => w.event_type.includes('stock')).length,
        order_updates: data.filter(w => w.event_type.includes('order')).length,
        errors: data.filter(w => w.status_code >= 400).length
      };
      setStats(stats);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    loadWebhooks();

    // Écouter nouveaux webhooks en temps réel
    const channel = supabase
      .channel('webhook_logs')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'webhook_delivery_logs'
      }, (payload) => {
        setWebhooks(prev => [payload.new as WebhookEvent, ...prev].slice(0, 50));
        loadWebhooks(); // Recharger stats
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'price_update': return <DollarSign className="h-4 w-4 text-primary" />;
      case 'stock_update': return <Package className="h-4 w-4 text-warning" />;
      case 'order_status_update': return <ShoppingCart className="h-4 w-4 text-success" />;
      case 'product_discontinued': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default: return <Webhook className="h-4 w-4" />;
    }
  };

  const getEventLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      'price_update': 'Mise à jour prix',
      'stock_update': 'Mise à jour stock',
      'order_status_update': 'Statut commande',
      'product_discontinued': 'Produit arrêté'
    };
    return labels[eventType] || eventType;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Webhooks reçus</div>
          </CardContent>
        </Card>

        <Card className="border-primary/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <div className="text-2xl font-bold">{stats.price_updates}</div>
            </div>
            <div className="text-sm text-muted-foreground">Prix</div>
          </CardContent>
        </Card>

        <Card className="border-warning/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-warning" />
              <div className="text-2xl font-bold">{stats.stock_updates}</div>
            </div>
            <div className="text-sm text-muted-foreground">Stock</div>
          </CardContent>
        </Card>

        <Card className="border-success/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-success" />
              <div className="text-2xl font-bold">{stats.order_updates}</div>
            </div>
            <div className="text-sm text-muted-foreground">Commandes</div>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div className="text-2xl font-bold">{stats.errors}</div>
            </div>
            <div className="text-sm text-muted-foreground">Erreurs</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Flux temps réel des webhooks</CardTitle>
              <CardDescription>
                Événements reçus des fournisseurs en temps réel
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={loadWebhooks}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {webhooks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Webhook className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun webhook reçu</p>
              <p className="text-sm mt-2">Les événements apparaîtront ici en temps réel</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {webhooks.map((webhook) => (
                  <Card key={webhook.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          {getEventIcon(webhook.event_type)}
                          
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {getEventLabel(webhook.event_type)}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {webhook.subscription_id}
                              </Badge>
                              <Badge
                                variant={webhook.status_code < 400 ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {webhook.status_code}
                              </Badge>
                            </div>

                            <div className="text-sm text-muted-foreground">
                              {new Date(webhook.created_at).toLocaleString('fr-FR')}
                            </div>

                            {webhook.payload && (
                              <details className="text-xs">
                                <summary className="cursor-pointer text-primary hover:underline">
                                  Voir les détails
                                </summary>
                                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                                  {JSON.stringify(webhook.payload, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

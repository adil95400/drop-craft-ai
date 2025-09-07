import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Webhook, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Settings, 
  RefreshCw,
  Eye,
  Copy,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WebhookEvent {
  id: string;
  type: string;
  created: number;
  data: any;
  processed: boolean;
  error?: string;
}

interface WebhookEndpoint {
  id: string;
  url: string;
  enabled: boolean;
  events: string[];
  secret: string;
}

export const StripeWebhookHandler = () => {
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newEndpoint, setNewEndpoint] = useState({
    url: '',
    events: [] as string[]
  });
  const { toast } = useToast();

  const stripeEvents = [
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
    'checkout.session.completed'
  ];

  useEffect(() => {
    loadWebhookEvents();
    loadEndpoints();
  }, []);

  const loadWebhookEvents = async () => {
    setIsLoading(true);
    try {
      // Simulate loading recent webhook events
      const mockEvents: WebhookEvent[] = [
        {
          id: 'evt_1',
          type: 'customer.subscription.created',
          created: Date.now() - 3600000,
          data: { object: { id: 'sub_123', status: 'active' } },
          processed: true
        },
        {
          id: 'evt_2',
          type: 'invoice.payment_succeeded',
          created: Date.now() - 7200000,
          data: { object: { id: 'in_123', amount_paid: 2900 } },
          processed: true
        },
        {
          id: 'evt_3',
          type: 'checkout.session.completed',
          created: Date.now() - 10800000,
          data: { object: { id: 'cs_123', payment_status: 'paid' } },
          processed: false,
          error: 'Processing failed - retry needed'
        }
      ];

      setWebhookEvents(mockEvents);
    } catch (error) {
      console.error('Error loading webhook events:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les événements webhook",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadEndpoints = () => {
    // Load configured webhook endpoints
    const mockEndpoints: WebhookEndpoint[] = [
      {
        id: 'we_1',
        url: `${window.location.origin}/api/webhooks/stripe`,
        enabled: true,
        events: stripeEvents,
        secret: 'whsec_••••••••••••••••••••••••••••••••'
      }
    ];
    
    setEndpoints(mockEndpoints);
  };

  const retryWebhookEvent = async (eventId: string) => {
    try {
      // Simulate retrying webhook processing
      const { error } = await supabase.functions.invoke('stripe-webhook-retry', {
        body: { event_id: eventId }
      });

      if (error) throw error;

      // Update event status
      setWebhookEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, processed: true, error: undefined }
          : event
      ));

      toast({
        title: "Événement retraité",
        description: "L'événement webhook a été retraité avec succès",
      });
    } catch (error) {
      console.error('Error retrying webhook:', error);
      toast({
        title: "Erreur de retraitement",
        description: "Impossible de retraiter l'événement",
        variant: "destructive"
      });
    }
  };

  const testWebhookEndpoint = async (endpointId: string) => {
    try {
      // Send test webhook
      const endpoint = endpoints.find(e => e.id === endpointId);
      if (!endpoint) return;

      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Stripe-Signature': 'test_signature'
        },
        body: JSON.stringify({
          type: 'test.event',
          data: { object: { id: 'test_object' } },
          created: Math.floor(Date.now() / 1000)
        })
      });

      if (response.ok) {
        toast({
          title: "Test réussi",
          description: "L'endpoint webhook répond correctement",
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      toast({
        title: "Test échoué",
        description: `L'endpoint ne répond pas: ${error}`,
        variant: "destructive"
      });
    }
  };

  const copyEndpointUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "URL copiée",
      description: "L'URL de l'endpoint a été copiée",
    });
  };

  const getEventStatusIcon = (event: WebhookEvent) => {
    if (event.processed && !event.error) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (event.error) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    } else {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getEventStatusBadge = (event: WebhookEvent) => {
    if (event.processed && !event.error) {
      return <Badge className="bg-green-100 text-green-800">Traité</Badge>;
    } else if (event.error) {
      return <Badge className="bg-red-100 text-red-800">Erreur</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Webhook className="h-6 w-6" />
          Webhooks Stripe
        </h2>
        <Button
          variant="outline"
          onClick={loadWebhookEvents}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Actualiser
        </Button>
      </div>

      {/* Endpoints Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration des Endpoints
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {endpoints.map((endpoint) => (
            <div key={endpoint.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={endpoint.enabled ? 'default' : 'secondary'}>
                    {endpoint.enabled ? 'Actif' : 'Inactif'}
                  </Badge>
                  <span className="font-mono text-sm">{endpoint.url}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyEndpointUrl(endpoint.url)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testWebhookEndpoint(endpoint.id)}
                  >
                    Test
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open('https://dashboard.stripe.com/webhooks', '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">Événements écoutés:</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {endpoint.events.map((event) => (
                    <Badge key={event} variant="outline" className="text-xs">
                      {event}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">Secret de signature:</Label>
                <p className="font-mono text-xs text-muted-foreground mt-1">{endpoint.secret}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Webhook Events */}
      <Card>
        <CardHeader>
          <CardTitle>Événements Récents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {webhookEvents.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucun événement webhook récent
              </p>
            ) : (
              webhookEvents.map((event) => (
                <div key={event.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getEventStatusIcon(event)}
                      <div>
                        <p className="font-medium">{event.type}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.created).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getEventStatusBadge(event)}
                      {event.error && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => retryWebhookEvent(event.id)}
                        >
                          Réessayer
                        </Button>
                      )}
                      <Button size="sm" variant="ghost">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {event.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                      {event.error}
                    </div>
                  )}
                  
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                      Voir les données de l'événement
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                      {JSON.stringify(event.data, null, 2)}
                    </pre>
                  </details>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => window.open('https://dashboard.stripe.com/webhooks', '_blank')}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Dashboard Stripe
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('https://dashboard.stripe.com/logs', '_blank')}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Logs Stripe
            </Button>
            <Button
              variant="outline"
              onClick={loadWebhookEvents}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Recharger les événements
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
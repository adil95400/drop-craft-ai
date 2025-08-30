import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Shield, Activity, Users, Database, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  description: string;
  metadata: any;
  created_at: string;
  user_id?: string;
}

interface WebhookEvent {
  id: string;
  source: string;
  event_type: string;
  processed: boolean;
  error_message?: string;
  retry_count: number;
  created_at: string;
}

export function SecurityDashboard() {
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch security events
  const { data: securityEvents, isLoading: loadingEvents, refetch: refetchEvents } = useQuery({
    queryKey: ['security-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as SecurityEvent[];
    }
  });

  // Fetch webhook events
  const { data: webhookEvents, isLoading: loadingWebhooks, refetch: refetchWebhooks } = useQuery({
    queryKey: ['webhook-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.warn('Could not fetch webhook events:', error);
        return [];
      }
      return (data || []).map(event => ({
        id: event.id,
        source: event.source || 'unknown',
        event_type: event.event_type,
        processed: event.processed || false,
        error_message: event.error_message,
        retry_count: event.retry_count || 0,
        created_at: event.created_at
      })) as WebhookEvent[];
    }
  });

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchEvents(),
        refetchWebhooks()
      ]);
      
      toast({
        title: "Dashboard actualisé",
        description: "Toutes les données ont été mises à jour"
      });
    } catch (error) {
      toast({
        title: "Erreur de rafraîchissement",
        description: "Impossible de mettre à jour les données",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'outline';
      default: return 'outline';
    }
  };

  const criticalEvents = securityEvents?.filter(e => e.severity === 'critical').length || 0;
  const failedWebhooks = webhookEvents?.filter(w => !w.processed && w.retry_count > 0).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tableau de Sécurité</h1>
          <p className="text-muted-foreground">
            Surveillez les événements de sécurité et l'activité système
          </p>
        </div>
        
        <Button onClick={handleRefreshAll} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Événements Critiques</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalEvents}</div>
            <p className="text-xs text-muted-foreground">
              Dernières 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhooks Échoués</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{failedWebhooks}</div>
            <p className="text-xs text-muted-foreground">
              En attente de traitement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Intégrations Actives</CardTitle>
            <Database className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">3</div>
            <p className="text-xs text-muted-foreground">
              Plateformes connectées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statut Système</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Stable</div>
            <p className="text-xs text-muted-foreground">
              Tous systèmes OK
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(criticalEvents > 0 || failedWebhooks > 0) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {criticalEvents > 0 && `${criticalEvents} événements critiques détectés. `}
            {failedWebhooks > 0 && `${failedWebhooks} webhooks en échec. `}
            Vérifiez les détails ci-dessous.
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Tabs */}
      <Tabs defaultValue="security" className="space-y-4">
        <TabsList>
          <TabsTrigger value="security">Événements de Sécurité</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Événements de Sécurité Récents</CardTitle>
              <CardDescription>
                Surveillance en temps réel des activités sensibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingEvents ? (
                <div className="text-center py-4">Chargement...</div>
              ) : (
                <div className="space-y-4">
                  {securityEvents?.map((event) => (
                    <div key={event.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityColor(event.severity)}>
                            {event.severity.toUpperCase()}
                          </Badge>
                          <span className="font-medium">{event.event_type}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.created_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <Badge variant="outline">
                          {Object.keys(event.metadata).length} détails
                        </Badge>
                      )}
                    </div>
                  ))}
                  
                  {!securityEvents?.length && (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucun événement de sécurité récent
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>État des Webhooks</CardTitle>
              <CardDescription>
                Suivi des webhooks entrants des plateformes connectées
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingWebhooks ? (
                <div className="text-center py-4">Chargement...</div>
              ) : (
                <div className="space-y-4">
                  {webhookEvents?.map((webhook) => (
                    <div key={webhook.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{webhook.source}</Badge>
                          <span className="font-medium">{webhook.event_type}</span>
                          {webhook.processed ? (
                            <Badge variant="default">Traité</Badge>
                          ) : (
                            <Badge variant="destructive">En attente</Badge>
                          )}
                        </div>
                        {webhook.error_message && (
                          <p className="text-sm text-destructive">{webhook.error_message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(webhook.created_at).toLocaleString('fr-FR')}
                          {webhook.retry_count > 0 && ` • ${webhook.retry_count} tentatives`}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {!webhookEvents?.length && (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucun webhook récent
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
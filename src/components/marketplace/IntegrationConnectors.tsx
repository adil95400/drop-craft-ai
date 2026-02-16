/**
 * IntegrationConnectors — Third-party connector management panel
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Plug, RefreshCw, Settings, CheckCircle2, AlertCircle, Clock, Activity } from 'lucide-react';
import { toast } from 'sonner';

interface Connector {
  id: string;
  name: string;
  description: string;
  logo: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync?: string;
  syncProgress?: number;
  dataPoints: number;
  enabled: boolean;
  category: string;
}

const CONNECTORS: Connector[] = [
  { id: '1', name: 'Shopify', description: 'Synchronisation catalogue, commandes et inventaire', logo: '🛍️', status: 'connected', lastSync: 'il y a 5 min', dataPoints: 1250, enabled: true, category: 'E-commerce' },
  { id: '2', name: 'WooCommerce', description: 'Intégration WordPress e-commerce bidirectionnelle', logo: '🔮', status: 'connected', lastSync: 'il y a 12 min', dataPoints: 830, enabled: true, category: 'E-commerce' },
  { id: '3', name: 'Amazon Seller', description: 'Gestion listings, prix et stock Amazon', logo: '📦', status: 'syncing', syncProgress: 67, dataPoints: 450, enabled: true, category: 'Marketplace' },
  { id: '4', name: 'eBay', description: 'Publication et synchronisation multi-formats eBay', logo: '🏷️', status: 'disconnected', dataPoints: 0, enabled: false, category: 'Marketplace' },
  { id: '5', name: 'Google Merchant', description: 'Flux Shopping et campagnes Performance Max', logo: '🔍', status: 'connected', lastSync: 'il y a 1h', dataPoints: 2100, enabled: true, category: 'Publicité' },
  { id: '6', name: 'Meta Ads', description: 'Catalogue Facebook & Instagram Shops', logo: '📱', status: 'error', lastSync: 'Échec', dataPoints: 0, enabled: true, category: 'Publicité' },
  { id: '7', name: 'Slack', description: 'Notifications temps réel commandes et alertes stock', logo: '💬', status: 'connected', lastSync: 'il y a 2 min', dataPoints: 500, enabled: true, category: 'Communication' },
  { id: '8', name: 'HubSpot CRM', description: 'Sync contacts, deals et activités commerciales', logo: '🧡', status: 'disconnected', dataPoints: 0, enabled: false, category: 'CRM' },
];

const statusConfig = {
  connected: { icon: <CheckCircle2 className="h-4 w-4 text-primary" />, label: 'Connecté', color: 'default' as const },
  disconnected: { icon: <Clock className="h-4 w-4 text-muted-foreground" />, label: 'Déconnecté', color: 'secondary' as const },
  error: { icon: <AlertCircle className="h-4 w-4 text-destructive" />, label: 'Erreur', color: 'destructive' as const },
  syncing: { icon: <RefreshCw className="h-4 w-4 text-primary animate-spin" />, label: 'Sync...', color: 'outline' as const },
};

export function IntegrationConnectors() {
  const [connectors, setConnectors] = useState(CONNECTORS);

  const toggleConnector = (id: string) => {
    setConnectors(prev => prev.map(c => c.id === id ? { ...c, enabled: !c.enabled, status: c.enabled ? 'disconnected' : 'connected' } : c));
    toast.success('Connecteur mis à jour');
  };

  const connected = connectors.filter(c => c.status === 'connected' || c.status === 'syncing').length;
  const totalDataPoints = connectors.reduce((s, c) => s + c.dataPoints, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Plug className="h-4 w-4" />, label: 'Connecteurs actifs', value: connected },
          { icon: <Activity className="h-4 w-4" />, label: 'Points de données', value: totalDataPoints.toLocaleString() },
          { icon: <AlertCircle className="h-4 w-4" />, label: 'Erreurs', value: connectors.filter(c => c.status === 'error').length },
          { icon: <RefreshCw className="h-4 w-4" />, label: 'En sync', value: connectors.filter(c => c.status === 'syncing').length },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">{stat.icon}</div>
              <div>
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Connector Cards */}
      <div className="space-y-3">
        {connectors.map(connector => {
          const config = statusConfig[connector.status];
          return (
            <Card key={connector.id} className={connector.status === 'error' ? 'border-destructive/50' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-2xl">{connector.logo}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{connector.name}</h4>
                        <Badge variant={config.color} className="gap-1 text-xs">{config.icon}{config.label}</Badge>
                        <Badge variant="outline" className="text-xs">{connector.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{connector.description}</p>
                      {connector.status === 'syncing' && connector.syncProgress && (
                        <Progress value={connector.syncProgress} className="mt-2 h-1.5" />
                      )}
                      {connector.lastSync && connector.status !== 'syncing' && (
                        <p className="text-xs text-muted-foreground mt-1">Dernière sync : {connector.lastSync}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {connector.dataPoints > 0 && <span className="text-xs text-muted-foreground">{connector.dataPoints.toLocaleString()} pts</span>}
                    <Button variant="ghost" size="icon"><Settings className="h-4 w-4" /></Button>
                    <Switch checked={connector.enabled} onCheckedChange={() => toggleConnector(connector.id)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

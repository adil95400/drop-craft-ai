import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIntegrations, IntegrationTemplate, Integration } from '@/hooks/useIntegrations';
import { 
  Store, 
  Settings, 
  RefreshCw, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle,
  Clock,
  Zap,
  Crown,
  Sparkles,
  ExternalLink,
  Power
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'connected':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'error':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'pending':
      return <Clock className="w-4 h-4 text-yellow-500" />;
    default:
      return <XCircle className="w-4 h-4 text-gray-400" />;
  }
};

const IntegrationCard = ({ 
  template, 
  integration, 
  onConnect, 
  onConfigure, 
  onSync, 
  onDisconnect 
}: {
  template: IntegrationTemplate;
  integration?: Integration;
  onConnect: (template: IntegrationTemplate) => void;
  onConfigure: (integration: Integration) => void;
  onSync: (integration: Integration) => void;
  onDisconnect: (integration: Integration) => void;
}) => {
  const isConnected = integration && integration.is_active;
  
  return (
    <Card className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
      isConnected ? 'ring-2 ring-green-200 bg-green-50/30' : 'hover:shadow-md'
    }`}>
      {template.isPopular && (
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="bg-orange-100 text-orange-600 border-orange-200">
            <Sparkles className="w-3 h-3 mr-1" />
            Populaire
          </Badge>
        </div>
      )}
      
      {template.isPremium && (
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="bg-purple-100 text-purple-600 border-purple-200">
            <Crown className="w-3 h-3 mr-1" />
            Premium
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${template.color}`}>
            {template.logo}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{template.name}</CardTitle>
              {isConnected && <StatusIcon status={integration.connection_status} />}
            </div>
            <CardDescription className="text-sm mt-1">
              {template.description}
            </CardDescription>
            <Badge 
              variant={template.status === 'available' ? 'default' : 'secondary'}
              className="mt-2 text-xs"
            >
              {template.status === 'available' ? 'Disponible' : 
               template.status === 'beta' ? 'Bêta' : 'Bientôt'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium text-sm mb-2">Fonctionnalités clés</h4>
          <div className="flex flex-wrap gap-1">
            {template.features.slice(0, 4).map(feature => (
              <Badge key={feature} variant="outline" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
        </div>

        {isConnected && integration && (
          <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Statut:</span>
              <span className={`font-medium ${
                integration.connection_status === 'connected' ? 'text-green-600' : 
                integration.connection_status === 'error' ? 'text-red-600' : 
                'text-yellow-600'
              }`}>
                {integration.connection_status === 'connected' ? 'Connecté' :
                 integration.connection_status === 'error' ? 'Erreur' : 'En attente'}
              </span>
            </div>
            {integration.last_sync_at && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Dernière sync:</span>
                <span>{new Date(integration.last_sync_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {!isConnected ? (
            <Button 
              onClick={() => onConnect(template)} 
              className="flex-1"
              disabled={template.status !== 'available'}
            >
              <Plus className="w-4 h-4 mr-2" />
              Connecter
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => onConfigure(integration!)}
                className="flex-1"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configurer
              </Button>
              <Button 
                variant="outline" 
                onClick={() => onSync(integration!)}
                size="sm"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => onDisconnect(integration!)}
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <Power className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const ConnectDialog = ({ 
  template, 
  open, 
  onOpenChange, 
  onConnect 
}: {
  template?: IntegrationTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (config: any) => void;
}) => {
  const [config, setConfig] = useState({
    url: '',
    domain: '',
    apiKey: '',
    apiSecret: '',
    syncFrequency: 'daily'
  });

  const handleConnect = () => {
    onConnect(config);
    onOpenChange(false);
    setConfig({ url: '', domain: '', apiKey: '', apiSecret: '', syncFrequency: 'daily' });
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{template.logo}</span>
            Connecter {template.name}
          </DialogTitle>
          <DialogDescription>
            Configurez votre intégration {template.name} pour commencer la synchronisation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="domain">Domaine/URL</Label>
            <Input
              id="domain"
              placeholder="mon-shop.com"
              value={config.domain}
              onChange={(e) => setConfig(prev => ({ ...prev, domain: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="apiKey">Clé API</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Entrez votre clé API"
              value={config.apiKey}
              onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="syncFrequency">Fréquence de synchronisation</Label>
            <Select value={config.syncFrequency} onValueChange={(value) => setConfig(prev => ({ ...prev, syncFrequency: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Toutes les heures</SelectItem>
                <SelectItem value="daily">Quotidiennement</SelectItem>
                <SelectItem value="weekly">Hebdomadairement</SelectItem>
                <SelectItem value="manual">Manuel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleConnect}>
              <Zap className="w-4 h-4 mr-2" />
              Connecter
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function ModernIntegrationsHub() {
  const { 
    integrations, 
    templates, 
    loading, 
    connectIntegration, 
    disconnectIntegration,
    syncIntegration 
  } = useIntegrations();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [connectDialog, setConnectDialog] = useState<{ open: boolean; template?: IntegrationTemplate }>({
    open: false
  });

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];
  
  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleConnect = (template: IntegrationTemplate) => {
    setConnectDialog({ open: true, template });
  };

  const handleConnectSubmit = async (config: any) => {
    if (connectDialog.template) {
      await connectIntegration(connectDialog.template, config);
    }
  };

  const handleConfigure = (integration: Integration) => {
    toast.info(`Configuration de ${integration.platform_name} - Fonctionnalité en développement`);
  };

  const handleSync = async (integration: Integration) => {
    await syncIntegration(integration.id);
  };

  const handleDisconnect = async (integration: Integration) => {
    await disconnectIntegration(integration.id);
  };

  const connectedCount = integrations.filter(i => i.is_active).length;
  const activeIntegrations = integrations.filter(i => i.connection_status === 'connected').length;

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Hub d'Intégrations</h1>
          <p className="text-muted-foreground">Connectez {templates.length} plateformes - {connectedCount} connectées</p>
        </div>
        <Button onClick={() => window.open('https://docs.example.com/integrations', '_blank')}>
          <ExternalLink className="w-4 h-4 mr-2" />
          Documentation
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Store className="w-4 h-4 text-blue-500" />
              Intégrations Connectées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">{activeIntegrations} actives</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-500" />
              Plateformes Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {templates.filter(t => t.status === 'available').length} prêtes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-orange-500" />
              Synchronisations 24h
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground mt-1">Dernières 24h</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parcourir les Intégrations</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher une intégration..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.slice(1).map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const integration = integrations.find(i => 
            i.platform_name.toLowerCase() === template.name.toLowerCase()
          );
          
          return (
            <IntegrationCard
              key={template.id}
              template={template}
              integration={integration}
              onConnect={handleConnect}
              onConfigure={handleConfigure}
              onSync={handleSync}
              onDisconnect={handleDisconnect}
            />
          );
        })}
      </div>

      <ConnectDialog
        template={connectDialog.template}
        open={connectDialog.open}
        onOpenChange={(open) => setConnectDialog({ open, template: open ? connectDialog.template : undefined })}
        onConnect={handleConnectSubmit}
      />
    </div>
  );
}
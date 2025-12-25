import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useEnterpriseIntegrations } from '@/hooks/useEnterpriseIntegrations';
import { 
  Plus, 
  RefreshCw, 
  Trash2, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Clock,
  Loader2,
  Building2,
  Plug
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const INTEGRATION_TYPES = [
  { value: 'erp', label: 'ERP', description: 'SAP, Oracle, Microsoft Dynamics' },
  { value: 'crm', label: 'CRM', description: 'Salesforce, HubSpot, Pipedrive' },
  { value: 'accounting', label: 'Comptabilité', description: 'QuickBooks, Xero, Sage' },
  { value: 'warehouse', label: 'WMS', description: 'Gestion d\'entrepôt' },
  { value: 'shipping', label: 'Expédition', description: 'Carriers, 3PL' },
  { value: 'analytics', label: 'Analytics', description: 'Google Analytics, Mixpanel' },
  { value: 'custom', label: 'API Personnalisée', description: 'Webhook, REST API' },
];

export default function EnterpriseIntegrationsPage() {
  const { 
    integrations, 
    isLoading, 
    stats, 
    createIntegration, 
    updateIntegration, 
    deleteIntegration,
    syncIntegration 
  } = useEnterpriseIntegrations();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newIntegration, setNewIntegration] = useState({
    name: '',
    integration_type: '',
  });

  const handleCreate = () => {
    if (!newIntegration.name || !newIntegration.integration_type) return;
    
    createIntegration.mutate(newIntegration, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setNewIntegration({ name: '', integration_type: '' });
      },
    });
  };

  const getStatusBadge = (status: string, lastError: string | null) => {
    if (lastError) {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Erreur</Badge>;
    }
    
    switch (status) {
      case 'syncing':
        return <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Sync...</Badge>;
      case 'completed':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Synchronisé</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
    }
  };

  const getIntegrationTypeLabel = (type: string) => {
    return INTEGRATION_TYPES.find(t => t.value === type)?.label || type;
  };

  return (
    <>
      <Helmet>
        <title>Intégrations Entreprise | Drop Craft AI</title>
        <meta name="description" content="Gérez vos intégrations ERP, CRM et systèmes d'entreprise" />
      </Helmet>

      <div className="container mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
              <Building2 className="h-10 w-10 text-primary" />
              Intégrations Entreprise
            </h1>
            <p className="text-xl text-muted-foreground mt-2">
              Connectez vos systèmes ERP, CRM et outils métier
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Intégration
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter une intégration</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nom de l'intégration</Label>
                  <Input
                    placeholder="Ex: SAP Business One"
                    value={newIntegration.name}
                    onChange={(e) => setNewIntegration(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type d'intégration</Label>
                  <Select
                    value={newIntegration.integration_type}
                    onValueChange={(value) => setNewIntegration(prev => ({ ...prev, integration_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {INTEGRATION_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleCreate} 
                  className="w-full"
                  disabled={createIntegration.isPending}
                >
                  {createIntegration.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Créer l'intégration
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <Plug className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Actives</p>
                  <p className="text-3xl font-bold text-green-600">{stats.active}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En sync</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.syncing}</p>
                </div>
                <RefreshCw className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Erreurs</p>
                  <p className="text-3xl font-bold text-red-600">{stats.errors}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integrations List */}
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Chargement des intégrations...</p>
            </CardContent>
          </Card>
        ) : integrations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Plug className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune intégration</h3>
              <p className="text-muted-foreground mb-4">
                Connectez vos systèmes d'entreprise pour automatiser vos processus
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une intégration
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {integrations.map((integration) => (
              <Card key={integration.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <CardDescription>
                          {getIntegrationTypeLabel(integration.integration_type)}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(integration.sync_status, integration.last_error)}
                      <Switch
                        checked={integration.is_active}
                        onCheckedChange={(checked) => 
                          updateIntegration.mutate({ id: integration.id, is_active: checked })
                        }
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {integration.last_sync_at ? (
                        <>Dernière sync: {format(new Date(integration.last_sync_at), 'PPp', { locale: fr })}</>
                      ) : (
                        <>Jamais synchronisé</>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => syncIntegration.mutate(integration.id)}
                        disabled={syncIntegration.isPending || integration.sync_status === 'syncing'}
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${integration.sync_status === 'syncing' ? 'animate-spin' : ''}`} />
                        Synchroniser
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Configurer
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteIntegration.mutate(integration.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {integration.last_error && (
                    <div className="mt-3 p-3 bg-destructive/10 rounded-lg text-sm text-destructive">
                      Erreur: {integration.last_error}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

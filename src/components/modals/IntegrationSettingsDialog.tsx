import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useIntegrationsUnified } from "@/hooks/unified";
import { logError } from '@/utils/consoleCleanup';
import { 
  Settings, 
  RefreshCw, 
  History, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Activity,
  Trash2,
  Edit,
  Play,
  Pause
} from "lucide-react";

interface IntegrationSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration?: any;
}

export const IntegrationSettingsDialog = ({ open, onOpenChange, integration }: IntegrationSettingsDialogProps) => {
  const { toast } = useToast();
  const { updateIntegration, deleteIntegration, syncIntegration, isUpdating, isDeleting, isSyncing } = useIntegrations();
  const [activeTab, setActiveTab] = useState("settings");
  const [settings, setSettings] = useState({
    is_active: true,
    sync_frequency: "daily",
    auto_sync: true,
    sync_settings: {
      products: true,
      inventory: true,
      orders: true,
      customers: false
    }
  });

  const [syncHistory] = useState([
    {
      id: 1,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: "completed",
      type: "products",
      items_processed: 1250,
      errors: 0,
      duration: "2m 34s"
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000),
      status: "completed",
      type: "inventory",
      items_processed: 1250,
      errors: 0,
      duration: "45s"
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: "failed",
      type: "orders",
      items_processed: 0,
      errors: 1,
      duration: "12s"
    }
  ]);

  useEffect(() => {
    if (integration) {
      setSettings({
        is_active: integration.is_active || true,
        sync_frequency: integration.sync_frequency || "daily",
        auto_sync: integration.sync_settings?.auto_sync || true,
        sync_settings: {
          products: integration.sync_settings?.products !== false,
          inventory: integration.sync_settings?.inventory !== false,
          orders: integration.sync_settings?.orders !== false,
          customers: integration.sync_settings?.customers === true
        }
      });
    }
  }, [integration]);

  const handleSave = async () => {
    if (!integration) return;

    try {
      await updateIntegration(integration.id, {
        ...integration,
        is_active: settings.is_active,
        sync_frequency: settings.sync_frequency,
        sync_settings: {
          ...settings.sync_settings,
          auto_sync: settings.auto_sync
        }
      });
      
      toast({
        title: "Paramètres sauvegardés",
        description: "Les paramètres de l'intégration ont été mis à jour",
      });
    } catch (error) {
      logError(error as Error, 'Failed to update integration');
    }
  };

  const handleDelete = async () => {
    if (!integration) return;

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'intégration "${integration.platform_name}" ?`)) {
      try {
        await deleteIntegration(integration.id);
        onOpenChange(false);
        toast({
          title: "Intégration supprimée",
          description: "L'intégration a été supprimée avec succès",
        });
      } catch (error) {
        logError(error as Error, 'Failed to delete integration');
      }
    }
  };

  const handleSync = async () => {
    if (!integration) return;

    try {
      await syncIntegration(integration.id);
    } catch (error) {
      logError(error as Error, 'Failed to sync integration');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "running":
        return <Activity className="w-4 h-4 text-warning animate-pulse" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success/10 text-success border-success/20">Terminé</Badge>;
      case "failed":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Échoué</Badge>;
      case "running":
        return <Badge className="bg-warning/10 text-warning border-warning/20">En cours</Badge>;
      default:
        return <Badge variant="secondary">Inconnu</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!integration) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-primary" />
            <div>
              <DialogTitle>Paramètres de l'intégration</DialogTitle>
              <DialogDescription>{integration.platform_name}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
            <TabsTrigger value="sync">Synchronisation</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuration générale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_active">Intégration active</Label>
                    <p className="text-xs text-muted-foreground">Activer ou désactiver cette intégration</p>
                  </div>
                  <Switch
                    id="is_active"
                    checked={settings.is_active}
                    onCheckedChange={(checked) => setSettings({...settings, is_active: checked})}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="sync_frequency">Fréquence de synchronisation</Label>
                  <Select 
                    value={settings.sync_frequency} 
                    onValueChange={(value) => setSettings({...settings, sync_frequency: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Toutes les heures</SelectItem>
                      <SelectItem value="daily">Quotidienne</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="manual">Manuel uniquement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto_sync">Synchronisation automatique</Label>
                    <p className="text-xs text-muted-foreground">Synchroniser automatiquement selon la fréquence</p>
                  </div>
                  <Switch
                    id="auto_sync"
                    checked={settings.auto_sync}
                    onCheckedChange={(checked) => setSettings({...settings, auto_sync: checked})}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Données à synchroniser</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sync_products">Produits</Label>
                    <p className="text-xs text-muted-foreground">Synchroniser les produits et leurs variantes</p>
                  </div>
                  <Switch
                    id="sync_products"
                    checked={settings.sync_settings.products}
                    onCheckedChange={(checked) => setSettings({
                      ...settings, 
                      sync_settings: {...settings.sync_settings, products: checked}
                    })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sync_inventory">Inventaire</Label>
                    <p className="text-xs text-muted-foreground">Synchroniser les niveaux de stock</p>
                  </div>
                  <Switch
                    id="sync_inventory"
                    checked={settings.sync_settings.inventory}
                    onCheckedChange={(checked) => setSettings({
                      ...settings, 
                      sync_settings: {...settings.sync_settings, inventory: checked}
                    })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sync_orders">Commandes</Label>
                    <p className="text-xs text-muted-foreground">Synchroniser les commandes</p>
                  </div>
                  <Switch
                    id="sync_orders"
                    checked={settings.sync_settings.orders}
                    onCheckedChange={(checked) => setSettings({
                      ...settings, 
                      sync_settings: {...settings.sync_settings, orders: checked}
                    })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sync_customers">Clients</Label>
                    <p className="text-xs text-muted-foreground">Synchroniser les données clients</p>
                  </div>
                  <Switch
                    id="sync_customers"
                    checked={settings.sync_settings.customers}
                    onCheckedChange={(checked) => setSettings({
                      ...settings, 
                      sync_settings: {...settings.sync_settings, customers: checked}
                    })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sync" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contrôles de synchronisation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="flex-1"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Synchronisation...' : 'Synchroniser maintenant'}
                  </Button>
                  
                  <Button variant="outline">
                    {settings.is_active ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Suspendre
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Reprendre
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Dernière synchronisation</Label>
                    <p className="font-medium">
                      {integration.last_sync_at ? formatDate(new Date(integration.last_sync_at)) : 'Jamais'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Prochaine synchronisation</Label>
                    <p className="font-medium">
                      {settings.auto_sync ? 'Dans 6h 23m' : 'Manuel'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Statistiques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-success">1,250</div>
                    <div className="text-xs text-muted-foreground">Produits synchronisés</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">847</div>
                    <div className="text-xs text-muted-foreground">Commandes traitées</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-warning">3</div>
                    <div className="text-xs text-muted-foreground">Erreurs ce mois</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Historique des synchronisations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {syncHistory.map((sync) => (
                    <div key={sync.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(sync.status)}
                        <div>
                          <div className="font-medium">{sync.type}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(sync.timestamp)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(sync.status)}
                        <div className="text-xs text-muted-foreground mt-1">
                          {sync.items_processed} éléments • {sync.duration}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={isUpdating}>
                {isUpdating ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
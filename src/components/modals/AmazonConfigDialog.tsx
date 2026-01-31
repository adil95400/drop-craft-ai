import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useIntegrationsUnified, IntegrationTemplate } from "@/hooks/unified";
import { logError } from "@/utils/consoleCleanup";
import { ShoppingCart, Key, Globe, Settings, CheckCircle, AlertTriangle } from "lucide-react";

interface AmazonConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AmazonConfigDialog = ({ open, onOpenChange }: AmazonConfigDialogProps) => {
  const { toast } = useToast();
  const { addIntegration, isAdding } = useIntegrations();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    accessToken: "",
    refreshToken: "",
    clientId: "",
    clientSecret: "",
    sellerId: "",
    marketplaceId: "A1PA6795UKMFR9", // Default to DE
    region: "EU" as "EU" | "NA" | "FE",
    syncProducts: true,
    syncInventory: true,
    syncOrders: true,
    autoSync: true,
    syncFrequency: "hourly" as "daily" | "manual" | "hourly" | "weekly"
  });

  const marketplaces = {
    EU: [
      { id: "A1PA6795UKMFR9", name: "Amazon.de", country: "Allemagne" },
      { id: "A1F83G8C2ARO7P", name: "Amazon.co.uk", country: "Royaume-Uni" },
      { id: "A13V1IB3VIYZZH", name: "Amazon.fr", country: "France" },
      { id: "APJ6JRA9NG5V4", name: "Amazon.it", country: "Italie" },
      { id: "A1RKKUPIHCS9HS", name: "Amazon.es", country: "Espagne" }
    ],
    NA: [
      { id: "ATVPDKIKX0DER", name: "Amazon.com", country: "États-Unis" },
      { id: "A2EUQ1WTGCTBG2", name: "Amazon.ca", country: "Canada" },
      { id: "A1AM78C64UM0Y8", name: "Amazon.com.mx", country: "Mexique" }
    ],
    FE: [
      { id: "A1VC38T7YXB528", name: "Amazon.co.jp", country: "Japon" },
      { id: "A39IBJ37TRP1C6", name: "Amazon.com.au", country: "Australie" }
    ]
  };

  const handleConnect = async () => {
    if (!formData.accessToken || !formData.sellerId || !formData.clientId) {
      toast({
        title: "Erreur",
        description: "Les informations d'authentification Amazon SP-API sont requises",
        variant: "destructive"
      });
      return;
    }

    try {
      await addIntegration({
        id: "amazon",
        name: "Amazon",
        description: "Intégration Amazon SP-API",
        category: "marketplace",
        logo: '📦',
        color: 'bg-orange-500',
        features: [],
        setupSteps: [],
        status: 'available',
        icon: ShoppingCart,
        premium: false,
        rating: 4.2,
        installs: 850
      } as IntegrationTemplate, {
        platform_url: `https://sellingpartnerapi-${formData.region.toLowerCase()}.amazon.com`,
        connection_status: 'connected',
        is_active: true,
        sync_frequency: formData.syncFrequency,
        credentials: {
          access_token: formData.accessToken,
          refresh_token: formData.refreshToken,
          client_id: formData.clientId,
          client_secret: formData.clientSecret,
          seller_id: formData.sellerId,
          marketplace_id: formData.marketplaceId,
          region: formData.region
        }
      });
      
      setStep(3); // Success step
      setTimeout(() => {
        onOpenChange(false);
        setStep(1);
        setFormData({
          accessToken: "",
          refreshToken: "",
          clientId: "",
          clientSecret: "",
          sellerId: "",
          marketplaceId: "A1PA6795UKMFR9",
          region: "EU" as "EU" | "NA" | "FE",
          syncProducts: true,
          syncInventory: true,
          syncOrders: true,
          autoSync: true,
          syncFrequency: "hourly" as "daily" | "manual" | "hourly" | "weekly"
        });
      }, 2000);
    } catch (error) {
      logError(error as Error, 'Amazon connection error');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <ShoppingCart className="w-8 h-8 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Amazon SP-API</h3>
                <p className="text-sm text-muted-foreground">Connectez-vous à Amazon Selling Partner API</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="region" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Région *
                </Label>
                <select
                  id="region"
                  value={formData.region}
                  onChange={(e) => setFormData({...formData, region: e.target.value as "EU" | "NA" | "FE", marketplaceId: marketplaces[e.target.value as keyof typeof marketplaces][0].id})}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="EU">Europe</option>
                  <option value="NA">Amérique du Nord</option>
                  <option value="FE">Extrême-Orient</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="marketplaceId">Marketplace *</Label>
                <select
                  id="marketplaceId"
                  value={formData.marketplaceId}
                  onChange={(e) => setFormData({...formData, marketplaceId: e.target.value})}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  {marketplaces[formData.region].map((marketplace) => (
                    <option key={marketplace.id} value={marketplace.id}>
                      {marketplace.name} ({marketplace.country})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientId" className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Client ID *
                </Label>
                <Input
                  id="clientId"
                  value={formData.clientId}
                  onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                  placeholder="amzn1.application-oa2-client.xxx"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientSecret">Client Secret *</Label>
                <Input
                  id="clientSecret"
                  type="password"
                  value={formData.clientSecret}
                  onChange={(e) => setFormData({...formData, clientSecret: e.target.value})}
                  placeholder="Votre client secret"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellerId">Seller ID *</Label>
                <Input
                  id="sellerId"
                  value={formData.sellerId}
                  onChange={(e) => setFormData({...formData, sellerId: e.target.value})}
                  placeholder="A1XXXXXXXXXXXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessToken">Access Token *</Label>
                <Input
                  id="accessToken"
                  type="password"
                  value={formData.accessToken}
                  onChange={(e) => setFormData({...formData, accessToken: e.target.value})}
                  placeholder="Atza|IwEBIxxx..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="refreshToken">Refresh Token</Label>
                <Input
                  id="refreshToken"
                  type="password"
                  value={formData.refreshToken}
                  onChange={(e) => setFormData({...formData, refreshToken: e.target.value})}
                  placeholder="Atzr|IwEBIxxx..."
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">Configuration SP-API</span>
              </div>
              <p className="text-sm text-blue-700">
                Vous devez créer une application SP-API dans Seller Central et obtenir l'autorisation LWA.
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Settings className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Configuration de la synchronisation</h3>
              <p className="text-sm text-muted-foreground">
                Choisissez les données à synchroniser avec Amazon
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Options de synchronisation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="syncProducts">Produits & Catalogue</Label>
                    <p className="text-xs text-muted-foreground">Synchroniser les informations produits</p>
                  </div>
                  <Switch
                    id="syncProducts"
                    checked={formData.syncProducts}
                    onCheckedChange={(checked) => setFormData({...formData, syncProducts: checked})}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="syncInventory">Inventaire FBA/FBM</Label>
                    <p className="text-xs text-muted-foreground">Synchroniser les niveaux de stock</p>
                  </div>
                  <Switch
                    id="syncInventory"
                    checked={formData.syncInventory}
                    onCheckedChange={(checked) => setFormData({...formData, syncInventory: checked})}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="syncOrders">Commandes</Label>
                    <p className="text-xs text-muted-foreground">Synchroniser les commandes et expéditions</p>
                  </div>
                  <Switch
                    id="syncOrders"
                    checked={formData.syncOrders}
                    onCheckedChange={(checked) => setFormData({...formData, syncOrders: checked})}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoSync">Synchronisation automatique</Label>
                    <p className="text-xs text-muted-foreground">Sync automatique selon la fréquence</p>
                  </div>
                  <Switch
                    id="autoSync"
                    checked={formData.autoSync}
                    onCheckedChange={(checked) => setFormData({...formData, autoSync: checked})}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="text-center space-y-6">
            <CheckCircle className="w-16 h-16 text-success mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-success mb-2">Connexion réussie !</h3>
              <p className="text-muted-foreground">
                Votre intégration Amazon SP-API a été configurée avec succès.
              </p>
            </div>
            <Badge className="bg-success/10 text-success border-success/20">
              Intégration active
            </Badge>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return "Connexion Amazon SP-API";
      case 2: return "Configuration";
      case 3: return "Connexion réussie";
      default: return "Amazon";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getStepTitle()}</DialogTitle>
          <DialogDescription>
            {step === 1 && "Entrez vos informations SP-API Amazon"}
            {step === 2 && "Configurez les options de synchronisation"}
            {step === 3 && "Votre intégration Amazon est prête"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {renderStep()}
        </div>

        {step < 3 && (
          <DialogFooter>
            <div className="flex justify-between w-full">
              <div>
                {step > 1 && (
                  <Button variant="outline" onClick={() => setStep(step - 1)}>
                    Retour
                  </Button>
                )}
              </div>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                {step === 1 && (
                  <Button 
                    onClick={() => setStep(2)}
                    disabled={!formData.accessToken || !formData.sellerId || !formData.clientId}
                  >
                    Continuer
                  </Button>
                )}
                {step === 2 && (
                  <Button 
                    onClick={handleConnect}
                    disabled={isAdding}
                    className="bg-primary hover:bg-primary-hover text-primary-foreground"
                  >
                    {isAdding ? 'Connexion...' : 'Connecter'}
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
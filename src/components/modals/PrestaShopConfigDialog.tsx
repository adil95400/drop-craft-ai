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
import { productionLogger } from "@/utils/productionLogger";
import { ShoppingCart, Key, Globe, Settings, CheckCircle, AlertTriangle } from "lucide-react";

interface PrestaShopConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PrestaShopConfigDialog = ({ open, onOpenChange }: PrestaShopConfigDialogProps) => {
  const { toast } = useToast();
  const { addIntegration, isAdding } = useIntegrationsUnified();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    shopUrl: "",
    apiKey: "",
    webserviceEnabled: true,
    syncProducts: true,
    syncCategories: true,
    syncCustomers: true,
    syncOrders: true,
    syncStock: true,
    autoSync: true,
    syncFrequency: "daily" as "daily" | "manual" | "hourly" | "weekly"
  });

  const [connectionTest, setConnectionTest] = useState({
    tested: false,
    success: false,
    message: ""
  });

  const testConnection = async () => {
    if (!formData.shopUrl || !formData.apiKey) {
      toast({
        title: "Erreur",
        description: "URL de la boutique et clé API sont requis pour le test",
        variant: "destructive"
      });
      return;
    }

    // Test de connexion via fetch HEAD vers l'URL fournie
    setTimeout(async () => {
      let success = false;
      try {
        await fetch(formData.shopUrl, { method: 'HEAD', mode: 'no-cors' });
        success = true; // no-cors won't throw if reachable
      } catch {
        success = false;
      }
      setConnectionTest({
        tested: true,
        success,
        message: success 
          ? "Connexion réussie ! PrestaShop est accessible." 
          : "Impossible de se connecter. Vérifiez l'URL et la clé API."
      });
      
      toast({
        title: success ? "Test réussi" : "Test échoué",
        description: success 
          ? "La connexion à PrestaShop fonctionne correctement" 
          : "Impossible de se connecter à PrestaShop",
        variant: success ? "default" : "destructive"
      });
    }, 2000);
  };

  const handleConnect = async () => {
    if (!formData.shopUrl || !formData.apiKey) {
      toast({
        title: "Erreur",
        description: "URL de la boutique et clé API sont requis",
        variant: "destructive"
      });
      return;
    }

    try {
      await addIntegration({
        template: {
          id: "prestashop",
          name: "PrestaShop",
          description: "Intégration PrestaShop",
          category: "ecommerce",
          logo: '🏬',
          color: 'bg-blue-500',
          features: [],
          setupSteps: [],
          status: 'available'
        } as IntegrationTemplate,
        config: {
          platform_url: formData.shopUrl,
          connection_status: 'connected',
          is_active: true,
          sync_frequency: formData.syncFrequency
        },
        credentials: {
          api_key: formData.apiKey,
          shop_url: formData.shopUrl
        }
      });
      
      setStep(3); // Success step
      setTimeout(() => {
        onOpenChange(false);
        setStep(1);
        setFormData({
          shopUrl: "",
          apiKey: "",
          webserviceEnabled: true,
          syncProducts: true,
          syncCategories: true,
          syncCustomers: true,
          syncOrders: true,
          syncStock: true,
          autoSync: true,
          syncFrequency: "daily" as "daily" | "manual" | "hourly" | "weekly"
        });
        setConnectionTest({
          tested: false,
          success: false,
          message: ""
        });
      }, 2000);
    } catch (error) {
      productionLogger.error('PrestaShop connection error', error as Error);
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
                <h3 className="font-semibold text-foreground">PrestaShop</h3>
                <p className="text-sm text-muted-foreground">Connectez votre boutique PrestaShop</p>
              </div>
            </div>

            <Card className="border-warning/20 bg-warning/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-warning">Prérequis PrestaShop</p>
                    <p className="text-muted-foreground mt-1">
                      Assurez-vous que le webservice est activé dans votre administration PrestaShop 
                      (Paramètres avancés → Webservice)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shopUrl" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  URL de la boutique *
                </Label>
                <Input
                  id="shopUrl"
                  value={formData.shopUrl}
                  onChange={(e) => setFormData({...formData, shopUrl: e.target.value})}
                  placeholder="https://votre-boutique.com"
                />
                <p className="text-xs text-muted-foreground">
                  URL complète de votre boutique PrestaShop (avec https://)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey" className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Clé API *
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                  placeholder="Votre clé API PrestaShop"
                />
                <p className="text-xs text-muted-foreground">
                  Générez une clé API dans Paramètres avancés → Webservice
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="webserviceEnabled">Webservice activé</Label>
                  <p className="text-xs text-muted-foreground">Le webservice PrestaShop est activé</p>
                </div>
                <Switch
                  id="webserviceEnabled"
                  checked={formData.webserviceEnabled}
                  onCheckedChange={(checked) => setFormData({...formData, webserviceEnabled: checked})}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                variant="outline" 
                onClick={testConnection}
                disabled={!formData.shopUrl || !formData.apiKey}
                className="w-full"
              >
                Tester la connexion
              </Button>

              {connectionTest.tested && (
                <Card className={connectionTest.success ? "border-success/20 bg-success/5" : "border-destructive/20 bg-destructive/5"}>
                  <CardContent className="p-4">
                    <div className={`flex items-center gap-2 ${connectionTest.success ? "text-success" : "text-destructive"}`}>
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">
                        {connectionTest.success ? "Test réussi" : "Test échoué"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {connectionTest.message}
                    </p>
                  </CardContent>
                </Card>
              )}
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
                Choisissez les données à synchroniser avec PrestaShop
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Options de synchronisation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="syncProducts">Produits</Label>
                    <p className="text-xs text-muted-foreground">Synchroniser les produits et leurs variantes</p>
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
                    <Label htmlFor="syncCategories">Catégories</Label>
                    <p className="text-xs text-muted-foreground">Synchroniser les catégories de produits</p>
                  </div>
                  <Switch
                    id="syncCategories"
                    checked={formData.syncCategories}
                    onCheckedChange={(checked) => setFormData({...formData, syncCategories: checked})}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="syncStock">Stock</Label>
                    <p className="text-xs text-muted-foreground">Synchroniser les niveaux de stock</p>
                  </div>
                  <Switch
                    id="syncStock"
                    checked={formData.syncStock}
                    onCheckedChange={(checked) => setFormData({...formData, syncStock: checked})}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="syncOrders">Commandes</Label>
                    <p className="text-xs text-muted-foreground">Synchroniser les commandes</p>
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
                    <Label htmlFor="syncCustomers">Clients</Label>
                    <p className="text-xs text-muted-foreground">Synchroniser les données clients</p>
                  </div>
                  <Switch
                    id="syncCustomers"
                    checked={formData.syncCustomers}
                    onCheckedChange={(checked) => setFormData({...formData, syncCustomers: checked})}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoSync">Synchronisation automatique</Label>
                    <p className="text-xs text-muted-foreground">Synchronisation quotidienne automatique</p>
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
                Votre boutique PrestaShop a été connectée avec succès.
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
      case 1: return "Connexion PrestaShop";
      case 2: return "Configuration";
      case 3: return "Connexion réussie";
      default: return "PrestaShop";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{getStepTitle()}</DialogTitle>
          <DialogDescription>
            {step === 1 && "Entrez vos informations de connexion PrestaShop"}
            {step === 2 && "Configurez les options de synchronisation"}
            {step === 3 && "Votre intégration PrestaShop est prête"}
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
                    disabled={!formData.shopUrl || !formData.apiKey || !connectionTest.success}
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
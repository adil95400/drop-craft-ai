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

interface WooCommerceConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WooCommerceConfigDialog = ({ open, onOpenChange }: WooCommerceConfigDialogProps) => {
  const { toast } = useToast();
  const { addIntegration, isAdding } = useIntegrationsUnified();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    storeUrl: "",
    consumerKey: "",
    consumerSecret: "",
    syncProducts: true,
    syncInventory: true,
    syncOrders: true,
    autoSync: true,
    syncFrequency: "hourly" as "daily" | "manual" | "hourly" | "weekly"
  });

  const handleConnect = async () => {
    if (!formData.storeUrl || !formData.consumerKey || !formData.consumerSecret) {
      toast({
        title: "Erreur",
        description: "L'URL de la boutique et les clés d'API WooCommerce sont requises",
        variant: "destructive"
      });
      return;
    }

    try {
      await addIntegration({
        template: {
          id: "woocommerce",
          name: "WooCommerce",
          description: "Intégration WooCommerce",
          category: "ecommerce",
          logo: '🟣',
          color: 'bg-purple-500',
          features: [],
          setupSteps: [],
          status: 'available'
        } as IntegrationTemplate,
        config: {
          platform_url: formData.storeUrl,
          connection_status: 'connected',
          is_active: true,
          sync_frequency: formData.syncFrequency
        },
        credentials: {
          store_url: formData.storeUrl,
          consumer_key: formData.consumerKey,
          consumer_secret: formData.consumerSecret
        }
      });
      
      setStep(3); // Success step
      setTimeout(() => {
        onOpenChange(false);
        setStep(1);
        setFormData({
          storeUrl: "",
          consumerKey: "",
          consumerSecret: "",
          syncProducts: true,
          syncInventory: true,
          syncOrders: true,
          autoSync: true,
          syncFrequency: "hourly" as "daily" | "manual" | "hourly" | "weekly"
        });
      }, 2000);
    } catch (error) {
      productionLogger.error('WooCommerce connection error', error as Error);
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
                <h3 className="font-semibold text-foreground">WooCommerce</h3>
                <p className="text-sm text-muted-foreground">Connectez votre boutique WooCommerce</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeUrl" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  URL de la boutique *
                </Label>
                <Input
                  id="storeUrl"
                  value={formData.storeUrl}
                  onChange={(e) => setFormData({...formData, storeUrl: e.target.value})}
                  placeholder="https://votre-boutique.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="consumerKey" className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Consumer Key *
                </Label>
                <Input
                  id="consumerKey"
                  value={formData.consumerKey}
                  onChange={(e) => setFormData({...formData, consumerKey: e.target.value})}
                  placeholder="ck_xxxxxxxxxxxxxxxxx"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="consumerSecret">Consumer Secret *</Label>
                <Input
                  id="consumerSecret"
                  type="password"
                  value={formData.consumerSecret}
                  onChange={(e) => setFormData({...formData, consumerSecret: e.target.value})}
                  placeholder="cs_xxxxxxxxxxxxxxxxx"
                />
                <p className="text-xs text-muted-foreground">
                  Créez des clés API REST dans WooCommerce → Paramètres → Avancé → REST API
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">Prérequis</span>
              </div>
              <p className="text-sm text-blue-700">
                Assurez-vous que l'API REST WooCommerce est activée et que les permaliens sont configurés.
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
                Choisissez les données à synchroniser avec WooCommerce
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
                    <p className="text-xs text-muted-foreground">Synchroniser les produits et leurs variations</p>
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
                    <Label htmlFor="syncInventory">Inventaire</Label>
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
                    <p className="text-xs text-muted-foreground">Synchroniser les commandes WooCommerce</p>
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
                    <p className="text-xs text-muted-foreground">Synchronisation régulière</p>
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
                Votre boutique WooCommerce a été connectée avec succès.
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
      case 1: return "Connexion WooCommerce";
      case 2: return "Configuration";
      case 3: return "Connexion réussie";
      default: return "WooCommerce";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{getStepTitle()}</DialogTitle>
          <DialogDescription>
            {step === 1 && "Entrez vos informations de connexion WooCommerce"}
            {step === 2 && "Configurez les options de synchronisation"}
            {step === 3 && "Votre intégration WooCommerce est prête"}
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
                    disabled={!formData.storeUrl || !formData.consumerKey || !formData.consumerSecret}
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
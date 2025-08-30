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
import { useIntegrations } from "@/hooks/useIntegrations";
import { ShoppingBag, Key, Globe, Settings, CheckCircle } from "lucide-react";

interface ShopifyConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShopifyConfigDialog = ({ open, onOpenChange }: ShopifyConfigDialogProps) => {
  const { toast } = useToast();
  const { addIntegration, isAdding } = useIntegrations();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    shopDomain: "",
    accessToken: "",
    webhookUrl: "",
    syncProducts: true,
    syncInventory: true,
    syncOrders: true,
    autoSync: true,
    syncFrequency: "hourly" as "daily" | "manual" | "hourly" | "weekly"
  });

  const handleConnect = async () => {
    if (!formData.shopDomain || !formData.accessToken) {
      toast({
        title: "Erreur",
        description: "Le domaine de la boutique et le token d'accès sont requis",
        variant: "destructive"
      });
      return;
    }

    try {
      await addIntegration({
        platform_name: "Shopify",
        platform_type: "ecommerce",
        platform_url: `https://${formData.shopDomain}.myshopify.com`,
        connection_status: 'connected',
        is_active: true,
        sync_frequency: formData.syncFrequency,
        credentials: {
          access_token: formData.accessToken,
          shop_domain: formData.shopDomain
        }
      });
      
      setStep(3); // Success step
      setTimeout(() => {
        onOpenChange(false);
        setStep(1);
        setFormData({
          shopDomain: "",
          accessToken: "",
          webhookUrl: "",
          syncProducts: true,
          syncInventory: true,
          syncOrders: true,
          autoSync: true,
          syncFrequency: "hourly" as "daily" | "manual" | "hourly" | "weekly"
        });
      }, 2000);
    } catch (error) {
      console.error('Shopify connection error:', error);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <ShoppingBag className="w-8 h-8 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Shopify</h3>
                <p className="text-sm text-muted-foreground">Connectez votre boutique Shopify</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shopDomain" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Domaine de la boutique *
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="shopDomain"
                    value={formData.shopDomain}
                    onChange={(e) => setFormData({...formData, shopDomain: e.target.value})}
                    placeholder="votre-boutique"
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">.myshopify.com</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessToken" className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Token d'accès privé *
                </Label>
                <Input
                  id="accessToken"
                  type="password"
                  value={formData.accessToken}
                  onChange={(e) => setFormData({...formData, accessToken: e.target.value})}
                  placeholder="shpat_xxxxxxxxxxxxxxxxx"
                />
                <p className="text-xs text-muted-foreground">
                  Créez une application privée dans votre admin Shopify pour obtenir ce token
                </p>
              </div>
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
                Choisissez les données à synchroniser avec Shopify
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
                    <Label htmlFor="autoSync">Synchronisation automatique</Label>
                    <p className="text-xs text-muted-foreground">Synchronisation toutes les heures</p>
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
                Votre boutique Shopify "{formData.shopDomain}" a été connectée avec succès.
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
      case 1: return "Connexion Shopify";
      case 2: return "Configuration";
      case 3: return "Connexion réussie";
      default: return "Shopify";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{getStepTitle()}</DialogTitle>
          <DialogDescription>
            {step === 1 && "Entrez vos informations de connexion Shopify"}
            {step === 2 && "Configurez les options de synchronisation"}
            {step === 3 && "Votre intégration Shopify est prête"}
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
                    disabled={!formData.shopDomain || !formData.accessToken}
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
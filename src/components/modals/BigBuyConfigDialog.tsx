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

interface BigBuyConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BigBuyConfigDialog = ({ open, onOpenChange }: BigBuyConfigDialogProps) => {
  const { toast } = useToast();
  const { addIntegration, isAdding } = useIntegrationsUnified();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    apiKey: "",
    testMode: true,
    syncProducts: true,
    syncInventory: true,
    syncOrders: true,
    autoSync: true,
    syncFrequency: "hourly" as "daily" | "manual" | "hourly" | "weekly",
    language: "fr" as "fr" | "en" | "es" | "de"
  });

  const handleConnect = async () => {
    if (!formData.apiKey) {
      toast({
        title: "Erreur",
        description: "La clé API BigBuy est requise",
        variant: "destructive"
      });
      return;
    }

    try {
      await addIntegration({
        template: {
          id: "bigbuy",
          name: "BigBuy", 
          description: "Intégration BigBuy - Grossiste européen",
          category: "ecommerce",
          logo: '🏪',
          color: 'bg-blue-500',
          features: [],
          setupSteps: [],
          status: 'available'
        } as IntegrationTemplate,
        config: {
          platform_url: formData.testMode ? "https://api-test.bigbuy.eu" : "https://api.bigbuy.eu",
          connection_status: 'connected',
          is_active: true,
          sync_frequency: formData.syncFrequency
        },
        credentials: {
          api_key: formData.apiKey,
          test_mode: String(formData.testMode),
          language: formData.language
        }
      });
      
      setStep(3); // Success step
      setTimeout(() => {
        onOpenChange(false);
        setStep(1);
        setFormData({
          apiKey: "",
          testMode: true,
          syncProducts: true,
          syncInventory: true,
          syncOrders: true,
          autoSync: true,
          syncFrequency: "hourly" as "daily" | "manual" | "hourly" | "weekly",
          language: "fr" as "fr" | "en" | "es" | "de"
        });
      }, 2000);
    } catch (error) {
      logError(error as Error, 'BigBuy connection error');
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
                <h3 className="font-semibold text-foreground">BigBuy</h3>
                <p className="text-sm text-muted-foreground">Connectez-vous à BigBuy, grossiste européen</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Clé API BigBuy *
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                  placeholder="Votre clé API BigBuy"
                />
                <p className="text-xs text-muted-foreground">
                  Obtenez votre clé API depuis votre compte BigBuy
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Langue
                </Label>
                <select
                  id="language"
                  value={formData.language}
                  onChange={(e) => setFormData({...formData, language: e.target.value as "fr" | "en" | "es" | "de"})}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="testMode">Mode test</Label>
                  <p className="text-xs text-muted-foreground">Utiliser l'environnement de test BigBuy</p>
                </div>
                <Switch
                  id="testMode"
                  checked={formData.testMode}
                  onCheckedChange={(checked) => setFormData({...formData, testMode: checked})}
                />
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
                Choisissez les données à synchroniser avec BigBuy
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
                    <p className="text-xs text-muted-foreground">Synchroniser le catalogue de produits</p>
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
                    <Label htmlFor="syncInventory">Stock</Label>
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
                    <p className="text-xs text-muted-foreground">Synchronisation régulière automatique</p>
                  </div>
                  <Switch
                    id="autoSync"
                    checked={formData.autoSync}
                    onCheckedChange={(checked) => setFormData({...formData, autoSync: checked})}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span className="font-medium text-orange-800">Information importante</span>
              </div>
              <p className="text-sm text-orange-700">
                BigBuy est une plateforme B2B. Assurez-vous d'avoir un compte professionnel validé.
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="text-center space-y-6">
            <CheckCircle className="w-16 h-16 text-success mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-success mb-2">Connexion réussie !</h3>
              <p className="text-muted-foreground">
                Votre intégration BigBuy a été configurée avec succès.
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
      case 1: return "Connexion BigBuy";
      case 2: return "Configuration";
      case 3: return "Connexion réussie";
      default: return "BigBuy";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{getStepTitle()}</DialogTitle>
          <DialogDescription>
            {step === 1 && "Entrez vos informations de connexion BigBuy"}
            {step === 2 && "Configurez les options de synchronisation"}
            {step === 3 && "Votre intégration BigBuy est prête"}
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
                    disabled={!formData.apiKey}
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
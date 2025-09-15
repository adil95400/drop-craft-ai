import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useRealIntegrations } from "@/hooks/useRealIntegrations";
import { supabase } from "@/integrations/supabase/client";
import { logError } from '@/utils/consoleCleanup';

interface CreateIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateIntegrationDialog = ({ open, onOpenChange }: CreateIntegrationDialogProps) => {
  const { toast } = useToast();
  const { addIntegration, isAdding } = useRealIntegrations();
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    apiKey: "",
    apiSecret: "",
    webhookUrl: "",
    description: "",
    enabled: true
  });

  const handleCreate = async () => {
    if (!formData.name || !formData.type || !formData.apiKey) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour créer une intégration",
          variant: "destructive"
        });
        return;
      }

      const credentials: Record<string, string> = {}
      if (formData.apiKey) credentials.api_key = formData.apiKey
      if (formData.apiSecret) credentials.api_secret = formData.apiSecret

      addIntegration({
        platform_name: formData.name,
        platform_type: formData.type,
        platform_url: formData.webhookUrl || undefined,
        is_active: formData.enabled,
        connection_status: 'disconnected',
        credentials: Object.keys(credentials).length > 0 ? credentials : undefined,
      });

      onOpenChange(false);
      setFormData({
        name: "",
        type: "",
        apiKey: "",
        apiSecret: "",
        webhookUrl: "",
        description: "",
        enabled: true
      });
    } catch (error) {
      logError(error as Error, 'Failed to create integration');
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de l'intégration",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouvelle Intégration</DialogTitle>
          <DialogDescription>
            Configurez une nouvelle intégration avec un service externe
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'intégration</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Shopify Store"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type d'intégration</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shopify">Shopify</SelectItem>
                  <SelectItem value="woocommerce">WooCommerce</SelectItem>
                  <SelectItem value="aliexpress">AliExpress</SelectItem>
                  <SelectItem value="amazon">Amazon</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description de l'intégration"
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="apiKey">Clé API</Label>
            <Input
              id="apiKey"
              type="password"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              placeholder="Votre clé API"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="apiSecret">Secret API (optionnel)</Label>
            <Input
              id="apiSecret"
              type="password"
              value={formData.apiSecret}
              onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
              placeholder="Secret API si requis"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="webhookUrl">URL Webhook (optionnel)</Label>
            <Input
              id="webhookUrl"
              value={formData.webhookUrl}
              onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
              placeholder="https://votre-site.com/webhook"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(enabled) => setFormData({ ...formData, enabled })}
            />
            <Label htmlFor="enabled">Activer l'intégration</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleCreate} disabled={isAdding}>
            {isAdding ? "Création..." : "Créer l'intégration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
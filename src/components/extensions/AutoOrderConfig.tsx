import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Play, Settings } from 'lucide-react';

export const AutoOrderConfig = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    autoProcess: false,
    orderStatus: 'confirmed',
    supplierPreference: 'primary',
    notifySupplier: true,
    notifyCustomer: true
  });

  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('extension-hub', {
        body: { handler: 'auto-order', action: 'configure', config }
      });

      if (error) throw error;

      toast({
        title: "Configuration sauvegardée",
        description: "Les paramètres ont été mis à jour avec succès"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestOrder = async () => {
    setLoading(true);
    try {
      // Test avec une commande factice
      const { data, error } = await supabase.functions.invoke('extension-hub', {
        body: { 
          handler: 'auto-order',
          action: 'process_order',
          orderId: 'test-order',
          config
        }
      });

      if (error) throw error;

      toast({
        title: "Test réussi",
        description: "La commande automatique a été simulée avec succès"
      });
    } catch (error) {
      toast({
        title: "Erreur de test",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration Auto-Order
          </CardTitle>
          <CardDescription>
            Configurez le traitement automatique des commandes auprès de vos fournisseurs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-process">Traitement automatique</Label>
              <p className="text-sm text-muted-foreground">
                Passer automatiquement les commandes aux fournisseurs
              </p>
            </div>
            <Switch
              id="auto-process"
              checked={config.autoProcess}
              onCheckedChange={(checked) => setConfig({ ...config, autoProcess: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label>Statut de déclenchement</Label>
            <Select 
              value={config.orderStatus} 
              onValueChange={(value) => setConfig({ ...config, orderStatus: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">Confirmée</SelectItem>
                <SelectItem value="paid">Payée</SelectItem>
                <SelectItem value="processing">En traitement</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Lancer l'auto-order quand la commande atteint ce statut
            </p>
          </div>

          <div className="space-y-2">
            <Label>Préférence fournisseur</Label>
            <Select 
              value={config.supplierPreference} 
              onValueChange={(value) => setConfig({ ...config, supplierPreference: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Fournisseur principal uniquement</SelectItem>
                <SelectItem value="cheapest">Moins cher disponible</SelectItem>
                <SelectItem value="fastest">Plus rapide disponible</SelectItem>
                <SelectItem value="backup">Avec backup si rupture</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notify-supplier">Notifier le fournisseur</Label>
              <p className="text-sm text-muted-foreground">
                Envoyer un email de confirmation au fournisseur
              </p>
            </div>
            <Switch
              id="notify-supplier"
              checked={config.notifySupplier}
              onCheckedChange={(checked) => setConfig({ ...config, notifySupplier: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notify-customer">Notifier le client</Label>
              <p className="text-sm text-muted-foreground">
                Informer le client de l'expédition
              </p>
            </div>
            <Switch
              id="notify-customer"
              checked={config.notifyCustomer}
              onCheckedChange={(checked) => setConfig({ ...config, notifyCustomer: checked })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSaveConfig} disabled={loading}>
              Sauvegarder la configuration
            </Button>
            <Button onClick={handleTestOrder} disabled={loading} variant="outline">
              <Play className="h-4 w-4 mr-2" />
              Tester
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

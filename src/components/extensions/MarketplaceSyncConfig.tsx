import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const PLATFORMS = [
  { id: 'shopify', name: 'Shopify', icon: '🛒' },
  { id: 'amazon', name: 'Amazon', icon: '📦' },
  { id: 'ebay', name: 'eBay', icon: '🔨' },
  { id: 'woocommerce', name: 'WooCommerce', icon: '🛍️' },
  { id: 'etsy', name: 'Etsy', icon: '🎨' },
];

export const MarketplaceSyncConfig = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleSync = async () => {
    if (selectedPlatforms.length === 0) {
      toast({
        title: "Sélection requise",
        description: "Veuillez sélectionner au moins une plateforme",
        variant: "destructive"
      });
      return;
    }

    setSyncing(true);
    try {
      // Récupérer quelques produits pour la démo
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .limit(5);

      const productIds = products?.map(p => p.id) || [];

      const { data, error } = await supabase.functions.invoke('extension-marketplace-sync', {
        body: { 
          action: 'sync_products',
          productIds,
          platforms: selectedPlatforms
        }
      });

      if (error) throw error;

      toast({
        title: "Synchronisation réussie",
        description: `${productIds.length} produits synchronisés sur ${selectedPlatforms.length} plateformes`
      });
    } catch (error) {
      toast({
        title: "Erreur de synchronisation",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Synchronisation Multi-Marketplace
          </CardTitle>
          <CardDescription>
            Synchronisez vos produits automatiquement sur plusieurs plateformes e-commerce
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label>Plateformes connectées</Label>
            {PLATFORMS.map((platform) => (
              <div key={platform.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={platform.id}
                    checked={selectedPlatforms.includes(platform.id)}
                    onCheckedChange={() => handlePlatformToggle(platform.id)}
                  />
                  <Label htmlFor={platform.id} className="flex items-center gap-2 cursor-pointer">
                    <span className="text-2xl">{platform.icon}</span>
                    <span className="font-medium">{platform.name}</span>
                  </Label>
                </div>
                <Badge variant={selectedPlatforms.includes(platform.id) ? 'default' : 'secondary'}>
                  {selectedPlatforms.includes(platform.id) ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            ))}
          </div>

          <div className="pt-4">
            <Button 
              onClick={handleSync} 
              disabled={syncing || selectedPlatforms.length === 0}
              className="w-full"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Synchronisation...' : 'Synchroniser maintenant'}
            </Button>
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-sm">Fonctionnalités incluses:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>✓ Synchronisation bidirectionnelle des stocks</li>
              <li>✓ Mise à jour automatique des prix</li>
              <li>✓ Gestion des commandes centralisée</li>
              <li>✓ Synchronisation des images et descriptions</li>
              <li>✓ Support multi-devises</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

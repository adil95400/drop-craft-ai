import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function ShopifyDiagnostic() {
  const [isTesting, setIsTesting] = useState(false);

  const { data: integration, isLoading: integrationLoading, refetch: refetchIntegration } = useQuery({
    queryKey: ['shopify-integration'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('store_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'shopify')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['imported-products-shopify'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('imported_products')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('supplier_name', 'Shopify');

      if (error) throw error;
      return data;
    },
  });

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('shopify-auto-sync');

      if (error) throw error;

      toast({
        title: 'Synchronisation lancée',
        description: 'Vérifiez les résultats dans quelques instants',
      });

      setTimeout(() => {
        refetchIntegration();
        refetchProducts();
      }, 3000);
    } catch (error) {
      toast({
        title: 'Erreur de synchronisation',
        description: error instanceof Error ? error.message : 'Impossible de synchroniser avec Shopify',
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Connecté</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Erreur</Badge>;
      default:
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Inconnu</Badge>;
    }
  };

  if (integrationLoading || productsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!integration) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Aucune intégration Shopify</CardTitle>
            <CardDescription>Vous devez d'abord connecter votre magasin Shopify</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Diagnostic Shopify</h1>
          <p className="text-muted-foreground">État de votre intégration Shopify</p>
        </div>
        <Button onClick={testConnection} disabled={isTesting}>
          {isTesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Tester la connexion
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Statut de la connexion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">État</span>
              {getStatusBadge(integration.connection_status || 'unknown')}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Magasin</span>
              <span className="text-sm text-muted-foreground">
                {(integration.credentials as any)?.shop_domain || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Dernière sync</span>
              <span className="text-sm text-muted-foreground">
                {integration.last_sync_at 
                  ? new Date(integration.last_sync_at).toLocaleString('fr-FR')
                  : 'Jamais'}
              </span>
            </div>
            {(integration.error_log as any)?.message && (
              <div className="p-3 bg-destructive/10 rounded-md">
                <p className="text-sm text-destructive">{(integration.error_log as any).message}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistiques des produits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Produits synchronisés</span>
              <span className="text-2xl font-bold">{products?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Produits Shopify (déclaré)</span>
              <span className="text-2xl font-bold">{integration.product_count || 0}</span>
            </div>
            {products && integration.product_count && products.length !== integration.product_count && (
              <div className="p-3 bg-yellow-500/10 rounded-md">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  ⚠️ Différence détectée : {integration.product_count - products.length} produits manquants
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Gérez votre intégration Shopify</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Synchronisation automatique</h3>
              <p className="text-sm text-muted-foreground">
                Les produits sont synchronisés automatiquement toutes les heures
              </p>
            </div>
            <Badge variant="outline">Actif</Badge>
          </div>
          
          <div className="p-4 border border-yellow-500/20 bg-yellow-500/5 rounded-lg">
            <h3 className="font-medium mb-2">⚠️ Problème de connexion ?</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Si vous voyez une erreur "app_not_installed" ou si seulement 20 produits sont synchronisés,
              vous devez reconnecter votre magasin Shopify pour générer un nouveau token d'accès.
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="/dashboard/stores/integrations">Gérer les intégrations</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

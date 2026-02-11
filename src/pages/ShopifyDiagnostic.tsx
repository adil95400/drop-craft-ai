import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, AlertCircle, RefreshCw, Store, Link2, RotateCcw, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ShopifyCredentialsDialog } from '@/components/stores/ShopifyCredentialsDialog';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function ShopifyDiagnostic() {
  const [isTesting, setIsTesting] = useState(false);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: integration, isLoading: integrationLoading, refetch: refetchIntegration } = useQuery({
    queryKey: ['shopify-integration'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Check store_integrations first (use maybeSingle to avoid PGRST116 errors)
      const { data: storeData, error: storeError } = await supabase
        .from('store_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'shopify')
        .eq('is_active', true)
        .maybeSingle();

      if (storeError) {
        console.error('store_integrations query error:', storeError);
      }

      if (storeData) return { ...storeData, source: 'store_integrations' };

      // Fallback to integrations table (use maybeSingle)
      const { data: integrationData, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'shopify')
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('integrations query error:', error);
        throw error;
      }
      
      return integrationData ? { ...integrationData, source: 'integrations' } : null;
    },
  });

  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['imported-products-shopify'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error, count } = await supabase
        .from('imported_products')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .limit(1);

      if (error) throw error;
      return { items: data, count };
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session expirée');

      // Test la connexion via l'edge function
      const { data, error } = await supabase.functions.invoke('shopify-fetch-products', {
        body: { action: 'test_connection' },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Connexion OK',
          description: `Connecté à ${data.shop_name || 'votre boutique Shopify'}`,
        });
        refetchIntegration();
        refetchProducts();
      } else {
        toast({
          title: 'Erreur de connexion',
          description: data.error || 'Token invalide ou expiré',
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur de test',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const syncProducts = async () => {
    setIsTesting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session expirée');

      const { data, error } = await supabase.functions.invoke('shopify-auto-sync', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;

      toast({
        title: 'Synchronisation lancée',
        description: `${data?.products_synced || 0} produits synchronisés`,
      });

      setTimeout(() => {
        refetchIntegration();
        refetchProducts();
      }, 3000);
    } catch (error) {
      toast({
        title: 'Erreur de synchronisation',
        description: error instanceof Error ? error.message : 'Impossible de synchroniser',
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusBadge = (status: string | undefined, isActive: boolean | undefined) => {
    if (!isActive) {
      return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Inactif</Badge>;
    }
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Connecté</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Erreur</Badge>;
      default:
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />{isActive ? 'Actif' : 'Inconnu'}</Badge>;
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
      <ChannablePageWrapper title="Diagnostic Shopify" heroImage="integrations" badge={{ label: 'Shopify', icon: Store }}>
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <Store className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle>Aucune intégration Shopify</CardTitle>
            <CardDescription>Vous devez d'abord connecter votre magasin Shopify</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <a href="/stores-channels/integrations">
                <Link2 className="w-4 h-4 mr-2" />
                Connecter Shopify
              </a>
            </Button>
          </CardContent>
        </Card>
      </ChannablePageWrapper>
    );
  }

  const shopDomain = integration.store_url || 
    (integration as any).config?.credentials?.shop_domain || 
    'N/A';
  
  const connectionStatus = (integration as any).connection_status || 
    ((integration as any).sync_status) || 
    (integration.is_active ? 'connected' : 'unknown');
    
  const autoSyncEnabled = (integration as any).auto_sync_enabled ?? 
    (integration as any).sync_products ?? 
    false;

  return (
    <ChannablePageWrapper
      title="Diagnostic Shopify"
      description="État de votre intégration Shopify"
      heroImage="integrations"
      badge={{ label: 'Shopify', icon: Store }}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => testConnectionMutation.mutate()} disabled={testConnectionMutation.isPending}>
            {testConnectionMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Tester
          </Button>
          <Button onClick={syncProducts} disabled={isTesting}>
            {isTesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Synchroniser
          </Button>
        </div>
      }
    >

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Statut de la connexion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">État</span>
              {getStatusBadge(connectionStatus, integration.is_active)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Magasin</span>
              <span className="text-sm text-muted-foreground font-mono">
                {shopDomain}
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
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Source</span>
              <Badge variant="outline" className="text-xs">
                {integration.source || 'integrations'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistiques des produits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Produits importés</span>
              <span className="text-2xl font-bold">{products?.count || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertCircle className="w-5 h-5" />
            Problème de connexion ?
          </CardTitle>
          <CardDescription>
            Si vous voyez une erreur "Token invalide" ou "UNAUTHORIZED", vous devez reconnecter votre boutique.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowCredentialsDialog(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Reconfigurer les credentials
            </Button>
            <Button variant="outline" asChild>
              <a href="/stores-channels/integrations">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reconnecter Shopify
              </a>
            </Button>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Assurez-vous que votre token Admin API a les permissions : <code>read_products</code>, <code>write_products</code>, <code>read_locations</code></p>
            <p>• Les tokens d'application privée n'expirent pas, mais les scopes peuvent changer</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Synchronisation automatique</CardTitle>
          <CardDescription>Configuration de la synchronisation en temps réel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Sync automatique</h3>
              <p className="text-sm text-muted-foreground">
                Les produits sont synchronisés automatiquement toutes les heures
              </p>
            </div>
            <Badge variant="outline">
              {autoSyncEnabled ? 'Actif' : 'Inactif'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {integration && (
        <ShopifyCredentialsDialog
          open={showCredentialsDialog}
          onOpenChange={setShowCredentialsDialog}
          integrationId={integration.id}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['shopify-integration'] });
            refetchIntegration();
          }}
        />
      )}
    </ChannablePageWrapper>
  );
}

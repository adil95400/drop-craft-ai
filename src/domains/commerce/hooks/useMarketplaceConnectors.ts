import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MarketplaceConnector {
  id: string;
  name: string;
  provider: 'amazon' | 'ebay' | 'aliexpress' | 'shopify' | 'woocommerce';
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: Date;
  config: Record<string, any>;
  credentials?: Record<string, string>;
}

export interface ConnectMarketplaceOptions {
  provider: MarketplaceConnector['provider'];
  credentials: Record<string, string>;
  config?: Record<string, any>;
}

export const useMarketplaceConnectors = () => {
  const [connectors, setConnectors] = useState<MarketplaceConnector[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadConnectors = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('import_connectors')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setConnectors((data || []).map(d => ({
        id: d.id,
        name: d.name,
        provider: d.provider as any,
        status: d.is_active ? 'connected' : 'disconnected',
        lastSync: d.last_sync_at ? new Date(d.last_sync_at) : undefined,
        config: (d.config as Record<string, any>) || {},
        credentials: (d.credentials as Record<string, string>) || {}
      })));
    } catch (error) {
      console.error('[useMarketplaceConnectors] Load error:', error);
      toast({
        title: 'Erreur de chargement',
        description: 'Impossible de charger les connecteurs',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const connectMarketplace = useCallback(async (options: ConnectMarketplaceOptions) => {
    if (!user) {
      toast({
        title: 'Authentification requise',
        description: 'Veuillez vous connecter',
        variant: 'destructive'
      });
      return false;
    }

    try {
      setLoading(true);

      // Test connection first
      const { data: testData, error: testError } = await supabase.functions.invoke('test-marketplace-connection', {
        body: {
          provider: options.provider,
          credentials: options.credentials
        }
      });

      if (testError || !testData?.success) {
        throw new Error(testData?.error || 'Connection test failed');
      }

      // Save connector
      const { data, error } = await supabase
        .from('import_connectors')
        .insert({
          user_id: user.id,
          provider: options.provider,
          name: `${options.provider.charAt(0).toUpperCase() + options.provider.slice(1)} Connector`,
          is_active: true,
          credentials: options.credentials,
          config: options.config || {}
        })
        .select()
        .single();

      if (error) throw error;

      const newConnector: MarketplaceConnector = {
        id: data.id,
        name: data.name,
        provider: data.provider as any,
        status: 'connected',
        config: (data.config as Record<string, any>) || {},
        credentials: (data.credentials as Record<string, string>) || {}
      };

      setConnectors(prev => [newConnector, ...prev]);

      toast({
        title: 'Connecteur ajouté',
        description: `${options.provider} connecté avec succès`
      });

      return true;
    } catch (error) {
      console.error('[useMarketplaceConnectors] Connect error:', error);
      toast({
        title: 'Erreur de connexion',
        description: error instanceof Error ? error.message : 'Connexion impossible',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const disconnectMarketplace = useCallback(async (connectorId: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('import_connectors')
        .delete()
        .eq('id', connectorId);

      if (error) throw error;

      setConnectors(prev => prev.filter(c => c.id !== connectorId));

      toast({
        title: 'Connecteur supprimé',
        description: 'Le connecteur a été déconnecté'
      });
    } catch (error) {
      console.error('[useMarketplaceConnectors] Disconnect error:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le connecteur',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const syncMarketplace = useCallback(async (connectorId: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('sync-marketplace', {
        body: { connectorId }
      });

      if (error) throw error;

      toast({
        title: 'Synchronisation démarrée',
        description: `Import de ${data.productCount || 0} produits en cours`
      });

      await loadConnectors();
    } catch (error) {
      console.error('[useMarketplaceConnectors] Sync error:', error);
      toast({
        title: 'Erreur de synchronisation',
        description: error instanceof Error ? error.message : 'Synchronisation impossible',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast, loadConnectors]);

  return {
    connectors,
    loading,
    loadConnectors,
    connectMarketplace,
    disconnectMarketplace,
    syncMarketplace
  };
};

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Integration {
  id: string;
  user_id: string;
  platform_type: 'ecommerce' | 'marketplace' | 'payment' | 'marketing';
  platform_name: string;
  platform_url?: string;
  api_key?: string;
  api_secret?: string;
  access_token?: string;
  refresh_token?: string;
  shop_domain?: string;
  seller_id?: string;
  store_config: Record<string, any>;
  connection_status: 'connected' | 'disconnected' | 'error';
  last_sync_at?: string;
  sync_frequency: 'hourly' | 'daily' | 'weekly' | 'manual';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SyncLog {
  id: string;
  integration_id: string;
  sync_type: 'products' | 'orders' | 'inventory' | 'customers';
  status: 'success' | 'error' | 'in_progress';
  records_processed: number;
  records_succeeded: number;
  records_failed: number;
  error_message?: string;
  sync_data: Record<string, any>;
  started_at: string;
  completed_at?: string;
}

export const useIntegrations = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchIntegrations = async () => {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIntegrations(data as Integration[] || []);
    } catch (error) {
      console.error('Error fetching integrations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les intégrations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSyncLogs = async (integrationId?: string) => {
    try {
      let query = supabase
        .from('sync_logs')
        .select('*')
        .order('started_at', { ascending: false });

      if (integrationId) {
        query = query.eq('integration_id', integrationId);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      setSyncLogs(data as SyncLog[] || []);
    } catch (error) {
      console.error('Error fetching sync logs:', error);
    }
  };

  const createIntegration = async (integration: Omit<Integration, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('integrations')
        .insert([{ ...integration, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      setIntegrations(prev => [data as Integration, ...prev]);
      toast({
        title: "Intégration créée",
        description: `${integration.platform_name} a été ajouté avec succès`,
      });

      return data;
    } catch (error) {
      console.error('Error creating integration:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'intégration",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateIntegration = async (id: string, updates: Partial<Integration>) => {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setIntegrations(prev => 
        prev.map(integration => 
          integration.id === id ? data as Integration : integration
        )
      );

      toast({
        title: "Intégration mise à jour",
        description: "Les paramètres ont été sauvegardés",
      });

      return data;
    } catch (error) {
      console.error('Error updating integration:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'intégration",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteIntegration = async (id: string) => {
    try {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setIntegrations(prev => prev.filter(integration => integration.id !== id));
      toast({
        title: "Intégration supprimée",
        description: "L'intégration a été supprimée avec succès",
      });
    } catch (error) {
      console.error('Error deleting integration:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'intégration",
        variant: "destructive",
      });
      throw error;
    }
  };

  const testConnection = async (id: string) => {
    try {
      // This would call an edge function to test the connection
      const { data, error } = await supabase.functions.invoke('test-integration', {
        body: { integration_id: id }
      });

      if (error) throw error;

      const status = data.success ? 'connected' : 'error';
      await updateIntegration(id, { 
        connection_status: status,
        last_sync_at: new Date().toISOString()
      });

      toast({
        title: status === 'connected' ? "Connexion réussie" : "Connexion échouée",
        description: status === 'connected' 
          ? "L'intégration fonctionne correctement" 
          : data.error || "Erreur de connexion",
        variant: status === 'connected' ? "default" : "destructive",
      });

      return status === 'connected';
    } catch (error) {
      console.error('Error testing connection:', error);
      await updateIntegration(id, { connection_status: 'error' });
      toast({
        title: "Erreur de test",
        description: "Impossible de tester la connexion",
        variant: "destructive",
      });
      return false;
    }
  };

  const syncData = async (id: string, syncType: SyncLog['sync_type']) => {
    try {
      const { data, error } = await supabase.functions.invoke('sync-integration', {
        body: { integration_id: id, sync_type: syncType }
      });

      if (error) throw error;

      toast({
        title: "Synchronisation lancée",
        description: `Synchronisation ${syncType} en cours...`,
      });

      // Refresh sync logs
      await fetchSyncLogs(id);
      
      return data;
    } catch (error) {
      console.error('Error syncing data:', error);
      toast({
        title: "Erreur de synchronisation",
        description: "Impossible de lancer la synchronisation",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchIntegrations();
    fetchSyncLogs();
  }, []);

  return {
    integrations,
    syncLogs,
    loading,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    testConnection,
    syncData,
    fetchIntegrations,
    fetchSyncLogs,
  };
};
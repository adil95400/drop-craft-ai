import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  key_prefix: string | null;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  scopes: string[];
  environment: string;
}

export function useApiKeys() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchApiKeys();
    }
  }, [user]);

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setApiKeys(data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = async (name: string, scopes: string[] = []) => {
    try {
      // Use secure server-side key generation with automatic hashing
      const { data: fullKey, error } = await supabase.rpc('generate_api_key', {
        key_name: name || 'Nouvelle API Key',
        key_scopes: scopes
      });

      if (error) throw error;

      // Refetch to get the new key in the list (key will be masked in DB)
      await fetchApiKeys();
      
      toast.success('Clé API créée avec succès');
      
      // Return the full key (this is the only time user will see it)
      return { 
        fullKey, 
        message: 'Copiez cette clé maintenant, elle ne sera plus visible après.' 
      };
    } catch (error) {
      console.error('Error generating API key:', error);
      toast.error('Erreur lors de la génération de la clé API');
      throw error;
    }
  };

  const deleteApiKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setApiKeys(prev => prev.filter(key => key.id !== id));
      toast.success('Clé API supprimée');
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('Erreur lors de la suppression');
      throw error;
    }
  };

  const toggleApiKey = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: isActive })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setApiKeys(prev => prev.map(key => 
        key.id === id ? { ...key, is_active: isActive } : key
      ));
      toast.success(isActive ? 'Clé API activée' : 'Clé API désactivée');
    } catch (error) {
      console.error('Error toggling API key:', error);
      toast.error('Erreur lors de la mise à jour');
      throw error;
    }
  };

  return {
    apiKeys,
    loading,
    generateApiKey,
    deleteApiKey,
    toggleApiKey,
    refetch: fetchApiKeys
  };
}

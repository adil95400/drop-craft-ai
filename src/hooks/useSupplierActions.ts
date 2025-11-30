import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function useSupplierActions() {
  const { user } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);

  const connectSupplier = async (supplierId: string, apiKey?: string, settings?: Record<string, any>) => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return { success: false };
    }

    setIsConnecting(true);
    try {
      // Build credentials object from apiKey and settings
      const credentials: Record<string, any> = {};
      
      if (apiKey) {
        credentials.apiKey = apiKey;
      }
      
      // Extract specific credential fields from settings
      if (settings?.apiKey) credentials.apiKey = settings.apiKey;
      if (settings?.apiSecret) credentials.apiSecret = settings.apiSecret;
      if (settings?.username) credentials.username = settings.username;
      if (settings?.password) credentials.password = settings.password;
      if (settings?.feedUrl) credentials.feedUrl = settings.feedUrl;
      if (settings?.ftpHost) credentials.ftpHost = settings.ftpHost;
      if (settings?.ftpUsername) credentials.ftpUsername = settings.ftpUsername;
      if (settings?.ftpPassword) credentials.ftpPassword = settings.ftpPassword;
      if (settings?.ftpPath) credentials.ftpPath = settings.ftpPath;

      const { data, error } = await supabase.functions.invoke('supplier-connect-advanced', {
        body: {
          supplierId: supplierId,
          credentials: credentials,
          settings: settings || {},
          connectionType: settings?.connectionType || 'api'
        }
      });

      if (error) throw error;

      toast.success('Fournisseur connecté avec succès');
      return { success: true, data };
    } catch (error) {
      console.error('Error connecting supplier:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la connexion');
      return { success: false, error };
    } finally {
      setIsConnecting(false);
    }
  };

  return {
    connectSupplier,
    isConnecting
  };
}

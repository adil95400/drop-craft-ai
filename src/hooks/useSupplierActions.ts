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
      const { data, error } = await supabase.functions.invoke('supplier-connect', {
        body: {
          supplier_id: supplierId,
          api_key: apiKey,
          settings
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

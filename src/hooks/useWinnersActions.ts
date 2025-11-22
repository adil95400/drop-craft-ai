import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function useWinnersActions() {
  const { user } = useAuth();
  const [isImporting, setIsImporting] = useState(false);

  const importWinner = async (product: any) => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return { success: false };
    }

    setIsImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('winners-import', {
        body: { product }
      });

      if (error) throw error;

      toast.success('Produit gagnant importé avec succès');
      return { success: true, data };
    } catch (error) {
      console.error('Error importing winner:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'import');
      return { success: false, error };
    } finally {
      setIsImporting(false);
    }
  };

  return {
    importWinner,
    isImporting
  };
}

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function useExtensionActions() {
  const { user } = useAuth();
  const [isInstalling, setIsInstalling] = useState(false);

  const installExtension = async (extensionId: string, config?: Record<string, any>) => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return { success: false };
    }

    setIsInstalling(true);
    try {
      const { data, error } = await supabase.functions.invoke('extension-install', {
        body: {
          extension_id: extensionId,
          config
        }
      });

      if (error) throw error;

      toast.success('Extension installée avec succès');
      return { success: true, data };
    } catch (error) {
      console.error('Error installing extension:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'installation');
      return { success: false, error };
    } finally {
      setIsInstalling(false);
    }
  };

  return {
    installExtension,
    isInstalling
  };
}

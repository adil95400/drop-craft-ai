import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CanvaIntegration {
  id: string;
  user_id: string;
  canva_user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface CanvaDesign {
  id: string;
  canva_design_id: string;
  title: string;
  design_type: string;
  thumbnail_url?: string;
  design_url?: string;
  export_urls?: Record<string, string>;
  metadata?: any;
  tags?: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

export const useCanva = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Connecter à Canva via OAuth
  const connectCanva = useCallback(async (): Promise<boolean> => {
    setIsConnecting(true);
    
    try {
      const redirectUri = `${window.location.origin}/canva-callback`;
      
      const { data, error } = await supabase.functions.invoke('canva-oauth', {
        body: {
          action: 'initiate',
          redirect_uri: redirectUri
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success && data.auth_url) {
        // Stocker le state pour la vérification
        localStorage.setItem('canva_oauth_state', data.state);
        
        // Ouvrir la popup OAuth
        const popup = window.open(
          data.auth_url,
          'canva_oauth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        return new Promise((resolve) => {
          const checkClosed = setInterval(() => {
            if (popup?.closed) {
              clearInterval(checkClosed);
              setIsConnecting(false);
              // Vérifier le statut de connexion
              setTimeout(() => {
                checkConnectionStatus().then(resolve);
              }, 1000);
            }
          }, 1000);
        });
      } else {
        throw new Error(data.error || 'Échec de l\'initialisation OAuth');
      }
    } catch (error: any) {
      console.error('Canva connection error:', error);
      toast({
        title: "Erreur de connexion",
        description: error.message || 'Impossible de se connecter à Canva',
        variant: "destructive"
      });
      setIsConnecting(false);
      return false;
    }
  }, [toast]);

  // Gérer le callback OAuth
  const handleOAuthCallback = useCallback(async (code: string, state: string): Promise<boolean> => {
    try {
      const storedState = localStorage.getItem('canva_oauth_state');
      if (state !== storedState) {
        throw new Error('État OAuth invalide');
      }

      const redirectUri = `${window.location.origin}/canva-callback`;
      
      const { data, error } = await supabase.functions.invoke('canva-oauth', {
        body: {
          action: 'callback',
          code,
          state,
          redirect_uri: redirectUri
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        localStorage.removeItem('canva_oauth_state');
        toast({
          title: "Connexion réussie",
          description: `Votre compte Canva a été connecté avec succès`
        });
        return true;
      } else {
        throw new Error(data.error || 'Échec de l\'authentification');
      }
    } catch (error: any) {
      console.error('OAuth callback error:', error);
      toast({
        title: "Erreur d'authentification",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  // Vérifier le statut de connexion avec cache
  const checkConnectionStatus = useCallback(async (): Promise<boolean> => {
    try {
      // Check localStorage cache first
      const cached = localStorage.getItem('canva_connection_status')
      const cacheTime = localStorage.getItem('canva_connection_cache_time')
      
      if (cached && cacheTime) {
        const now = Date.now()
        const cacheAge = now - parseInt(cacheTime)
        if (cacheAge < 60000) { // Cache for 1 minute
          return cached === 'true'
        }
      }

      const { data, error } = await supabase
        .from('canva_integrations')
        .select('*')
        .eq('status', 'active')
        .single();

      const isConnected = !error && !!data;
      
      // Cache the result
      localStorage.setItem('canva_connection_status', String(isConnected))
      localStorage.setItem('canva_connection_cache_time', String(Date.now()))
      
      return isConnected;
    } catch (error) {
      // Fallback: check if user has used Canva before
      const hasCanvaHistory = localStorage.getItem('canva_connected') === 'true'
      return hasCanvaHistory;
    }
  }, []);

  // Déconnecter Canva
  const disconnectCanva = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('canva-oauth', {
        body: { action: 'disconnect' }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        toast({
          title: "Déconnexion réussie",
          description: "Votre compte Canva a été déconnecté"
        });
        return true;
      } else {
        throw new Error(data.error || 'Échec de la déconnexion');
      }
    } catch (error: any) {
      console.error('Canva disconnect error:', error);
      toast({
        title: "Erreur de déconnexion",
        description: error.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Récupérer les designs de l'utilisateur
  const getDesigns = useCallback(async (): Promise<CanvaDesign[]> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('canva_designs')
        .select('*')
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    } catch (error: any) {
      console.error('Error fetching designs:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les designs",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Récupérer l'intégration actuelle
  const getIntegration = useCallback(async (): Promise<CanvaIntegration | null> => {
    try {
      const { data, error } = await supabase
        .from('canva_integrations')
        .select('*')
        .eq('status', 'active')
        .single();

      if (error) {
        return null;
      }

      return data;
    } catch (error) {
      return null;
    }
  }, []);

  // Ouvrir l'éditeur Canva
  const openCanvaEditor = useCallback((designId?: string, template?: string) => {
    let editorUrl = 'https://www.canva.com/design';
    
    if (designId) {
      editorUrl += `/${designId}`;
    } else if (template) {
      editorUrl += `?template=${template}`;
    }

    // Ouvrir dans une nouvelle fenêtre
    const editor = window.open(
      editorUrl,
      'canva_editor',
      'width=1200,height=800,scrollbars=yes,resizable=yes'
    );

    if (!editor) {
      toast({
        title: "Popup bloquée",
        description: "Veuillez autoriser les popups pour utiliser l'éditeur Canva",
        variant: "destructive"
      });
    }

    return editor;
  }, [toast]);

  return {
    // États
    isConnecting,
    isLoading,
    
    // Actions
    connectCanva,
    disconnectCanva,
    handleOAuthCallback,
    checkConnectionStatus,
    getDesigns,
    getIntegration,
    openCanvaEditor
  };
};
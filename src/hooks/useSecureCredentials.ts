import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CredentialData {
  api_key?: string;
  api_secret?: string;
  access_token?: string;
  refresh_token?: string;
  encrypted_credentials?: Record<string, any>;
}

interface SecureCredentialsHook {
  storeCredentials: (integrationId: string, credentials: CredentialData, additionalAuth?: string) => Promise<{ success: boolean; error?: string }>;
  retrieveCredentials: (integrationId: string, additionalAuth?: string) => Promise<{ success: boolean; credentials?: CredentialData; error?: string }>;
  deleteCredentials: (integrationId: string, additionalAuth?: string) => Promise<{ success: boolean; error?: string }>;
}

export const useSecureCredentials = (): SecureCredentialsHook => {
  const { toast } = useToast();

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.warn('Failed to get client IP:', error);
      return 'unknown';
    }
  };

  const storeCredentials = useCallback(async (
    integrationId: string, 
    credentials: CredentialData,
    additionalAuth?: string
  ) => {
    try {
      const ipAddress = await getClientIP();

      const { data, error } = await supabase.functions.invoke('secure-integration-credentials', {
        body: {
          action: 'store',
          integrationId,
          credentials,
          additionalAuth,
          ipAddress
        }
      });

      if (error) {
        console.error('Store credentials error:', error);
        toast({
          title: "Erreur de sécurité",
          description: "Impossible de stocker les identifiants de manière sécurisée",
          variant: "destructive",
        });
        return { success: false, error: error.message };
      }

      if (data.requiresAdditionalAuth) {
        return { success: false, error: 'additional_auth_required' };
      }

      toast({
        title: "Identifiants sécurisés",
        description: "Les identifiants ont été stockés de manière sécurisée",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Store credentials error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du stockage des identifiants",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  }, [toast]);

  const retrieveCredentials = useCallback(async (
    integrationId: string,
    additionalAuth?: string
  ) => {
    try {
      const ipAddress = await getClientIP();

      const { data, error } = await supabase.functions.invoke('secure-integration-credentials', {
        body: {
          action: 'retrieve',
          integrationId,
          additionalAuth,
          ipAddress
        }
      });

      if (error) {
        console.error('Retrieve credentials error:', error);
        toast({
          title: "Erreur de sécurité",
          description: "Impossible de récupérer les identifiants",
          variant: "destructive",
        });
        return { success: false, error: error.message };
      }

      if (data.requiresAdditionalAuth) {
        return { success: false, error: 'additional_auth_required' };
      }

      return { 
        success: true, 
        credentials: data.credentials 
      };
    } catch (error: any) {
      console.error('Retrieve credentials error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la récupération des identifiants",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  }, [toast]);

  const deleteCredentials = useCallback(async (
    integrationId: string,
    additionalAuth?: string
  ) => {
    try {
      const ipAddress = await getClientIP();

      const { data, error } = await supabase.functions.invoke('secure-integration-credentials', {
        body: {
          action: 'delete',
          integrationId,
          additionalAuth,
          ipAddress
        }
      });

      if (error) {
        console.error('Delete credentials error:', error);
        toast({
          title: "Erreur de sécurité",
          description: "Impossible de supprimer les identifiants",
          variant: "destructive",
        });
        return { success: false, error: error.message };
      }

      if (data.requiresAdditionalAuth) {
        return { success: false, error: 'additional_auth_required' };
      }

      toast({
        title: "Identifiants supprimés",
        description: "Les identifiants ont été supprimés de manière sécurisée",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Delete credentials error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression des identifiants",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  }, [toast]);

  return {
    storeCredentials,
    retrieveCredentials,
    deleteCredentials
  };
};
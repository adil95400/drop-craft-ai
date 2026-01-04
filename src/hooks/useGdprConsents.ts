import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ConsentType = 'marketing' | 'analytics' | 'third_party' | 'cookies' | 'newsletter';

export interface GdprConsent {
  id: string;
  user_id: string;
  consent_type: ConsentType;
  granted: boolean;
  granted_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useGdprConsents = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: consents, isLoading } = useQuery({
    queryKey: ['gdpr-consents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gdpr_consents')
        .select('*')
        .order('consent_type');
      
      if (error) throw error;
      return data as GdprConsent[];
    }
  });

  const updateConsent = useMutation({
    mutationFn: async ({ consentType, granted }: { consentType: ConsentType; granted: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const consentData = {
        user_id: user.id,
        consent_type: consentType,
        granted,
        granted_at: granted ? new Date().toISOString() : null,
        revoked_at: granted ? null : new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('gdpr_consents')
        .upsert(consentData, { onConflict: 'user_id,consent_type' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gdpr-consents'] });
      toast({
        title: 'Préférences mises à jour',
        description: 'Vos préférences de consentement ont été enregistrées.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour vos préférences.',
        variant: 'destructive'
      });
      console.error('Consent update error:', error);
    }
  });

  const exportUserData = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('export_user_data');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Télécharger les données en JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mes-donnees-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Export réussi',
        description: 'Vos données ont été exportées avec succès.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'exporter vos données.',
        variant: 'destructive'
      });
      console.error('Export error:', error);
    }
  });

  const anonymizeCustomer = useMutation({
    mutationFn: async (customerId: string) => {
      const { data, error } = await supabase.rpc('anonymize_customer_data', {
        customer_id_param: customerId
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: 'Données anonymisées',
        description: 'Les données du client ont été anonymisées conformément au RGPD.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'anonymiser les données.',
        variant: 'destructive'
      });
      console.error('Anonymize error:', error);
    }
  });

  const getConsentStatus = (type: ConsentType): boolean => {
    const consent = consents?.find(c => c.consent_type === type);
    return consent?.granted ?? false;
  };

  return {
    consents,
    isLoading,
    updateConsent,
    exportUserData,
    anonymizeCustomer,
    getConsentStatus
  };
};

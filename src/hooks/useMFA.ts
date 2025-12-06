import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MFAFactor {
  id: string;
  factor_type: string;
  friendly_name?: string;
  status: 'verified' | 'unverified';
}

interface MFAState {
  isEnabled: boolean;
  factors: MFAFactor[];
  isLoading: boolean;
  qrCode: string | null;
  secret: string | null;
}

export function useMFA() {
  const [state, setState] = useState<MFAState>({
    isEnabled: false,
    factors: [],
    isLoading: false,
    qrCode: null,
    secret: null,
  });
  const { toast } = useToast();

  // Check current MFA status
  const checkMFAStatus = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      
      if (error) throw error;

      const verifiedFactors = data.totp.filter(f => f.status === 'verified');
      
      // Map factors to our interface
      const mappedFactors: MFAFactor[] = data.totp.map(f => ({
        id: f.id,
        factor_type: f.factor_type,
        friendly_name: f.friendly_name ?? undefined,
        status: f.status as 'verified' | 'unverified',
      }));
      
      setState(prev => ({
        ...prev,
        isEnabled: verifiedFactors.length > 0,
        factors: mappedFactors,
        isLoading: false,
      }));

      return verifiedFactors.length > 0;
    } catch (error) {
      console.error('Failed to check MFA status:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, []);

  // Enroll in MFA (generate QR code)
  const enrollMFA = useCallback(async (friendlyName?: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: friendlyName || 'ShopOpti+ Authenticator',
      });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        isLoading: false,
      }));

      toast({
        title: "QR Code généré",
        description: "Scannez le QR code avec votre application d'authentification.",
      });

      return { qrCode: data.totp.qr_code, secret: data.totp.secret, factorId: data.id };
    } catch (error) {
      console.error('Failed to enroll MFA:', error);
      toast({
        title: "Erreur",
        description: "Impossible de configurer l'authentification à deux facteurs.",
        variant: "destructive",
      });
      setState(prev => ({ ...prev, isLoading: false }));
      return null;
    }
  }, [toast]);

  // Verify MFA code during enrollment
  const verifyMFA = useCallback(async (factorId: string, code: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code,
      });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        isEnabled: true,
        qrCode: null,
        secret: null,
        isLoading: false,
      }));

      toast({
        title: "MFA activé",
        description: "L'authentification à deux facteurs est maintenant active sur votre compte.",
      });

      // Refresh factors list
      await checkMFAStatus();

      return true;
    } catch (error) {
      console.error('Failed to verify MFA:', error);
      toast({
        title: "Code invalide",
        description: "Le code entré est incorrect. Veuillez réessayer.",
        variant: "destructive",
      });
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [toast, checkMFAStatus]);

  // Unenroll from MFA
  const unenrollMFA = useCallback(async (factorId: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });

      if (error) throw error;

      toast({
        title: "MFA désactivé",
        description: "L'authentification à deux facteurs a été désactivée.",
      });

      // Refresh factors list
      await checkMFAStatus();

      return true;
    } catch (error) {
      console.error('Failed to unenroll MFA:', error);
      toast({
        title: "Erreur",
        description: "Impossible de désactiver l'authentification à deux facteurs.",
        variant: "destructive",
      });
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [toast, checkMFAStatus]);

  // Create MFA challenge for login
  const createChallenge = useCallback(async (factorId: string) => {
    try {
      const { data, error } = await supabase.auth.mfa.challenge({ factorId });

      if (error) throw error;

      return data.id;
    } catch (error) {
      console.error('Failed to create MFA challenge:', error);
      return null;
    }
  }, []);

  // Verify MFA during login
  const verifyChallenge = useCallback(async (factorId: string, challengeId: string, code: string) => {
    try {
      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code,
      });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Failed to verify MFA challenge:', error);
      toast({
        title: "Code invalide",
        description: "Le code d'authentification est incorrect.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  // Get current assurance level
  const getAssuranceLevel = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (error) throw error;

      return {
        currentLevel: data.currentLevel,
        nextLevel: data.nextLevel,
        currentAuthenticationMethods: data.currentAuthenticationMethods,
      };
    } catch (error) {
      console.error('Failed to get assurance level:', error);
      return null;
    }
  }, []);

  return {
    ...state,
    checkMFAStatus,
    enrollMFA,
    verifyMFA,
    unenrollMFA,
    createChallenge,
    verifyChallenge,
    getAssuranceLevel,
  };
}

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    marketing: boolean;
    security: boolean;
  };
  privacy: {
    profileVisible: boolean;
    activityVisible: boolean;
    analyticsEnabled: boolean;
  };
  language: string;
}

export const useSettingsActions = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const saveSettings = async (settings: UserSettings) => {
    if (!user) return false;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          settings: settings as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Paramètres sauvegardés",
        description: "Vos préférences ont été mises à jour.",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder les paramètres.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    if (!user?.email) return false;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      toast({
        title: "E-mail envoyé",
        description: "Un lien de réinitialisation a été envoyé à votre adresse e-mail.",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer l'e-mail de réinitialisation.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    if (!user) return false;
    
    setLoading(true);
    try {
      // Fetch user data from various tables
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const exportData = {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        profile,
        exported_at: new Date().toISOString()
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shopopti-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export terminé",
        description: "Vos données ont été téléchargées avec succès.",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'exporter vos données.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (!user) return false;
    
    setLoading(true);
    try {
      // Delete user data and account
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) throw error;

      toast({
        title: "Compte supprimé",
        description: "Votre compte a été supprimé définitivement.",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le compte.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    saveSettings,
    changePassword,
    exportData,
    deleteAccount,
    loading
  };
};
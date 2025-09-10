import { supabase } from '@/integrations/supabase/client';
export type UserRole = 'admin' | 'user'

export const roleService = {
  async setUserRole(targetUserId: string, newRole: UserRole) {
    try {
      const { data, error } = await supabase.rpc('admin_set_role', {
        target_user_id: targetUserId,
        new_role: newRole
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data,
        message: `Rôle mis à jour avec succès vers ${newRole}`
      };
    } catch (error: any) {
      console.error('Error setting user role:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la mise à jour du rôle'
      };
    }
  },

  async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, email_notifications, created_at')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        data
      };
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération du profil'
      };
    }
  },

  async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error: any) {
      console.error('Error fetching users:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération des utilisateurs'
      };
    }
  }
};
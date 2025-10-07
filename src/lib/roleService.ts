import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'user';

export const roleService = {
  /**
   * Change user role using the secure admin_set_role function
   * SECURITY: Only admins can change roles, enforced at database level
   */
  async setUserRole(targetUserId: string, newRole: UserRole) {
    try {
      const { data, error } = await supabase.rpc('admin_set_role', {
        target_user_id: targetUserId,
        new_role: newRole
      });

      if (error) throw error;

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

  /**
   * Get user's primary role from user_roles table
   * SECURITY: Uses secure database function
   */
  async getUserRole(userId: string): Promise<{ success: boolean; role?: UserRole; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('get_user_primary_role', {
        _user_id: userId
      });

      if (error) throw error;

      return {
        success: true,
        role: data as UserRole
      };
    } catch (error: any) {
      console.error('Error fetching user role:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération du rôle'
      };
    }
  },

  /**
   * Check if user has specific role
   * SECURITY: Uses secure database function
   */
  async hasRole(userId: string, role: UserRole): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: role
      });

      if (error) throw error;
      return data === true;
    } catch (error: any) {
      console.error('Error checking user role:', error);
      return false;
    }
  },

  /**
   * Get user profile with role from user_roles
   */
  async getUserProfile(userId: string) {
    try {
      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email_notifications, created_at')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Get role from user_roles
      const { data: roleData, error: roleError } = await supabase.rpc('get_user_primary_role', {
        _user_id: userId
      });

      if (roleError) throw roleError;

      return {
        success: true,
        data: {
          ...profile,
          role: roleData
        }
      };
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération du profil'
      };
    }
  },

  /**
   * Get all users with their roles
   * SECURITY: Only admins can access this
   */
  async getAllUsers() {
    try {
      // First check if current user is admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const isAdmin = await this.hasRole(user.id, 'admin');
      if (!isAdmin) throw new Error('Admin access required');

      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get roles for all users
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Merge data
      const usersWithRoles = (profiles || []).map(profile => ({
        ...profile,
        role: roles?.find(r => r.user_id === profile.id)?.role || 'user'
      }));

      return {
        success: true,
        data: usersWithRoles
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
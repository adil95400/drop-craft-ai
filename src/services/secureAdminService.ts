import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdminActionResult {
  success: boolean;
  message: string;
  error?: string;
  data?: any;
}

export class SecureAdminService {
  private static instance: SecureAdminService;
  
  static getInstance(): SecureAdminService {
    if (!SecureAdminService.instance) {
      SecureAdminService.instance = new SecureAdminService();
    }
    return SecureAdminService.instance;
  }

  /**
   * Securely change a user's role using the database function
   */
  async changeUserRole(targetUserId: string, newRole: 'admin' | 'user'): Promise<AdminActionResult> {
    try {
      const { data, error } = await supabase.rpc('secure_admin_set_role', {
        target_user_id: targetUserId,
        new_role: newRole
      });

      if (error) {
        console.error('Role change error:', error);
        return {
          success: false,
          message: 'Failed to change user role',
          error: error.message
        };
      }

      const result = data as { success: boolean; message: string; target_user_id: string; new_role: string };
      return {
        success: true,
        message: result.message,
        data: result
      };
    } catch (error: any) {
      console.error('Role change exception:', error);
      return {
        success: false,
        message: 'An unexpected error occurred',
        error: error.message
      };
    }
  }

  /**
   * Get all users for admin management
   */
  async getAllUsers(): Promise<AdminActionResult> {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) {
        return {
          success: false,
          message: 'Failed to fetch users',
          error: error.message
        };
      }

      // Get roles for each user
      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id)
            .maybeSingle();
          
          return {
            ...profile,
            role: roleData?.role || 'user'
          };
        })
      );

      return {
        success: true,
        message: 'Users fetched successfully',
        data: usersWithRoles
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'An unexpected error occurred',
        error: error.message
      };
    }
  }

  /**
   * Log admin actions securely
   */
  async logAdminAction(action: string, description: string, metadata?: any): Promise<void> {
    try {
      await supabase.from('security_events').insert({
        event_type: action,
        severity: 'info',
        description,
        metadata: metadata || {}
      });
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  }

  /**
   * Get security events for monitoring
   */
  async getSecurityEvents(limit: number = 50): Promise<AdminActionResult> {
    try {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return {
          success: false,
          message: 'Failed to fetch security events',
          error: error.message
        };
      }

      return {
        success: true,
        message: 'Security events fetched successfully',
        data: data || []
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'An unexpected error occurred',
        error: error.message
      };
    }
  }

  /**
   * Check if current user is admin
   */
  async isCurrentUserAdmin(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (error) return false;
      return Boolean(data);
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }
}

export const secureAdminService = SecureAdminService.getInstance();
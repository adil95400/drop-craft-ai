import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useSecureAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('has_role', { 
          _user_id: user.id,
          _role: 'admin'
        });
        
        if (error) {
          console.error('Error checking admin role:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(Boolean(data));
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminRole();
  }, [user]);

  const logAdminAccess = async (table_name: string, action_type: string, record_id?: string) => {
    if (isAdmin) {
      try {
        // Insert directly into security_events table since we have the proper policy
        await supabase.from('security_events').insert({
          user_id: user?.id,
          event_type: 'admin_data_access',
          severity: 'info',
          description: `Admin accessed sensitive data in ${table_name}`,
          metadata: {
            table_name,
            action_type,
            record_id,
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('Error logging admin access:', error);
      }
    }
  };

  return {
    isAdmin,
    isLoading,
    logAdminAccess
  };
};
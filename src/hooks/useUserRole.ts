import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'user';

export const useUserRole = () => {
  const { user, profile } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile?.role) {
      setRole(profile.role as UserRole);
      setIsLoading(false);
    } else if (user) {
      // Fallback: fetch role directly if not in profile
      fetchUserRole();
    } else {
      setRole(null);
      setIsLoading(false);
    }
  }, [user, profile]);

  const fetchUserRole = async () => {
    if (!user) {
      setRole(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        setRole('user'); // Default to user on error
      } else {
        setRole(data?.role as UserRole || 'user');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setRole('user');
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = role === 'admin';
  const isUser = role === 'user';

  return {
    role,
    isAdmin,
    isUser,
    isLoading,
    refetch: fetchUserRole
  };
};
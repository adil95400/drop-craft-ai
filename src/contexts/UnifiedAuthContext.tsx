import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Profile {
  id: string;
  full_name?: string;
  admin_mode?: string | null;
  is_admin: boolean;
  plan: 'standard' | 'pro' | 'ultra_pro';
  subscription_plan?: string;
  subscription_status?: string;
  avatar_url?: string;
  phone?: string;
  company?: string;
  website?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  created_at: string;
  updated_at: string;
}

interface UnifiedAuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  
  // Auth methods
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  signInWithGoogle?: () => Promise<{ error: any }>;
  getUserSessions?: () => Promise<any>;
  revokeUserSessions?: () => Promise<any>;
  
  // Role & permissions
  isAdmin: boolean;
  hasRole: (role: string) => boolean;
  canAccess: (permission: string) => boolean;
  effectivePlan: 'standard' | 'pro' | 'ultra_pro';
  
  // Profile management
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  refetchProfile: () => Promise<void>;
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined);

export const UnifiedAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const fetchingRef = useRef(false);
  const lastFetchedRef = useRef<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user && event !== 'SIGNED_OUT') {
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    // Prevent duplicate fetches
    if (fetchingRef.current || lastFetchedRef.current === userId) {
      return;
    }
    
    try {
      fetchingRef.current = true;
      lastFetchedRef.current = userId;
      
      // Fetch profile data directly from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setProfile(null);
        return;
      }

      // Check if user is admin via the has_role function
      const { data: isAdminData } = await supabase.rpc('has_role', { 
        _user_id: userId, 
        _role: 'admin' 
      });

      if (profileData) {
        setProfile({
          ...profileData,
          is_admin: isAdminData === true,
          plan: profileData.subscription_plan || 'free'
        } as unknown as Profile);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      setProfile(null);
    } finally {
      fetchingRef.current = false;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      toast({
        title: "Erreur de connexion",
        description: error.message,
        variant: "destructive",
      });
    }

    return { error };
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    const redirectUrl = `${window.location.origin}/`;
    
    let signUpData: any = { email, password };
    
    if (metadata) {
      signUpData.options = {
        emailRedirectTo: redirectUrl,
        data: typeof metadata === 'string' ? { full_name: metadata } : metadata,
      };
    }
    
    const { error } = await supabase.auth.signUp(signUpData);

    if (error) {
      toast({
        title: "Erreur d'inscription",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Inscription réussie",
        description: "Vérifiez votre email pour confirmer votre compte.",
      });
    }

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erreur de déconnexion",
        description: error.message,
        variant: "destructive",
      });
    }
    
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });

    if (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Email envoyé",
        description: "Vérifiez votre email pour réinitialiser votre mot de passe.",
      });
    }

    return { error };
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('User not authenticated') };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      toast({
        title: "Erreur de mise à jour",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées.",
      });
      await refetchProfile();
    }

    return { error };
  };

  const refetchProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  // Role and permission helpers
  const isAdmin = profile?.is_admin === true;
  
  const hasRole = (role: string): boolean => {
    if (!profile) return false;
    // Use is_admin flag which is synced from user_roles
    if (role === 'admin') return profile.is_admin === true;
    // For other roles, we would need to query user_roles separately
    return false;
  };

  const canAccess = (permission: string): boolean => {
    if (!profile) return false;
    
    // Admin has access to everything
    if (isAdmin) return true;
    
    // Basic authenticated user permissions
    const basicPermissions = ['dashboard', 'products', 'orders', 'profile'];
    return basicPermissions.includes(permission);
  };

  // Calculate effective plan considering admin modes
  const effectivePlan = React.useMemo((): 'standard' | 'pro' | 'ultra_pro' => {
    if (!profile) return 'standard';
    
    // Admin bypass or preview modes
    if (profile.admin_mode === 'bypass') return 'ultra_pro';
    if (profile.admin_mode?.startsWith('preview:')) {
      const planMode = profile.admin_mode.split(':')[1];
      return planMode as 'standard' | 'pro' | 'ultra_pro';
    }
    
    // Default to user's actual plan
    return profile.plan || 'standard';
  }, [profile]);

  // Optional methods that can be implemented later
  const signInWithGoogle = async () => {
    return { error: new Error('Google sign-in not implemented yet') };
  };

  const getUserSessions = async () => {
    return { data: [], error: null };
  };

  const revokeUserSessions = async () => {
    return { error: null };
  };

  const value = useMemo<UnifiedAuthContextType>(() => ({
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    signInWithGoogle,
    getUserSessions,
    revokeUserSessions,
    isAdmin,
    hasRole,
    canAccess,
    effectivePlan,
    updateProfile,
    refetchProfile,
  }), [user, session, profile, loading, isAdmin, effectivePlan]);

  return (
    <UnifiedAuthContext.Provider value={value}>
      {children}
    </UnifiedAuthContext.Provider>
  );
};

export const useUnifiedAuth = () => {
  const context = useContext(UnifiedAuthContext);
  if (context === undefined) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider');
  }
  return context;
};
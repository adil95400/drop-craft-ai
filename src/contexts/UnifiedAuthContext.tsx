import React, { createContext, useContext, useEffect, useState, useRef, useMemo, useCallback } from 'react';
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

  // Backwards compatible alias used by older UI
  company?: string;
  // Canonical DB column
  company_name?: string;

  website?: string;
  bio?: string;
  location?: string;
  twitter?: string;
  linkedin?: string;
  github?: string;
  language?: string;
  timezone?: string;
  email_notifications?: boolean;
  push_notifications?: boolean;
  marketing_notifications?: boolean;
  profile_visible?: boolean;
  activity_visible?: boolean;
  analytics_enabled?: boolean;
  settings?: any;
  onboarding_completed?: boolean | null;
  created_at: string;
  updated_at: string;
}

interface SessionInfo {
  isExpired: boolean;
  expiresAt: Date | null;
  lastActivity: Date | null;
}

interface UnifiedAuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  
  // Session management - Phase 2.2
  sessionInfo: SessionInfo;
  refreshSession: () => Promise<void>;
  
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

export const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined);

// Session monitoring constants
const SESSION_WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry
const SESSION_CHECK_INTERVAL = 60 * 1000; // Check every minute

export const UnifiedAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
    isExpired: false,
    expiresAt: null,
    lastActivity: null,
  });
  
  const { toast } = useToast();
  const fetchingRef = useRef(false);
  const lastFetchedRef = useRef<string | null>(null);
  const sessionCheckRef = useRef<NodeJS.Timeout | null>(null);

  // Log login activity for security monitoring
  const logLoginActivity = useCallback(async (userId: string, event: string, success: boolean) => {
    try {
      await supabase.from('activity_logs').insert({
        user_id: userId,
        action: success ? 'user_login' : 'user_logout',
        entity_type: 'auth',
        description: `Auth event: ${event}`,
        details: {
          event,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        },
        severity: 'info',
        source: 'client',
      });
    } catch (error) {
      console.error('Error logging auth activity:', error);
    }
  }, []);

  // Check session expiration
  const checkSessionExpiry = useCallback(async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        setSessionInfo(prev => ({ ...prev, isExpired: true, expiresAt: null }));
        return;
      }

      const expiresAt = new Date(currentSession.expires_at! * 1000);
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();

      setSessionInfo(prev => ({
        ...prev,
        expiresAt,
        isExpired: timeUntilExpiry <= 0,
        lastActivity: new Date(),
      }));

      // Warn user if session is about to expire
      if (timeUntilExpiry > 0 && timeUntilExpiry <= SESSION_WARNING_THRESHOLD) {
        const minutesLeft = Math.ceil(timeUntilExpiry / 60000);
        toast({
          title: "Session expirant bientôt",
          description: `Votre session expire dans ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
        });
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
  }, [toast]);

  // Refresh session token
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) throw error;

      if (data.session) {
        setSession(data.session);
        setSessionInfo(prev => ({
          ...prev,
          isExpired: false,
          expiresAt: new Date(data.session!.expires_at! * 1000),
        }));
        
        toast({
          title: "Session prolongée",
          description: "Votre session a été renouvelée.",
        });
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      toast({
        title: "Erreur de session",
        description: "Impossible de renouveler la session.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Initialize auth state
  useEffect(() => {
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Log auth events for security
        if (session?.user) {
          if (event === 'SIGNED_IN') {
            logLoginActivity(session.user.id, event, true);
            
            // Check subscription status on login
            supabase.functions.invoke('check-subscription').then(({ data, error }) => {
              if (!error && data) {
                console.log('[subscription-check] Plan:', data.plan);
              }
            }).catch(() => {});
            
            // Auto-activate free trial if user came from a trial CTA
            try {
              const pendingTrial = localStorage.getItem('pending_trial');
              if (pendingTrial === 'true') {
                localStorage.removeItem('pending_trial');
                supabase.functions.invoke('trial-activate', {
                  body: { trialDays: 14, plan: 'pro' },
                }).then(({ error }) => {
                  if (error) console.warn('[trial-auto-activate] Failed:', error);
                  else console.log('[trial-auto-activate] Trial activated for new user');
                });
              }
            } catch {
              // Ignore localStorage errors
            }
          }
          
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
          
          // Update session info
          if (session.expires_at) {
            setSessionInfo(prev => ({
              ...prev,
              isExpired: false,
              expiresAt: new Date(session.expires_at! * 1000),
              lastActivity: new Date(),
            }));
          }
        } else {
          setProfile(null);
          setSessionInfo({ isExpired: true, expiresAt: null, lastActivity: null });
        }
        
        if (event === 'SIGNED_OUT' && user) {
          logLoginActivity(user.id, event, true);
        }
        
        if (event === 'TOKEN_REFRESHED' && session) {
          setSessionInfo(prev => ({
            ...prev,
            expiresAt: new Date(session.expires_at! * 1000),
          }));
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
        if (session.expires_at) {
          setSessionInfo(prev => ({
            ...prev,
            isExpired: false,
            expiresAt: new Date(session.expires_at! * 1000),
          }));
        }
      } else {
        setLoading(false);
      }
    });

    // Set up periodic session checks
    sessionCheckRef.current = setInterval(checkSessionExpiry, SESSION_CHECK_INTERVAL);

    // Periodic subscription sync (every 10 minutes)
    const subscriptionCheckRef = setInterval(() => {
      supabase.auth.getSession().then(({ data: { session: s } }) => {
        if (s?.user) {
          supabase.functions.invoke('check-subscription').then(({ data, error }) => {
            if (!error && data && s.user) {
              // Refetch profile to get updated plan
              fetchUserProfile(s.user.id);
            }
          }).catch(() => {});
        }
      });
    }, 10 * 60 * 1000); // 10 minutes

    return () => {
      subscription.unsubscribe();
      if (sessionCheckRef.current) {
        clearInterval(sessionCheckRef.current);
      }
      clearInterval(subscriptionCheckRef);
    };
  }, [checkSessionExpiry, logLoginActivity]);

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
          company: (profileData as any).company_name ?? (profileData as any).company ?? null,
          is_admin: isAdminData === true,
          plan: (profileData as any).subscription_plan || 'free',
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

  // OAuth methods
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    return { error };
  };

  /**
   * Get user sessions - queries activity_logs for auth events
   * Returns recent login sessions for the current user
   */
  const getUserSessions = async () => {
    if (!user) return { data: [], error: new Error('User not authenticated') };

    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('entity_type', 'auth')
        .in('action', ['user_login', 'SIGNED_IN'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const sessions = (data || []).map(log => {
        const details = log.details as Record<string, unknown> | null;
        return {
          id: log.id,
          created_at: log.created_at,
          user_agent: (details?.user_agent as string) || log.user_agent,
          ip_address: log.ip_address,
          is_current: false
        };
      });

      return { data: sessions, error: null };
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      return { data: [], error };
    }
  };

  /**
   * Revoke all user sessions except current
   * Signs out user from all devices by invalidating refresh tokens
   */
  const revokeUserSessions = async () => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      // Sign out globally - this invalidates all refresh tokens
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) throw error;

      // Log the security event
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'sessions_revoked',
        entity_type: 'auth',
        description: 'All user sessions revoked',
        details: {
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent
        },
        severity: 'warn',
        source: 'client'
      });

      toast({
        title: "Sessions révoquées",
        description: "Toutes vos sessions ont été déconnectées. Veuillez vous reconnecter.",
      });

      return { error: null };
    } catch (error) {
      console.error('Failed to revoke sessions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de révoquer les sessions.",
        variant: "destructive"
      });
      return { error };
    }
  };

  const value = useMemo<UnifiedAuthContextType>(() => ({
    user,
    session,
    profile,
    loading,
    sessionInfo,
    refreshSession,
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
  }), [user, session, profile, loading, isAdmin, effectivePlan, sessionInfo, refreshSession]);

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
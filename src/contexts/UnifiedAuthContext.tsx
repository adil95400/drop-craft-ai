import React, { createContext, useContext, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

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
  isAdmin: boolean;
  effectivePlan: string;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error?: any }>;
  resetPassword: (email: string) => Promise<{ error?: any }>;
  updateProfile: (data: Record<string, any>) => Promise<void>;
  refetchProfile: () => Promise<void>;
  getUserSessions: () => Promise<{ data: any[]; error: any }>;
  revokeUserSessions: () => Promise<{ error: any }>;
  hasRole: (role: string) => boolean;
  canAccess: (feature: string) => boolean;
  sessionInfo: SessionInfo;
  refreshSession: () => Promise<void>;
}

export type UnifiedAuthContextValue = UnifiedAuthContextType;

export const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined);

const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const SESSION_WARNING_THRESHOLD = 10 * 60 * 1000; // 10 minutes

export const UnifiedAuthProvider = ({ children }: { children: React.ReactNode }) => {
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
  const initializedRef = useRef(false);

  // ── Log auth activity ────────────────────────────────────────────
  const logLoginActivity = useCallback(async (userId: string, event: string, success: boolean) => {
    try {
      await supabase.from('activity_logs').insert({
        user_id: userId,
        action: event,
        entity_type: 'auth',
        description: `Auth event: ${event}`,
        details: {
          success,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        },
        severity: 'info',
        source: 'client',
      });
    } catch (error) {
      logger.warn('Error logging auth activity', { error });
    }
  }, []);

  // ── Check session expiration ─────────────────────────────────────
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

      if (timeUntilExpiry > 0 && timeUntilExpiry <= SESSION_WARNING_THRESHOLD) {
        const minutesLeft = Math.ceil(timeUntilExpiry / 60000);
        toast({
          title: 'Session expirant bientôt',
          description: `Votre session expire dans ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
        });
      }
    } catch (error) {
      logger.warn('Session check error', { error });
    }
  }, [toast]);

  // ── Refresh session token ────────────────────────────────────────
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
        toast({ title: 'Session prolongée', description: 'Votre session a été renouvelée.' });
      }
    } catch (error) {
      logger.error('Session refresh error', error);
      toast({
        title: 'Erreur de session',
        description: 'Impossible de renouveler la session.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // ── Fetch profile ────────────────────────────────────────────────
  const fetchProfile = useCallback(async (userId: string) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        logger.error('Error fetching profile', profileError);
        setProfile(null);
        return;
      }

      const { data: isAdminData } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin',
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
      logger.error('Profile fetch error', error);
      setProfile(null);
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  const refetchProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user?.id, fetchProfile]);

  // ── Initialize auth state ────────────────────────────────────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          if (event === 'SIGNED_IN') {
            logLoginActivity(session.user.id, event, true);

            supabase.functions.invoke('check-subscription').then(({ error }) => {
              if (error) logger.debug('check-subscription skipped', { error });
            }).catch(() => {});

            try {
              const pendingTrial = localStorage.getItem('pending_trial');
              if (pendingTrial === 'true') {
                localStorage.removeItem('pending_trial');
                supabase.functions.invoke('trial-activate', {
                  body: { trialDays: 14, plan: 'pro' },
                }).then(({ error }) => {
                  if (error) logger.warn('trial-auto-activate failed', { error });
                });
              }
            } catch {
              // Ignore localStorage errors
            }
          }

          setTimeout(() => fetchProfile(session.user.id), 0);
          logger.setUser(session.user.id, session.user.email);
        } else {
          setProfile(null);
          logger.clearUser();
        }

        if (!initializedRef.current) {
          initializedRef.current = true;
          setLoading(false);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id);
        logger.setUser(session.user.id, session.user.email);
      }

      if (!initializedRef.current) {
        initializedRef.current = true;
        setLoading(false);
      }
    });

    // Periodic session check
    const interval = setInterval(checkSessionExpiry, SESSION_CHECK_INTERVAL);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [checkSessionExpiry, fetchProfile, logLoginActivity]);

  // ── Auth actions ─────────────────────────────────────────────────
  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signUp = useCallback(async (email: string, password: string, metadata?: Record<string, any>) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (!error) {
      try { const { trackSignUp } = await import('@/lib/analytics/conversions'); trackSignUp('email'); } catch {}
    }
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    logger.clearUser();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    return { error };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?type=recovery`,
    });
    return { error };
  }, []);

  // ── Session management ───────────────────────────────────────────
  const getUserSessions = useCallback(async () => {
    if (!user) return { data: [], error: new Error('User not authenticated') };

    try {
      const { data: logs, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('action', 'SIGNED_IN')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const sessions = (logs || []).map((log: any) => {
        const details = log.details || {};
        return {
          id: log.id,
          device_info: {
            userAgent: details.user_agent,
            platform: details.platform,
            language: details.language,
          },
          last_activity_at: log.created_at,
          created_at: log.created_at,
          is_active: true,
          user_agent: (details?.user_agent as string) || log.user_agent,
          ip_address: log.ip_address,
          is_current: false,
        };
      });

      return { data: sessions, error: null };
    } catch (error) {
      logger.error('Failed to get user sessions', error);
      return { data: [], error };
    }
  }, [user]);

  const revokeUserSessions = useCallback(async () => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;

      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'sessions_revoked',
        entity_type: 'auth',
        description: 'All user sessions revoked',
        details: {
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
        },
        severity: 'warn',
        source: 'client',
      });

      toast({
        title: 'Sessions révoquées',
        description: 'Toutes vos sessions ont été déconnectées. Veuillez vous reconnecter.',
      });

      return { error: null };
    } catch (error) {
      logger.error('Failed to revoke sessions', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de révoquer les sessions.',
        variant: 'destructive',
      });
      return { error };
    }
  }, [user, toast]);

  // ── Derived values ────────────────────────────────────────────────
  const isAdmin = profile?.is_admin === true;
  const effectivePlan = profile?.subscription_plan || profile?.plan || 'standard';

  const updateProfile = useCallback(async (data: Record<string, any>) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id);
    if (error) {
      logger.error('Failed to update profile', error);
      throw error;
    }
    await refetchProfile();
  }, [user, refetchProfile]);

  const hasRole = useCallback((role: string) => {
    if (role === 'admin') return isAdmin;
    return !!profile;
  }, [isAdmin, profile]);

  const canAccess = useCallback((_feature: string) => {
    return !!profile;
  }, [profile]);

  // ── Context value ────────────────────────────────────────────────
  const value = useMemo<UnifiedAuthContextType>(
    () => ({
      user,
      session,
      profile,
      loading,
      isAdmin,
      effectivePlan,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      resetPassword,
      updateProfile,
      refetchProfile,
      getUserSessions,
      revokeUserSessions,
      hasRole,
      canAccess,
      sessionInfo,
      refreshSession,
    }),
    [
      user, session, profile, loading, isAdmin, effectivePlan,
      signIn, signUp, signOut, signInWithGoogle, resetPassword,
      updateProfile, refetchProfile, getUserSessions, revokeUserSessions,
      hasRole, canAccess, sessionInfo, refreshSession,
    ]
  );

  return (
    <UnifiedAuthContext.Provider value={value}>
      {children}
    </UnifiedAuthContext.Provider>
  );
};

export const useUnifiedAuth = (): UnifiedAuthContextType => {
  const context = useContext(UnifiedAuthContext);
  if (context === undefined) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider');
  }
  return context;
};

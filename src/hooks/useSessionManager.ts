/**
 * Session Manager Hook - Phase 2.2
 * Handles session expiration, token refresh, and suspicious login detection
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SessionState {
  isExpired: boolean;
  lastActivity: Date | null;
  sessionExpiresAt: Date | null;
  isRefreshing: boolean;
}

interface LoginAttempt {
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  location?: string;
  success: boolean;
}

const SESSION_WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry
const SESSION_CHECK_INTERVAL = 60 * 1000; // Check every minute
const SUSPICIOUS_LOGIN_THRESHOLD = 3; // Failed attempts before warning

export const useSessionManager = () => {
  const { toast } = useToast();
  const [sessionState, setSessionState] = useState<SessionState>({
    isExpired: false,
    lastActivity: null,
    sessionExpiresAt: null,
    isRefreshing: false,
  });
  
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const failedAttemptsRef = useRef<LoginAttempt[]>([]);

  // Update last activity timestamp
  const updateActivity = useCallback(() => {
    setSessionState(prev => ({
      ...prev,
      lastActivity: new Date(),
    }));
  }, []);

  // Refresh the session token
  const refreshSession = useCallback(async () => {
    setSessionState(prev => ({ ...prev, isRefreshing: true }));
    
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw error;
      }

      if (data.session) {
        setSessionState(prev => ({
          ...prev,
          isExpired: false,
          sessionExpiresAt: new Date(data.session!.expires_at! * 1000),
          isRefreshing: false,
        }));

        toast({
          title: "Session prolongée",
          description: "Votre session a été renouvelée avec succès.",
        });
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      setSessionState(prev => ({
        ...prev,
        isExpired: true,
        isRefreshing: false,
      }));
      
      toast({
        title: "Erreur de session",
        description: "Impossible de renouveler votre session. Veuillez vous reconnecter.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Check if session is about to expire
  const checkSessionExpiry = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        setSessionState(prev => ({
          ...prev,
          isExpired: true,
          sessionExpiresAt: null,
        }));
        return;
      }

      const expiresAt = new Date(session.expires_at! * 1000);
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();

      setSessionState(prev => ({
        ...prev,
        sessionExpiresAt: expiresAt,
        isExpired: timeUntilExpiry <= 0,
      }));

      // Warn user if session is about to expire
      if (timeUntilExpiry > 0 && timeUntilExpiry <= SESSION_WARNING_THRESHOLD) {
        const minutesLeft = Math.ceil(timeUntilExpiry / 60000);
        toast({
          title: "Session expirant bientôt",
          description: `Votre session expire dans ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}. Rafraîchissez pour prolonger.`,
        });
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
  }, [toast]);

  // Log suspicious login activity
  const logSuspiciousActivity = useCallback(async (email: string) => {
    try {
      toast({
        title: "Activité suspecte détectée",
        description: "Plusieurs tentatives de connexion échouées ont été détectées.",
        variant: "destructive",
      });

      // Log to activity_logs
      await supabase.from('activity_logs').insert({
        action: 'suspicious_login_activity',
        entity_type: 'security',
        description: `Multiple failed login attempts detected for ${email}`,
        details: {
          failed_attempts: failedAttemptsRef.current.length,
          email,
          timestamp: new Date().toISOString(),
        },
        severity: 'error',
        source: 'system',
      });

      // Reset counter after logging
      failedAttemptsRef.current = [];
    } catch (error) {
      console.error('Error logging suspicious activity:', error);
    }
  }, [toast]);

  // Log login attempt for security monitoring
  const logLoginAttempt = useCallback(async (
    userId: string | null,
    success: boolean,
    metadata?: { ip?: string; userAgent?: string; email?: string }
  ) => {
    try {
      const attempt: LoginAttempt = {
        timestamp: new Date(),
        ip: metadata?.ip,
        userAgent: metadata?.userAgent || navigator.userAgent,
        success,
      };

      // Track failed attempts in memory
      if (!success) {
        failedAttemptsRef.current.push(attempt);
        
        // Clean old attempts (older than 15 minutes)
        const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
        failedAttemptsRef.current = failedAttemptsRef.current.filter(
          a => a.timestamp.getTime() > fifteenMinutesAgo
        );

        // Check for suspicious activity
        if (failedAttemptsRef.current.length >= SUSPICIOUS_LOGIN_THRESHOLD) {
          await logSuspiciousActivity(metadata?.email || 'unknown');
        }
      }

      // Log to activity_logs table
      if (userId) {
        await supabase.from('activity_logs').insert({
          user_id: userId,
          action: success ? 'user_login' : 'failed_login_attempt',
          entity_type: 'auth',
          description: success 
            ? 'User logged in successfully' 
            : 'Failed login attempt detected',
          details: {
            user_agent: attempt.userAgent,
            ip_address: attempt.ip,
            timestamp: attempt.timestamp.toISOString(),
          },
          severity: success ? 'info' : 'warn',
          source: 'client',
        });
      }
    } catch (error) {
      console.error('Error logging login attempt:', error);
    }
  }, [logSuspiciousActivity]);

  // Handle session expired notification
  const handleSessionExpired = useCallback(() => {
    toast({
      title: "Session expirée",
      description: "Votre session a expiré. Veuillez vous reconnecter.",
      variant: "destructive",
    });
  }, [toast]);

  // Set up session monitoring
  useEffect(() => {
    // Initial check
    checkSessionExpiry();

    // Set up periodic checks
    refreshIntervalRef.current = setInterval(checkSessionExpiry, SESSION_CHECK_INTERVAL);

    // Listen for visibility changes to check session when user returns
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSessionExpiry();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Track user activity
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      activityEvents.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, [checkSessionExpiry, updateActivity]);

  // Notify when session expires
  useEffect(() => {
    if (sessionState.isExpired) {
      handleSessionExpired();
    }
  }, [sessionState.isExpired, handleSessionExpired]);

  return {
    ...sessionState,
    refreshSession,
    logLoginAttempt,
    updateActivity,
    failedAttempts: failedAttemptsRef.current.length,
  };
};

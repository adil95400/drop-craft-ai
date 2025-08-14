import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SecurityEvent {
  id: string;
  user_id?: string;
  event_type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  description: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

interface SecurityStats {
  total_events: number;
  critical_events: number;
  events_today: number;
  top_threats: string[];
}

export const useSecurityMonitoring = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState<SecurityStats>({
    total_events: 0,
    critical_events: 0,
    events_today: 0,
    top_threats: []
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Get client IP address
  const getClientIP = async (): Promise<string | null> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return null;
    }
  };

  // Log security event
  const logSecurityEvent = async (
    eventType: string,
    severity: 'info' | 'warning' | 'error' | 'critical',
    description: string,
    metadata?: Record<string, any>
  ) => {
    try {
      const clientIP = await getClientIP();
      const userAgent = navigator.userAgent;

      const { error } = await supabase
        .from('security_events')
        .insert([{
          user_id: user?.id || null,
          event_type: eventType,
          severity,
          description,
          metadata: metadata || {},
          ip_address: clientIP,
          user_agent: userAgent
        }]);

      if (error) {
        console.error('Failed to log security event:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Security event logging error:', error);
      return { success: false, error: 'Failed to log security event' };
    }
  };

  // Fetch security events (admin only)
  const fetchSecurityEvents = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (eventsError) throw eventsError;

      const formattedEvents: SecurityEvent[] = (eventsData || []).map(event => ({
        id: event.id,
        user_id: event.user_id,
        event_type: event.event_type,
        severity: event.severity as 'info' | 'warning' | 'error' | 'critical',
        description: event.description,
        metadata: (event.metadata as Record<string, any>) || {},
        ip_address: event.ip_address,
        user_agent: event.user_agent,
        created_at: event.created_at
      }));

      setEvents(formattedEvents);

      // Calculate statistics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const eventsToday = formattedEvents.filter(event => 
        new Date(event.created_at) >= today
      ).length;

      const criticalEvents = formattedEvents.filter(event => 
        event.severity === 'critical'
      ).length;

      const threatTypes = formattedEvents
        .filter(event => event.severity === 'error' || event.severity === 'critical')
        .reduce((acc, event) => {
          acc[event.event_type] = (acc[event.event_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const topThreats = Object.entries(threatTypes)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([threat]) => threat);

      setStats({
        total_events: formattedEvents.length,
        critical_events: criticalEvents,
        events_today: eventsToday,
        top_threats: topThreats
      });

    } catch (error) {
      console.error('Failed to fetch security events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Detect suspicious activity
  const detectSuspiciousActivity = async (eventType: string, threshold: number = 10, windowMs: number = 300000) => {
    if (!user) return;

    const now = Date.now();
    const recentEvents = events.filter(event => 
      event.event_type === eventType &&
      event.user_id === user.id &&
      (now - new Date(event.created_at).getTime()) < windowMs
    );

    if (recentEvents.length >= threshold) {
      await logSecurityEvent(
        'suspicious_activity',
        'critical',
        `Suspicious activity detected: ${eventType} repeated ${recentEvents.length} times in ${windowMs/1000} seconds`,
        { 
          event_type: eventType, 
          count: recentEvents.length, 
          window_ms: windowMs,
          threshold 
        }
      );
    }
  };

  // Analyze login patterns
  const analyzeLoginPattern = async (success: boolean) => {
    const eventType = success ? 'login_success' : 'login_failed';
    
    await logSecurityEvent(
      eventType,
      success ? 'info' : 'warning',
      success ? 'User login successful' : 'User login failed'
    );

    if (!success) {
      await detectSuspiciousActivity('login_failed', 5, 300000); // 5 failed attempts in 5 minutes
    }
  };

  // Check data access patterns
  const checkDataAccessPattern = async (dataType: string, action: string) => {
    await logSecurityEvent(
      'data_access',
      'info',
      `User accessed ${dataType} - ${action}`,
      { data_type: dataType, action }
    );

    await detectSuspiciousActivity('data_access', 50, 300000); // 50 accesses in 5 minutes
  };

  // Refresh events
  const refreshEvents = () => {
    fetchSecurityEvents();
  };

  useEffect(() => {
    if (user) {
      fetchSecurityEvents();
    }
  }, [user]);

  return {
    events,
    stats,
    loading,
    logSecurityEvent,
    analyzeLoginPattern,
    checkDataAccessPattern,
    detectSuspiciousActivity,
    refreshEvents
  };
};
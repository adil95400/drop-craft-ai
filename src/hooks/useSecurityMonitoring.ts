import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'failed_login' | 'suspicious_activity' | 'data_access' | 'password_change';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  metadata?: any;
}

interface SecurityStats {
  totalEvents: number;
  criticalEvents: number;
  todayEvents: number;
  topThreats: Array<{ type: string; count: number }>;
}

export const useSecurityMonitoring = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState<SecurityStats>({
    totalEvents: 0,
    criticalEvents: 0,
    todayEvents: 0,
    topThreats: []
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const logSecurityEvent = async (
    type: SecurityEvent['type'],
    description: string,
    severity: SecurityEvent['severity'] = 'low',
    metadata?: any
  ) => {
    if (!user) return;

    try {
      const ipAddress = await getClientIP();
      const userAgent = navigator.userAgent;

      const { error } = await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'security_event',
        description,
        entity_type: 'security',
        metadata: {
          event_type: type,
          severity,
          ip_address: ipAddress,
          user_agent: userAgent,
          ...metadata
        },
        ip_address: ipAddress,
        user_agent: userAgent
      });

      if (error) {
        console.error('Failed to log security event:', error);
      } else {
        // Refresh events after logging
        fetchSecurityEvents();
      }
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  };

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  const fetchSecurityEvents = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('entity_type', 'security')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedEvents: SecurityEvent[] = data.map(log => {
        const metadata = log.metadata as any;
        return {
          id: log.id,
          type: metadata?.event_type || 'data_access',
          description: log.description,
          severity: metadata?.severity || 'low',
          ip_address: log.ip_address,
          user_agent: log.user_agent,
          timestamp: log.created_at,
          metadata: log.metadata
        };
      });

      setEvents(formattedEvents);

      // Calculate stats
      const today = new Date().toDateString();
      const todayEvents = formattedEvents.filter(
        event => new Date(event.timestamp).toDateString() === today
      ).length;

      const criticalEvents = formattedEvents.filter(
        event => event.severity === 'critical'
      ).length;

      const threatCounts = formattedEvents.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topThreats = Object.entries(threatCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      setStats({
        totalEvents: formattedEvents.length,
        criticalEvents,
        todayEvents,
        topThreats
      });

    } catch (error) {
      console.error('Error fetching security events:', error);
    } finally {
      setLoading(false);
    }
  };

  const detectSuspiciousActivity = async (activity: {
    action: string;
    frequency?: number;
    timeWindow?: number;
  }) => {
    // Simple suspicious activity detection
    const { action, frequency = 10, timeWindow = 300000 } = activity; // 5 minutes window
    
    const recent = events.filter(
      event => 
        event.description.includes(action) && 
        Date.now() - new Date(event.timestamp).getTime() < timeWindow
    );

    if (recent.length >= frequency) {
      await logSecurityEvent(
        'suspicious_activity',
        `Activité suspecte détectée: ${action} répété ${recent.length} fois`,
        'high',
        { action, occurrences: recent.length, timeWindow }
      );
    }
  };

  const analyzeLoginPattern = async (loginAttempt: { success: boolean; ip?: string }) => {
    const { success, ip } = loginAttempt;
    
    if (!success) {
      await logSecurityEvent(
        'failed_login',
        'Tentative de connexion échouée',
        'medium',
        { ip_address: ip }
      );
      
      // Check for multiple failed attempts
      await detectSuspiciousActivity({
        action: 'failed_login',
        frequency: 5,
        timeWindow: 600000 // 10 minutes
      });
    } else {
      await logSecurityEvent(
        'login_attempt',
        'Connexion réussie',
        'low',
        { ip_address: ip }
      );
    }
  };

  const checkDataAccessPattern = async (resourceType: string) => {
    await logSecurityEvent(
      'data_access',
      `Accès aux données: ${resourceType}`,
      'low',
      { resource_type: resourceType }
    );

    // Check for unusual data access patterns
    await detectSuspiciousActivity({
      action: resourceType,
      frequency: 20,
      timeWindow: 300000 // 5 minutes
    });
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
    refreshEvents: fetchSecurityEvents
  };
};
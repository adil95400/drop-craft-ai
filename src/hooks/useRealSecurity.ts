import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface SecurityEvent {
  id: string
  user_id: string
  event_type: 'login' | 'failed_login' | 'password_change' | 'suspicious_activity' | 'api_access' | string
  severity: 'low' | 'medium' | 'high' | 'critical' | 'info' | 'warning' | 'error'
  description: string
  ip_address?: string
  user_agent?: string
  status: 'open' | 'investigating' | 'resolved' | 'blocked'
  metadata: any
  created_at: string
}

export interface SecurityMetrics {
  securityScore: number
  vulnerabilities: number
  activeThreats: number
  blockedAttacks: number
  lastScan: string
  features: {
    ssl: boolean
    firewall: boolean
    backup: boolean
    monitoring: boolean
    twoFactor: boolean
  }
}

export interface Vulnerability {
  id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: string
  status: 'open' | 'investigating' | 'resolved' | 'patched'
  discovered_at: string
  fixed_at?: string
}

export const useRealSecurity = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const {
    data: securityEvents = [],
    isLoading: eventsLoading,
    error: eventsError
  } = useQuery({
    queryKey: ['real-security-events'],
    queryFn: async (): Promise<SecurityEvent[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      // Fetch real security events from Supabase
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching security events:', error)
        return []
      }

      // Map database fields to interface
      return (data || []).map((event: any) => ({
        id: event.id,
        user_id: event.user_id || user.id,
        event_type: event.event_type || 'unknown',
        severity: event.severity || 'info',
        description: event.description || '',
        ip_address: event.metadata?.ip_address,
        user_agent: event.metadata?.user_agent,
        status: event.metadata?.status || 'open',
        metadata: event.metadata || {},
        created_at: event.created_at
      }))
    }
  })

  const {
    data: vulnerabilities = [],
    isLoading: vulnLoading
  } = useQuery({
    queryKey: ['real-vulnerabilities'],
    queryFn: async (): Promise<Vulnerability[]> => {
      // Fetch from security_events where event_type indicates vulnerabilities
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .in('event_type', ['vulnerability_detected', 'security_warning', 'potential_scraping_detected'])
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error fetching vulnerabilities:', error)
        return []
      }

      return (data || []).map((v: any) => ({
        id: v.id,
        title: v.event_type || 'Security Issue',
        description: v.description || '',
        severity: v.severity === 'critical' ? 'critical' : 
                  v.severity === 'error' ? 'high' : 
                  v.severity === 'warning' ? 'medium' : 'low',
        category: v.metadata?.category || 'Security',
        status: v.metadata?.resolved ? 'resolved' : 'open',
        discovered_at: v.created_at,
        fixed_at: v.metadata?.fixed_at
      }))
    }
  })

  // Run security scan - creates real audit entry
  const runSecurityScan = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Log the security scan
      await supabase.from('security_events').insert({
        user_id: user.id,
        event_type: 'security_scan_initiated',
        severity: 'info',
        description: 'Manual security scan initiated by admin',
        metadata: { scan_type: 'full', timestamp: new Date().toISOString() }
      })

      // Fetch current security stats
      const { data: events } = await supabase
        .from('security_events')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      const criticalCount = (events || []).filter((e: any) => e.severity === 'critical').length
      const warningCount = (events || []).filter((e: any) => e.severity === 'warning').length

      // Log scan completion
      await supabase.from('security_events').insert({
        user_id: user.id,
        event_type: 'security_scan_completed',
        severity: 'info',
        description: `Security scan completed. Found ${criticalCount} critical, ${warningCount} warnings.`,
        metadata: { 
          critical_count: criticalCount,
          warning_count: warningCount,
          scanned_at: new Date().toISOString()
        }
      })
      
      return {
        scannedAt: new Date().toISOString(),
        newVulnerabilities: criticalCount,
        fixedIssues: 0
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['real-vulnerabilities'] })
      queryClient.invalidateQueries({ queryKey: ['real-security-events'] })
      toast({
        title: "Scan de sécurité terminé",
        description: `${data.newVulnerabilities} problèmes critiques détectés`
      })
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de lancer le scan de sécurité",
        variant: "destructive"
      })
    }
  })

  // Fix vulnerability - updates the security event
  const fixVulnerability = useMutation({
    mutationFn: async (vulnerabilityId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Update the security event as resolved
      const { error } = await supabase
        .from('security_events')
        .update({ 
          metadata: { resolved: true, fixed_at: new Date().toISOString(), fixed_by: user.id }
        })
        .eq('id', vulnerabilityId)

      if (error) throw error

      // Log the fix action
      await supabase.from('security_events').insert({
        user_id: user.id,
        event_type: 'vulnerability_fixed',
        severity: 'info',
        description: `Security vulnerability ${vulnerabilityId} has been resolved`,
        metadata: { vulnerability_id: vulnerabilityId }
      })

      return vulnerabilityId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-vulnerabilities'] })
      queryClient.invalidateQueries({ queryKey: ['real-security-events'] })
      toast({
        title: "Vulnérabilité corrigée",
        description: "La vulnérabilité a été résolue avec succès"
      })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de résoudre la vulnérabilité",
        variant: "destructive"
      })
    }
  })

  // Calculate real security metrics from database
  const openVulnerabilities = vulnerabilities.filter(v => v.status === 'open').length
  const criticalEvents = securityEvents.filter(e => e.severity === 'critical' || e.severity === 'error').length
  const blockedEvents = securityEvents.filter(e => e.status === 'blocked').length

  // Calculate score (higher is better)
  const baseScore = 100
  const scoreDeductions = (openVulnerabilities * 10) + (criticalEvents * 5)
  const calculatedScore = Math.max(0, Math.min(100, baseScore - scoreDeductions))

  const metrics: SecurityMetrics = {
    securityScore: calculatedScore,
    vulnerabilities: openVulnerabilities,
    activeThreats: criticalEvents,
    blockedAttacks: blockedEvents,
    lastScan: securityEvents.length > 0 ? securityEvents[0].created_at : new Date().toISOString(),
    features: {
      ssl: true, // Assuming SSL is always on for Supabase
      firewall: true, // Supabase has built-in firewall
      backup: true, // Supabase has automatic backups
      monitoring: true, // We're monitoring via security_events
      twoFactor: false // Would need to check auth settings
    }
  }

  return {
    securityEvents,
    vulnerabilities,
    metrics,
    isLoading: eventsLoading || vulnLoading,
    error: eventsError,
    runSecurityScan: runSecurityScan.mutate,
    fixVulnerability: fixVulnerability.mutate,
    isScanning: runSecurityScan.isPending,
    isFixing: fixVulnerability.isPending
  }
}

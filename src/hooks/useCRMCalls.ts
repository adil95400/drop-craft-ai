/**
 * Hook pour la gestion des appels CRM
 * Stocke les données dans activity_logs avec entity_type = 'call'
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
import { useToast } from '@/hooks/use-toast'

export interface CallRecord {
  id: string
  user_id: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  type: 'incoming' | 'outgoing' | 'missed'
  status: 'completed' | 'missed' | 'busy' | 'scheduled' | 'in_progress'
  duration: number // in seconds
  date: string
  notes?: string
  follow_up?: string
  outcome?: string
  created_at: string
}

interface CallStats {
  totalCalls: number
  completedToday: number
  missedCalls: number
  scheduledCalls: number
  avgDuration: number
  totalDurationToday: number
}

export function useCRMCalls() {
  const { user } = useUnifiedAuth()
  const { toast } = useToast()
  const [calls, setCalls] = useState<CallRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<CallStats>({
    totalCalls: 0,
    completedToday: 0,
    missedCalls: 0,
    scheduledCalls: 0,
    avgDuration: 0,
    totalDurationToday: 0
  })

  const fetchCalls = useCallback(async () => {
    if (!user) {
      setCalls([])
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('entity_type', 'call')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      const formattedCalls: CallRecord[] = (data || []).map(log => {
        const details = log.details as Record<string, any> || {}
        return {
          id: log.id,
          user_id: log.user_id,
          customer_name: details.customer_name || 'Client inconnu',
          customer_phone: details.customer_phone || '',
          customer_email: details.customer_email,
          type: details.call_type || 'outgoing',
          status: details.status || 'completed',
          duration: details.duration || 0,
          date: log.created_at,
          notes: details.notes || log.description,
          follow_up: details.follow_up,
          outcome: details.outcome,
          created_at: log.created_at
        }
      })

      setCalls(formattedCalls)
      calculateStats(formattedCalls)
    } catch (error: any) {
      console.error('Error fetching calls:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les appels',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [user, toast])

  const calculateStats = (calls: CallRecord[]) => {
    const today = new Date().toDateString()
    const todayCalls = calls.filter(c => new Date(c.date).toDateString() === today)
    const completedCalls = calls.filter(c => c.status === 'completed' && c.duration > 0)

    setStats({
      totalCalls: calls.length,
      completedToday: todayCalls.filter(c => c.status === 'completed').length,
      missedCalls: calls.filter(c => c.status === 'missed').length,
      scheduledCalls: calls.filter(c => c.status === 'scheduled').length,
      avgDuration: completedCalls.length > 0 
        ? completedCalls.reduce((acc, c) => acc + c.duration, 0) / completedCalls.length 
        : 0,
      totalDurationToday: todayCalls.reduce((acc, c) => acc + c.duration, 0)
    })
  }

  const logCall = useCallback(async (callData: Partial<CallRecord>) => {
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          action: 'call_logged',
          entity_type: 'call',
          entity_id: crypto.randomUUID(),
          description: callData.notes || `Appel ${callData.type} - ${callData.customer_name}`,
          details: {
            customer_name: callData.customer_name,
            customer_phone: callData.customer_phone,
            customer_email: callData.customer_email,
            call_type: callData.type || 'outgoing',
            status: callData.status || 'completed',
            duration: callData.duration || 0,
            notes: callData.notes,
            follow_up: callData.follow_up,
            outcome: callData.outcome
          },
          severity: 'info',
          source: 'crm'
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: 'Succès',
        description: 'Appel enregistré avec succès'
      })

      await fetchCalls()
      return data
    } catch (error: any) {
      console.error('Error logging call:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer l\'appel',
        variant: 'destructive'
      })
      return null
    }
  }, [user, toast, fetchCalls])

  const scheduleCall = useCallback(async (callData: {
    customer_name: string
    customer_phone: string
    scheduled_date: string
    notes?: string
  }) => {
    return await logCall({
      ...callData,
      type: 'outgoing',
      status: 'scheduled',
      duration: 0,
      notes: callData.notes
    })
  }, [logCall])

  const updateCall = useCallback(async (id: string, updates: Partial<CallRecord>) => {
    try {
      const { error } = await supabase
        .from('activity_logs')
        .update({
          description: updates.notes,
          details: {
            customer_name: updates.customer_name,
            customer_phone: updates.customer_phone,
            call_type: updates.type,
            status: updates.status,
            duration: updates.duration,
            notes: updates.notes,
            follow_up: updates.follow_up,
            outcome: updates.outcome
          }
        })
        .eq('id', id)

      if (error) throw error

      toast({
        title: 'Succès',
        description: 'Appel mis à jour'
      })

      await fetchCalls()
    } catch (error: any) {
      console.error('Error updating call:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour l\'appel',
        variant: 'destructive'
      })
    }
  }, [toast, fetchCalls])

  const deleteCall = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('activity_logs')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: 'Succès',
        description: 'Appel supprimé'
      })

      await fetchCalls()
    } catch (error: any) {
      console.error('Error deleting call:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'appel',
        variant: 'destructive'
      })
    }
  }, [toast, fetchCalls])

  useEffect(() => {
    fetchCalls()
  }, [fetchCalls])

  return {
    calls,
    stats,
    isLoading,
    logCall,
    scheduleCall,
    updateCall,
    deleteCall,
    refetch: fetchCalls
  }
}

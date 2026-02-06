/**
 * Hook pour la gestion des appels CRM
 * Délègue toute la logique à FastAPI
 */
import { useState, useEffect, useCallback } from 'react'
import { shopOptiApi } from '@/services/api/ShopOptiApiClient'
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
  duration: number
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

  const fetchCalls = useCallback(async () => {
    if (!user) {
      setCalls([])
      setIsLoading(false)
      return
    }

    try {
      const res = await shopOptiApi.request<CallRecord[]>('/crm/calls')
      const data = res.data || []
      setCalls(data)
      calculateStats(data)
    } catch (error: any) {
      console.error('Error fetching calls:', error)
      toast({ title: 'Erreur', description: 'Impossible de charger les appels', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [user, toast])

  const logCall = useCallback(async (callData: Partial<CallRecord>) => {
    if (!user) return null
    try {
      const res = await shopOptiApi.request('/crm/calls', { method: 'POST', body: callData })
      if (!res.success) throw new Error(res.error)
      toast({ title: 'Succès', description: 'Appel enregistré avec succès' })
      await fetchCalls()
      return res.data
    } catch (error: any) {
      toast({ title: 'Erreur', description: "Impossible d'enregistrer l'appel", variant: 'destructive' })
      return null
    }
  }, [user, toast, fetchCalls])

  const scheduleCall = useCallback(async (callData: {
    customer_name: string; customer_phone: string; scheduled_date: string; notes?: string
  }) => {
    return await logCall({ ...callData, type: 'outgoing', status: 'scheduled', duration: 0 })
  }, [logCall])

  const updateCall = useCallback(async (id: string, updates: Partial<CallRecord>) => {
    try {
      const res = await shopOptiApi.request(`/crm/calls/${id}`, { method: 'PUT', body: updates })
      if (!res.success) throw new Error(res.error)
      toast({ title: 'Succès', description: 'Appel mis à jour' })
      await fetchCalls()
    } catch (error: any) {
      toast({ title: 'Erreur', description: "Impossible de mettre à jour l'appel", variant: 'destructive' })
    }
  }, [toast, fetchCalls])

  const deleteCall = useCallback(async (id: string) => {
    try {
      const res = await shopOptiApi.request(`/crm/calls/${id}`, { method: 'DELETE' })
      if (!res.success) throw new Error(res.error)
      toast({ title: 'Succès', description: 'Appel supprimé' })
      await fetchCalls()
    } catch (error: any) {
      toast({ title: 'Erreur', description: "Impossible de supprimer l'appel", variant: 'destructive' })
    }
  }, [toast, fetchCalls])

  useEffect(() => { fetchCalls() }, [fetchCalls])

  return { calls, stats, isLoading, logCall, scheduleCall, updateCall, deleteCall, refetch: fetchCalls }
}

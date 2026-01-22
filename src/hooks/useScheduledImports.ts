import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
import { useToast } from '@/hooks/use-toast'

export interface ScheduledImport {
  id: string
  user_id: string
  name: string
  source_type: 'url' | 'csv' | 'xml' | 'api' | 'feed'
  source_url?: string
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly'
  cron_expression?: string
  next_run_at: string
  last_run_at?: string
  is_active: boolean
  last_run_status: 'completed' | 'failed' | 'pending' | 'never' | 'running'
  products_imported: number
  description?: string
  config: {
    auto_optimize?: boolean
    auto_publish?: boolean
    mapping?: Record<string, string>
    filters?: Record<string, any>
  }
  created_at: string
  updated_at: string
}

export interface CreateScheduledImportData {
  name: string
  source_type: ScheduledImport['source_type']
  source_url?: string
  frequency: ScheduledImport['frequency']
  is_active: boolean
  description?: string
  config?: ScheduledImport['config']
}

export function useScheduledImports() {
  const { user } = useUnifiedAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Calculate next run date based on frequency
  const calculateNextRun = (frequency: string): string => {
    const now = new Date()
    switch (frequency) {
      case 'hourly':
        now.setHours(now.getHours() + 1)
        break
      case 'daily':
        now.setDate(now.getDate() + 1)
        break
      case 'weekly':
        now.setDate(now.getDate() + 7)
        break
      case 'monthly':
        now.setMonth(now.getMonth() + 1)
        break
    }
    return now.toISOString()
  }

  // Fetch all scheduled imports
  const { data: schedules = [], isLoading, refetch } = useQuery({
    queryKey: ['scheduled-imports', user?.id],
    queryFn: async (): Promise<ScheduledImport[]> => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('scheduled_imports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        name: item.name,
        source_type: item.source_type,
        source_url: item.source_url,
        frequency: item.frequency,
        cron_expression: item.cron_expression,
        next_run_at: item.next_run_at,
        last_run_at: item.last_run_at,
        is_active: item.is_active ?? true,
        last_run_status: item.last_run_status || 'never',
        products_imported: item.products_imported || 0,
        description: item.description,
        config: typeof item.config === 'object' ? item.config : {},
        created_at: item.created_at,
        updated_at: item.updated_at
      }))
    },
    enabled: !!user?.id,
    staleTime: 30000
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateScheduledImportData) => {
      if (!user?.id) throw new Error('Non authentifié')

      const payload = {
        user_id: user.id,
        name: data.name,
        source_type: data.source_type,
        source_url: data.source_url || null,
        frequency: data.frequency,
        is_active: data.is_active,
        description: data.description || null,
        config: data.config || {},
        next_run_at: calculateNextRun(data.frequency),
        last_run_status: 'never',
        products_imported: 0
      }

      const { data: result, error } = await supabase
        .from('scheduled_imports')
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-imports'] })
      toast({
        title: 'Planning créé',
        description: 'Le planning d\'import a été créé avec succès'
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateScheduledImportData> }) => {
      if (!user?.id) throw new Error('Non authentifié')

      const updatePayload: Record<string, any> = { ...data }
      
      if (data.frequency) {
        updatePayload.next_run_at = calculateNextRun(data.frequency)
      }

      const { data: result, error } = await supabase
        .from('scheduled_imports')
        .update(updatePayload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-imports'] })
      toast({
        title: 'Planning mis à jour',
        description: 'Les modifications ont été enregistrées'
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Non authentifié')

      const { error } = await supabase
        .from('scheduled_imports')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-imports'] })
      toast({
        title: 'Planning supprimé',
        description: 'Le planning a été supprimé'
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  // Toggle active status
  const toggleActive = useCallback(async (id: string) => {
    const schedule = schedules.find(s => s.id === id)
    if (!schedule) return

    await updateMutation.mutateAsync({
      id,
      data: { is_active: !schedule.is_active }
    })
  }, [schedules, updateMutation])

  // Execute import now
  const executeNow = useMutation({
    mutationFn: async (id: string) => {
      const schedule = schedules.find(s => s.id === id)
      if (!schedule) throw new Error('Planning non trouvé')

      // Call the appropriate import function based on source_type
      const { data, error } = await supabase.functions.invoke('process-import', {
        body: {
          schedule_id: id,
          source_type: schedule.source_type,
          source_url: schedule.source_url,
          config: schedule.config
        }
      })

      if (error) throw error

      // Update last run
      await supabase
        .from('scheduled_imports')
        .update({
          last_run_at: new Date().toISOString(),
          last_run_status: 'completed',
          next_run_at: calculateNextRun(schedule.frequency)
        })
        .eq('id', id)

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-imports'] })
      toast({
        title: 'Import lancé',
        description: 'L\'import a été lancé manuellement'
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  // Stats
  const stats = {
    total: schedules.length,
    active: schedules.filter(s => s.is_active).length,
    inactive: schedules.filter(s => !s.is_active).length,
    totalProductsImported: schedules.reduce((sum, s) => sum + (s.products_imported || 0), 0)
  }

  return {
    schedules,
    isLoading,
    stats,
    refetch,
    createSchedule: createMutation.mutate,
    updateSchedule: updateMutation.mutate,
    deleteSchedule: deleteMutation.mutate,
    toggleActive,
    executeNow: executeNow.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isExecuting: executeNow.isPending
  }
}

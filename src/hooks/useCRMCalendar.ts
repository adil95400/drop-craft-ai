/**
 * Hook pour la gestion du calendrier CRM
 * Utilise content_calendar pour les événements
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
import { useToast } from '@/hooks/use-toast'

export interface CalendarEvent {
  id: string
  user_id: string
  title: string
  content_type: 'meeting' | 'call' | 'email' | 'task' | 'demo' | 'follow_up'
  scheduled_date: string
  scheduled_time: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'in_progress'
  platform?: string
  notes?: string
  color?: string
  attendees?: string[]
  duration_minutes?: number
  location?: string
  priority?: 'low' | 'medium' | 'high'
  created_at: string
  updated_at: string
}

interface CalendarStats {
  totalEvents: number
  todayEvents: number
  weekEvents: number
  completedThisMonth: number
  upcomingMeetings: number
}

export function useCRMCalendar() {
  const { user } = useUnifiedAuth()
  const { toast } = useToast()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<CalendarStats>({
    totalEvents: 0,
    todayEvents: 0,
    weekEvents: 0,
    completedThisMonth: 0,
    upcomingMeetings: 0
  })

  const fetchEvents = useCallback(async () => {
    if (!user) {
      setEvents([])
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('content_calendar')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_date', { ascending: true })

      if (error) throw error

      const formattedEvents: CalendarEvent[] = (data || []).map(event => ({
        id: event.id,
        user_id: event.user_id,
        title: event.title,
        content_type: event.content_type as CalendarEvent['content_type'] || 'task',
        scheduled_date: event.scheduled_date,
        scheduled_time: event.scheduled_time || '09:00',
        status: event.status as CalendarEvent['status'] || 'scheduled',
        platform: event.platform,
        notes: event.notes,
        color: event.color,
        created_at: event.created_at,
        updated_at: event.updated_at
      }))

      setEvents(formattedEvents)
      calculateStats(formattedEvents)
    } catch (error: any) {
      console.error('Error fetching calendar events:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les événements',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [user, toast])

  const calculateStats = (events: CalendarEvent[]) => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const weekEnd = new Date(today)
    weekEnd.setDate(weekEnd.getDate() + 7)
    const weekEndStr = weekEnd.toISOString().split('T')[0]
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]

    setStats({
      totalEvents: events.length,
      todayEvents: events.filter(e => e.scheduled_date === todayStr).length,
      weekEvents: events.filter(e => 
        e.scheduled_date >= todayStr && e.scheduled_date <= weekEndStr
      ).length,
      completedThisMonth: events.filter(e => 
        e.status === 'completed' && e.scheduled_date >= monthStart
      ).length,
      upcomingMeetings: events.filter(e => 
        e.content_type === 'meeting' && e.scheduled_date >= todayStr && e.status !== 'completed'
      ).length
    })
  }

  const createEvent = useCallback(async (eventData: Partial<CalendarEvent>) => {
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from('content_calendar')
        .insert({
          user_id: user.id,
          title: eventData.title || 'Nouvel événement',
          content_type: eventData.content_type || 'task',
          scheduled_date: eventData.scheduled_date || new Date().toISOString().split('T')[0],
          scheduled_time: eventData.scheduled_time || '09:00',
          status: eventData.status || 'scheduled',
          platform: eventData.platform,
          notes: eventData.notes,
          color: eventData.color
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: 'Succès',
        description: 'Événement créé avec succès'
      })

      await fetchEvents()
      return data
    } catch (error: any) {
      console.error('Error creating event:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de créer l\'événement',
        variant: 'destructive'
      })
      return null
    }
  }, [user, toast, fetchEvents])

  const updateEvent = useCallback(async (id: string, updates: Partial<CalendarEvent>) => {
    try {
      const { error } = await supabase
        .from('content_calendar')
        .update({
          title: updates.title,
          content_type: updates.content_type,
          scheduled_date: updates.scheduled_date,
          scheduled_time: updates.scheduled_time,
          status: updates.status,
          platform: updates.platform,
          notes: updates.notes,
          color: updates.color,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      toast({
        title: 'Succès',
        description: 'Événement mis à jour'
      })

      await fetchEvents()
    } catch (error: any) {
      console.error('Error updating event:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour l\'événement',
        variant: 'destructive'
      })
    }
  }, [toast, fetchEvents])

  const deleteEvent = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('content_calendar')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: 'Succès',
        description: 'Événement supprimé'
      })

      await fetchEvents()
    } catch (error: any) {
      console.error('Error deleting event:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'événement',
        variant: 'destructive'
      })
    }
  }, [toast, fetchEvents])

  const markAsCompleted = useCallback(async (id: string) => {
    await updateEvent(id, { status: 'completed' })
  }, [updateEvent])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return {
    events,
    stats,
    isLoading,
    createEvent,
    updateEvent,
    deleteEvent,
    markAsCompleted,
    refetch: fetchEvents
  }
}

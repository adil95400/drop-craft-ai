import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useToast } from '@/hooks/use-toast';

export interface CalendarEvent {
  id: string; user_id: string; title: string;
  content_type: 'meeting' | 'call' | 'email' | 'task' | 'demo' | 'follow_up';
  scheduled_date: string; scheduled_time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'in_progress';
  platform?: string; notes?: string; color?: string; attendees?: string[];
  duration_minutes?: number; location?: string; priority?: 'low' | 'medium' | 'high';
  created_at: string; updated_at: string;
}

interface CalendarStats {
  totalEvents: number; todayEvents: number; weekEvents: number; completedThisMonth: number; upcomingMeetings: number;
}

export function useCRMCalendar() {
  const { user } = useUnifiedAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<CalendarStats>({ totalEvents: 0, todayEvents: 0, weekEvents: 0, completedThisMonth: 0, upcomingMeetings: 0 });

  const calculateStats = (events: CalendarEvent[]) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().split('T')[0];
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    setStats({
      totalEvents: events.length,
      todayEvents: events.filter(e => e.scheduled_date === todayStr).length,
      weekEvents: events.filter(e => e.scheduled_date >= todayStr && e.scheduled_date <= weekEndStr).length,
      completedThisMonth: events.filter(e => e.status === 'completed' && e.scheduled_date >= monthStart).length,
      upcomingMeetings: events.filter(e => e.content_type === 'meeting' && e.scheduled_date >= todayStr && e.status !== 'completed').length,
    });
  };

  const fetchEvents = useCallback(async () => {
    if (!user) { setEvents([]); setIsLoading(false); return; }
    try {
      const { data, error } = await (supabase.from('crm_calendar_events') as any)
        .select('*').eq('user_id', user.id).order('scheduled_date', { ascending: true });
      if (error) throw error;
      const eventData = (data || []) as CalendarEvent[];
      setEvents(eventData);
      calculateStats(eventData);
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger les événements', variant: 'destructive' });
    } finally { setIsLoading(false); }
  }, [user, toast]);

  const createEvent = useCallback(async (eventData: Partial<CalendarEvent>) => {
    if (!user) return null;
    try {
      const { data, error } = await (supabase.from('crm_calendar_events') as any)
        .insert({ ...eventData, user_id: user.id }).select().single();
      if (error) throw error;
      toast({ title: 'Succès', description: 'Événement créé avec succès' });
      await fetchEvents();
      return data;
    } catch {
      toast({ title: 'Erreur', description: "Impossible de créer l'événement", variant: 'destructive' });
      return null;
    }
  }, [user, toast, fetchEvents]);

  const updateEvent = useCallback(async (id: string, updates: Partial<CalendarEvent>) => {
    try {
      const { error } = await (supabase.from('crm_calendar_events') as any)
        .update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Succès', description: 'Événement mis à jour' });
      await fetchEvents();
    } catch {
      toast({ title: 'Erreur', description: "Impossible de mettre à jour l'événement", variant: 'destructive' });
    }
  }, [toast, fetchEvents]);

  const deleteEvent = useCallback(async (id: string) => {
    try {
      const { error } = await (supabase.from('crm_calendar_events') as any).delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Succès', description: 'Événement supprimé' });
      await fetchEvents();
    } catch {
      toast({ title: 'Erreur', description: "Impossible de supprimer l'événement", variant: 'destructive' });
    }
  }, [toast, fetchEvents]);

  const markAsCompleted = useCallback(async (id: string) => { await updateEvent(id, { status: 'completed' }); }, [updateEvent]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  return { events, stats, isLoading, createEvent, updateEvent, deleteEvent, markAsCompleted, refetch: fetchEvents };
}

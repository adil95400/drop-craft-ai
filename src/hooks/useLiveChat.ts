/**
 * useLiveChat - Hook for real-time live chat sessions & messages
 */
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthOptimized } from '@/shared/hooks/useAuthOptimized';
import { toast } from 'sonner';

export interface ChatSession {
  id: string;
  user_id: string;
  customer_email: string | null;
  customer_name: string | null;
  status: string;
  channel: string;
  assigned_to: string | null;
  priority: string;
  subject: string | null;
  tags: string[];
  satisfaction_rating: number | null;
  metadata: any;
  started_at: string;
  last_message_at: string | null;
  closed_at: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender_type: string;
  sender_id: string | null;
  content: string;
  message_type: string;
  attachments: any[];
  metadata: any;
  is_read: boolean;
  created_at: string;
}

export interface CannedResponse {
  id: string;
  title: string;
  content: string;
  category: string;
  shortcut: string | null;
  usage_count: number;
  is_active: boolean;
}

export function useLiveChat(activeSessionId?: string) {
  const { user } = useAuthOptimized();
  const queryClient = useQueryClient();

  // Fetch sessions
  const { data: sessions = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: ['live-chat-sessions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('live_chat_sessions')
        .select('*')
        .eq('user_id', user!.id)
        .order('last_message_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as ChatSession[];
    },
    enabled: !!user?.id,
  });

  // Fetch messages for active session
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['live-chat-messages', activeSessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('live_chat_messages')
        .select('*')
        .eq('session_id', activeSessionId!)
        .order('created_at', { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data || []) as ChatMessage[];
    },
    enabled: !!activeSessionId,
  });

  // Fetch canned responses
  const { data: cannedResponses = [] } = useQuery({
    queryKey: ['canned-responses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('canned_responses')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .order('usage_count', { ascending: false });
      if (error) throw error;
      return (data || []) as CannedResponse[];
    },
    enabled: !!user?.id,
  });

  // Realtime subscriptions
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('live-chat-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'live_chat_messages',
      }, (payload) => {
        const msg = payload.new as ChatMessage;
        if (msg.session_id === activeSessionId) {
          queryClient.setQueryData<ChatMessage[]>(
            ['live-chat-messages', activeSessionId],
            (old) => [...(old || []), msg]
          );
        }
        queryClient.invalidateQueries({ queryKey: ['live-chat-sessions'] });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'live_chat_sessions',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['live-chat-sessions'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, activeSessionId, queryClient]);

  // Create session
  const createSession = useMutation({
    mutationFn: async (params: { customer_email: string; customer_name?: string; subject?: string; channel?: string; priority?: string }) => {
      const { data, error } = await supabase
        .from('live_chat_sessions')
        .insert({
          user_id: user!.id,
          customer_email: params.customer_email,
          customer_name: params.customer_name,
          subject: params.subject,
          channel: params.channel || 'web',
          priority: params.priority || 'normal',
        })
        .select()
        .single();
      if (error) throw error;
      // Send system message
      await supabase.from('live_chat_messages').insert({
        session_id: data.id,
        sender_type: 'system',
        content: `Conversation démarrée avec ${params.customer_name || params.customer_email}`,
        message_type: 'system',
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-chat-sessions'] });
      toast.success('Conversation créée');
    },
  });

  // Send message
  const sendMessage = useMutation({
    mutationFn: async (params: { session_id: string; content: string; sender_type?: string; message_type?: string }) => {
      const { data, error } = await supabase
        .from('live_chat_messages')
        .insert({
          session_id: params.session_id,
          sender_type: params.sender_type || 'agent',
          sender_id: user!.id,
          content: params.content,
          message_type: params.message_type || 'text',
        })
        .select()
        .single();
      if (error) throw error;
      // Update last_message_at
      await supabase
        .from('live_chat_sessions')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', params.session_id);
      return data;
    },
  });

  // Close session
  const closeSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('live_chat_sessions')
        .update({ status: 'closed', closed_at: new Date().toISOString() })
        .eq('id', sessionId);
      if (error) throw error;
      await supabase.from('live_chat_messages').insert({
        session_id: sessionId,
        sender_type: 'system',
        content: 'Conversation fermée',
        message_type: 'system',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-chat-sessions'] });
      toast.success('Conversation fermée');
    },
  });

  // Rate session
  const rateSession = useMutation({
    mutationFn: async ({ sessionId, rating }: { sessionId: string; rating: number }) => {
      const { error } = await supabase
        .from('live_chat_sessions')
        .update({ satisfaction_rating: rating })
        .eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => toast.success('Note enregistrée'),
  });

  const activeSessions = sessions.filter(s => s.status === 'active' || s.status === 'waiting');
  const closedSessions = sessions.filter(s => s.status === 'closed' || s.status === 'archived');

  return {
    sessions, activeSessions, closedSessions, messages, cannedResponses,
    isLoadingSessions, isLoadingMessages,
    createSession, sendMessage, closeSession, rateSession,
  };
}

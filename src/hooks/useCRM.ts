import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CustomerWithScore {
  id: string;
  name: string;
  email: string;
  phone?: string;
  total_orders: number;
  total_spent: number;
  created_at: string;
  score?: {
    total_score: number;
    recency_score: number;
    frequency_score: number;
    monetary_score: number;
    engagement_score: number;
  };
  segment_name?: string;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string | null;
  color?: string;
  conditions?: any[];
  customer_count: number;
  is_dynamic?: boolean;
  is_active?: boolean;
  created_at: string;
}

export interface CustomerCommunication {
  id: string;
  customer_id: string | null;
  segment_id: string | null;
  communication_type: string;
  subject: string;
  content: string | null;
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
}

export function useCRM() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch customers with scores
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['crm-customers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;

      // Fetch scores
      const { data: scores } = await supabase
        .from('customer_scores')
        .select('*')
        .eq('user_id', user.id);

      const scoreMap = new Map((scores || []).map((s: any) => [s.customer_id, s]));

      return (data || []).map((c: any) => {
        const s = scoreMap.get(c.id);
        return {
          id: c.id,
          name: c.name || c.first_name || 'Sans nom',
          email: c.email || '',
          phone: c.phone,
          total_orders: c.total_orders || 0,
          total_spent: c.total_spent || 0,
          created_at: c.created_at,
          score: s ? {
            total_score: s.total_score,
            recency_score: s.recency_score,
            frequency_score: s.frequency_score,
            monetary_score: s.monetary_score,
            engagement_score: s.engagement_score,
          } : undefined,
        } as CustomerWithScore;
      });
    },
    enabled: !!user?.id,
  });

  // Segments
  const { data: segments = [], isLoading: isLoadingSegments } = useQuery({
    queryKey: ['crm-segments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('customer_segments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as CustomerSegment[];
    },
    enabled: !!user?.id,
  });

  // Communications
  const { data: communications = [], isLoading: isLoadingComms } = useQuery({
    queryKey: ['crm-communications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('customer_communications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as CustomerCommunication[];
    },
    enabled: !!user?.id,
  });

  // Create segment
  const createSegment = useMutation({
    mutationFn: async (segment: { name: string; description?: string; color?: string; conditions?: any[] }) => {
      if (!user?.id) throw new Error('Non connecté');
      const { data, error } = await supabase
        .from('customer_segments')
        .insert({ user_id: user.id, ...segment })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-segments'] });
      toast.success('Segment créé');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Calculate RFM scores
  const calculateScores = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Non connecté');
      const customerList = customers;
      if (!customerList.length) return;

      const maxSpent = Math.max(...customerList.map(c => c.total_spent), 1);
      const maxOrders = Math.max(...customerList.map(c => c.total_orders), 1);
      const now = Date.now();

      const scores = customerList.map(c => {
        const daysSinceCreated = Math.max(1, (now - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24));
        const recency = Math.round(Math.max(0, 100 - daysSinceCreated));
        const frequency = Math.round((c.total_orders / maxOrders) * 100);
        const monetary = Math.round((c.total_spent / maxSpent) * 100);
        const engagement = Math.round((recency + frequency + monetary) / 3);
        const total = Math.round((recency * 0.25 + frequency * 0.3 + monetary * 0.35 + engagement * 0.1));

        return {
          user_id: user.id,
          customer_id: c.id,
          total_score: total,
          recency_score: recency,
          frequency_score: frequency,
          monetary_score: monetary,
          engagement_score: engagement,
          last_calculated_at: new Date().toISOString(),
        };
      });

      const { error } = await supabase
        .from('customer_scores')
        .upsert(scores, { onConflict: 'user_id,customer_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-customers'] });
      toast.success('Scores RFM recalculés');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Create communication
  const createCommunication = useMutation({
    mutationFn: async (comm: { subject: string; content?: string; communication_type?: string; customer_id?: string; segment_id?: string }) => {
      if (!user?.id) throw new Error('Non connecté');
      const { data, error } = await supabase
        .from('customer_communications')
        .insert({ user_id: user.id, ...comm })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-communications'] });
      toast.success('Communication créée');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Stats
  const totalCustomers = customers.length;
  const avgScore = customers.reduce((a, c) => a + (c.score?.total_score || 0), 0) / Math.max(totalCustomers, 1);
  const totalRevenue = customers.reduce((a, c) => a + c.total_spent, 0);
  const vipCustomers = customers.filter(c => (c.score?.total_score || 0) >= 70).length;

  return {
    customers,
    segments,
    communications,
    isLoading: isLoadingCustomers || isLoadingSegments || isLoadingComms,
    createSegment: createSegment.mutate,
    calculateScores: calculateScores.mutate,
    isCalculating: calculateScores.isPending,
    createCommunication: createCommunication.mutate,
    stats: { totalCustomers, avgScore: Math.round(avgScore), totalRevenue, vipCustomers },
  };
}

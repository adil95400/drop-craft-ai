import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface AutomationTrigger {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  trigger_type: 'order_status' | 'customer_behavior' | 'inventory_level' | 'price_change' | 'scheduled';
  conditions: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutomationAction {
  id: string;
  user_id: string;
  trigger_id: string;
  action_type: 'send_email' | 'update_inventory' | 'create_order' | 'update_customer' | 'price_adjustment' | 'notification';
  action_config: any;
  execution_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutomationExecution {
  id: string;
  user_id: string;
  trigger_id: string;
  action_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input_data: any;
  output_data: any;
  error_message?: string;
  execution_time_ms?: number;
  started_at: string;
  completed_at?: string;
}

export const useAutomation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch automation triggers
  const { data: triggers = [], isLoading: isLoadingTriggers } = useQuery({
    queryKey: ['automation-triggers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_triggers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as AutomationTrigger[];
    },
  });

  // Fetch automation actions
  const { data: actions = [], isLoading: isLoadingActions } = useQuery({
    queryKey: ['automation-actions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_actions')
        .select('*')
        .order('execution_order', { ascending: true });
      
      if (error) throw error;
      return data as AutomationAction[];
    },
  });

  // Fetch execution logs
  const { data: executions = [], isLoading: isLoadingExecutions } = useQuery({
    queryKey: ['automation-executions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_execution_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as AutomationExecution[];
    },
  });

  // Create automation trigger
  const createTrigger = useMutation({
    mutationFn: async (newTrigger: Omit<AutomationTrigger, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('automation_triggers')
        .insert([{ ...newTrigger, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-triggers'] });
      toast({
        title: "Déclencheur créé",
        description: "Le déclencheur d'automatisation a été créé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le déclencheur",
        variant: "destructive",
      });
    },
  });

  // Update automation trigger
  const updateTrigger = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AutomationTrigger> }) => {
      const { data, error } = await supabase
        .from('automation_triggers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-triggers'] });
      toast({
        title: "Déclencheur mis à jour",
        description: "Le déclencheur a été modifié avec succès",
      });
    },
  });

  // Delete automation trigger
  const deleteTrigger = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('automation_triggers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-triggers'] });
      queryClient.invalidateQueries({ queryKey: ['automation-actions'] });
      toast({
        title: "Déclencheur supprimé",
        description: "Le déclencheur a été supprimé avec succès",
      });
    },
  });

  // Create automation action
  const createAction = useMutation({
    mutationFn: async (newAction: Omit<AutomationAction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('automation_actions')
        .insert([{ ...newAction, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-actions'] });
      toast({
        title: "Action créée",
        description: "L'action d'automatisation a été créée avec succès",
      });
    },
  });

  // Process automation trigger
  const processTrigger = useMutation({
    mutationFn: async ({ triggerId, contextData }: { triggerId: string; contextData?: any }) => {
      const { data, error } = await supabase.rpc('process_automation_trigger', {
        trigger_id: triggerId,
        context_data: contextData || {}
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['automation-executions'] });
      toast({
        title: "Automatisation exécutée",
        description: `${data?.actions_executed || 0} action(s) exécutée(s) avec succès`,
      });
    },
  });

  // Seed sample data
  const seedSampleData = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('seed_sample_data');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['automation-triggers'] });
      toast({
        title: "Données créées",
        description: "Les données d'exemple ont été créées avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer les données d'exemple",
        variant: "destructive",
      });
    },
  });

  const stats = {
    totalTriggers: triggers.length,
    activeTriggers: triggers.filter(t => t.is_active).length,
    totalActions: actions.length,
    activeActions: actions.filter(a => a.is_active).length,
    totalExecutions: executions.length,
    successfulExecutions: executions.filter(e => e.status === 'completed').length,
    failedExecutions: executions.filter(e => e.status === 'failed').length,
  };

  return {
    triggers,
    actions,
    executions,
    stats,
    isLoading: isLoadingTriggers || isLoadingActions || isLoadingExecutions,
    createTrigger: createTrigger.mutate,
    updateTrigger: updateTrigger.mutate,
    deleteTrigger: deleteTrigger.mutate,
    createAction: createAction.mutate,
    processTrigger: processTrigger.mutate,
    seedSampleData: seedSampleData.mutate,
    isCreatingTrigger: createTrigger.isPending,
    isUpdatingTrigger: updateTrigger.isPending,
    isDeletingTrigger: deleteTrigger.isPending,
    isCreatingAction: createAction.isPending,
    isProcessing: processTrigger.isPending,
    isSeeding: seedSampleData.isPending,
  };
};
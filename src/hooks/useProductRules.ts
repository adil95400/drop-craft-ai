import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ProductRule, RULE_TEMPLATES, ProductRuleConditionGroup, ProductRuleAction } from '@/lib/rules/ruleTypes';

export function useProductRules() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer toutes les règles - using pricing_rules table
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['product-rules', user?.id],
    queryFn: async (): Promise<ProductRule[]> => {
      if (!user?.id) return [];

      const { data, error } = await (supabase as any)
        .from('pricing_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: true });

      if (error) throw error;
      
      return (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description || undefined,
        enabled: row.is_active ?? true,
        priority: row.priority || 3,
        channel: 'global',
        conditionGroup: row.conditions || { logic: 'AND', conditions: [] },
        actions: row.actions || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        executionCount: row.execution_count || 0,
        successCount: row.products_affected || 0,
        errorCount: 0,
        lastExecutedAt: row.last_executed_at || undefined,
        stopOnError: false,
        skipIfAlreadyModified: false,
        logChanges: true
      }));
    },
    enabled: !!user?.id
  });

  // Statistiques - avec valeurs par défaut sécurisées
  const safeRules = Array.isArray(rules) ? rules : [];
  const stats = {
    totalRules: safeRules.length,
    activeRules: safeRules.filter(r => r?.enabled).length,
    pausedRules: safeRules.filter(r => !r?.enabled).length,
    aiRules: safeRules.filter(r => r?.actions?.some(a => a?.type === 'generate_ai')).length,
    totalExecutions: safeRules.reduce((sum, r) => sum + (r?.executionCount || 0), 0)
  };

  // Créer une règle
  const createRule = useMutation({
    mutationFn: async (rule: Partial<ProductRule>) => {
      if (!user?.id) throw new Error('Non authentifié');

      const insertData = {
        user_id: user.id,
        name: rule.name || 'Nouvelle règle',
        description: rule.description || null,
        is_active: rule.enabled ?? true,
        priority: rule.priority || 3,
        conditions: (rule.conditionGroup || { logic: 'AND', conditions: [] }),
        actions: (rule.actions || [])
      };

      const { data, error } = await (supabase as any)
        .from('pricing_rules')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-rules'] });
      toast({ title: 'Règle créée', description: 'La règle a été créée avec succès' });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  // Mettre à jour une règle
  const updateRule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProductRule> & { id: string }) => {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.enabled !== undefined) updateData.is_active = updates.enabled;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.conditionGroup !== undefined) updateData.conditions = updates.conditionGroup;
      if (updates.actions !== undefined) updateData.actions = updates.actions;

      const { data, error } = await (supabase as any)
        .from('pricing_rules')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-rules'] });
      toast({ title: 'Règle mise à jour' });
    }
  });

  // Supprimer une règle
  const deleteRule = useMutation({
    mutationFn: async (ruleId: string) => {
      const { error } = await (supabase as any)
        .from('pricing_rules')
        .delete()
        .eq('id', ruleId)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-rules'] });
      toast({ title: 'Règle supprimée' });
    }
  });

  // Activer/désactiver une règle
  const toggleRule = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await (supabase as any)
        .from('pricing_rules')
        .update({ is_active: enabled, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: (_, { enabled }) => {
      queryClient.invalidateQueries({ queryKey: ['product-rules'] });
      toast({ title: enabled ? 'Règle activée' : 'Règle désactivée' });
    }
  });

  // Créer depuis un template
  const createFromTemplate = async (templateId: string) => {
    const template = RULE_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      toast({ title: 'Erreur', description: 'Template non trouvé', variant: 'destructive' });
      return;
    }

    await createRule.mutateAsync({
      name: template.rule.name,
      description: template.description,
      enabled: template.rule.enabled ?? true,
      priority: template.rule.priority || 3,
      channel: template.rule.channel || 'global',
      conditionGroup: template.rule.conditionGroup as ProductRuleConditionGroup,
      actions: template.rule.actions as ProductRuleAction[]
    });
  };

  return {
    rules,
    stats,
    templates: RULE_TEMPLATES,
    isLoading,
    createRule: createRule.mutate,
    updateRule: updateRule.mutate,
    deleteRule: deleteRule.mutate,
    toggleRule: toggleRule.mutate,
    createFromTemplate,
    isCreating: createRule.isPending,
    isUpdating: updateRule.isPending,
    isDeleting: deleteRule.isPending
  };
}

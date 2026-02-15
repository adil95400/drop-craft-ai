/**
 * Rules Execution Data Hook
 * Connects execution history to real Supabase data with AI insights
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthOptimized } from '@/shared';
import { useMemo } from 'react';

export interface ExecutionLog {
  id: string;
  ruleId: string;
  ruleName: string;
  ruleType: 'catalog' | 'pricing' | 'feed';
  executedAt: string;
  status: 'success' | 'error' | 'partial';
  productsAffected: number;
  duration: number;
  error?: string;
  changes?: Array<{
    productId: string;
    productName: string;
    field: string;
    before: string;
    after: string;
  }>;
}

export interface ExecutionStats {
  totalExecutions: number;
  successRate: number;
  avgProductsPerExecution: number;
  avgDuration: number;
  trendsLastWeek: {
    executions: number;
    executionsDelta: number;
    successRate: number;
    successRateDelta: number;
  };
  topPerformingRules: Array<{
    id: string;
    name: string;
    successRate: number;
    executionCount: number;
  }>;
  recentErrors: Array<{
    ruleId: string;
    ruleName: string;
    error: string;
    timestamp: string;
  }>;
}

export function useRulesExecutionData(limit: number = 50) {
  const { user } = useAuthOptimized();
  const userId = user?.id || '';

  // Fetch execution logs from automation_execution_logs
  const { data: executionsRaw = [], isLoading, refetch } = useQuery({
    queryKey: ['rules-execution-history', userId, limit],
    queryFn: async () => {
      // Query activity_logs for catalog/feed rule executions
      const { data: automationLogsRaw, error: automationError } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .in('action', ['rule_executed', 'automation_executed', 'customer_updated'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (automationError) throw automationError;
      const automationLogs = (automationLogsRaw || []).map((log: any) => ({
        id: log.id,
        trigger_id: log.entity_id,
        action_id: null,
        input_data: log.details,
        executed_at: log.created_at,
        created_at: log.created_at,
        status: log.severity === 'error' ? 'error' : 'success',
        output_data: log.details,
        duration_ms: 0,
        error_message: log.severity === 'error' ? log.description : null,
      }));

      // Query price_history for pricing rule executions
      const { data: priceLogs, error: priceError } = await supabase
        .from('price_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (priceError) throw priceError;

      // Combine and normalize logs
      const normalizedAutomation = (automationLogs || []).map(log => ({
        id: log.id,
        ruleId: log.trigger_id || log.action_id || '',
        ruleName: (log.input_data as any)?.rule_name || 'Règle automatisation',
        ruleType: 'catalog' as const,
        executedAt: log.executed_at || log.created_at || '',
        status: log.status === 'success' ? 'success' as const : 
                log.status === 'partial' ? 'partial' as const : 'error' as const,
        productsAffected: (log.output_data as any)?.products_affected || 0,
        duration: log.duration_ms || 0,
        error: log.error_message || undefined,
        changes: (log.output_data as any)?.changes || undefined,
      }));

      const normalizedPricing = (priceLogs || []).map(log => ({
        id: log.id,
        ruleId: log.rule_id || '',
        ruleName: log.change_reason || 'Règle de prix',
        ruleType: 'pricing' as const,
        executedAt: log.created_at || '',
        status: 'success' as const,
        productsAffected: 1,
        duration: 0,
        error: undefined,
        changes: [{
          productId: log.product_id || '',
          productName: 'Produit',
          field: 'price',
          before: String(log.old_price || 0),
          after: String(log.new_price || 0),
        }],
      }));

      return [...normalizedAutomation, ...normalizedPricing]
        .sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime())
        .slice(0, limit);
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });

  // Calculate execution stats with AI insights
  const stats = useMemo((): ExecutionStats => {
    const executions = executionsRaw as ExecutionLog[];
    const totalExecutions = executions.length;
    
    if (totalExecutions === 0) {
      return {
        totalExecutions: 0,
        successRate: 0,
        avgProductsPerExecution: 0,
        avgDuration: 0,
        trendsLastWeek: { executions: 0, executionsDelta: 0, successRate: 0, successRateDelta: 0 },
        topPerformingRules: [],
        recentErrors: [],
      };
    }

    const successfulExecutions = executions.filter(e => e.status === 'success');
    const successRate = Math.round((successfulExecutions.length / totalExecutions) * 100);
    
    const totalProducts = executions.reduce((sum, e) => sum + e.productsAffected, 0);
    const avgProductsPerExecution = Math.round(totalProducts / totalExecutions);
    
    const totalDuration = executions.reduce((sum, e) => sum + e.duration, 0);
    const avgDuration = Math.round(totalDuration / totalExecutions);

    // Calculate weekly trends
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const thisWeekExecs = executions.filter(e => new Date(e.executedAt) >= oneWeekAgo);
    const lastWeekExecs = executions.filter(e => {
      const date = new Date(e.executedAt);
      return date >= twoWeeksAgo && date < oneWeekAgo;
    });

    const thisWeekSuccess = thisWeekExecs.filter(e => e.status === 'success').length;
    const thisWeekSuccessRate = thisWeekExecs.length > 0 
      ? Math.round((thisWeekSuccess / thisWeekExecs.length) * 100) 
      : 0;
    
    const lastWeekSuccess = lastWeekExecs.filter(e => e.status === 'success').length;
    const lastWeekSuccessRate = lastWeekExecs.length > 0 
      ? Math.round((lastWeekSuccess / lastWeekExecs.length) * 100) 
      : 0;

    // Top performing rules (grouped by ruleId)
    const rulePerformance = new Map<string, { name: string; success: number; total: number }>();
    executions.forEach(e => {
      const existing = rulePerformance.get(e.ruleId) || { name: e.ruleName, success: 0, total: 0 };
      existing.total++;
      if (e.status === 'success') existing.success++;
      existing.name = e.ruleName;
      rulePerformance.set(e.ruleId, existing);
    });

    const topPerformingRules = Array.from(rulePerformance.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        successRate: Math.round((data.success / data.total) * 100),
        executionCount: data.total,
      }))
      .filter(r => r.executionCount >= 2)
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5);

    // Recent errors
    const recentErrors = executions
      .filter(e => e.error)
      .slice(0, 5)
      .map(e => ({
        ruleId: e.ruleId,
        ruleName: e.ruleName,
        error: e.error || '',
        timestamp: e.executedAt,
      }));

    return {
      totalExecutions,
      successRate,
      avgProductsPerExecution,
      avgDuration,
      trendsLastWeek: {
        executions: thisWeekExecs.length,
        executionsDelta: thisWeekExecs.length - lastWeekExecs.length,
        successRate: thisWeekSuccessRate,
        successRateDelta: thisWeekSuccessRate - lastWeekSuccessRate,
      },
      topPerformingRules,
      recentErrors,
    };
  }, [executionsRaw]);

  return {
    executions: executionsRaw as ExecutionLog[],
    stats,
    isLoading,
    refetch,
  };
}

export function useExecutionAIInsights() {
  const { stats } = useRulesExecutionData();

  const insights = useMemo(() => {
    const recommendations: Array<{
      type: 'warning' | 'success' | 'info';
      title: string;
      description: string;
      action?: string;
    }> = [];

    // Low success rate warning
    if (stats.successRate < 80 && stats.totalExecutions > 5) {
      recommendations.push({
        type: 'warning',
        title: 'Taux de réussite faible',
        description: `Seulement ${stats.successRate}% de vos exécutions réussissent. Vérifiez les règles problématiques.`,
        action: 'Voir les erreurs récentes',
      });
    }

    // High performance congratulation
    if (stats.successRate >= 95 && stats.totalExecutions > 10) {
      recommendations.push({
        type: 'success',
        title: 'Excellente performance',
        description: `${stats.successRate}% de succès sur ${stats.totalExecutions} exécutions. Vos règles sont bien optimisées.`,
      });
    }

    // Slow execution warning
    if (stats.avgDuration > 5000) {
      recommendations.push({
        type: 'info',
        title: 'Optimisation possible',
        description: `Temps moyen d'exécution de ${Math.round(stats.avgDuration / 1000)}s. Envisagez de simplifier certaines règles.`,
        action: 'Analyser les performances',
      });
    }

    // Recent errors
    if (stats.recentErrors.length > 0) {
      recommendations.push({
        type: 'warning',
        title: `${stats.recentErrors.length} erreur(s) récente(s)`,
        description: stats.recentErrors[0].error.slice(0, 100),
        action: 'Corriger les erreurs',
      });
    }

    return recommendations;
  }, [stats]);

  return { insights };
}

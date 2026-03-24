import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AIUsageStats {
  totalGenerations: number;
  totalTokensIn: number;
  totalTokensOut: number;
  totalCost: number;
  avgLatency: number;
  byProvider: Record<string, { count: number; tokens: number; cost: number }>;
  byTask: Record<string, { count: number; avgTokens: number }>;
  dailyTrend: { date: string; count: number; cost: number }[];
  roi: { contentGenerated: number; timeSavedHours: number; estimatedValue: number };
}

export function useAIObservability(period: 'day' | 'week' | 'month' = 'month') {
  return useQuery({
    queryKey: ['ai-observability', period],
    queryFn: async (): Promise<AIUsageStats> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const daysMap = { day: 1, week: 7, month: 30 };
      const since = new Date(Date.now() - daysMap[period] * 86_400_000).toISOString();

      const { data, error } = await supabase
        .from('ai_generations')
        .select('provider, task, tokens_in, tokens_out, cost_usd, created_at')
        .eq('user_id', session.user.id)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      const rows = data || [];

      // Aggregate
      const byProvider: AIUsageStats['byProvider'] = {};
      const byTask: AIUsageStats['byTask'] = {};
      const dailyMap = new Map<string, { count: number; cost: number }>();

      let totalTokensIn = 0, totalTokensOut = 0, totalCost = 0;

      for (const row of rows) {
        const tokIn = row.tokens_in || 0;
        const tokOut = row.tokens_out || 0;
        const cost = row.cost_usd || 0;
        totalTokensIn += tokIn;
        totalTokensOut += tokOut;
        totalCost += cost;

        // By provider
        if (!byProvider[row.provider]) byProvider[row.provider] = { count: 0, tokens: 0, cost: 0 };
        byProvider[row.provider].count++;
        byProvider[row.provider].tokens += tokIn + tokOut;
        byProvider[row.provider].cost += cost;

        // By task
        if (!byTask[row.task]) byTask[row.task] = { count: 0, avgTokens: 0 };
        byTask[row.task].count++;
        byTask[row.task].avgTokens += tokIn + tokOut;

        // Daily
        const day = row.created_at.substring(0, 10);
        const d = dailyMap.get(day) || { count: 0, cost: 0 };
        d.count++;
        d.cost += cost;
        dailyMap.set(day, d);
      }

      // Finalize avg tokens
      for (const task of Object.values(byTask)) {
        task.avgTokens = task.count > 0 ? Math.round(task.avgTokens / task.count) : 0;
      }

      const dailyTrend = Array.from(dailyMap.entries())
        .map(([date, v]) => ({ date, ...v }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // ROI estimation (conservative: 5 min saved per generation, $30/hr value)
      const timeSavedHours = (rows.length * 5) / 60;
      const estimatedValue = timeSavedHours * 30;

      return {
        totalGenerations: rows.length,
        totalTokensIn,
        totalTokensOut,
        totalCost: Math.round(totalCost * 100) / 100,
        avgLatency: 0,
        byProvider,
        byTask,
        dailyTrend,
        roi: {
          contentGenerated: rows.length,
          timeSavedHours: Math.round(timeSavedHours * 10) / 10,
          estimatedValue: Math.round(estimatedValue),
        },
      };
    },
    staleTime: 5 * 60_000,
  });
}

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export function useExtensionAnalytics(timeRange: string = '7d') {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['extension-analytics', timeRange],
    queryFn: async () => {
      const daysAgo = parseInt(timeRange)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysAgo)

      const { data, error } = await supabase
        .from('extension_analytics')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      // Calculate aggregates
      const totalImports = data.reduce((sum, item) => sum + (item.product_count || 0), 0)
      const avgSuccessRate = data.reduce((sum, item) => sum + (item.success_rate || 0), 0) / data.length
      const avgProcessingTime = data.reduce((sum, item) => sum + (item.processing_time_ms || 0), 0) / data.length

      return {
        raw: data,
        stats: {
          totalImports,
          avgSuccessRate: avgSuccessRate || 100,
          avgProcessingTime: avgProcessingTime || 0,
          totalEvents: data.length
        }
      }
    }
  })

  return {
    analytics,
    isLoading
  }
}

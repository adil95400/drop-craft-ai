import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface FeedReport {
  id: string
  channel: string
  total_products: number
  valid_products: number
  warning_products: number
  error_products: number
  score: number
  summary: Record<string, any>
  created_at: string
}

export interface FeedDiagnosticItem {
  id: string
  report_id: string
  product_id: string | null
  product_title: string
  severity: 'error' | 'warning' | 'info'
  rule_code: string
  field_name: string
  message: string
  suggestion: string | null
  current_value: string | null
  auto_fixable: boolean
  fixed: boolean
}

export function useFeedReports() {
  return useQuery({
    queryKey: ['feed-reports'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('feed-diagnostics', {
        body: { action: 'list_reports' },
      })
      if (error) throw error
      return (data?.reports || []) as FeedReport[]
    },
  })
}

export function useFeedReportDetails(reportId: string | null) {
  return useQuery({
    queryKey: ['feed-report-details', reportId],
    queryFn: async () => {
      if (!reportId) return null
      const { data, error } = await supabase.functions.invoke('feed-diagnostics', {
        body: { action: 'get_report', reportId },
      })
      if (error) throw error
      return { report: data.report as FeedReport, items: (data.items || []) as FeedDiagnosticItem[] }
    },
    enabled: !!reportId,
  })
}

export function useRunFeedDiagnostic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (channel?: string) => {
      const { data, error } = await supabase.functions.invoke('feed-diagnostics', {
        body: { action: 'run_diagnostic', channel },
      })
      if (error) throw error
      return data.reports as FeedReport[]
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed-reports'] })
      toast.success('Diagnostic feed terminé')
    },
    onError: (e: any) => toast.error(`Erreur: ${e.message}`),
  })
}
